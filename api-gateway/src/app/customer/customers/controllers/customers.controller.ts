import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiNotFound, ApiUnauthorized, ApiConflict } from '../../../../shared/utils/swagger/index.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { CustomerGrpcClientService } from '../../services/customer-grpc-client.service.js';
import { CustomerDto } from '../dto/customer.dto.js';
import { CreateCustomerDto } from '../dto/create-customer.dto.js';
import { UpdateCustomerDto } from '../dto/update-customer.dto.js';
import { FindAllCustomersResponseDto } from '../dto/find-all-customers-response.dto.js';

// gRPC leaves unset optional fields out of the message — expose them as explicit nulls instead.
type GrpcCustomer = Omit<CustomerDto, 'email'> & { email?: string };
const toDto = (c: GrpcCustomer): CustomerDto => ({ ...c, email: c.email ?? null });

/**
 * Over gRPC (customer-service). Error dictionary: CUSTOMER_NOT_FOUND 404, INVALID_ADDRESS_ID 400, INVALID_STORE_ID 400,
 * STILL_REFERENCED 409, CUSTOMER_SERVICE_UNAVAILABLE 503, INVALID_TOKEN 401
 */
@ApiTags('Customers (gRPC)')
@ApiBearerAuth('access-token')
@Controller('customer/customers')
export class CustomersController {
    constructor(private readonly client: CustomerGrpcClientService) {}

    @Get()
    @ApiOperation({ summary: 'List customers' })
    @ApiOkResponse({ type: FindAllCustomersResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllCustomersResponseDto> {
        const res = await this.client.call<{ data: GrpcCustomer[]; meta: FindAllCustomersResponseDto['meta'] }>(
            'customers', 'list', { page: params.page, limit: params.limit });
        return { data: (res.data ?? []).map(toDto), meta: res.meta };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a customer by id' })
    @ApiOkResponse({ type: CustomerDto })
    @ApiNotFound({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CustomerDto> {
        return toDto(await this.client.call<GrpcCustomer>('customers', 'findOne', { id }));
    }

    @Post()
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiOperation({ summary: 'Create a customer' })
    @ApiBadRequest({ code: 'INVALID_ADDRESS_ID', message: 'Address 999 does not exist.' })
    @ApiCreatedResponse({ type: CustomerDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateCustomerDto): Promise<CustomerDto> {
        return toDto(await this.client.call<GrpcCustomer>('customers', 'create', createDto));
    }

    @Patch(':id')
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiOperation({ summary: 'Update a customer' })
    @ApiBadRequest({ code: 'INVALID_ADDRESS_ID', message: 'Address 999 does not exist.' })
    @ApiOkResponse({ type: CustomerDto })
    @ApiNotFound({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCustomerDto): Promise<CustomerDto> {
        return toDto(await this.client.call<GrpcCustomer>('customers', 'update', { id, ...updateDto }));
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a customer' })
    @ApiNotFound({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.call('customers', 'remove', { id });
    }
}
