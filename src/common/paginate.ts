import { PaginatedResponse } from './paginated-response.dto';

interface PaginateArgs {
  page: number;
  limit: number;
  sortBy?: string[];
  sortOrder?: ('asc' | 'desc')[];
  where?: Record<string, unknown>;
  defaultSortField?: string;
}

export async function paginate<T>(
  delegate: {
    findMany: (args: any) => Promise<T[]>;
    count: (args: any) => Promise<number>;
  },
  args: PaginateArgs,
): Promise<PaginatedResponse<T>> {
  const { page, limit, where } = args;
  const skip = (page - 1) * limit;

  const orderBy = buildOrderBy(args);

  const [data, total] = await Promise.all([
    delegate.findMany({ skip, take: limit, orderBy, where }),
    delegate.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
    },
  };
}

function buildOrderBy(
  args: Pick<PaginateArgs, 'sortBy' | 'sortOrder' | 'defaultSortField'>,
): Record<string, 'asc' | 'desc'>[] {
  const { sortBy, sortOrder, defaultSortField = 'id' } = args;

  if (!sortBy || sortBy.length === 0) {
    return [{ [defaultSortField]: 'asc' }];
  }

  return sortBy.map((field, i) => ({
    [field]: sortOrder?.[i] ?? 'asc',
  }));
}
