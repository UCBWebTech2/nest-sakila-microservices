import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateAddressDto {
    @IsInt() @Min(1)
    id: number;

    @IsOptional() @IsString() @Length(1, 50)
    address?: string;

    @IsOptional() @IsString() @Length(1, 50)
    address2?: string;

    @IsOptional() @IsString() @Length(1, 20)
    district?: string;

    @IsOptional() @IsInt() @Min(1)
    cityId?: number;

    @IsOptional() @IsString() @Length(1, 10)
    postalCode?: string;

    @IsOptional() @IsString() @Length(1, 20)
    phone?: string;
}
