import { SMTPServer } from "smtp-server";
import fs from "fs";
import path from "path";

// Paths to your cert + key
const keyPath = path.join("/etc/ssl/private", "server.key");
const certPath = path.join("/etc/ssl/certs", "server.crt");

const server = new SMTPServer({
  authOptional: true,
  secure: true, // enable TLS (like SMTPS)
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),

  async onData(stream, session, callback) {
    try {
      const data = await processEmailStream(stream);
      console.log("📩 Headers:", data);
      callback();
    } catch (err) {
      console.error("Error parsing email:", err);
      callback(err as Error);
    }
  },
});

server.listen(465, () => {
  console.log("🔐 SMTP server (TLS) listening on port 465");
});

async function processEmailStream(
  stream: NodeJS.ReadableStream
): Promise<Record<string, string>> {
  const chunks: Buffer[] = [];

  return new Promise((resolve) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      const rawEmail = Buffer.concat(chunks).toString("utf-8");

      // Extract headers only
      const headers: Record<string, string> = {};
      const headerLines = rawEmail.split(/\r?\n/);
      let i = 0;
      while (i < headerLines.length && headerLines[i] !== "") {
        const line = headerLines[i];
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          headers[key] = value;
        }
        i++;
      }

      resolve(headers);
    });
  });
}
