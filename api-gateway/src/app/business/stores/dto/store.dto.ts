import { ApiProperty } from '@nestjs/swagger';

export class StoreDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1 })
    managerStaffId: number;

    @ApiProperty({ example: 1, description: 'Id of an address owned by customer-service.' })
    addressId: number;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    lastUpdate: string;
}
