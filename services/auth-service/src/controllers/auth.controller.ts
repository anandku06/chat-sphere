import {
  login,
  refreshTokens,
  register,
  revokeRefreshToken,
} from "@/service/auth.service";
import { LoginInput } from "@/types/auth";
import { asyncHandler, HttpError } from "@chat_app/common";
import { RequestHandler } from "express";

export const registerHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    // Implementation of the register handler

    const payload = req.body; // Assuming the request body has been validated and parsed

    // Call the register service with the payload
    const tokens = await register(payload);

    // Respond with the generated tokens and user data
    res.status(201).json(tokens);
  },
);

export const loginHandler: RequestHandler = asyncHandler(async (req, res) => {
  // Implementation of the login handler

  const payload = req.body as LoginInput;
  const tokens = await login(payload);

  res.status(200).json(tokens);
});

export const refreshHandler: RequestHandler = asyncHandler(async (req, res) => {
  // Implementation of the refresh token handler

  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    throw new HttpError(400, "Refresh token is required");
  }

  const tokens = await refreshTokens(refreshToken);
  res.status(200).json(tokens);
});

export const revokeHandler: RequestHandler = asyncHandler(async (req, res) => {
  // Implementation of the revoke refresh token handler
  const { userId } = req.body as { userId?: string };
  if (!userId) {
    throw new HttpError(400, "User ID is required");
  }

  await revokeRefreshToken(userId);
  res.status(204).json({ message: "Refresh tokens revoked successfully" });
});
