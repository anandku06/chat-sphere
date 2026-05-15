import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export const getMongoClient = async (): Promise<MongoClient> => {
  if (client) {
    return client;
  }

  const uri = env.MONGO_URL;
  client = new MongoClient(uri);
  await client.connect();

  logger.info("Connected to MongoDB!");

  return client;
};

export const closeMongoClient = async () => {
  if (!client) {
    return;
  }

  await client.close();
  logger.info("MongoDB connection closed!");
  client = null;
};
