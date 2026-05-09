import {
  loginHandler,
  refreshHandler,
  registerHandler,
  revokeHandler,
} from "@/controllers/auth.controller";
import { validateRequest } from "@chat_app/common";
import { Router } from "express";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  revokeTokenSchema,
} from "./auth.schema";

export const authRouter: Router = Router();

authRouter.post(
  "/register",
  validateRequest({ body: registerSchema.shape.body }),
  registerHandler,
);

authRouter.post(
  "/login",
  validateRequest({ body: loginSchema.shape.body }),
  loginHandler,
);

authRouter.post(
  "/refresh",
  validateRequest({ body: refreshTokenSchema.shape.body }),
  refreshHandler,
);

authRouter.post(
  "/revoke",
  validateRequest({ body: revokeTokenSchema.shape.body }),
  revokeHandler,
);
