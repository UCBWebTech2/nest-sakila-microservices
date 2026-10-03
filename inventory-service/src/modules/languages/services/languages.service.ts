import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '../entities/language.entity.js';
import { NotFoundFault } from '../../../shared/soap/soap-fault.js';
import { PaginationArgs, PaginationMeta, buildMeta, normalizePagination } from '../../../shared/soap/pagination.js';

export interface CreateLanguageInput {
    name: string;
}

export type UpdateLanguageInput = Partial<CreateLanguageInput>;

@Injectable()
export class LanguagesService {
    constructor(
        @InjectRepository(Language)
        private readonly repo: Repository<Language>,
    ) {}

    async findAll(args: PaginationArgs): Promise<{ data: Language[]; meta: PaginationMeta }> {
        const { page, limit } = normalizePagination(args);
        const [data, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });
        return { data, meta: buildMeta(page, limit, total) };
    }

    async existsById(id: number): Promise<boolean> {
        return await this.repo.existsBy({ id });
    }

    async findOneById(id: number): Promise<Language> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new NotFoundFault('Language');
        return entity;
    }

    async create(input: CreateLanguageInput): Promise<Language> {
        const entity = this.repo.create({ name: input.name, lastUpdate: new Date() });
        return await this.repo.save(entity);
    }

    async update(id: number, input: UpdateLanguageInput): Promise<Language> {
        const entity = await this.findOneById(id);
        if (input.name !== undefined) entity.name = input.name;
        entity.lastUpdate = new Date();
        return await this.repo.save(entity);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new NotFoundFault('Language');
        await this.repo.delete(id);
    }
}
