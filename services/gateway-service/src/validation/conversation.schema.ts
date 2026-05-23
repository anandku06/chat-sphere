import { z } from "@chat_app/common";

export const createConversationSchema = z.object({
  title: z
    .string()
    .max(255, "Title must be at most 255 characters long.")
    .optional(),
  participantIds: z
    .array(z.string().uuid())
    .min(2, "At least two participants are required to create a conversation."),
});

export const listConversationQuerySchema = z.object({
  participantId: z.string().uuid().optional(),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().uuid(),
});
