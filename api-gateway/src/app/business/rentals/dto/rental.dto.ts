import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RentalDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    rentalDate: string;

    @ApiProperty({ example: 1, description: 'Id of an inventory item owned by inventory-service.' })
    inventoryId: number;

    @ApiProperty({ example: 1, description: 'Id of a customer owned by customer-service.' })
    customerId: number;

    @ApiPropertyOptional({ example: null, nullable: true })
    returnDate: string | null;

    @ApiProperty({ example: 1 })
    staffId: number;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    lastUpdate: string;
}
