import { getMongoClient } from "@/clients/mongo.client";
import type { UserCreatedEventPayload } from "@chat_app/common";
import type { Collection } from "mongodb";

const COLLECTION_NAME = "users";

interface UserDocument {
  _id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

const getCollection = async (): Promise<Collection<UserDocument>> => {
  const client = await getMongoClient();

  return client.db().collection<UserDocument>(COLLECTION_NAME);
};

export const userRepository = {
  async upsertUser(payload: UserCreatedEventPayload) {
    const collection = await getCollection();
    await collection.updateOne(
      { _id: payload.id },
      {
        $set: {
          _id: payload.id,
          email: payload.email,
          displayName: payload.displayName,
          createdAt: payload.createdAt,
          updatedAt: payload.updatedAt,
        },
      },
      { upsert: true },
    );
  },

  async findUserById(id: string): Promise<UserDocument | null> {
    const collection = await getCollection();
    return collection.findOne({ _id: id });
  },
};
