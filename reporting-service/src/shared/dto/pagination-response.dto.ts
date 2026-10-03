class MetadataDto {
    /** Current page number. */
    page: number;

    /** Items per page. */
    limit: number;

    /** Total number of pages. */
    pages: number;

    /** Total number of records. */
    total: number;
}

export class PaginationResponseDto<T> {
    /** Items on the current page. */
    data: T[];

    /** Pagination metadata. */
    meta: MetadataDto;
}
