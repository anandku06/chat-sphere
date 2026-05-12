import { userService } from "@/service/user.service";
import {
  CreateUserBody,
  SearchUsersQuery,
  UserIdParam,
} from "@/validation/user.schema";
import type { AsyncHandler } from "@chat_app/common";

export const getUser: AsyncHandler = async (req, res, next) => {
  try {
    const { id } = req.params as unknown as UserIdParam;
    const user = await userService.getUserById(id);

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers: AsyncHandler = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser: AsyncHandler = async (req, res, next) => {
  try {
    const payload = req.body as CreateUserBody;
    const user = await userService.createUser(payload);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const searchUsers: AsyncHandler = async (req, res, next) => {
  try {
    const { query, limit, exclude } = req.query as unknown as SearchUsersQuery;
    const users = await userService.searchUsers({
      query,
      limit,
      excludeIds: exclude,
    });

    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};
