/**
 * This file defines the AuthProxyService, which is responsible for communicating with the Auth Service to validate authentication tokens and retrieve user information. It uses Axios to make HTTP requests to the Auth Service and handles any errors that may occur during these requests. The service is designed to be used by other parts of the Gateway Service to ensure that incoming requests are authenticated before they are processed further.
 */

import { HttpError } from "@chat_app/common";
import axios from "axios";

import { env } from "@/config/env";

// Create an Axios instance for communicating with the Auth Service, using the base URL and timeout specified in the environment configuration
const client = axios.create({
  baseURL: env.AUTH_SERVICE_URL,
  timeout: 5000,
});

// Define a constant for the authentication header, which includes an internal token for secure communication with the Auth Service
const authHeader = {
  headers: {
    "X-Internal-Token": env.INTERNAL_API_TOKEN,
  },
} as const;

// These interfaces define the expected structure of the data returned by the Auth Service, as well as the payloads for various authentication-related operations such as registration, login, token refresh, and token revocation.

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponse extends AuthToken {
  user: UserData;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface RevokePayload {
  userId: string;
}

// resolves the error message based on the status code and response data from the Auth Service. If the response data contains a message, it uses that; otherwise, it provides a generic message based on whether the error is a server error (status code 500 or above) or a client error (status code below 500).
const resolveMessage = (status: number, data: unknown): string => {
  if (typeof data === "object" && data && "message" in data) {
    const message = (data as Record<string, unknown>).message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return status >= 500
    ? "Auth Service is currently unavailable. Please try again later."
    : "An error occurred while communicating with the Auth Service.";
};

// handles errors that occur during Axios requests to the Auth Service.
const handleAxiosError = (error: unknown): never => {
  if (!axios.isAxiosError(error) || !error.response) {
    throw new HttpError(500, "Failed to communicate with Auth Service.");
  }

  const { status, data } = error.response as { status: number; data: unknown };

  throw new HttpError(status, resolveMessage(status, data));
};

export const authProxyService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>(
        "/auth/register",
        payload,
        authHeader,
      );
      return response.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  },

  async login(payload: LoginPayload): Promise<AuthToken> {
    try {
      const response = await client.post<AuthToken>(
        "/auth/login",
        payload,
        authHeader,
      );
      return response.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  },

  async refresh(payload: RefreshPayload): Promise<AuthToken> {
    try {
      const response = await client.post<AuthToken>(
        "/auth/refresh",
        payload,
        authHeader,
      );
      return response.data;
    } catch (error) {
      return handleAxiosError(error);
    }
  },

  async revoke(payload: RevokePayload): Promise<void> {
    try {
      const response = await client.post<void>(
        "/auth/revoke",
        payload,
        authHeader,
      );
    } catch (error) {
      return handleAxiosError(error);
    }
  },
};
