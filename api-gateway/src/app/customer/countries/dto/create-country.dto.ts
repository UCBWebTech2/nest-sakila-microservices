import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCountryDto {
    @ApiProperty({ example: 'Atlantis' })
    @IsString() @Length(1, 50)
    country: string;
}
