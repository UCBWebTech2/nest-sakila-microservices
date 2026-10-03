import { InputType, PartialType } from '@nestjs/graphql';
import { CreatePaymentDto } from './create-payment.dto.js';

@InputType()
export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
