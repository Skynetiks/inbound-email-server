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
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        console.log("📩 Received mail", Buffer.concat(chunks).toString());
        callback();
      });
    },
    onConnect(session, callback) {
      console.log("Incoming connection from", session.remoteAddress);
      callback();
    },
    onRcptTo(address, session, callback) {
      if (address.address.endsWith("@rajeevkr.dev")) {
        return callback(); // accept
      }
      return callback(new Error("Relaying denied"));
    },
  });
}

// Port 25 — STARTTLS (not secure by default, but can upgrade)
createServer({ secure: false }).listen(25, () => {
  console.log("📮 SMTP server listening on port 25 (STARTTLS)");
});

// // Port 465 — Implicit TLS
// createServer({ secure: true }).listen(465, () => {
//   console.log("🔐 SMTP server listening on port 465 (SMTPS)");
// });
