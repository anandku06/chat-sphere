import { z } from "@chat_app/common";

export const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(3).max(255),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

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
    .optional()
    .default(10),
  exclude: excludeSchema,
});

export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
