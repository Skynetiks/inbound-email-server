import { SMTPServer } from "smtp-server";
import fs from "fs";
import path from "path";
import os from "os";

const keyPath = path.join(os.homedir(), "smtp-certs/private", "server.key");
const certPath = path.join(os.homedir(), "smtp-certs/certs", "server.crt");

function createServer({ secure }: { secure: boolean }) {
  return new SMTPServer({
    authOptional: true,
    secure,
    name: "vps-d0506dab.vps.ovh.net",

    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    onData(stream, session, callback) {
      console.log("📂 DATA command started from", session.remoteAddress);
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        console.log("📩 Received mail", Buffer.concat(chunks).toString());
        callback();
      });
    },
    onConnect(session, callback) {
      console.log("🔗 New connection from", session.remoteAddress);
      console.log("    clientHostname:", session.clientHostname);
      callback(); // accept connection
    },
    onMailFrom(address, session, callback) {
      console.log("📧 MAIL FROM:", address.address);
      callback(); // accept
    },

    // Optional: log authentication attempts
    onAuth(auth, session, callback) {
      console.log("🔑 Auth attempt:", auth.username);
      callback(null, { user: auth.username });
    },

    onSecure(_, session, callback) {
      console.log("🔒 Secure connection established");
      callback();
    },

    onRcptTo(address, session, callback) {
      if (address.address.endsWith("@rajeevkr.dev")) {
        console.log("Accepted recipient:", address.address);
        return callback(); // accept
      }

      console.log("Rejected recipient:", address.address);
      return callback(new Error("Relaying denied"));
    },
  });
}

// Port 25 — STARTTLS (not secure by default, but can upgrade)
createServer({ secure: false })
  .listen(25, "0.0.0.0", () => {
    console.log("📮 SMTP server listening on port 25 (STARTTLS)");
  })
  .on("error", (err) => {
    console.error("❌ SMTP Server error:", err);
  });

// // Port 465 — Implicit TLS
// createServer({ secure: true }).listen(465, () => {
//   console.log("🔐 SMTP server listening on port 465 (SMTPS)");
// });
