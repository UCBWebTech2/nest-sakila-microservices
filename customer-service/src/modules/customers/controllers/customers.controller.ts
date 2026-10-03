import { Controller, UseFilters, UsePipes } from '@nestjs/common';
import { GrpcExceptionFilter, GrpcMethod, Payload } from '@nestjs/microservices';
import { CustomersService } from '../services/customers.service.js';
import { CustomerDto } from '../dto/customer.dto.js';
import { CreateCustomerDto } from '../dto/create-customer.dto.js';
import { UpdateCustomerDto } from '../dto/update-customer.dto.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { IdDto } from '../../../shared/rpc/id.dto.js';
import { grpcValidationPipe } from '../../../shared/rpc/validation-pipes.js';

// gRPC handlers for `service CustomersService` in src/proto/customer.proto.
// Error dictionary: CUSTOMER_NOT_FOUND NOT_FOUND, INVALID_REFERENCE INVALID_ARGUMENT,
// STILL_REFERENCED FAILED_PRECONDITION, VALIDATION_ERROR INVALID_ARGUMENT
@Controller()
@UseFilters(new GrpcExceptionFilter())
@UsePipes(grpcValidationPipe)
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @GrpcMethod('CustomersService', 'List')
    async list(@Payload() params: PaginationParamsDto) {
        return await this.service.findAll(params);
    }

    @GrpcMethod('CustomersService', 'FindOne')
    async findOne(@Payload() dto: IdDto): Promise<CustomerDto> {
        return await this.service.findOneById(dto.id);
    }

    @GrpcMethod('CustomersService', 'Create')
    async create(@Payload() dto: CreateCustomerDto): Promise<CustomerDto> {
        return await this.service.create(dto);
    }

    @GrpcMethod('CustomersService', 'Update')
    async update(@Payload() dto: UpdateCustomerDto): Promise<CustomerDto> {
        return await this.service.update(dto);
    }

    @GrpcMethod('CustomersService', 'Remove')
    async remove(@Payload() dto: IdDto): Promise<Record<string, never>> {
        await this.service.remove(dto.id);
        return {};
    }
}
