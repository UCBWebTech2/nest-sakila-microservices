import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Film-Noir' })
    @IsString()
    @Length(1, 25)
    name: string;
}
