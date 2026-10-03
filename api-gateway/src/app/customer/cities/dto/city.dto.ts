import { ApiProperty } from '@nestjs/swagger';

export class CityDto {
    @ApiProperty({ example: 463 })
    id: number;

    @ApiProperty({ example: 'Sasebo' })
    city: string;

    @ApiProperty({ example: 50 })
    countryId: number;

    @ApiProperty({ example: '2006-02-15T09:45:25.000Z' })
    lastUpdate: string;
}
