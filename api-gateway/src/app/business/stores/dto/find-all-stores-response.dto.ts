import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { StoreDto } from './store.dto.js';

export class FindAllStoresResponseDto extends PaginationResponseDto<StoreDto> {
    @ApiProperty({ type: [StoreDto] })
    declare data: StoreDto[];
}
