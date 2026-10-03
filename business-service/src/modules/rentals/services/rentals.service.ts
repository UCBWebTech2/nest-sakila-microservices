import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from '../entities/rental.entity.js';
import { Staff } from '../../staffs/entities/staff.entity.js';
import { RentalDto } from '../dto/rental.dto.js';
import { CreateRentalDto } from '../dto/create-rental.dto.js';
import { UpdateRentalDto } from '../dto/update-rental.dto.js';
import { FindAllRentalsResponseDto } from '../dto/find-all-rentals-response.dto.js';
import { InvalidStaffIdException, RentalNotFoundException } from '../exceptions/index.js';
import { FindOptions, PaginationArgs } from '../../../shared/dto/index.js';

@Injectable()
export class RentalsService {
    constructor(
        @InjectRepository(Rental)
        private readonly repo: Repository<Rental>,
        @InjectRepository(Staff)
        private readonly staffs: Repository<Staff>,
    ) {}

    async findAll(params: PaginationArgs): Promise<FindAllRentalsResponseDto> {
        const { page, limit } = params;
        const [entities, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });

        return {
            data: entities.map((entity) => RentalDto.fromEntity(entity)),
            meta: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async findOneById(id: number, options?: FindOptions): Promise<RentalDto | null> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) {
            if (options?.throwException === false) return null;
            throw new RentalNotFoundException();
        }
        return RentalDto.fromEntity(entity);
    }

    async create(createDto: CreateRentalDto): Promise<RentalDto> {
        await this.assertStaffExists(createDto.staffId);
        const entity = this.repo.create({
            rentalDate:  new Date(createDto.rentalDate),
            inventoryId: createDto.inventoryId,
            customerId:  createDto.customerId,
            returnDate:  null,
            staffId:     createDto.staffId,
            lastUpdate:  new Date(),
        });

        const saved = await this.repo.save(entity);
        return RentalDto.fromEntity(saved);
    }

    async update(id: number, updateDto: UpdateRentalDto): Promise<RentalDto> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new RentalNotFoundException();

        if (updateDto.staffId !== undefined) await this.assertStaffExists(updateDto.staffId);

        if (updateDto.rentalDate !== undefined) entity.rentalDate = new Date(updateDto.rentalDate);
        if (updateDto.inventoryId !== undefined) entity.inventoryId = updateDto.inventoryId;
        if (updateDto.customerId !== undefined) entity.customerId = updateDto.customerId;
        if (updateDto.staffId !== undefined) entity.staffId = updateDto.staffId;
        if (updateDto.returnDate !== undefined) entity.returnDate = new Date(updateDto.returnDate);
        entity.lastUpdate = new Date();

        const saved = await this.repo.save(entity);
        return RentalDto.fromEntity(saved);
    }

    // inventory_id and customer_id are not checked here: they live in inventory-service /
    // customer-service and microservices don't call each other. Their FKs are still in the schema,
    // so Postgres rejects an unknown one and the global filter turns that into INVALID_CUSTOMER_ID /
    // INVALID_INVENTORY_ID (shared/utils/pg-errors.util.ts).
    private async assertStaffExists(staffId: number): Promise<void> {
        if (!(await this.staffs.existsBy({ id: staffId }))) throw new InvalidStaffIdException(staffId);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new RentalNotFoundException();
        await this.repo.delete(id);
    }
}
