import { Controller, UseFilters, UsePipes } from '@nestjs/common';
import { GrpcExceptionFilter, GrpcMethod, Payload } from '@nestjs/microservices';
import { AddressesService } from '../services/addresses.service.js';
import { AddressDto } from '../dto/address.dto.js';
import { CreateAddressDto } from '../dto/create-address.dto.js';
import { UpdateAddressDto } from '../dto/update-address.dto.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { IdDto } from '../../../shared/rpc/id.dto.js';
import { grpcValidationPipe } from '../../../shared/rpc/validation-pipes.js';

// gRPC handlers for `service AddressesService` in src/proto/customer.proto.
// Error dictionary: ADDRESS_NOT_FOUND NOT_FOUND, INVALID_REFERENCE INVALID_ARGUMENT,
// STILL_REFERENCED FAILED_PRECONDITION, VALIDATION_ERROR INVALID_ARGUMENT
@Controller()
@UseFilters(new GrpcExceptionFilter())
@UsePipes(grpcValidationPipe)
export class AddressesController {
    constructor(private readonly service: AddressesService) {}

    @GrpcMethod('AddressesService', 'List')
    async list(@Payload() params: PaginationParamsDto) {
        return await this.service.findAll(params);
    }

    @GrpcMethod('AddressesService', 'FindOne')
    async findOne(@Payload() dto: IdDto): Promise<AddressDto> {
        return await this.service.findOneById(dto.id);
    }

    @GrpcMethod('AddressesService', 'Create')
    async create(@Payload() dto: CreateAddressDto): Promise<AddressDto> {
        return await this.service.create(dto);
    }

    @GrpcMethod('AddressesService', 'Update')
    async update(@Payload() dto: UpdateAddressDto): Promise<AddressDto> {
        return await this.service.update(dto);
    }

    @GrpcMethod('AddressesService', 'Remove')
    async remove(@Payload() dto: IdDto): Promise<Record<string, never>> {
        await this.service.remove(dto.id);
        return {};
    }
}
