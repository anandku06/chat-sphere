import { z } from "@chat_app/common";

export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});
