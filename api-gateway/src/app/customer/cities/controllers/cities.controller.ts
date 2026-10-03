import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiNotFound, ApiUnauthorized, ApiConflict } from '../../../../shared/utils/swagger/index.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { CustomerRmqClientService } from '../../services/customer-rmq-client.service.js';
import { CityDto } from '../dto/city.dto.js';
import { CreateCityDto } from '../dto/create-city.dto.js';
import { UpdateCityDto } from '../dto/update-city.dto.js';
import { FindAllCitiesResponseDto } from '../dto/find-all-cities-response.dto.js';

/**
 * Over RabbitMQ (customer-service). Error dictionary: CITY_NOT_FOUND 404, INVALID_COUNTRY_ID 400, INVALID_REFERENCE 400,
 * STILL_REFERENCED 409, CUSTOMER_SERVICE_UNAVAILABLE 503, INVALID_TOKEN 401
 */
@ApiTags('Cities (RabbitMQ)')
@ApiBearerAuth('access-token')
@Controller('customer/cities')
export class CitiesController {
    constructor(private readonly client: CustomerRmqClientService) {}

    @Get()
    @ApiOperation({ summary: 'List cities' })
    @ApiOkResponse({ type: FindAllCitiesResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllCitiesResponseDto> {
        return await this.client.send('cities.find-all', { page: params.page, limit: params.limit });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a city by id' })
    @ApiOkResponse({ type: CityDto })
    @ApiNotFound({ code: 'CITY_NOT_FOUND', message: 'City not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CityDto> {
        return await this.client.send('cities.find-one', { id });
    }

    @Post()
    @ApiOperation({ summary: 'Create a city' })
    @ApiBadRequest({ code: 'INVALID_COUNTRY_ID', message: 'Country 999 does not exist.' })
    @ApiCreatedResponse({ type: CityDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateCityDto): Promise<CityDto> {
        return await this.client.send('cities.create', createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a city' })
    @ApiBadRequest({ code: 'INVALID_COUNTRY_ID', message: 'Country 999 does not exist.' })
    @ApiOkResponse({ type: CityDto })
    @ApiNotFound({ code: 'CITY_NOT_FOUND', message: 'City not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCityDto): Promise<CityDto> {
        return await this.client.send('cities.update', { id, ...updateDto });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:     'Remove a city',
        description: 'Fails with a 409 while any address still belongs to it.',
    })
    @ApiNotFound({ code: 'CITY_NOT_FOUND', message: 'City not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.send('cities.remove', { id });
    }
}
