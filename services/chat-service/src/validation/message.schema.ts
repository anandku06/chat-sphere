import { z } from "@chat_app/common";

export const createMessageBodySchema = z.object({
  body: z
    .string()
    .min(1, "Message body is required")
    .max(2000, "Message body must be less than 2000 characters"),
});

export const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
});

export const listMessageQuerySchema = z.object({
  limit: z
    .preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z.number().int().min(1).max(200),
    )
    .optional(),
  after: z.string().uuid().optional(), // after is the ID of the last message received, used for pagination
});
