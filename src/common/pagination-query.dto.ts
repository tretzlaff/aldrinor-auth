import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .string()
    .transform((v) => v.split(','))
    .optional(),
  sortOrder: z
    .string()
    .transform((v) =>
      v.split(',').map((o) => o.toLowerCase() as 'asc' | 'desc'),
    )
    .optional(),
});

export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;
