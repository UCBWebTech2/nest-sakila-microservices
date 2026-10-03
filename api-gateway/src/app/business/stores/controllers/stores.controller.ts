import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiConflict, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { BusinessGraphqlClientService } from '../../services/business-graphql-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { StoreDto } from '../dto/store.dto.js';
import { CreateStoreDto } from '../dto/create-store.dto.js';
import { UpdateStoreDto } from '../dto/update-store.dto.js';
import { FindAllStoresResponseDto } from '../dto/find-all-stores-response.dto.js';

/**
 * Rental store locations. Each one has a manager (a staff account) and a physical address —
 * both of those are just ids here, resolved by other services if you need the full record.
 *
 * Error dictionary: STORE_NOT_FOUND 404, ALREADY_EXISTS 409, STILL_REFERENCED 409,
 * INVALID_TOKEN 401
 */
@ApiTags('Stores')
@ApiBearerAuth('access-token')
@Controller('business/stores')
export class StoresController {
    constructor(private readonly client: BusinessGraphqlClientService) {}

    @Get()
    @ApiOperation({ summary: 'List stores' })
    @ApiOkResponse({ type: FindAllStoresResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllStoresResponseDto> {
        const data = await this.client.request<{ stores: FindAllStoresResponseDto }>(
            `query($page: Int, $limit: Int) {
                stores(page: $page, limit: $limit) {
                    data { id managerStaffId addressId lastUpdate }
                    meta { page limit total pages }
                }
            }`,
            { page: params.page, limit: params.limit },
        );
        return data.stores;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a store' })
    @ApiOkResponse({ type: StoreDto })
    @ApiNotFound({ code: 'STORE_NOT_FOUND', message: 'Store not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<StoreDto> {
        const data = await this.client.request<{ store: StoreDto }>(
            `query($id: Int!) { store(id: $id) { id managerStaffId addressId lastUpdate } }`,
            { id },
        );
        return data.store;
    }

    @Post()
    @ApiBadRequest({ code: 'INVALID_ADDRESS_ID', message: 'Address 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_STAFF_ID', message: 'Staff 999 does not exist.' })
    @ApiOperation({
        summary:     'Open a new store',
        description: 'managerStaffId must belong to a staff account that isn\'t already managing another store — Sakila only allows one manager per store.',
    })
    @ApiCreatedResponse({ type: StoreDto })
    @ApiConflict({ code: 'ALREADY_EXISTS', message: 'A record with that value already exists.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateStoreDto): Promise<StoreDto> {
        const data = await this.client.request<{ createStore: StoreDto }>(
            `mutation($input: CreateStoreDto!) { createStore(input: $input) { id managerStaffId addressId lastUpdate } }`,
            { input: createDto },
        );
        return data.createStore;
    }

    @Patch(':id')
    @ApiBadRequest({ code: 'INVALID_ADDRESS_ID', message: 'Address 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_STAFF_ID', message: 'Staff 999 does not exist.' })
    @ApiOperation({
        summary:     'Update a store',
        description: "Typically used to reassign the manager — changing addressId just relabels which address this store's id points at.",
    })
    @ApiOkResponse({ type: StoreDto })
    @ApiNotFound({ code: 'STORE_NOT_FOUND', message: 'Store not found.' })
    @ApiConflict({ code: 'ALREADY_EXISTS', message: 'A record with that value already exists.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateStoreDto): Promise<StoreDto> {
        const data = await this.client.request<{ updateStore: StoreDto }>(
            `mutation($id: Int!, $input: UpdateStoreDto!) { updateStore(id: $id, input: $input) { id managerStaffId addressId lastUpdate } }`,
            { id, input: updateDto },
        );
        return data.updateStore;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:     'Close a store',
        description: 'Fails with a 409 while any staff account is still assigned to this store.',
    })
    @ApiNotFound({ code: 'STORE_NOT_FOUND', message: 'Store not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.request<{ removeStore: boolean }>(
            `mutation($id: Int!) { removeStore(id: $id) }`,
            { id },
        );
    }
}
