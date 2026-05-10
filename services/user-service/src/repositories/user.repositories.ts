/**
 * This file contains the repository functions for the User entity. It provides an abstraction layer over the database operations, allowing us to interact with the User model without directly coupling our business logic to the database implementation. The functions in this file include creating a new user, finding a user by their email, and finding a user by their ID. Each function interacts with the UserModel defined in the db/models/user.model.ts file and returns data in the format defined by the User type in types/user.ts.
 */

import { Op, type WhereOptions } from "sequelize";

import type { CreateUserInput, User } from "@/types/user";
import type { AuthUserRegisteredEventPayload } from "@chat_app/common";

import { UserModel } from "@/db";

// this function is used to convert the UserModel instance to the User type defined in types/user.ts
const toDomainUser = (model: UserModel): User => ({
  id: model.id,
  email: model.email,
  displayName: model.displayName,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findByPk(id);
    return user ? toDomainUser(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await UserModel.findAll({
      order: [["displayName", "ASC"]],
    });

    return users.map(toDomainUser);
  }

  async create(data: CreateUserInput): Promise<User> {
    const user = await UserModel.create(data);
    return toDomainUser(user);
  }

  async searchByQuery(
    query: string,
    options: { limit?: number; offset?: number; excludeIds?: string[] } = {},
  ): Promise<User[]> {
    const where: WhereOptions = {
      // Op.or is used to search for users where either the displayName or the email matches the query, using a case-insensitive like operator (iLike) to allow for partial matches. The % symbols are used as wildcards to match any characters before or after the query string.
      [Op.or]: [
        { displayName: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
      ],
    };

    if (options.excludeIds && options.excludeIds.length > 0) {
      Object.assign(where, {
        [Op.and]: [{ id: { [Op.notIn]: options.excludeIds } }],
      });
    }

    const users = await UserModel.findAll({
      where,
      order: [["displayName", "ASC"]],
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });

    return users.map(toDomainUser);
  }

  // why using upsert not normal create? because we want to make sure that if the user already exists, we don't create a new one, but instead update the existing one with the new data from the auth event. this is important because the auth event might contain updated information about the user, such as a new display name, and we want to make sure that our user service reflects that information correctly.
  async upsertFromAuthEvent(
    payload: AuthUserRegisteredEventPayload,
  ): Promise<User> {
    const [user] = await UserModel.upsert(
      {
        id: payload.id,
        email: payload.email,
        displayName: payload.displayName,
        createdAt: new Date(payload.createdAt),
        updatedAt: new Date(payload.createdAt), // set updatedAt to the same value as createdAt on upsert, since we don't want to update the timestamp if the user already exists
      },
      { returning: true },
    );

    return toDomainUser(user);
  }
}

export const userRepository = new UserRepository();
