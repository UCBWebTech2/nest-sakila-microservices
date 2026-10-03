import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateStaffDto {
    @ApiProperty({ example: 'Mike' })
    @IsString()
    @Length(1, 45)
    firstName: string;

    @ApiProperty({ example: 'Hillyer' })
    @IsString()
    @Length(1, 45)
    lastName: string;

    @ApiProperty({ example: 1, description: 'Id of an address owned by customer-service.' })
    @IsInt()
    addressId: number;

    @ApiPropertyOptional({ example: 'mike@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: 1 })
    @IsInt()
    storeId: number;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiProperty({ example: 'mhillyer' })
    @IsString()
    @Length(1, 16)
    username: string;

    @ApiProperty({ example: 'Sup3rSecret!', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;
}
