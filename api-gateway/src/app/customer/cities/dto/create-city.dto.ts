import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateCityDto {
    @ApiProperty({ example: 'La Paz' })
    @IsString() @Length(1, 50)
    city: string;

    @ApiProperty({ example: 20, description: 'Must be an existing country.' })
    @IsInt() @Min(1)
    countryId: number;
}
