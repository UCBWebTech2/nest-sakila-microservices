import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actor } from '../entities/actor.entity.js';
import { NotFoundFault } from '../../../shared/soap/soap-fault.js';
import { PaginationArgs, PaginationMeta, buildMeta, normalizePagination } from '../../../shared/soap/pagination.js';

export interface CreateActorInput {
    firstName: string;
    lastName:  string;
}

export type UpdateActorInput = Partial<CreateActorInput>;

@Injectable()
export class ActorsService {
    constructor(
        @InjectRepository(Actor)
        private readonly repo: Repository<Actor>,
    ) {}

    async findAll(args: PaginationArgs): Promise<{ data: Actor[]; meta: PaginationMeta }> {
        const { page, limit } = normalizePagination(args);
        const [data, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });
        return { data, meta: buildMeta(page, limit, total) };
    }

    async findOneById(id: number): Promise<Actor> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new NotFoundFault('Actor');
        return entity;
    }

    async create(input: CreateActorInput): Promise<Actor> {
        const entity = this.repo.create({
            firstName:  input.firstName,
            lastName:   input.lastName,
            lastUpdate: new Date(),
        });
        return await this.repo.save(entity);
    }

    async update(id: number, input: UpdateActorInput): Promise<Actor> {
        const entity = await this.findOneById(id);
        if (input.firstName !== undefined) entity.firstName = input.firstName;
        if (input.lastName !== undefined) entity.lastName = input.lastName;
        entity.lastUpdate = new Date();
        return await this.repo.save(entity);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new NotFoundFault('Actor');
        await this.repo.delete(id);
    }
}
