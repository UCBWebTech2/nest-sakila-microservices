import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Payment } from '../entities/payment.entity.js';

@ObjectType('Payment')
export class PaymentDto {
    @Field(() => Int)
    id: number;

    @Field(() => Int, { description: 'Id of a customer owned by customer-service.' })
    customerId: number;

    @Field(() => Int)
    staffId: number;

    @Field(() => Int)
    rentalId: number;

    @Field()
    amount: string;

    @Field()
    paymentDate: Date;

    static fromEntity(entity: Payment): PaymentDto {
        const dto = new PaymentDto();
        dto.id = entity.id;
        dto.customerId = entity.customerId;
        dto.staffId = entity.staffId;
        dto.rentalId = entity.rentalId;
        dto.amount = entity.amount;
        dto.paymentDate = entity.paymentDate;
        return dto;
    }
}
