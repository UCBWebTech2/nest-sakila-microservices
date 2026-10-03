import { ApiProperty } from '@nestjs/swagger';

export class CustomerDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1 })
    storeId: number;

    @ApiProperty({ example: 'MARY' })
    firstName: string;

    @ApiProperty({ example: 'SMITH' })
    lastName: string;

    @ApiProperty({ example: 'mary.smith@sakilacustomer.org', nullable: true, type: String })
    email: string | null;

    @ApiProperty({ example: 5 })
    addressId: number;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: '2006-02-14' })
    createDate: string;

    @ApiProperty({ example: '2013-05-26T14:49:45.738Z' })
    lastUpdate: string;
}
