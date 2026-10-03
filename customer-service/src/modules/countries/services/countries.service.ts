import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../entities/country.entity.js';
import { CountryDto } from '../dto/country.dto.js';
import { CreateCountryDto } from '../dto/create-country.dto.js';
import { UpdateCountryDto } from '../dto/update-country.dto.js';
import { CountryNotFoundException } from '../exceptions/index.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { PaginationMeta, buildMeta } from '../../../shared/rpc/pagination.js';
import { rmqDbError } from '../../../shared/rpc/rmq-exceptions.js';

@Injectable()
export class CountriesService {
    constructor(
        @InjectRepository(Country)
        private readonly repo: Repository<Country>,
    ) {}

    async findAll(params: PaginationParamsDto): Promise<{ data: CountryDto[]; meta: PaginationMeta }> {
        const [entities, total] = await this.repo.findAndCount({
            skip:  (params.page - 1) * params.limit,
            take:  params.limit,
            order: { id: 'ASC' },
        });
        return { data: entities.map((e) => CountryDto.fromEntity(e)), meta: buildMeta(params.page, params.limit, total) };
    }

    async existsById(id: number): Promise<boolean> {
        return await this.repo.existsBy({ id });
    }

    async findOneById(id: number): Promise<CountryDto> {
        return CountryDto.fromEntity(await this.findEntity(id));
    }

    async create(dto: CreateCountryDto): Promise<CountryDto> {
        const entity = this.repo.create();
        entity.country    = dto.country;
        entity.lastUpdate = new Date();
        return CountryDto.fromEntity(await this.repo.save(entity));
    }

    async update(dto: UpdateCountryDto): Promise<CountryDto> {
        const entity = await this.findEntity(dto.id);
        if (dto.country !== undefined) entity.country = dto.country;
        entity.lastUpdate = new Date();
        return CountryDto.fromEntity(await this.repo.save(entity));
    }

    async remove(id: number): Promise<void> {
        if (!(await this.repo.existsBy({ id }))) throw new CountryNotFoundException();
        try {
            await this.repo.delete(id);
        } catch (err) {
            throw rmqDbError(err);
        }
    }

    private async findEntity(id: number): Promise<Country> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new CountryNotFoundException();
        return entity;
    }
}
