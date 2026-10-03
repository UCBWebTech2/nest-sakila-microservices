import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity.js';
import { CustomerDto } from '../dto/customer.dto.js';
import { CreateCustomerDto } from '../dto/create-customer.dto.js';
import { UpdateCustomerDto } from '../dto/update-customer.dto.js';
import { CustomerNotFoundException, InvalidAddressIdException } from '../exceptions/index.js';
import { AddressesService } from '../../addresses/services/addresses.service.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { PaginationMeta, buildMeta } from '../../../shared/rpc/pagination.js';
import { grpcDbError } from '../../../shared/rpc/grpc-exceptions.js';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly repo: Repository<Customer>,
        private readonly addresses: AddressesService,
    ) {}

    async findAll(params: PaginationParamsDto): Promise<{ data: CustomerDto[]; meta: PaginationMeta }> {
        const [entities, total] = await this.repo.findAndCount({
            skip:  (params.page - 1) * params.limit,
            take:  params.limit,
            order: { id: 'ASC' },
        });
        return { data: entities.map((e) => CustomerDto.fromEntity(e)), meta: buildMeta(params.page, params.limit, total) };
    }

    async findOneById(id: number): Promise<CustomerDto> {
        return CustomerDto.fromEntity(await this.findEntity(id));
    }

    async create(dto: CreateCustomerDto): Promise<CustomerDto> {
        await this.assertAddressExists(dto.addressId);
        const entity = this.repo.create();
        entity.storeId    = dto.storeId;
        entity.firstName  = dto.firstName;
        entity.lastName   = dto.lastName;
        entity.email      = dto.email ?? null;
        entity.addressId  = dto.addressId;
        entity.activebool = true;
        entity.active     = 1;
        entity.lastUpdate = new Date();
        return CustomerDto.fromEntity(await this.save(entity));
    }

    async update(dto: UpdateCustomerDto): Promise<CustomerDto> {
        const entity = await this.findEntity(dto.id);
        if (dto.addressId !== undefined) await this.assertAddressExists(dto.addressId);
        if (dto.storeId   !== undefined) entity.storeId   = dto.storeId;
        if (dto.firstName !== undefined) entity.firstName = dto.firstName;
        if (dto.lastName  !== undefined) entity.lastName  = dto.lastName;
        if (dto.email     !== undefined) entity.email     = dto.email;
        if (dto.addressId !== undefined) entity.addressId = dto.addressId;
        if (dto.active    !== undefined) {
            entity.activebool = dto.active;
            entity.active     = dto.active ? 1 : 0;
        }
        entity.lastUpdate = new Date();
        return CustomerDto.fromEntity(await this.save(entity));
    }

    async remove(id: number): Promise<void> {
        if (!(await this.repo.existsBy({ id }))) throw new CustomerNotFoundException();
        try {
            await this.repo.delete(id);
        } catch (err) {
            throw grpcDbError(err);
        }
    }

    // Checked up front so the caller learns *which* reference is wrong; the DB's FK stays as the
    // fallback for the delete-in-between race (see save()). store_id gets no such check here: stores
    // belong to business-service and services don't call each other — but its FK is still in the
    // schema, so Postgres rejects an unknown store and grpcDbError() turns that into INVALID_STORE_ID.
    private async assertAddressExists(addressId: number): Promise<void> {
        if (!(await this.addresses.existsById(addressId))) throw new InvalidAddressIdException(addressId);
    }

    private async findEntity(id: number): Promise<Customer> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new CustomerNotFoundException();
        return entity;
    }

    private async save(entity: Customer): Promise<Customer> {
        try {
            return await this.repo.save(entity);
        } catch (err) {
            throw grpcDbError(err);
        }
    }
}
