import { conversationService } from "@/service/conversation.service";
import { getAuthenticatedUser } from "@/utils/auth";
import {
  createConversationSchema,
  listConversationsQuerySchema,
} from "@/validation/conversation.schema";
import { conversationIdParamSchema } from "@/validation/shared.schema";
import { asyncHandler, HttpError } from "@chat_app/common";
import { RequestHandler } from "express";

const parsedConversation = (params: unknown) => {
  const { id } = conversationIdParamSchema.parse(params);

  return id;
};

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

    const conversation = await conversationService.createConversation({
      title: payload.title,
      participantIds: uniqueParticipantIds,
    });

    res.status(201).json({ data: conversation });
  },
);

export const listConversationHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = getAuthenticatedUser(req);
    const filter = listConversationsQuerySchema.parse(req.query);

    if (filter.participantId && filter.participantId !== user.id) {
      throw new HttpError(403, "You can only list conversations for yourself");
    }

    const conversations = await conversationService.listConversations({
      participantId: user.id,
    });

    res.status(201).json({ data: conversations });
  },
);

export const getConversationHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = getAuthenticatedUser(req);
    const conversationId = parsedConversation(req.params);

    const conversation =
      await conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(user.id)) {
      throw new HttpError(
        403,
        "You are not a participant of this conversation",
      );
    }

    res.status(201).json({ data: conversation });
  },
);
