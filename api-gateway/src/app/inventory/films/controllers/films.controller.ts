import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiConflict, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { InventorySoapClientService } from '../../services/inventory-soap-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { FilmDto } from '../dto/film.dto.js';
import { CreateFilmDto } from '../dto/create-film.dto.js';
import { UpdateFilmDto } from '../dto/update-film.dto.js';
import { FindAllFilmsResponseDto } from '../dto/find-all-films-response.dto.js';

/**
 * The film catalog. Backed by inventory-service over SOAP — this controller just translates
 * each call into the matching operation on its WSDL.
 *
 * Error dictionary: FILM_NOT_FOUND 404, INVALID_REFERENCE 400, STILL_REFERENCED 409,
 * INVALID_TOKEN 401
 */
@ApiTags('Films')
@ApiBearerAuth('access-token')
@Controller('inventory/films')
export class FilmsController {
    constructor(private readonly client: InventorySoapClientService) {}

    @Get()
    @ApiOperation({ summary: 'List films' })
    @ApiOkResponse({ type: FindAllFilmsResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllFilmsResponseDto> {
        return await this.client.call('ListFilms', { page: params.page, limit: params.limit });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a film by id' })
    @ApiOkResponse({ type: FilmDto })
    @ApiNotFound({ code: 'FILM_NOT_FOUND', message: 'Film not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<FilmDto> {
        return await this.client.call('GetFilm', { id });
    }

    @Post()
    @ApiBadRequest({ code: 'INVALID_LANGUAGE_ID', message: 'Language 999 does not exist.' })
    @ApiOperation({
        summary:     'Add a film to the catalog',
        description: 'rentalDuration, rentalRate, replacementCost, and rating fall back to Sakila\'s own defaults (3 days / $4.99 / $19.99 / G) when omitted.',
    })
    @ApiCreatedResponse({ type: FilmDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateFilmDto): Promise<FilmDto> {
        return await this.client.call('CreateFilm', createDto);
    }

    @Patch(':id')
    @ApiBadRequest({ code: 'INVALID_LANGUAGE_ID', message: 'Language 999 does not exist.' })
    @ApiOperation({ summary: 'Update a film' })
    @ApiOkResponse({ type: FilmDto })
    @ApiNotFound({ code: 'FILM_NOT_FOUND', message: 'Film not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateFilmDto): Promise<FilmDto> {
        return await this.client.call('UpdateFilm', { id, ...updateDto });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:     'Remove a film from the catalog',
        description: 'Fails with a 409 while any inventory copy still references this film.',
    })
    @ApiNotFound({ code: 'FILM_NOT_FOUND', message: 'Film not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.call('DeleteFilm', { id });
    }
}
