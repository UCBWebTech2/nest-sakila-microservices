import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateActorDto {
    @ApiProperty({ example: 'Leonardo' })
    @IsString()
    @Length(1, 45)
    firstName: string;

    @ApiProperty({ example: 'DiCaprio' })
    @IsString()
    @Length(1, 45)
    lastName: string;
}
