import type { Conversation } from "@/types/conversation";

import { getRedisClient } from "@/clients/redis.client";

const CACHE_PREFIX = "conversation:";
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

type SerializedConversation = Omit<
  Conversation,
  "createdAt" | "updatedAt" | "lastMessageAt"
> & {
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
};

const serialize = (conversation: Conversation): string =>
  JSON.stringify({
    ...conversation,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  });

const deserialize = (data: string): Conversation => {
  const parsed = JSON.parse(data) as SerializedConversation;

  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
    lastMessageAt: parsed.lastMessageAt ? new Date(parsed.lastMessageAt) : null,
  };
};

export const conversationCache = {
  async get(conversationId: string): Promise<Conversation | null> {
    const redis = getRedisClient();
    const payload = await redis.get(`${CACHE_PREFIX}${conversationId}`);

    return payload ? deserialize(payload) : null;
  },

  async set(conversation: Conversation): Promise<void> {
    const redis = getRedisClient();

    await redis.setex(
      `${CACHE_PREFIX}${conversation.id}`,
      CACHE_TTL_SECONDS,
      serialize(conversation),
    );
  },

  async invalidate(conversationId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`${CACHE_PREFIX}${conversationId}`);
  },
};
