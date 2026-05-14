import { HttpError } from "@chat_app/common";

import type { ErrorRequestHandler } from "express";
import { logger } from "@/utils/logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err }, "An error occurred while processing the request");

  const error = err instanceof HttpError ? err : undefined;
  const statusCode = error?.statusCode ?? 500;

  const message =
    statusCode >= 500
      ? "Internal Server Error"
      : (error?.message ?? "An error occurred");

  const poyload = error?.details
    ? { message, details: error.details }
    : { message };

  res.status(statusCode).json(poyload);

  void _next();
};
