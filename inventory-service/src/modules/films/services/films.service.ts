import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film } from '../entities/film.entity.js';
import { InvalidIdFault, NotFoundFault } from '../../../shared/soap/soap-fault.js';
import { LanguagesService } from '../../languages/services/languages.service.js';
import { PaginationArgs, PaginationMeta, buildMeta, normalizePagination } from '../../../shared/soap/pagination.js';

export interface CreateFilmInput {
    title:               string;
    description?:        string;
    releaseYear?:        number;
    languageId:          number;
    originalLanguageId?: number;
    rentalDuration?:     number;
    rentalRate?:         string;
    length?:             number;
    replacementCost?:    string;
    rating?:             string;
}

export type UpdateFilmInput = Partial<CreateFilmInput>;

const DEFAULT_RENTAL_DURATION  = 3;
const DEFAULT_RENTAL_RATE      = '4.99';
const DEFAULT_REPLACEMENT_COST = '19.99';
const DEFAULT_RATING           = 'G';

@Injectable()
export class FilmsService {
    constructor(
        @InjectRepository(Film)
        private readonly repo: Repository<Film>,
        private readonly languages: LanguagesService,
    ) {}

    async findAll(args: PaginationArgs): Promise<{ data: Film[]; meta: PaginationMeta }> {
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

    async findOneById(id: number): Promise<Film> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new NotFoundFault('Film');
        return entity;
    }

    async create(input: CreateFilmInput): Promise<Film> {
        await this.assertLanguagesExist(input.languageId, input.originalLanguageId);
        const entity = this.repo.create({
            title:              input.title,
            description:        input.description ?? null,
            releaseYear:        input.releaseYear ?? null,
            languageId:         input.languageId,
            originalLanguageId: input.originalLanguageId ?? null,
            rentalDuration:     input.rentalDuration ?? DEFAULT_RENTAL_DURATION,
            rentalRate:         input.rentalRate ?? DEFAULT_RENTAL_RATE,
            length:             input.length ?? null,
            replacementCost:    input.replacementCost ?? DEFAULT_REPLACEMENT_COST,
            rating:             input.rating ?? DEFAULT_RATING,
            lastUpdate:         new Date(),
        });
        return await this.repo.save(entity);
    }

    async update(id: number, input: UpdateFilmInput): Promise<Film> {
        const entity = await this.findOneById(id);
        await this.assertLanguagesExist(input.languageId, input.originalLanguageId);

        if (input.title !== undefined) entity.title = input.title;
        if (input.description !== undefined) entity.description = input.description;
        if (input.releaseYear !== undefined) entity.releaseYear = input.releaseYear;
        if (input.languageId !== undefined) entity.languageId = input.languageId;
        if (input.originalLanguageId !== undefined) entity.originalLanguageId = input.originalLanguageId;
        if (input.rentalDuration !== undefined) entity.rentalDuration = input.rentalDuration;
        if (input.rentalRate !== undefined) entity.rentalRate = input.rentalRate;
        if (input.length !== undefined) entity.length = input.length;
        if (input.replacementCost !== undefined) entity.replacementCost = input.replacementCost;
        if (input.rating !== undefined) entity.rating = input.rating;
        entity.lastUpdate = new Date();

        return await this.repo.save(entity);
    }

    // Undefined = not sent (original language is optional, and an update may leave either alone).
    private async assertLanguagesExist(languageId?: number, originalLanguageId?: number): Promise<void> {
        for (const id of [languageId, originalLanguageId]) {
            if (id !== undefined && id !== null && !(await this.languages.existsById(id))) throw new InvalidIdFault('language', id);
        }
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new NotFoundFault('Film');
        await this.repo.delete(id);
    }
}
