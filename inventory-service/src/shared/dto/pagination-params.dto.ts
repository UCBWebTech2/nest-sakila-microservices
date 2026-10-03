import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional } from 'class-validator';

// Query params arrive as strings — @Type(() => Number) converts them before validation.
// Requires ValidationPipe({ transform: true }) in main.ts.
export class PaginationParamsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: "The 'page' parameter must be an integer." })
    @Min(1,  { message: "The 'page' parameter must be >= 1." })
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: "The 'limit' parameter must be an integer." })
    @Min(1,  { message: "The 'limit' parameter must be >= 1." })
    limit: number = 10;
}
