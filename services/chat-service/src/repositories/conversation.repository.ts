import { getMongoClient } from "@/clients/mongo.client";
import {
  Conversation,
  ConversationFilter,
  ConversationSummary,
  CreateConversationInput,
} from "@/types/conversation";
import { WithId, Document } from "mongodb";
import { randomUUID } from "node:crypto";

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_COLLECTION = "messages";

const toConversation = (doc: WithId<Document>): Conversation => ({
  id: String(doc._id),
  title: typeof doc.title === "string" ? doc.title : null,
  participantIds: Array.isArray(doc.participantIds)
    ? (doc.participantIds as string[])
    : [],
  createdAt: new Date(doc.createdAt as string | number | Date),
  updatedAt: new Date(doc.updatedAt as string | number | Date),
  lastMessageAt: doc.lastMessageAt
    ? new Date(doc.lastMessageAt as string | number | Date)
    : null,
  lastMessagePreview:
    typeof doc.lastMessagePreview === "string" ? doc.lastMessagePreview : null,
});

const toConversationSummary = (doc: WithId<Document>): ConversationSummary =>
  toConversation(doc);

export const conversationRepository = {
  // This method is used to create a new conversation, typically when a user starts a new chat with one or more participants
  async create(input: CreateConversationInput): Promise<Conversation> {
    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection(CONVERSATIONS_COLLECTION);
    const now = new Date();

    const document = {
      _id: randomUUID(),
      title: input.title ?? null,
      participantIds: input.participantIds,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
      lastMessagePreview: null,
    };

    await collection.insertOne(document as unknown as Document);
    return toConversation(document as unknown as WithId<Document>);
  },

  // This method is used to find a conversation by its ID, typically for loading the conversation when a user opens it
  async findById(id: string): Promise<Conversation | null> {
    const client = await getMongoClient();
    const db = client.db();
    const doc = await db.collection(CONVERSATIONS_COLLECTION).findOne({
      _id: new Object(id),
    });

    return doc ? toConversation(doc as WithId<Document>) : null;
  },

  // This method is used to find conversations for a user, sorted by last message time (most recent first)
  async findSummaries(
    filter: ConversationFilter,
  ): Promise<ConversationSummary[]> {
    const client = await getMongoClient();
    const db = client.db();
    const cursor = db
      .collection(CONVERSATIONS_COLLECTION)
      .find({ participantIds: filter.participantId })
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const results = await cursor.toArray();
    return results.map(toConversationSummary);
  },

  // This method is used to update the conversation's last message info when a new message is sent in the conversation
  async touchConversation(
    conversationId: string,
    preview: string,
  ): Promise<void> {
    const client = await getMongoClient();
    const db = client.db();
    await db.collection(CONVERSATIONS_COLLECTION).updateOne(
      { _id: new Object(conversationId) },
      {
        $set: {
          lastMessageAt: new Date(),
          lastMessagePreview: preview,
          updatedAt: new Date(),
        },
      },
    );
  },

  async removeAll(): Promise<void> {
    const client = await getMongoClient();
    const db = client.db();
    await Promise.all([
      db.collection(CONVERSATIONS_COLLECTION).deleteMany({}),
      db.collection(MESSAGES_COLLECTION).deleteMany({}),
    ]);
  },
};
