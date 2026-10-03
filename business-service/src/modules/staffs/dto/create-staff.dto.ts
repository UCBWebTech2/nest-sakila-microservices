import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Length, MinLength } from 'class-validator';

@InputType()
export class CreateStaffDto {
    @Field()
    @IsString()
    @Length(1, 45)
    firstName: string;

    @Field()
    @IsString()
    @Length(1, 45)
    lastName: string;

    @Field(() => Int, { description: 'Id of an address owned by customer-service.' })
    @IsInt()
    addressId: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsEmail()
    email?: string;

    @Field(() => Int)
    @IsInt()
    storeId: number;

    @Field({ nullable: true, defaultValue: true })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @Field()
    @IsString()
    @Length(1, 16)
    username: string;

    @Field()
    @IsString()
    @MinLength(6)
    password: string;
}
