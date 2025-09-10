import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(Bun.env.REDIS_URL!);

    // Handle errors so your app doesn't just implode silently
    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    // Close connection when the process exits
    process.on("beforeExit", () => {
      if (redisClient) {
        redisClient.quit();
        redisClient = null;
      }
    });

    process.on("SIGINT", () => {
      if (redisClient) {
        redisClient.quit().then(() => process.exit(0));
      } else {
        process.exit(0);
      }
    });
  }

  return redisClient;
}
