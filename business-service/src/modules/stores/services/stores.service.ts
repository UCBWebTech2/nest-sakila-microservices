import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity.js';
import { Staff } from '../../staffs/entities/staff.entity.js';
import { StoreDto } from '../dto/store.dto.js';
import { CreateStoreDto } from '../dto/create-store.dto.js';
import { UpdateStoreDto } from '../dto/update-store.dto.js';
import { FindAllStoresResponseDto } from '../dto/find-all-stores-response.dto.js';
import { InvalidStaffIdException, StoreNotFoundException } from '../exceptions/index.js';
import { FindOptions, PaginationArgs } from '../../../shared/dto/index.js';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private readonly repo: Repository<Store>,
        // See StaffsService: a repository rather than StaffsService to avoid a circular module import.
        @InjectRepository(Staff)
        private readonly staffs: Repository<Staff>,
    ) {}

    async findAll(params: PaginationArgs): Promise<FindAllStoresResponseDto> {
        const { page, limit } = params;
        const [entities, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });

        return {
            data: entities.map((entity) => StoreDto.fromEntity(entity)),
            meta: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async findOneById(id: number, options?: FindOptions): Promise<StoreDto | null> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) {
            if (options?.throwException === false) return null;
            throw new StoreNotFoundException();
        }
        return StoreDto.fromEntity(entity);
    }

    async create(createDto: CreateStoreDto): Promise<StoreDto> {
        await this.assertManagerExists(createDto.managerStaffId);
        const entity = this.repo.create({
            managerStaffId: createDto.managerStaffId,
            addressId:      createDto.addressId,
            lastUpdate:     new Date(),
        });

        const saved = await this.repo.save(entity);
        return StoreDto.fromEntity(saved);
    }

    async update(id: number, updateDto: UpdateStoreDto): Promise<StoreDto> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new StoreNotFoundException();

        if (updateDto.managerStaffId !== undefined) await this.assertManagerExists(updateDto.managerStaffId);

        if (updateDto.managerStaffId !== undefined) entity.managerStaffId = updateDto.managerStaffId;
        if (updateDto.addressId !== undefined) entity.addressId = updateDto.addressId;
        entity.lastUpdate = new Date();

        const saved = await this.repo.save(entity);
        return StoreDto.fromEntity(saved);
    }

    // address_id is not checked here: addresses live in customer-service (see StaffsService) — the
    // FK in the schema makes Postgres reject an unknown one (INVALID_ADDRESS_ID via the global filter).
    private async assertManagerExists(staffId: number): Promise<void> {
        if (!(await this.staffs.existsBy({ id: staffId }))) throw new InvalidStaffIdException(staffId);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new StoreNotFoundException();
        await this.repo.delete(id);
    }
}
