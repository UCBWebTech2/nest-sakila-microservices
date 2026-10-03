import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiConflict, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { InventorySoapClientService } from '../../services/inventory-soap-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { LanguageDto } from '../dto/language.dto.js';
import { CreateLanguageDto } from '../dto/create-language.dto.js';
import { UpdateLanguageDto } from '../dto/update-language.dto.js';
import { FindAllLanguagesResponseDto } from '../dto/find-all-languages-response.dto.js';

/**
 * Error dictionary: LANGUAGE_NOT_FOUND 404, STILL_REFERENCED 409, INVALID_TOKEN 401
 */
@ApiTags('Languages')
@ApiBearerAuth('access-token')
@Controller('inventory/languages')
export class LanguagesController {
    constructor(private readonly client: InventorySoapClientService) {}

    @Get()
    @ApiOperation({ summary: 'List languages' })
    @ApiOkResponse({ type: FindAllLanguagesResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllLanguagesResponseDto> {
        return await this.client.call('ListLanguages', { page: params.page, limit: params.limit });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a language by id' })
    @ApiOkResponse({ type: LanguageDto })
    @ApiNotFound({ code: 'LANGUAGE_NOT_FOUND', message: 'Language not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<LanguageDto> {
        return await this.client.call('GetLanguage', { id });
    }

    @Post()
    @ApiOperation({ summary: 'Add a language' })
    @ApiCreatedResponse({ type: LanguageDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateLanguageDto): Promise<LanguageDto> {
        return await this.client.call('CreateLanguage', createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Rename a language' })
    @ApiOkResponse({ type: LanguageDto })
    @ApiNotFound({ code: 'LANGUAGE_NOT_FOUND', message: 'Language not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateLanguageDto): Promise<LanguageDto> {
        return await this.client.call('UpdateLanguage', { id, ...updateDto });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:     'Remove a language',
        description: 'Fails with a 409 while any film still uses it (either as its main language or original language).',
    })
    @ApiNotFound({ code: 'LANGUAGE_NOT_FOUND', message: 'Language not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.call('DeleteLanguage', { id });
    }
}
