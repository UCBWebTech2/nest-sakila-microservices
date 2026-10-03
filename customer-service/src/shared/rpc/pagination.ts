export interface PaginationMeta {
    page:  number;
    limit: number;
    total: number;
    pages: number;
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
    return { page, limit, total, pages: Math.ceil(total / limit) };
}
