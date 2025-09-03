import { sql, redis } from "bun";

const CACHE_TTL = parseInt(process.env.RECEIPT_CACHE_TIME || "300", 10); // 5 minutes

export async function isDomainVerified(domain: string): Promise<boolean> {
  if (!domain) return false;

  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain) return false;
  const cacheKey = `sender_domain::${normalizedDomain}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) return cached === "true";

    const res = await sql<{ "1": number }[]>`
      SELECT 1
      FROM "SenderDomains"
      WHERE domain = '${normalizedDomain}'
      LIMIT 1
    `;

    const verified = res.length > 0;

    await redis.set(cacheKey, verified ? "true" : "false", "EX", CACHE_TTL);

    return verified;
  } catch (err) {
    console.error("Error checking domain verification:", err);

    return false;
  }
}
