import { z } from "@chat_app/common";

export const createMessageBodySchema = z.object({
  body: z
    .string()
    .min(1, "Message body is required")
    .max(2000, "Message body must be less than 2000 characters"),
});

export const listMessageQuerySchema = z.object({
  limit: z
    .preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z.number().int().min(1).max(200),
    )
    .optional(),
  after: z.string().datetime().optional(), // why not z.string().optional() ? because we want to ensure that the 'after' parameter is a valid datetime string, which can be used for pagination purposes. By using z.string().datetime(), we can validate that the input is in the correct format and can be parsed as a date, ensuring that our pagination logic works correctly when fetching messages after a certain timestamp.
});
