import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaymentsService } from '../services/payments.service.js';
import { PaymentDto } from '../dto/payment.dto.js';
import { CreatePaymentDto } from '../dto/create-payment.dto.js';
import { UpdatePaymentDto } from '../dto/update-payment.dto.js';
import { FindAllPaymentsResponseDto } from '../dto/find-all-payments-response.dto.js';
import { PaginationArgs } from '../../../shared/dto/index.js';

@Resolver(() => PaymentDto)
export class PaymentsResolver {
    constructor(private readonly service: PaymentsService) {}

    @Query(() => FindAllPaymentsResponseDto, { name: 'payments', description: 'Returns a paginated list of payments.' })
    async findAll(@Args() params: PaginationArgs): Promise<FindAllPaymentsResponseDto> {
        return await this.service.findAll(params);
    }

    @Query(() => PaymentDto, { name: 'payment', description: 'Returns a single payment by id.' })
    async findOne(@Args('id', { type: () => Int }) id: number): Promise<PaymentDto> {
        return (await this.service.findOneById(id)) as PaymentDto;
    }

    @Mutation(() => PaymentDto, { name: 'createPayment', description: 'Creates a new payment.' })
    async create(@Args('input') input: CreatePaymentDto): Promise<PaymentDto> {
        return await this.service.create(input);
    }

    @Mutation(() => PaymentDto, { name: 'updatePayment', description: 'Partially updates a payment.' })
    async update(
        @Args('id', { type: () => Int }) id: number,
        @Args('input') input: UpdatePaymentDto,
    ): Promise<PaymentDto> {
        return await this.service.update(id, input);
    }

    @Mutation(() => Boolean, { name: 'removePayment', description: 'Permanently deletes a payment.' })
    async remove(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
        await this.service.remove(id);
        return true;
    }
}
