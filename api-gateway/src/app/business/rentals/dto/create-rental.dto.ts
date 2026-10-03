import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt } from 'class-validator';

export class CreateRentalDto {
    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    @IsDateString()
    rentalDate: string;

    @ApiProperty({ example: 1, description: 'Id of an inventory item owned by inventory-service.' })
    @IsInt()
    inventoryId: number;

    @ApiProperty({ example: 1, description: 'Id of a customer owned by customer-service.' })
    @IsInt()
    customerId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    staffId: number;
}
