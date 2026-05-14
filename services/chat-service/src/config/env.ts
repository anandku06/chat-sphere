import "dotenv/config";
import { createEnv, z } from "@chat_app/common";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CHAT_SERVICE_PORT: z.coerce.number().int().min(0).max(65_535).default(4000),
  JWT_SECRET: z
    .string()
    .min(32, "JWT secret must be at least 32 characters long"),
  RABBITMQ_URL: z.string().url("Invalid RabbitMQ URL").optional(),
  REDIS_URL: z.string().url("Invalid Redis URL"),
  MONGO_URL: z.string().url("Invalid MongoDB URL"),
  INTERNAL_API_TOKEN: z.string().min(16, "Internal API token is required"),
});

type EnvType = z.infer<typeof envSchema>;

export const env: EnvType = createEnv(envSchema, {
  serviceName: "Chat Service",
});

export type Env = typeof env;
