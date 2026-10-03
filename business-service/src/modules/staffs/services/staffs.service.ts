import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity.js';
import { Store } from '../../stores/entities/store.entity.js';
import { StaffDto } from '../dto/staff.dto.js';
import { CreateStaffDto } from '../dto/create-staff.dto.js';
import { UpdateStaffDto } from '../dto/update-staff.dto.js';
import { FindAllStaffsResponseDto } from '../dto/find-all-staffs-response.dto.js';
import { StaffLoginDto } from '../dto/staff-login.dto.js';
import { StaffNotFoundException, StaffAlreadyExistsException, InvalidCredentialsException, InvalidStoreIdException } from '../exceptions/index.js';
import { FindOptions, PaginationArgs } from '../../../shared/dto/index.js';
import { hashPassword, comparePassword } from '../../../shared/utils/crypto.util.js';

@Injectable()
export class StaffsService {
    constructor(
        @InjectRepository(Staff)
        private readonly repo: Repository<Staff>,
        // Another module's table, read only to check an id exists. A repository instead of importing
        // StoresService: stores.manager_staff_id points back at staff, so a module import would be circular.
        @InjectRepository(Store)
        private readonly stores: Repository<Store>,
    ) {}

    async findAll(params: PaginationArgs): Promise<FindAllStaffsResponseDto> {
        const { page, limit } = params;
        const [entities, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });

        return {
            data: entities.map((entity) => StaffDto.fromEntity(entity)),
            meta: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async findOneById(id: number, options?: FindOptions): Promise<StaffDto | null> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) {
            if (options?.throwException === false) return null;
            throw new StaffNotFoundException();
        }
        return StaffDto.fromEntity(entity);
    }

    async create(createDto: CreateStaffDto): Promise<StaffDto> {
        const exists = await this.repo.existsBy({ username: createDto.username });
        if (exists) throw new StaffAlreadyExistsException();
        await this.assertStoreExists(createDto.storeId);

        const entity = this.repo.create({
            firstName:  createDto.firstName,
            lastName:   createDto.lastName,
            addressId:  createDto.addressId,
            email:      createDto.email ?? null,
            storeId:    createDto.storeId,
            active:     createDto.active ?? true,
            username:   createDto.username,
            password:   await hashPassword(createDto.password),
            lastUpdate: new Date(),
        });

        const saved = await this.repo.save(entity);
        return StaffDto.fromEntity(saved);
    }

    async update(id: number, updateDto: UpdateStaffDto): Promise<StaffDto> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new StaffNotFoundException();

        if (updateDto.username !== undefined && updateDto.username !== entity.username) {
            const exists = await this.repo.existsBy({ username: updateDto.username });
            if (exists) throw new StaffAlreadyExistsException();
            entity.username = updateDto.username;
        }

        if (updateDto.storeId !== undefined) await this.assertStoreExists(updateDto.storeId);

        if (updateDto.firstName !== undefined) entity.firstName = updateDto.firstName;
        if (updateDto.lastName !== undefined) entity.lastName = updateDto.lastName;
        if (updateDto.addressId !== undefined) entity.addressId = updateDto.addressId;
        if (updateDto.email !== undefined) entity.email = updateDto.email;
        if (updateDto.storeId !== undefined) entity.storeId = updateDto.storeId;
        if (updateDto.active !== undefined) entity.active = updateDto.active;
        if (updateDto.password !== undefined) entity.password = await hashPassword(updateDto.password);
        entity.lastUpdate = new Date();

        const saved = await this.repo.save(entity);
        return StaffDto.fromEntity(saved);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new StaffNotFoundException();
        await this.repo.delete(id);
    }

    // address_id is not checked here: addresses live in customer-service and microservices don't
    // call each other. Its FK is still in the schema, so Postgres rejects an unknown address and
    // the global filter turns that into INVALID_ADDRESS_ID (shared/utils/pg-errors.util.ts).
    private async assertStoreExists(storeId: number): Promise<void> {
        if (!(await this.stores.existsBy({ id: storeId }))) throw new InvalidStoreIdException(storeId);
    }

    // The only place `password` is read. api-gateway calls this to verify a login attempt —
    // the hash itself never leaves this service (StaffDto never includes it).
    async verifyCredentials(loginDto: StaffLoginDto): Promise<StaffDto> {
        const entity = await this.repo.findOneBy({ username: loginDto.username });
        if (!entity || !entity.active) throw new InvalidCredentialsException();

        const passwordMatches = await comparePassword(loginDto.password, entity.password);
        if (!passwordMatches) throw new InvalidCredentialsException();

        return StaffDto.fromEntity(entity);
    }
}
