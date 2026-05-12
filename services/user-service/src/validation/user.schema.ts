import { z } from "@chat_app/common";

export const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(3).max(255),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

// This schema allows for either a single UUID string or an array of UUID strings. If a single string is provided, it will be transformed into an array containing that string. If the field is omitted, it will default to an empty array.
const excludeSchema = z.union([
  z.array(z.string().uuid()),
  z
    .string()
    .uuid()
    .transform((id) => [id])
    .optional()
    .transform((ids) => ids ?? []),
]);

export const searchUsersQuerySchema = z.object({
  query: z.string().trim().min(3).max(255),
  limit: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => Number.isInteger(val) && val > 0 && val <= 10, {
      message: "Limit must be an integer between 1 and 10",
    })
    .optional(),
  exclude: excludeSchema,
});

export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
