import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { BusinessGraphqlClientService } from '../../services/business-graphql-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { RentalDto } from '../dto/rental.dto.js';
import { CreateRentalDto } from '../dto/create-rental.dto.js';
import { UpdateRentalDto } from '../dto/update-rental.dto.js';
import { FindAllRentalsResponseDto } from '../dto/find-all-rentals-response.dto.js';

/**
 * Rental transactions — a customer checking out an inventory item through a staff member, with
 * returnDate left empty until the item comes back.
 *
 * Error dictionary: RENTAL_NOT_FOUND 404, INVALID_TOKEN 401
 */
@ApiTags('Rentals')
@ApiBearerAuth('access-token')
@Controller('business/rentals')
export class RentalsController {
    constructor(private readonly client: BusinessGraphqlClientService) {}

    @Get()
    @ApiOperation({ summary: 'List rentals' })
    @ApiOkResponse({ type: FindAllRentalsResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllRentalsResponseDto> {
        const data = await this.client.request<{ rentals: FindAllRentalsResponseDto }>(
            `query($page: Int, $limit: Int) {
                rentals(page: $page, limit: $limit) {
                    data { id rentalDate inventoryId customerId returnDate staffId lastUpdate }
                    meta { page limit total pages }
                }
            }`,
            { page: params.page, limit: params.limit },
        );
        return data.rentals;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a rental by id' })
    @ApiOkResponse({ type: RentalDto })
    @ApiNotFound({ code: 'RENTAL_NOT_FOUND', message: 'Rental not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RentalDto> {
        const data = await this.client.request<{ rental: RentalDto }>(
            `query($id: Int!) { rental(id: $id) { id rentalDate inventoryId customerId returnDate staffId lastUpdate } }`,
            { id },
        );
        return data.rental;
    }

    @Post()
    @ApiBadRequest({ code: 'INVALID_CUSTOMER_ID', message: 'Customer 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_INVENTORY_ID', message: 'Inventory 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_STAFF_ID', message: 'Staff 999 does not exist.' })
    @ApiOperation({
        summary:     'Check out an item',
        description: 'returnDate is never set here — it starts empty and gets filled in by a later PATCH once the item is brought back.',
    })
    @ApiCreatedResponse({ type: RentalDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateRentalDto): Promise<RentalDto> {
        const data = await this.client.request<{ createRental: RentalDto }>(
            `mutation($input: CreateRentalDto!) { createRental(input: $input) { id rentalDate inventoryId customerId returnDate staffId lastUpdate } }`,
            { input: createDto },
        );
        return data.createRental;
    }

    @Patch(':id')
    @ApiBadRequest({ code: 'INVALID_CUSTOMER_ID', message: 'Customer 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_INVENTORY_ID', message: 'Inventory 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_STAFF_ID', message: 'Staff 999 does not exist.' })
    @ApiOperation({
        summary:     'Update a rental',
        description: 'This is how a return gets recorded — send just returnDate once the item is back; everything else is optional.',
    })
    @ApiOkResponse({ type: RentalDto })
    @ApiNotFound({ code: 'RENTAL_NOT_FOUND', message: 'Rental not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateRentalDto): Promise<RentalDto> {
        const data = await this.client.request<{ updateRental: RentalDto }>(
            `mutation($id: Int!, $input: UpdateRentalDto!) { updateRental(id: $id, input: $input) { id rentalDate inventoryId customerId returnDate staffId lastUpdate } }`,
            { id, input: updateDto },
        );
        return data.updateRental;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a rental record' })
    @ApiNotFound({ code: 'RENTAL_NOT_FOUND', message: 'Rental not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.request<{ removeRental: boolean }>(
            `mutation($id: Int!) { removeRental(id: $id) }`,
            { id },
        );
    }
}
