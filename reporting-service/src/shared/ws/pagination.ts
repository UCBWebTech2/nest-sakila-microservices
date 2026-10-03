// No ValidationPipe applies to @SubscribeMessage args by default — pagination is normalized by
// hand, same spirit as inventory-service's shared/soap/pagination.ts.
export interface PaginationArgs {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    page:  number;
    limit: number;
    total: number;
    pages: number;
}

export function normalizePagination(args: PaginationArgs): { page: number; limit: number } {
    const page  = Number(args?.page) > 0 ? Math.floor(Number(args.page)) : 1;
    const limit = Number(args?.limit) > 0 ? Math.floor(Number(args.limit)) : 10;
    return { page, limit };
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
    return { page, limit, total, pages: Math.ceil(total / limit) };
}
