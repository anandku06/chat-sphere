import type { UserRepository } from "@/repositories/user.repositories";
import type { CreateUserInput, User } from "@/types/user";

import { sequelize } from "@/db";
import { userRepository } from "@/repositories/user.repositories";
import { AuthUserRegisteredEventPayload, HttpError } from "@chat_app/common";
import { UniqueConstraintError } from "sequelize";
import { publishUserCreatedEvent } from "@/messaging/event-publish";

class UserService {
  constructor(private readonly repos: UserRepository) {}

  async getUserById(id: string): Promise<User | null> {
    const user = await this.repos.findById(id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.repos.findAll();
  }

  async createUser(data: CreateUserInput): Promise<User> {
    try {
      const user = await this.repos.create(data);

      // so in one line, using void before an async function call is a way to explicitly indicate that you are intentionally ignoring the returned promise and that you don't want to wait for it to complete before proceeding with the rest of the code.
      void publishUserCreatedEvent({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });

      return user;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new HttpError(409, "Email already exists");
      }
      throw error;
    }
  }

  async searchUsers(params: {
    query: string;
    limit?: number;
    offset?: number;
    excludeIds?: string[];
  }): Promise<User[]> {
    const query = params.query.trim();
    if (query.length === 0) {
      return [];
    }

    return this.repos.searchByQuery(query, {
      limit: params.limit,
      offset: params.offset,
      excludeIds: params.excludeIds,
    });
  }

  async syncFromAuthUser(
    payload: AuthUserRegisteredEventPayload,
  ): Promise<User> {
    const user = await this.repos.upsertFromAuthEvent(payload);

    void publishUserCreatedEvent({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    return user;
  }
}

export const userService = new UserService(userRepository);
