import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "@/middlewares/error-handler";
import { registerRoutes } from "@/routes";
import { createInternalAuthMiddleware } from "@chat_app/common";
import { env } from "@/config/env";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: "*",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((_req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  app.use(
    createInternalAuthMiddleware(env.INTERNAL_API_TOKEN, {
      exemptPaths: ["/health"],
    }),
  );

  registerRoutes(app);

  app.use(errorHandler);

  return app;
};
