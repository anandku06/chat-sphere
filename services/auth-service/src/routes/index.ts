import { Router } from "express";
import { authRouter } from "@/routes/auth.routes";

export const registerRoutes = (app: Router) => {
  // health check endpoint, bcz this is a microservice, we need to have a health check endpoint to check if the service is running or not
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "auth-service" });
  });

  app.use("/auth", authRouter);
};
