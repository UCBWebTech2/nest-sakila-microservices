import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumberString } from 'class-validator';

export class CreatePaymentDto {
    @ApiProperty({ example: 1, description: 'Id of a customer owned by customer-service.' })
    @IsInt()
    customerId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    staffId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    rentalId: number;

    @ApiProperty({ example: '2.99' })
    @IsNumberString()
    amount: string;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    @IsDateString()
    paymentDate: string;
}
