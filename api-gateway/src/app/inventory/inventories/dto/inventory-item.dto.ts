import { ApiProperty } from '@nestjs/swagger';

// Named InventoryItem, not Inventory, to avoid colliding with this whole module's own name.
export class InventoryItemDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1, description: 'Id of a film owned by this same service.' })
    filmId: number;

    @ApiProperty({ example: 1, description: 'Id of a store owned by business-service.' })
    storeId: number;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    lastUpdate: string;
}
