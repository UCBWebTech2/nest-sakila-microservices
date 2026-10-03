import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CitiesService } from '../services/cities.service.js';
import { CityDto } from '../dto/city.dto.js';
import { CreateCityDto } from '../dto/create-city.dto.js';
import { UpdateCityDto } from '../dto/update-city.dto.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { IdDto } from '../../../shared/rpc/id.dto.js';
import { rmqValidationPipe } from '../../../shared/rpc/validation-pipes.js';

// RabbitMQ request-response handlers (client side uses `send`). Errors are RpcExceptions carrying
// { statusCode, error, message } — no filter needed, Nest's default RPC handler returns them as-is.
// Error dictionary: CITY_NOT_FOUND 404, INVALID_REFERENCE 400, STILL_REFERENCED 409,
// VALIDATION_ERROR 400
@Controller()
@UsePipes(rmqValidationPipe)
export class CitiesController {
    constructor(private readonly service: CitiesService) {}

    @MessagePattern('cities.find-all')
    async findAll(@Payload() params: PaginationParamsDto) {
        return await this.service.findAll(params);
    }

    @MessagePattern('cities.find-one')
    async findOne(@Payload() dto: IdDto): Promise<CityDto> {
        return await this.service.findOneById(dto.id);
    }

    @MessagePattern('cities.create')
    async create(@Payload() dto: CreateCityDto): Promise<CityDto> {
        return await this.service.create(dto);
    }

    @MessagePattern('cities.update')
    async update(@Payload() dto: UpdateCityDto): Promise<CityDto> {
        return await this.service.update(dto);
    }

    @MessagePattern('cities.remove')
    async remove(@Payload() dto: IdDto): Promise<{ id: number }> {
        await this.service.remove(dto.id);
        return { id: dto.id };
    }
}
