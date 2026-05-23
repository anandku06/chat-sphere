import { HttpError, USER_ID_HEADER } from "@chat_app/common";
import axios, { AxiosRequestConfig } from "axios";

import { env } from "@/config/env";

// using a factory function to create the Axios client allows for better encapsulation and potential future enhancements, such as adding interceptors or custom error handling logic specific to the Chat Service without affecting other services that might use a similar client setup.
const createClient = () => {
  const config: AxiosRequestConfig = {
    baseURL: env.CHAT_SERVICE_URL,
    timeout: 5000,
    headers: {
      "X-Internal-Token": env.INTERNAL_API_TOKEN,
    },
  };

  return axios.create(config);
};

const chatClient = createClient();

export interface ConversationDto {
  id: string;
  title: string | null;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null; // optional field (bcz it may not be present in some responses)
  lastMessagePreview: string | null; // optional field (bcz it may not be present in some responses) to provide a brief preview of the last message in the conversation, which can be useful for displaying conversation lists without fetching full message histories.
}

export interface ReactionDto {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  reactions?: ReactionDto[]; // optional field to include reactions when fetching messages, allowing clients to display them without additional requests.
}

export interface ConversationResponse {
  data: ConversationDto;
}

export interface ConversationListResponse {
  data: ConversationDto[];
}

export interface MessageResponse {
  data: MessageDto;
}

export interface MessageListResponse {
  data: MessageDto[];
}

export interface CreateConversationPayload {
  title?: string | null;
  participantIds: string[];
}

export interface CreateMessagePayload {
  body: string;
}

const handleAxiosError = (error: unknown): never => {
  if (!axios.isAxiosError(error) || !error.response) {
    throw new HttpError(500, "Failed to communicate with User Service.");
  }

  const { status, data } = error.response as { status: number; data: unknown };

  throw new HttpError(status, resolveMessage(status, data));
};

const resolveMessage = (status: number, data: unknown): string => {
  if (typeof data === "object" && data && "message" in data) {
    const message = (data as Record<string, unknown>).message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return status >= 500
    ? "User Service is currently unavailable. Please try again later."
    : "An error occurred while communicating with the User Service.";
};

export const chatProxyService = {
  async createConversation(
    userId: string,
    payload: CreateConversationPayload,
  ): Promise<ConversationDto> {
    try {
      const response = await chatClient.post<ConversationResponse>(
        "/conversations",
        payload,
        {
          headers: {
            [USER_ID_HEADER]: userId,
          },
        },
      );

      return response.data.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  },

  async listConversations(userId: string): Promise<ConversationDto[]> {
    try {
      const response = await chatClient.get<ConversationListResponse>(
        "/conversations",
        {
          headers: {
            [USER_ID_HEADER]: userId,
          },
        },
      );

      return response.data.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  },

  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDto> {
    try {
      const response = await chatClient.get<ConversationResponse>(
        `/conversations/${conversationId}`,
        {
          headers: {
            [USER_ID_HEADER]: userId,
          },
        },
      );

      return response.data.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  },
};
