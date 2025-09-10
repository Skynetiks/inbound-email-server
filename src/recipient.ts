import { sql } from "bun";
import { getRedisClient } from "./redis";

const CACHE_TTL = parseInt(process.env.RECEIPT_CACHE_TIME || "300", 10); // 5 minutes

export async function isDomainVerified(domain: string): Promise<boolean> {
  if (!domain) return false;

  const normalizedEmail = domain.trim().toLowerCase();
  const normalizedDomain = normalizedEmail.split("@")[1];
  if (!normalizedEmail) {
    console.error("Invalid email address:", domain);
    return false;
  }

  console.log("Checking domain verification for", normalizedDomain);

  const cacheKey = `sender_domain::${normalizedDomain}`;

  try {
    const cached = await getRedisClient().get(cacheKey);
    if (cached !== null) return cached === "true";

    const res = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count
      FROM "SenderDomains"
      WHERE domain = ${normalizedDomain}::text
    `;

    const verified = parseInt(res[0].count) > 0;

    await getRedisClient().set(
      cacheKey,
      verified ? "true" : "false",
      "EX",
      CACHE_TTL
    );

    return verified;
  } catch (err) {
    console.error("Error checking domain verification:", err);

    return false;
  }
}
