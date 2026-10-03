import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../entities/city.entity.js';
import { CityDto } from '../dto/city.dto.js';
import { CreateCityDto } from '../dto/create-city.dto.js';
import { UpdateCityDto } from '../dto/update-city.dto.js';
import { CityNotFoundException, InvalidCountryIdException } from '../exceptions/index.js';
import { CountriesService } from '../../countries/services/countries.service.js';
import { PaginationParamsDto } from '../../../shared/dto/index.js';
import { PaginationMeta, buildMeta } from '../../../shared/rpc/pagination.js';
import { rmqDbError } from '../../../shared/rpc/rmq-exceptions.js';

@Injectable()
export class CitiesService {
    constructor(
        @InjectRepository(City)
        private readonly repo: Repository<City>,
        private readonly countries: CountriesService,
    ) {}

    async findAll(params: PaginationParamsDto): Promise<{ data: CityDto[]; meta: PaginationMeta }> {
        const [entities, total] = await this.repo.findAndCount({
            skip:  (params.page - 1) * params.limit,
            take:  params.limit,
            order: { id: 'ASC' },
        });
        return { data: entities.map((e) => CityDto.fromEntity(e)), meta: buildMeta(params.page, params.limit, total) };
    }

    async existsById(id: number): Promise<boolean> {
        return await this.repo.existsBy({ id });
    }

    async findOneById(id: number): Promise<CityDto> {
        return CityDto.fromEntity(await this.findEntity(id));
    }

    async create(dto: CreateCityDto): Promise<CityDto> {
        await this.assertCountryExists(dto.countryId);
        const entity = this.repo.create();
        entity.city       = dto.city;
        entity.countryId  = dto.countryId;
        entity.lastUpdate = new Date();
        return CityDto.fromEntity(await this.save(entity));
    }

    async update(dto: UpdateCityDto): Promise<CityDto> {
        const entity = await this.findEntity(dto.id);
        if (dto.countryId !== undefined) await this.assertCountryExists(dto.countryId);
        if (dto.city      !== undefined) entity.city      = dto.city;
        if (dto.countryId !== undefined) entity.countryId = dto.countryId;
        entity.lastUpdate = new Date();
        return CityDto.fromEntity(await this.save(entity));
    }

    async remove(id: number): Promise<void> {
        if (!(await this.repo.existsBy({ id }))) throw new CityNotFoundException();
        try {
            await this.repo.delete(id);
        } catch (err) {
            throw rmqDbError(err);
        }
    }

    // Checked up front so the caller learns *which* reference is wrong. The DB's own FK is still the
    // last line of defence (see save()) for the race where the country is deleted in between.
    private async assertCountryExists(countryId: number): Promise<void> {
        if (!(await this.countries.existsById(countryId))) throw new InvalidCountryIdException(countryId);
    }

    private async findEntity(id: number): Promise<City> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new CityNotFoundException();
        return entity;
    }

    private async save(entity: City): Promise<City> {
        try {
            return await this.repo.save(entity);
        } catch (err) {
            throw rmqDbError(err);
        }
    }
}
