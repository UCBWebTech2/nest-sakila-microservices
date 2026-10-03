import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity.js';
import { AddressDto } from '../dto/address.dto.js';
import { CreateAddressDto } from '../dto/create-address.dto.js';
import { UpdateAddressDto } from '../dto/update-address.dto.js';
import { AddressNotFoundException, InvalidCityIdException } from '../exceptions/index.js';
import { CitiesService } from '../../cities/services/cities.service.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { PaginationMeta, buildMeta } from '../../../shared/rpc/pagination.js';
import { grpcDbError } from '../../../shared/rpc/grpc-exceptions.js';

@Injectable()
export class AddressesService {
    constructor(
        @InjectRepository(Address)
        private readonly repo: Repository<Address>,
        private readonly cities: CitiesService,
    ) {}

    async findAll(params: PaginationParamsDto): Promise<{ data: AddressDto[]; meta: PaginationMeta }> {
        const [entities, total] = await this.repo.findAndCount({
            skip:  (params.page - 1) * params.limit,
            take:  params.limit,
            order: { id: 'ASC' },
        });
        return { data: entities.map((e) => AddressDto.fromEntity(e)), meta: buildMeta(params.page, params.limit, total) };
    }

    async existsById(id: number): Promise<boolean> {
        return await this.repo.existsBy({ id });
    }

    async findOneById(id: number): Promise<AddressDto> {
        return AddressDto.fromEntity(await this.findEntity(id));
    }

    async create(dto: CreateAddressDto): Promise<AddressDto> {
        await this.assertCityExists(dto.cityId);
        const entity = this.repo.create();
        entity.address    = dto.address;
        entity.address2   = dto.address2 ?? null;
        entity.district   = dto.district;
        entity.cityId     = dto.cityId;
        entity.postalCode = dto.postalCode ?? null;
        entity.phone      = dto.phone;
        entity.lastUpdate = new Date();
        return AddressDto.fromEntity(await this.save(entity));
    }

    async update(dto: UpdateAddressDto): Promise<AddressDto> {
        const entity = await this.findEntity(dto.id);
        if (dto.cityId !== undefined) await this.assertCityExists(dto.cityId);
        if (dto.address    !== undefined) entity.address    = dto.address;
        if (dto.address2   !== undefined) entity.address2   = dto.address2;
        if (dto.district   !== undefined) entity.district   = dto.district;
        if (dto.cityId     !== undefined) entity.cityId     = dto.cityId;
        if (dto.postalCode !== undefined) entity.postalCode = dto.postalCode;
        if (dto.phone      !== undefined) entity.phone      = dto.phone;
        entity.lastUpdate = new Date();
        return AddressDto.fromEntity(await this.save(entity));
    }

    async remove(id: number): Promise<void> {
        if (!(await this.repo.existsBy({ id }))) throw new AddressNotFoundException();
        try {
            await this.repo.delete(id);
        } catch (err) {
            throw grpcDbError(err);
        }
    }

    // Checked up front so the caller learns *which* reference is wrong; the DB's FK stays as the
    // fallback for the delete-in-between race (see save()).
    private async assertCityExists(cityId: number): Promise<void> {
        if (!(await this.cities.existsById(cityId))) throw new InvalidCityIdException(cityId);
    }

    private async findEntity(id: number): Promise<Address> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new AddressNotFoundException();
        return entity;
    }

    private async save(entity: Address): Promise<Address> {
        try {
            return await this.repo.save(entity);
        } catch (err) {
            throw grpcDbError(err);
        }
    }
}
