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
import { asyncHandler, validateRequest } from "@chat_app/common";
import { Router } from "express";

export const userRoutes: Router = Router();

userRoutes.get("/", asyncHandler(getAllUsers));
userRoutes.get(
  "/search",
  validateRequest({ query: searchUsersQuerySchema }),
  asyncHandler(searchUsers),
);
userRoutes.get(
  "/:id",
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(getUser),
);
userRoutes.post(
  "/",
  validateRequest({ body: createUserSchema }),
  asyncHandler(createUser),
);
