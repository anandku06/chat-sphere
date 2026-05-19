import { conversationCache } from "@/cache/conversation.cache";
import { conversationRepository } from "@/repositories/conversation.repository";
import {
  Conversation,
  ConversationFilter,
  ConversationSummary,
  CreateConversationInput,
} from "@/types/conversation";
import { HttpError } from "@chat_app/common";

export const conversationService = {
  async createConversation(
    input: CreateConversationInput,
  ): Promise<Conversation> {
    const converse = await conversationRepository.create(input);

    await conversationCache.set(converse);
    return converse;
  },

  async getConversationById(id: string): Promise<Conversation> {
    // Try to get the conversation from cache first
    const cached = await conversationCache.get(id);
    if (cached) {
      return cached;
    }

    const conversation = await conversationRepository.findById(id);
    if (!conversation) {
      throw new HttpError(404, "Conversation not found");
    }

    // Cache the conversation for future requests
    await conversationCache.set(conversation);
    return conversation;
  },

  async listConversations(
    filter: ConversationFilter,
  ): Promise<ConversationSummary[]> {
    return conversationRepository.findSummaries(filter);
  },

  async touchConversation(
    conversationId: string,
    preview: string,
  ): Promise<void> {
    await conversationRepository.touchConversation(conversationId, preview);

    // Invalidate the cache for this conversation since its last message info has changed
    await conversationCache.invalidate(conversationId);
  },
};
