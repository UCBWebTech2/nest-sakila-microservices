import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateAddressDto {
    @IsString() @Length(1, 50)
    address: string;

    @IsOptional() @IsString() @Length(1, 50)
    address2?: string;

    @IsString() @Length(1, 20)
    district: string;

    @IsInt() @Min(1)
    cityId: number;

    @IsOptional() @IsString() @Length(1, 10)
    postalCode?: string;

    @IsString() @Length(1, 20)
    phone: string;
}
