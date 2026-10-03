import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiConflict, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { InventorySoapClientService } from '../../services/inventory-soap-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { CategoryDto } from '../dto/category.dto.js';
import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/update-category.dto.js';
import { FindAllCategoriesResponseDto } from '../dto/find-all-categories-response.dto.js';

/**
 * Error dictionary: CATEGORY_NOT_FOUND 404, STILL_REFERENCED 409, INVALID_TOKEN 401
 */
@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('inventory/categories')
export class CategoriesController {
    constructor(private readonly client: InventorySoapClientService) {}

    @Get()
    @ApiOperation({ summary: 'List categories' })
    @ApiOkResponse({ type: FindAllCategoriesResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllCategoriesResponseDto> {
        return await this.client.call('ListCategories', { page: params.page, limit: params.limit });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a category by id' })
    @ApiOkResponse({ type: CategoryDto })
    @ApiNotFound({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryDto> {
        return await this.client.call('GetCategory', { id });
    }

    @Post()
    @ApiOperation({ summary: 'Add a category' })
    @ApiCreatedResponse({ type: CategoryDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateCategoryDto): Promise<CategoryDto> {
        return await this.client.call('CreateCategory', createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Rename a category' })
    @ApiOkResponse({ type: CategoryDto })
    @ApiNotFound({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCategoryDto): Promise<CategoryDto> {
        return await this.client.call('UpdateCategory', { id, ...updateDto });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a category' })
    @ApiNotFound({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.call('DeleteCategory', { id });
    }
}
