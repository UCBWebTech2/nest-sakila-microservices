import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiNotFound, ApiUnauthorized, ApiConflict } from '../../../../shared/utils/swagger/index.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { CustomerGrpcClientService } from '../../services/customer-grpc-client.service.js';
import { AddressDto } from '../dto/address.dto.js';
import { CreateAddressDto } from '../dto/create-address.dto.js';
import { UpdateAddressDto } from '../dto/update-address.dto.js';
import { FindAllAddressesResponseDto } from '../dto/find-all-addresses-response.dto.js';

// gRPC leaves unset optional fields out of the message — expose them as explicit nulls instead.
type GrpcAddress = Omit<AddressDto, 'address2' | 'postalCode'> & { address2?: string; postalCode?: string };
const toDto = (a: GrpcAddress): AddressDto => ({ ...a, address2: a.address2 ?? null, postalCode: a.postalCode ?? null });

/**
 * Over gRPC (customer-service). Error dictionary: ADDRESS_NOT_FOUND 404, INVALID_CITY_ID 400, INVALID_REFERENCE 400,
 * STILL_REFERENCED 409, CUSTOMER_SERVICE_UNAVAILABLE 503, INVALID_TOKEN 401
 */
@ApiTags('Addresses (gRPC)')
@ApiBearerAuth('access-token')
@Controller('customer/addresses')
export class AddressesController {
    constructor(private readonly client: CustomerGrpcClientService) {}

    @Get()
    @ApiOperation({ summary: 'List addresses' })
    @ApiOkResponse({ type: FindAllAddressesResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllAddressesResponseDto> {
        const res = await this.client.call<{ data: GrpcAddress[]; meta: FindAllAddressesResponseDto['meta'] }>(
            'addresses', 'list', { page: params.page, limit: params.limit });
        return { data: (res.data ?? []).map(toDto), meta: res.meta };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an address by id' })
    @ApiOkResponse({ type: AddressDto })
    @ApiNotFound({ code: 'ADDRESS_NOT_FOUND', message: 'Address not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<AddressDto> {
        return toDto(await this.client.call<GrpcAddress>('addresses', 'findOne', { id }));
    }

    @Post()
    @ApiOperation({ summary: 'Create an address' })
    @ApiBadRequest({ code: 'INVALID_CITY_ID', message: 'City 999 does not exist.' })
    @ApiCreatedResponse({ type: AddressDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateAddressDto): Promise<AddressDto> {
        return toDto(await this.client.call<GrpcAddress>('addresses', 'create', createDto));
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an address' })
    @ApiBadRequest({ code: 'INVALID_CITY_ID', message: 'City 999 does not exist.' })
    @ApiOkResponse({ type: AddressDto })
    @ApiNotFound({ code: 'ADDRESS_NOT_FOUND', message: 'Address not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateAddressDto): Promise<AddressDto> {
        return toDto(await this.client.call<GrpcAddress>('addresses', 'update', { id, ...updateDto }));
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:     'Remove an address',
        description: 'Fails with a 409 while any customer still lives at it.',
    })
    @ApiNotFound({ code: 'ADDRESS_NOT_FOUND', message: 'Address not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.call('addresses', 'remove', { id });
    }
}
