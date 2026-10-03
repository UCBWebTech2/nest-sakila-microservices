import { ApiProperty } from '@nestjs/swagger';

export class CountryDto {
    @ApiProperty({ example: 20 })
    id: number;

    @ApiProperty({ example: 'Bolivia' })
    country: string;

    @ApiProperty({ example: '2006-02-15T09:44:00.000Z' })
    lastUpdate: string;
}
