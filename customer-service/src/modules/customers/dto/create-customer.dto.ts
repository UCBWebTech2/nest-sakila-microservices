import { IsEmail, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateCustomerDto {
    @IsInt() @Min(1)
    storeId: number;

    @IsString() @Length(1, 45)
    firstName: string;

    @IsString() @Length(1, 45)
    lastName: string;

    @IsOptional() @IsEmail() @Length(1, 50)
    email?: string;

    @IsInt() @Min(1)
    addressId: number;
}
