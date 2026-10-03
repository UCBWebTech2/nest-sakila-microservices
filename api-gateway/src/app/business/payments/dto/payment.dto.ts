import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1, description: 'Id of a customer owned by customer-service.' })
    customerId: number;

    @ApiProperty({ example: 1 })
    staffId: number;

    @ApiProperty({ example: 1 })
    rentalId: number;

    @ApiProperty({ example: '2.99' })
    amount: string;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    paymentDate: string;
}
