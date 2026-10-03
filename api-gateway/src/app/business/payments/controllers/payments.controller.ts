import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiUnprocessableEntity, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { BusinessGraphqlClientService } from '../../services/business-graphql-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { PaymentDto } from '../dto/payment.dto.js';
import { CreatePaymentDto } from '../dto/create-payment.dto.js';
import { UpdatePaymentDto } from '../dto/update-payment.dto.js';
import { FindAllPaymentsResponseDto } from '../dto/find-all-payments-response.dto.js';

/**
 * Payments taken against a rental. Each one ties a customer, the staff member who processed it,
 * and the rental it covers — all three are ids here, not expanded objects.
 *
 * Error dictionary: PAYMENT_NOT_FOUND 404, INVALID_TOKEN 401
 */
@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('business/payments')
export class PaymentsController {
    constructor(private readonly client: BusinessGraphqlClientService) {}

    @Get()
    @ApiOperation({ summary: 'List payments' })
    @ApiOkResponse({ type: FindAllPaymentsResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllPaymentsResponseDto> {
        const data = await this.client.request<{ payments: FindAllPaymentsResponseDto }>(
            `query($page: Int, $limit: Int) {
                payments(page: $page, limit: $limit) {
                    data { id customerId staffId rentalId amount paymentDate }
                    meta { page limit total pages }
                }
            }`,
            { page: params.page, limit: params.limit },
        );
        return data.payments;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a payment by id' })
    @ApiOkResponse({ type: PaymentDto })
    @ApiNotFound({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentDto> {
        const data = await this.client.request<{ payment: PaymentDto }>(
            `query($id: Int!) { payment(id: $id) { id customerId staffId rentalId amount paymentDate } }`,
            { id },
        );
        return data.payment;
    }

    @Post()
    @ApiBadRequest({ code: 'INVALID_CUSTOMER_ID', message: 'Customer 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_STAFF_ID', message: 'Staff 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_RENTAL_ID', message: 'Rental 999 does not exist.' })
    @ApiOperation({
        summary:     'Record a payment',
        description: 'customerId, staffId, and rentalId each have to point at an existing row — the write is rejected otherwise.',
    })
    @ApiCreatedResponse({ type: PaymentDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreatePaymentDto): Promise<PaymentDto> {
        const data = await this.client.request<{ createPayment: PaymentDto }>(
            `mutation($input: CreatePaymentDto!) { createPayment(input: $input) { id customerId staffId rentalId amount paymentDate } }`,
            { input: createDto },
        );
        return data.createPayment;
    }

    @Patch(':id')
    @ApiBadRequest({ code: 'INVALID_CUSTOMER_ID', message: 'Customer 999 does not exist.' })
    @ApiUnprocessableEntity({ code: 'PAYMENT_DATE_OUT_OF_RANGE', message: "A payment's date can't be moved into a different month: delete it and create a new one instead." })
    @ApiBadRequest({ code: 'INVALID_STAFF_ID', message: 'Staff 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_RENTAL_ID', message: 'Rental 999 does not exist.' })
    @ApiOperation({ summary: 'Correct a payment', description: 'Mainly for fixing the amount or the date on a mis-entered payment.' })
    @ApiOkResponse({ type: PaymentDto })
    @ApiNotFound({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdatePaymentDto): Promise<PaymentDto> {
        const data = await this.client.request<{ updatePayment: PaymentDto }>(
            `mutation($id: Int!, $input: UpdatePaymentDto!) { updatePayment(id: $id, input: $input) { id customerId staffId rentalId amount paymentDate } }`,
            { id, input: updateDto },
        );
        return data.updatePayment;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Void a payment', description: 'Removes the record outright — there is no reversal/credit flow here, this is a hard delete.' })
    @ApiNotFound({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.request<{ removePayment: boolean }>(
            `mutation($id: Int!) { removePayment(id: $id) }`,
            { id },
        );
    }
}
