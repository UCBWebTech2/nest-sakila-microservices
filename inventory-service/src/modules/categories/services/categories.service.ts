import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';
import { NotFoundFault } from '../../../shared/soap/soap-fault.js';
import { PaginationArgs, PaginationMeta, buildMeta, normalizePagination } from '../../../shared/soap/pagination.js';

export interface CreateCategoryInput {
    name: string;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly repo: Repository<Category>,
    ) {}

    async findAll(args: PaginationArgs): Promise<{ data: Category[]; meta: PaginationMeta }> {
        const { page, limit } = normalizePagination(args);
        const [data, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });
        return { data, meta: buildMeta(page, limit, total) };
    }

    async findOneById(id: number): Promise<Category> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new NotFoundFault('Category');
        return entity;
    }

    async create(input: CreateCategoryInput): Promise<Category> {
        const entity = this.repo.create({ name: input.name, lastUpdate: new Date() });
        return await this.repo.save(entity);
    }

    async update(id: number, input: UpdateCategoryInput): Promise<Category> {
        const entity = await this.findOneById(id);
        if (input.name !== undefined) entity.name = input.name;
        entity.lastUpdate = new Date();
        return await this.repo.save(entity);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new NotFoundFault('Category');
        await this.repo.delete(id);
    }
}
