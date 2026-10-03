import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateLanguageDto {
    @ApiProperty({ example: 'Klingon' })
    @IsString()
    @Length(1, 20)
    name: string;
}
