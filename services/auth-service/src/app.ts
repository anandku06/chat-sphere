import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error-handler";
import { registerRoutes } from "@/routes";
import { createInternalAuthMiddleware } from "@chat_app/common";
import { env } from "@/config/env";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: "*", // Allow all origins for development; adjust in production
      credentials: true, // Allow cookies to be sent with requests
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
  app.use(
    createInternalAuthMiddleware(env.INTERNAL_API_TOKEN, {
      exemptPaths: ["/health"],
    }),
  ); // Middleware to authenticate internal service requests

  // Register application routes
  registerRoutes(app);

  // for routes that are not defined, return a 404 response
  app.use((_req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  // Error handling middleware should be the last middleware in the stack, so it can catch errors from all previous middlewares and routes.
  app.use(errorHandler);

  return app;
};
