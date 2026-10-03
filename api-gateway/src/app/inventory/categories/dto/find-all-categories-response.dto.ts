import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { CategoryDto } from './category.dto.js';

export class FindAllCategoriesResponseDto extends PaginationResponseDto<CategoryDto> {
    @ApiProperty({ type: [CategoryDto] })
    declare data: CategoryDto[];
}
