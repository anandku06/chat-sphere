import { chatProxyService } from "@/service/chat-proxy.service";
import { getAuthenticatedUser } from "@/utils/auth";
import {
  conversationIdParamSchema,
  createConversationSchema,
  listConversationQuerySchema,
} from "@/validation/conversation.schema";
import { asyncHandler, HttpError } from "@chat_app/common";
import { RequestHandler } from "express";

export const createConversationHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = getAuthenticatedUser(req);
    const payload = createConversationSchema.parse(req.body);

    const uniqueParticipantIds = Array.from(
      new Set([...payload.participantIds, user.id]),
    );
    if (uniqueParticipantIds.length < 2) {
      throw new HttpError(
        400,
        "A conversation must have at least 2 unique participants",
      );
    }

    const conversation = await chatProxyService.createConversation(user.id, {
      title: payload.title,
      participantIds: uniqueParticipantIds,
    });

    res.status(201).json({ data: conversation });
  },
);

export const listConversationHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = getAuthenticatedUser(req);
    const { participantId } = listConversationQuerySchema.parse(req.query);

    if (participantId && participantId !== user.id) {
      throw new HttpError(403, "You can only list conversations for yourself");
    }

    const conversations = await chatProxyService.listConversations(user.id);

    res.status(200).json({ data: conversations });
  },
);

export const getConversationHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = getAuthenticatedUser(req);
    const { conversationId } = conversationIdParamSchema.parse(req.params);
    const conversation = await chatProxyService.getConversation(
      user.id,
      conversationId,
    );

    if (!conversation.participantIds.includes(user.id)) {
      throw new HttpError(
        404,
        "You are not a participant of this conversation or it does not exist",
      );
    }
    res.status(200).json({ data: conversation });
  },
);
