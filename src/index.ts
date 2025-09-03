import { SMTPServer } from "smtp-server";
import { randomUUID } from "crypto";
import { MAX_MAIL_SIZE } from "./config";
import { isIpBlocked } from "./block";
import { isDomainVerified } from "./recipient";

function createServer({ secure }: { secure: boolean }) {
  return new SMTPServer({
    name: Bun.env.DNS_NAME, // match DNS
    secure,
    size: MAX_MAIL_SIZE,
    authOptional: false,
    disabledCommands: ["STARTTLS"],
    banner: "Welcome to Skyfunnel SMTP service",

    onConnect(session, callback) {
      console.log("🔗 New connection from", session.remoteAddress);
      console.log("Client hostname:", session.clientHostname);

      if (isIpBlocked(session.remoteAddress)) {
        return callback(new Error("Local IPs not allowed"));
      }

      callback();
    },

    async onRcptTo(address, _, callback) {
      const isValidReceiver = await isDomainVerified(address.address);
      if (isValidReceiver) {
        console.log("✅ Accepted recipient:", address.address);
        return callback();
      }

      console.log("❌ Rejected recipient:", address.address);
      return callback(new Error("Relaying denied"));
    },

    onData(stream, session, callback) {
      console.log("📂 DATA from", session.remoteAddress);

      const id = randomUUID();
      let size = 0;

      stream.on("data", (chunk) => {
        size += chunk.length;
        if (size > 10 * 1024 * 1024) {
          // enforce size limit
          stream.destroy();
          return callback(new Error("Message too large"));
        }
      });

      stream.on("end", () => {
        console.log(
          `📩 Finished receiving message [${id}] (size: ${size} bytes)`
        );
        callback();
      });

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        callback(err);
      });
    },
  });
}

// For STARTTLS (submission) → port 587 recommended instead of 25
createServer({ secure: false })
  .listen(25, "0.0.0.0", () => {
    console.log("📮 SMTP server listening on port 25");
  })
  .on("error", (err) => {
    console.error("❌ SMTP Server error:", err);
  });
