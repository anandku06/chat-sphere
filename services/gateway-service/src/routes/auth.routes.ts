import {
  loginUser,
  refreshTokens,
  registerUser,
  revokeTokens,
} from "@/controller/auth.controller";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  revokeTokenSchema,
} from "@/validation/auth.schema";
import { asyncHandler, validateRequest } from "@chat_app/common";
import { Router } from "express";

export const authRouter: Router = Router();

// uses validation middleware to ensure that the incoming request body for the registration endpoint adheres to the defined schema, and then delegates the actual registration logic to the registerUser controller function, which is wrapped in an asyncHandler to handle any asynchronous errors gracefully.
authRouter.post(
  "/register",
  validateRequest({ body: registerSchema }),
  asyncHandler(registerUser),
);
authRouter.post(
  "/login",
  validateRequest({ body: loginSchema }),
  asyncHandler(loginUser),
);
authRouter.post(
  "/refresh",
  validateRequest({ body: refreshTokenSchema }),
  asyncHandler(refreshTokens),
);
authRouter.post(
  "/revoke",
  validateRequest({ body: revokeTokenSchema }),
  asyncHandler(revokeTokens),
);
