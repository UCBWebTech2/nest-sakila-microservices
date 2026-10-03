import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt } from 'class-validator';

@InputType()
export class CreateRentalDto {
    @Field()
    @IsDateString()
    rentalDate: string;

    @Field(() => Int, { description: 'Id of an inventory item owned by inventory-service.' })
    @IsInt()
    inventoryId: number;

    @Field(() => Int, { description: 'Id of a customer owned by customer-service.' })
    @IsInt()
    customerId: number;

    @Field(() => Int)
    @IsInt()
    staffId: number;
}
