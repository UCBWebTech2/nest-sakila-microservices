import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiNotFound, ApiUnauthorized, ApiConflict } from '../../../../shared/utils/swagger/index.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { CustomerRmqClientService } from '../../services/customer-rmq-client.service.js';
import { CountryDto } from '../dto/country.dto.js';
import { CreateCountryDto } from '../dto/create-country.dto.js';
import { UpdateCountryDto } from '../dto/update-country.dto.js';
import { FindAllCountriesResponseDto } from '../dto/find-all-countries-response.dto.js';

/**
 * Over RabbitMQ (customer-service). Error dictionary: COUNTRY_NOT_FOUND 404, STILL_REFERENCED 409,
 * CUSTOMER_SERVICE_UNAVAILABLE 503, INVALID_TOKEN 401
 */
@ApiTags('Countries (RabbitMQ)')
@ApiBearerAuth('access-token')
@Controller('customer/countries')
export class CountriesController {
    constructor(private readonly client: CustomerRmqClientService) {}

    @Get()
    @ApiOperation({ summary: 'List countries' })
    @ApiOkResponse({ type: FindAllCountriesResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllCountriesResponseDto> {
        return await this.client.send('countries.find-all', { page: params.page, limit: params.limit });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a country by id' })
    @ApiOkResponse({ type: CountryDto })
    @ApiNotFound({ code: 'COUNTRY_NOT_FOUND', message: 'Country not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CountryDto> {
        return await this.client.send('countries.find-one', { id });
    }

    @Post()
    @ApiOperation({ summary: 'Create a country' })
    @ApiCreatedResponse({ type: CountryDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateCountryDto): Promise<CountryDto> {
        return await this.client.send('countries.create', createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a country' })
    @ApiOkResponse({ type: CountryDto })
    @ApiNotFound({ code: 'COUNTRY_NOT_FOUND', message: 'Country not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCountryDto): Promise<CountryDto> {
        return await this.client.send('countries.update', { id, ...updateDto });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:     'Remove a country',
        description: 'Fails with a 409 while any city still belongs to it.',
    })
    @ApiNotFound({ code: 'COUNTRY_NOT_FOUND', message: 'Country not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.send('countries.remove', { id });
    }
}
