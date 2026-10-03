import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCustomerDto {
    @IsInt() @Min(1)
    id: number;

    @IsOptional() @IsInt() @Min(1)
    storeId?: number;

    @IsOptional() @IsString() @Length(1, 45)
    firstName?: string;

    @IsOptional() @IsString() @Length(1, 45)
    lastName?: string;

    @IsOptional() @IsEmail() @Length(1, 50)
    email?: string;

    @IsOptional() @IsInt() @Min(1)
    addressId?: number;

    @IsOptional() @IsBoolean()
    active?: boolean;
}
