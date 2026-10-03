import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { InventorySoapClientService } from '../../services/inventory-soap-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { InventoryItemDto } from '../dto/inventory-item.dto.js';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto.js';
import { FindAllInventoryItemsResponseDto } from '../dto/find-all-inventory-items-response.dto.js';

/**
 * Physical copies of a film sitting at a given store — this is what actually gets rented out.
 *
 * Error dictionary: INVENTORY_NOT_FOUND 404, INVALID_REFERENCE 400, INVALID_TOKEN 401
 */
@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@Controller('inventory/items')
export class InventoriesController {
    constructor(private readonly client: InventorySoapClientService) {}

    @Get()
    @ApiOperation({ summary: 'List inventory items' })
    @ApiOkResponse({ type: FindAllInventoryItemsResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllInventoryItemsResponseDto> {
        return await this.client.call('ListInventories', { page: params.page, limit: params.limit });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an inventory item by id' })
    @ApiOkResponse({ type: InventoryItemDto })
    @ApiNotFound({ code: 'INVENTORY_NOT_FOUND', message: 'Inventory not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemDto> {
        return await this.client.call('GetInventory', { id });
    }

    @Post()
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_FILM_ID', message: 'Film 999 does not exist.' })
    @ApiOperation({ summary: 'Add a copy of a film to a store' })
    @ApiCreatedResponse({ type: InventoryItemDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateInventoryItemDto): Promise<InventoryItemDto> {
        return await this.client.call('CreateInventory', createDto);
    }

    @Patch(':id')
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_FILM_ID', message: 'Film 999 does not exist.' })
    @ApiOperation({ summary: 'Move a copy to a different film or store' })
    @ApiOkResponse({ type: InventoryItemDto })
    @ApiNotFound({ code: 'INVENTORY_NOT_FOUND', message: 'Inventory not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateInventoryItemDto): Promise<InventoryItemDto> {
        return await this.client.call('UpdateInventory', { id, ...updateDto });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a copy from inventory' })
    @ApiNotFound({ code: 'INVENTORY_NOT_FOUND', message: 'Inventory not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.call('DeleteInventory', { id });
    }
}
