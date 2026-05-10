import { AsyncHandler } from "@chat_app/common";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  revokeTokenSchema,
} from "@/validation/auth.schema";
import { authProxyService } from "@/service/auth-proxy.service";

export const registerUser: AsyncHandler = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const response = await authProxyService.register(payload);

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const loginUser: AsyncHandler = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const tokens = await authProxyService.login(payload);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const refreshTokens: AsyncHandler = async (req, res, next) => {
  try {
    const payload = refreshTokenSchema.parse(req.body);
    const tokens = await authProxyService.refresh(payload);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const revokeTokens: AsyncHandler = async (req, res, next) => {
  try {
    const payload = revokeTokenSchema.parse(req.body);
    await authProxyService.revoke(payload);

    res.status(204).json();
  } catch (error) {
    next(error);
  }
};
