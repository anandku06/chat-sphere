import { getMongoClient } from "@/clients/mongo.client";
import { Message, MessageListOptions } from "@/types/message";
import { Document, WithId } from "mongodb";
import { randomUUID } from "node:crypto";

const MESSAGES_COLLECTION = "messages";

const toMessage = (doc: WithId<Document>): Message => ({
  id: String(doc._id),
  conversationId: String(doc.conversationId),
  senderId: String(doc.senderId),
  body: String(doc.body),
  createdAt: new Date(doc.createdAt as string | number | Date),
  reactions: Array.isArray(doc.reactions)
    ? doc.reactions.map((r: WithId<Document>) => ({
        emoji: String(r.emoji),
        userId: String(r.userId),
        createdAt: new Date(r.createdAt as string | number | Date),
      }))
    : [],
});

export const messageRepository = {
  async create(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<Message> {
    const client = await getMongoClient();
    const db = client.db();

    const collection = db.collection(MESSAGES_COLLECTION);
    const now = new Date();

    const doc = {
      _id: randomUUID(),
      conversationId,
      senderId,
      body,
      createdAt: now,
    };

    await collection.insertOne(doc as unknown as Document);
    return toMessage(doc as unknown as WithId<Document>);
  },

  async findByConversation(
    conversationId: string,
    options: MessageListOptions = {},
  ): Promise<Message[]> {
    const client = await getMongoClient();
    const db = client.db();
    const query: Record<string, unknown> = {
      conversationId,
    };
    if (options.after) {
      query.createdAt = { $gt: options.after }; // Filter messages created after the specified date
    }

    const cursor = db
      .collection(MESSAGES_COLLECTION)
      .find(query)
      .sort({ createdAt: 1 }) // Sort messages by creation date in ascending order
      .limit(options.limit || 50); // Limit the number of messages returned

    const messages = await cursor.toArray();
    return messages.map((doc) => toMessage(doc as unknown as WithId<Document>));
  },

  async findById(messageId: string): Promise<Message | null> {
    const client = await getMongoClient();
    const db = client.db();
    const doc = await db
      .collection(MESSAGES_COLLECTION)
      .findOne({ _id: messageId } as unknown as Document);

    return doc ? toMessage(doc as unknown as WithId<Document>) : null;
  },
};
