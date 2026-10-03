import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumberString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiBadRequest, ApiNotFound, ApiUnauthorized } from '../../../shared/utils/swagger/index.js';
import { ReportingSocketClientService } from '../services/reporting-socket-client.service.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import {
    FindAllActorInfoResponseDto, FindAllCustomersReportResponseDto, FindAllFilmListResponseDto,
    FindAllSalesByCategoryResponseDto, FindAllSalesByStoreResponseDto, FindAllStaffReportResponseDto,
    RewardsCustomerDto,
} from '../dto/reports.dto.js';
import {
    mapActorInfo, mapCustomerReport, mapFilmListItem,
    mapRewardsCustomer, mapSalesByCategory, mapSalesByStore, mapStaffReport,
} from '../dto/mappers.js';

class StockQueryDto {
    @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) storeId: number;
}
class RewardsQueryDto {
    @ApiProperty({ example: 2, description: 'Minimum number of distinct months with a purchase.' })
    @Type(() => Number) @IsInt() @Min(1) minMonthlyPurchases: number;

    @ApiProperty({ example: '50.00' }) @IsNumberString() minDollarAmountPurchased: string;
}
class BalanceQueryDto {
    @ApiProperty({ example: '2026-01-01T00:00:00.000Z' }) @IsDateString() effectiveDate: string;
}

/**
 * Read-only reports — all 7 Sakila views + 6 functions, backed by reporting-service over
 * WebSocket. There's nothing to create/update/delete here, every route is a GET.
 *
 * Error dictionary: INVALID_PARAMS 400, INVALID_TOKEN 401
 */
@ApiTags('Reporting')
@ApiBearerAuth('access-token')
@Controller('reporting')
export class ReportingController {
    constructor(private readonly client: ReportingSocketClientService) {}

    @Get('actors/info')
    @ApiOperation({ summary: 'Every actor with the films they\'ve appeared in, grouped by category' })
    @ApiOkResponse({ type: FindAllActorInfoResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getActorInfo(@Query() params: PaginationParamsDto): Promise<FindAllActorInfoResponseDto> {
        const res = await this.client.call<{ data: any[]; meta: any }>('getActorInfo', { page: params.page, limit: params.limit });
        return { data: res.data.map(mapActorInfo), meta: res.meta };
    }

    @Get('customers')
    @ApiOperation({ summary: 'Customers with their address, city, and country, flattened for display' })
    @ApiOkResponse({ type: FindAllCustomersReportResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getCustomerList(@Query() params: PaginationParamsDto): Promise<FindAllCustomersReportResponseDto> {
        const res = await this.client.call<{ data: any[]; meta: any }>('getCustomerList', { page: params.page, limit: params.limit });
        return { data: res.data.map(mapCustomerReport), meta: res.meta };
    }

    @Get('films')
    @ApiOperation({ summary: 'Films with their category and full cast, in one row per film' })
    @ApiOkResponse({ type: FindAllFilmListResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getFilmList(@Query() params: PaginationParamsDto): Promise<FindAllFilmListResponseDto> {
        const res = await this.client.call<{ data: any[]; meta: any }>('getFilmList', { page: params.page, limit: params.limit });
        return { data: res.data.map(mapFilmListItem), meta: res.meta };
    }

    @Get('films/nicer-but-slower')
    @ApiOperation({
        summary:     'Same as /films, but the cast names are properly capitalized',
        description: 'Sakila ships this as a separate view specifically to demonstrate that formatting text at query time (vs. once, at write time) is slower — hence the name.',
    })
    @ApiOkResponse({ type: FindAllFilmListResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getNicerButSlowerFilmList(@Query() params: PaginationParamsDto): Promise<FindAllFilmListResponseDto> {
        const res = await this.client.call<{ data: any[]; meta: any }>('getNicerButSlowerFilmList', { page: params.page, limit: params.limit });
        return { data: res.data.map(mapFilmListItem), meta: res.meta };
    }

    @Get('sales/by-category')
    @ApiOperation({ summary: 'Total revenue per film category, highest first' })
    @ApiOkResponse({ type: FindAllSalesByCategoryResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getSalesByFilmCategory(@Query() params: PaginationParamsDto): Promise<FindAllSalesByCategoryResponseDto> {
        const res = await this.client.call<{ data: any[]; meta: any }>('getSalesByFilmCategory', { page: params.page, limit: params.limit });
        return { data: res.data.map(mapSalesByCategory), meta: res.meta };
    }

    @Get('sales/by-store')
    @ApiOperation({ summary: 'Total revenue per store, with its manager and location' })
    @ApiOkResponse({ type: FindAllSalesByStoreResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getSalesByStore(@Query() params: PaginationParamsDto): Promise<FindAllSalesByStoreResponseDto> {
        const res = await this.client.call<{ data: any[]; meta: any }>('getSalesByStore', { page: params.page, limit: params.limit });
        return { data: res.data.map(mapSalesByStore), meta: res.meta };
    }

    @Get('staff')
    @ApiOperation({ summary: 'Staff with their address, city, and country, flattened for display' })
    @ApiOkResponse({ type: FindAllStaffReportResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getStaffList(@Query() params: PaginationParamsDto): Promise<FindAllStaffReportResponseDto> {
        const res = await this.client.call<{ data: any[]; meta: any }>('getStaffList', { page: params.page, limit: params.limit });
        return { data: res.data.map(mapStaffReport), meta: res.meta };
    }

    @Get('films/:filmId/in-stock')
    @ApiNotFound({ code: 'FILM_NOT_FOUND', message: 'Film 999 not found.' })
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiOperation({ summary: 'Inventory ids of this film currently available to rent at a store' })
    @ApiOkResponse({ schema: { type: 'array', items: { type: 'integer' } } })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getFilmInStock(@Param('filmId', ParseIntPipe) filmId: number, @Query() query: StockQueryDto) {
        return await this.client.call('getFilmInStock', { filmId, storeId: query.storeId });
    }

    @Get('films/:filmId/not-in-stock')
    @ApiNotFound({ code: 'FILM_NOT_FOUND', message: 'Film 999 not found.' })
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiOperation({ summary: 'Inventory ids of this film currently checked out at a store' })
    @ApiOkResponse({ schema: { type: 'array', items: { type: 'integer' } } })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getFilmNotInStock(@Param('filmId', ParseIntPipe) filmId: number, @Query() query: StockQueryDto) {
        return await this.client.call('getFilmNotInStock', { filmId, storeId: query.storeId });
    }

    @Get('customers/:customerId/balance')
    @ApiNotFound({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer 999 not found.' })
    @ApiOperation({
        summary:     'A customer\'s balance as of a given date',
        description: 'Rental fees owed, plus $1/day for anything returned late, minus payments already made.',
    })
    @ApiQuery({ name: 'effectiveDate', required: true })
    @ApiOkResponse({ schema: { type: 'object', properties: { balance: { type: 'string', example: '-4.00' } } } })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getCustomerBalance(@Param('customerId', ParseIntPipe) customerId: number, @Query() query: BalanceQueryDto) {
        return await this.client.call('getCustomerBalance', { customerId, effectiveDate: query.effectiveDate });
    }

    @Get('inventory/:inventoryId/held-by')
    @ApiNotFound({ code: 'INVENTORY_NOT_FOUND', message: 'Inventory 999 not found.' })
    @ApiOperation({ summary: 'Which customer currently has this inventory item rented out', description: 'null if nobody does.' })
    @ApiOkResponse({ schema: { type: 'object', properties: { customerId: { type: 'integer', nullable: true } } } })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getInventoryHeldByCustomer(@Param('inventoryId', ParseIntPipe) inventoryId: number) {
        return await this.client.call('getInventoryHeldByCustomer', { inventoryId });
    }

    @Get('inventory/:inventoryId/in-stock')
    @ApiNotFound({ code: 'INVENTORY_NOT_FOUND', message: 'Inventory 999 not found.' })
    @ApiOperation({ summary: 'Whether this specific inventory item is available right now' })
    @ApiOkResponse({ schema: { type: 'object', properties: { inStock: { type: 'boolean' } } } })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getInventoryInStock(@Param('inventoryId', ParseIntPipe) inventoryId: number) {
        return await this.client.call('getInventoryInStock', { inventoryId });
    }

    @Get('customers/rewards')
    @ApiOperation({
        summary:     'Customers eligible for the rewards program',
        description: 'Everyone who made at least minMonthlyPurchases purchases of at least minDollarAmountPurchased in a month.',
    })
    @ApiOkResponse({ type: [RewardsCustomerDto] })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async getRewardsReport(@Query() query: RewardsQueryDto): Promise<RewardsCustomerDto[]> {
        const rows = await this.client.call<any[]>('getRewardsReport', {
            minMonthlyPurchases:      query.minMonthlyPurchases,
            minDollarAmountPurchased: query.minDollarAmountPurchased,
        });
        return rows.map(mapRewardsCustomer);
    }
}
