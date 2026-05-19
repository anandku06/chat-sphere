import { z, USER_ID_HEADER, HttpError } from "@chat_app/common";
import type { RequestHandler } from "express";

const userIdSchema = z.string().uuid();

export const attachAuthenticatedUser: RequestHandler = (req, res, next) => {
  try {
    const headerValue = req.header(USER_ID_HEADER);
    const userId = userIdSchema.parse(headerValue);

    req.user = { id: userId };
    next();
  } catch (error) {
    next(
      new HttpError(401, "Unauthorized: Invalid or missing user ID in header"),
    );
  }
};
