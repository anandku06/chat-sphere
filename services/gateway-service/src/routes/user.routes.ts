import { requireAuth } from "@/middlewares/require-auth";
import { Router } from "express";
import { asyncHandler, validateRequest } from "@chat_app/common";
import {
  createUser,
  getAllUsers,
  getUser,
  searchUsers,
} from "@/controller/user.controller";
import {
  createUserSchema,
  searchUsersQuerySchema,
  userIdParamSchema,
} from "@/validation/user.schema";

export const userRouter: Router = Router();

userRouter.get("/", requireAuth, asyncHandler(getAllUsers));
userRouter.get(
  "/:id",
  requireAuth,
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(getUser),
);
userRouter.get(
  "/search",
  requireAuth,
  validateRequest({ query: searchUsersQuerySchema }),
  asyncHandler(searchUsers),
);
userRouter.post(
  "/",
  requireAuth,
  validateRequest({ body: createUserSchema }),
  asyncHandler(createUser),
);
