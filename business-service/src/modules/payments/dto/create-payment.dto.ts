import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, IsNumberString } from 'class-validator';

@InputType()
export class CreatePaymentDto {
    @Field(() => Int, { description: 'Id of a customer owned by customer-service.' })
    @IsInt()
    customerId: number;

    @Field(() => Int)
    @IsInt()
    staffId: number;

    @Field(() => Int)
    @IsInt()
    rentalId: number;

    @Field()
    @IsNumberString()
    amount: string;

    @Field()
    @IsDateString()
    paymentDate: string;
}
