import { sequelize } from "@/db/sequelize";
import { publishUserRegistered } from "@/messaging/message-publish";
import { RefreshToken, UserCredentials } from "@/models";
import {
  AuthResponse,
  AuthTokens,
  LoginInput,
  RegisterInput,
} from "@/types/auth";
import { logger } from "@/utils/logger";
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/utils/token";
import { HttpError } from "@chat_app/common";
import { Op, Transaction } from "sequelize";

const REFRESH_TOKEN_TTL_DAYS = 7;

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await UserCredentials.findOne({
    where: {
      email: { [Op.eq]: input.email },
    },
  });

  if (existingUser) {
    throw new HttpError(400, "Email is already in use");
  }

  const transaction = await sequelize.transaction();
  try {
    const passHash = await hashPassword(input.password);
    const user = await UserCredentials.create(
      {
        email: input.email,
        displayName: input.displayName,
        passwordHash: passHash,
      },
      { transaction },
    );

    const refreshTokenRecord = await createRefreshToken(user.id, transaction);

    await transaction.commit();

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({
      sub: user.id,
      tokenId: refreshTokenRecord.token,
    });

    const userData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    };

    publishUserRegistered(userData); // Publish the user registered event to RabbitMQ

    return {
      accessToken,
      refreshToken,
      user: userData,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const login = async (input: LoginInput): Promise<AuthTokens> => {
  const credentials = await UserCredentials.findOne({
    where: {
      email: { [Op.eq]: input.email },
    },
  });

  if (!credentials) {
    throw new HttpError(401, "Invalid email!");
  }

  const valid = await comparePassword(input.password, credentials.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid password!");
  }

  const refreshTokenRecord = await createRefreshToken(credentials.id);

  const accessToken = signAccessToken({
    sub: credentials.id,
    email: credentials.email,
  });
  const refreshToken = signRefreshToken({
    sub: credentials.id,
    tokenId: refreshTokenRecord.token,
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const refreshTokens = async (token: string): Promise<AuthTokens> => {
  const payload = verifyRefreshToken(token);

  const tokenRecord = await RefreshToken.findOne({
    where: {
      token: { [Op.eq]: payload.tokenId },
      userId: { [Op.eq]: payload.sub },
    },
  });

  if (!tokenRecord) {
    throw new HttpError(401, "Invalid refresh token!");
  }
  if (tokenRecord.expiresAt.getTime() < Date.now()) {
    await tokenRecord.destroy(); // Clean up expired token
    throw new HttpError(401, "Refresh token has expired!");
  }

  const credential = await UserCredentials.findByPk(payload.sub);
  if (!credential) {
    logger.warn({ userId: payload.sub }, "User not found!");
    throw new HttpError(401, "User not found!");
  }

  await tokenRecord.destroy(); // Invalidate the used refresh token

  const newTokenRecord = await createRefreshToken(credential.id);

  return {
    accessToken: signAccessToken({
      sub: credential.id,
      email: credential.email,
    }),
    refreshToken: signRefreshToken({
      sub: credential.id,
      tokenId: newTokenRecord.token,
    }),
  };
};

export const revokeRefreshToken = async (userId: string) => {
  await RefreshToken.destroy({
    where: {
      userId,
    },
  });
};

const createRefreshToken = async (
  userId: string,
  transaction?: Transaction,
) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  const token = crypto.randomUUID();

  const record = await RefreshToken.create(
    {
      userId,
      token,
      expiresAt,
    },
    { transaction },
  );

  return record;
};
