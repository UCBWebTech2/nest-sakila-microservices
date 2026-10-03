import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { InventoryItemDto } from './inventory-item.dto.js';

export class FindAllInventoryItemsResponseDto extends PaginationResponseDto<InventoryItemDto> {
    @ApiProperty({ type: [InventoryItemDto] })
    declare data: InventoryItemDto[];
}
