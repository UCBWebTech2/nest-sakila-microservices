import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateAddressDto {
    @ApiProperty({ example: '47 MySakila Drive' })
    @IsString() @Length(1, 50)
    address: string;

    @ApiPropertyOptional({ example: 'Apt 2' })
    @IsOptional() @IsString() @Length(1, 50)
    address2?: string;

    @ApiProperty({ example: 'Alberta' })
    @IsString() @Length(1, 20)
    district: string;

    @ApiProperty({ example: 300, description: 'Must be an existing city.' })
    @IsInt() @Min(1)
    cityId: number;

    @ApiPropertyOptional({ example: '35200' })
    @IsOptional() @IsString() @Length(1, 10)
    postalCode?: string;

    @ApiProperty({ example: '28303384290' })
    @IsString() @Length(1, 20)
    phone: string;
}
