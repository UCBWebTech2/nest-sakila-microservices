import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateStoreDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    managerStaffId: number;

    @ApiProperty({ example: 1, description: 'Id of an address owned by customer-service.' })
    @IsInt()
    addressId: number;
}
