// SOAP args arrive as parsed XML — no ValidationPipe/class-validator here, so pagination
// parameters are normalized by hand instead of relying on decorators.
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

// `args` can arrive empty: a List* call with no parameters (page and limit are optional in the WSDL)
// gets an empty request element, which the soap package hands over as undefined or ''.
export function normalizePagination(args?: PaginationArgs | null): { page: number; limit: number } {
    const page  = Number(args?.page) > 0 ? Math.floor(Number(args?.page)) : 1;
    const limit = Number(args?.limit) > 0 ? Math.floor(Number(args?.limit)) : 10;
    return { page, limit };
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
    return { page, limit, total, pages: Math.ceil(total / limit) };
}
