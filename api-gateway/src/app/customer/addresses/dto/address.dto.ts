import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
    @ApiProperty({ example: 5 })
    id: number;

    @ApiProperty({ example: '1913 Hanoi Way' })
    address: string;

    @ApiProperty({ example: null, nullable: true, type: String })
    address2: string | null;

    @ApiProperty({ example: 'Nagasaki' })
    district: string;

    @ApiProperty({ example: 463 })
    cityId: number;

    @ApiProperty({ example: '35200', nullable: true, type: String })
    postalCode: string | null;

    @ApiProperty({ example: '28303384290' })
    phone: string;

    @ApiProperty({ example: '2014-09-25T22:30:27.000Z' })
    lastUpdate: string;
}
