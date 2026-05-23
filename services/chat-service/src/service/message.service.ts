import { Message, MessageListOptions } from "@/types/message";
import { conversationService } from "./conversation.service";
import { HttpError } from "@chat_app/common";
import { messageRepository } from "@/repositories/message.repository";

export const messageService = {
  async createMessage(
    conversationId: string,
    senderId: string,
    body: string,
  ): Promise<Message> {
    // ensure the conversation exists before creating a message
    const conversation =
      await conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(senderId)) {
      throw new HttpError(
        403,
        "Sender is not a participant in the conversation",
      );
    }

    const message = await messageRepository.create(
      conversationId,
      senderId,
      body,
    );

    await conversationService.touchConversation(
      conversationId,
      body.slice(0, 120),
    ); // Update conversation's lastMessageAt and lastMessagePreview

    return message;
  },

  async listMessages(
    conversationId: string,
    requestedId: string,
    options: MessageListOptions = {},
  ): Promise<Message[]> {
    // ensure the conversation exists before listing messages
    const conversation =
      await conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(requestedId)) {
      throw new HttpError(
        403,
        "Requester is not a participant in the conversation",
      );
    }

    return await messageRepository.findByConversation(conversationId, options);
  },
};
