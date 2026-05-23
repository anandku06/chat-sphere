import {
  createConversationHandler,
  getConversationHandler,
  listConversationHandler,
} from "@/controller/conversation.controller";
import { requireAuth } from "@/middlewares/require-auth";
import {
  conversationIdParamSchema,
  createConversationSchema,
  listConversationQuerySchema,
} from "@/validation/conversation.schema";
import { validateRequest } from "@chat_app/common";
import { Router } from "express";

export const conversationRouter: Router = Router();

conversationRouter.use(requireAuth);

conversationRouter.post(
  "/",
  validateRequest({ body: createConversationSchema }),
  createConversationHandler,
);

conversationRouter.get(
  "/",
  validateRequest({ query: listConversationQuerySchema }),
  listConversationHandler,
);

conversationRouter.get(
  "/:conversationId",
  validateRequest({ params: conversationIdParamSchema }),
  getConversationHandler,
);
