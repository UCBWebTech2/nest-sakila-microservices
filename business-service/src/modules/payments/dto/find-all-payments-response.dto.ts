import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationMeta } from '../../../shared/dto/index.js';
import { PaymentDto } from './payment.dto.js';

@ObjectType()
export class FindAllPaymentsResponseDto {
    @Field(() => [PaymentDto])
    data: PaymentDto[];

    @Field(() => PaginationMeta)
    meta: PaginationMeta;
}
