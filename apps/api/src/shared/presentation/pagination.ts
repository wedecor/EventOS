import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PageResult<T> = {
  items: T[];
  meta: PageMeta;
};

export function buildPageMeta(
  page: number,
  pageSize: number,
  total: number,
): PageMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function paginationSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function toPagedResponse<T>(page: PageResult<T>): {
  data: T[];
  meta: PageMeta;
} {
  return { data: page.items, meta: page.meta };
}
