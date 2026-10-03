import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateInventoryItemDto {
    @ApiProperty({ example: 1, description: 'Id of a film owned by this same service.' })
    @IsInt()
    filmId: number;

    @ApiProperty({ example: 1, description: 'Id of a store owned by business-service.' })
    @IsInt()
    storeId: number;
}
