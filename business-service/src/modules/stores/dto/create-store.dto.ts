import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt } from 'class-validator';

@InputType()
export class CreateStoreDto {
    @Field(() => Int)
    @IsInt()
    managerStaffId: number;

    @Field(() => Int, { description: 'Id of an address owned by customer-service.' })
    @IsInt()
    addressId: number;
}
