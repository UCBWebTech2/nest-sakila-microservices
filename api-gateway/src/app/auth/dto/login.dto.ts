import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'mhillyer' })
    @IsString()
    @IsNotEmpty({ message: 'Username is required.' })
    username: string;

    @ApiProperty({ example: 'Sup3rSecret!' })
    @IsString()
    @IsNotEmpty({ message: 'Password is required.' })
    password: string;
}
