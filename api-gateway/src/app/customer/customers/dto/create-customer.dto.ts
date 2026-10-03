import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ example: 1, description: 'Store (business-service) the customer belongs to.' })
    @IsInt() @Min(1)
    storeId: number;

    @ApiProperty({ example: 'JAIME' })
    @IsString() @Length(1, 45)
    firstName: string;

    @ApiProperty({ example: 'HUAYCHO' })
    @IsString() @Length(1, 45)
    lastName: string;

    @ApiPropertyOptional({ example: 'jaime@example.com' })
    @IsOptional() @IsEmail() @Length(1, 50)
    email?: string;

    @ApiProperty({ example: 5, description: 'Must be an existing address.' })
    @IsInt() @Min(1)
    addressId: number;
}
