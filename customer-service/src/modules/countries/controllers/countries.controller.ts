import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CountriesService } from '../services/countries.service.js';
import { CountryDto } from '../dto/country.dto.js';
import { CreateCountryDto } from '../dto/create-country.dto.js';
import { UpdateCountryDto } from '../dto/update-country.dto.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { IdDto } from '../../../shared/rpc/id.dto.js';
import { rmqValidationPipe } from '../../../shared/rpc/validation-pipes.js';

// RabbitMQ request-response handlers — same contract as cities.controller.ts.
// Error dictionary: COUNTRY_NOT_FOUND 404, STILL_REFERENCED 409, VALIDATION_ERROR 400
@Controller()
@UsePipes(rmqValidationPipe)
export class CountriesController {
    constructor(private readonly service: CountriesService) {}

    @MessagePattern('countries.find-all')
    async findAll(@Payload() params: PaginationParamsDto) {
        return await this.service.findAll(params);
    }

    @MessagePattern('countries.find-one')
    async findOne(@Payload() dto: IdDto): Promise<CountryDto> {
        return await this.service.findOneById(dto.id);
    }

    @MessagePattern('countries.create')
    async create(@Payload() dto: CreateCountryDto): Promise<CountryDto> {
        return await this.service.create(dto);
    }

    @MessagePattern('countries.update')
    async update(@Payload() dto: UpdateCountryDto): Promise<CountryDto> {
        return await this.service.update(dto);
    }

    @MessagePattern('countries.remove')
    async remove(@Payload() dto: IdDto): Promise<{ id: number }> {
        await this.service.remove(dto.id);
        return { id: dto.id };
    }
}
