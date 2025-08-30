// import Redis from "ioredis";
// import dotenv from "dotenv";

// dotenv.config()

// export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
import Redis from "ioredis"

export const redis = new Redis("rediss://default:AS6OAAIncDFmNjk0ZGUzZmU2ODY0YmM2YjRjNWJiN2MzZjVjMzJhNHAxMTE5MTg@wise-marlin-11918.upstash.io:6379");
await redis.set('foo', 'bar');