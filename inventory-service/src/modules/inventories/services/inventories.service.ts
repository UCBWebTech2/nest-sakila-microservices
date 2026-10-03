import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity.js';
import { InvalidIdFault, NotFoundFault } from '../../../shared/soap/soap-fault.js';
import { FilmsService } from '../../films/services/films.service.js';
import { PaginationArgs, PaginationMeta, buildMeta, normalizePagination } from '../../../shared/soap/pagination.js';

export interface CreateInventoryInput {
    filmId:  number;
    storeId: number;
}

export type UpdateInventoryInput = Partial<CreateInventoryInput>;

@Injectable()
export class InventoriesService {
    constructor(
        @InjectRepository(Inventory)
        private readonly repo: Repository<Inventory>,
        private readonly films: FilmsService,
    ) {}

    async findAll(args: PaginationArgs): Promise<{ data: Inventory[]; meta: PaginationMeta }> {
        const { page, limit } = normalizePagination(args);
        const [data, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });
        return { data, meta: buildMeta(page, limit, total) };
    }

    async findOneById(id: number): Promise<Inventory> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new NotFoundFault('Inventory');
        return entity;
    }

    async create(input: CreateInventoryInput): Promise<Inventory> {
        await this.assertFilmExists(input.filmId);
        const entity = this.repo.create({
            filmId:     input.filmId,
            storeId:    input.storeId,
            lastUpdate: new Date(),
        });
        return await this.repo.save(entity);
    }

    async update(id: number, input: UpdateInventoryInput): Promise<Inventory> {
        const entity = await this.findOneById(id);
        if (input.filmId !== undefined) await this.assertFilmExists(input.filmId);
        if (input.filmId !== undefined) entity.filmId = input.filmId;
        if (input.storeId !== undefined) entity.storeId = input.storeId;
        entity.lastUpdate = new Date();
        return await this.repo.save(entity);
    }

    // store_id is not checked here: stores live in business-service and microservices don't call
    // each other. Its FK is still in the schema, so Postgres rejects an unknown store and
    // resolveFault() turns that into INVALID_STORE_ID.
    private async assertFilmExists(filmId: number): Promise<void> {
        if (!(await this.films.existsById(filmId))) throw new InvalidIdFault('film', filmId);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new NotFoundFault('Inventory');
        await this.repo.delete(id);
    }
}
