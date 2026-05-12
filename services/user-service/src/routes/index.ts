import { Router } from "express";
import { userRoutes } from "./user.routes";

export const registerRoutes = (app: Router) => {
  app.use("/users", userRoutes);
};
