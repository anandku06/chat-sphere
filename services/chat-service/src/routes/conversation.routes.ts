import {
  createConversationHandler,
  createMessageHandler,
  getConversationHandler,
  listConversationHandler,
  listMessageHandler,
} from "@/controllers/conversation.controller";
import { attachAuthenticatedUser } from "@/middlewares/authenticated-user";
import {
  createConversationSchema,
  listConversationsQuerySchema,
} from "@/validation/conversation.schema";
import {
  createMessageBodySchema,
  listMessageQuerySchema,
} from "@/validation/message.schema";
import { conversationIdParamSchema } from "@/validation/shared.schema";
import { validateRequest } from "@chat_app/common";
import { Router } from "express";

export const conversationRouter: Router = Router();

conversationRouter.use(attachAuthenticatedUser);

conversationRouter.post(
  "/",
  validateRequest({ body: createConversationSchema }),
  createConversationHandler,
);

conversationRouter.get(
  "/",
  validateRequest({ query: listConversationsQuerySchema }),
  listConversationHandler,
);

conversationRouter.get(
  "/:id",
  validateRequest({ params: conversationIdParamSchema }),
  getConversationHandler,
);

conversationRouter.post(
  "/:id/messages",
  validateRequest({
    params: conversationIdParamSchema,
    body: createMessageBodySchema,
  }),
  createMessageHandler,
);

conversationRouter.get(
  "/:id/messages",
  validateRequest({
    params: conversationIdParamSchema,
    query: listMessageQuerySchema,
   }),
  listMessageHandler,
);
