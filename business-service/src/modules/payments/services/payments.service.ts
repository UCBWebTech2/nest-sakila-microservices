import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity.js';
import { Staff } from '../../staffs/entities/staff.entity.js';
import { Rental } from '../../rentals/entities/rental.entity.js';
import { PaymentDto } from '../dto/payment.dto.js';
import { CreatePaymentDto } from '../dto/create-payment.dto.js';
import { UpdatePaymentDto } from '../dto/update-payment.dto.js';
import { FindAllPaymentsResponseDto } from '../dto/find-all-payments-response.dto.js';
import { InvalidRentalIdException, InvalidStaffIdException, PaymentDateOutOfRangeException, PaymentNotFoundException } from '../exceptions/index.js';
import { FindOptions, PaginationArgs } from '../../../shared/dto/index.js';
import { isCheckViolation } from '../../../shared/utils/index.js';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private readonly repo: Repository<Payment>,
        @InjectRepository(Staff)
        private readonly staffs: Repository<Staff>,
        @InjectRepository(Rental)
        private readonly rentals: Repository<Rental>,
    ) {}

    async findAll(params: PaginationArgs): Promise<FindAllPaymentsResponseDto> {
        const { page, limit } = params;
        const [entities, total] = await this.repo.findAndCount({
            skip:  (page - 1) * limit,
            take:  limit,
            order: { id: 'ASC' },
        });

        return {
            data: entities.map((entity) => PaymentDto.fromEntity(entity)),
            meta: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async findOneById(id: number, options?: FindOptions): Promise<PaymentDto | null> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) {
            if (options?.throwException === false) return null;
            throw new PaymentNotFoundException();
        }
        return PaymentDto.fromEntity(entity);
    }

    async create(createDto: CreatePaymentDto): Promise<PaymentDto> {
        await this.assertReferencesExist(createDto.staffId, createDto.rentalId);
        const entity = this.repo.create({
            customerId:  createDto.customerId,
            staffId:     createDto.staffId,
            rentalId:    createDto.rentalId,
            amount:      createDto.amount,
            paymentDate: new Date(createDto.paymentDate),
        });

        return PaymentDto.fromEntity(await this.insert(entity));
    }

    // `payment` is partitioned with conditional INSERT rules (one per month), and Postgres refuses
    // `INSERT ... RETURNING` on a table like that ("cannot perform INSERT RETURNING on relation
    // payment"). repo.save() always appends RETURNING payment_id for a generated key, so the row is
    // inserted with updateEntity(false) (no RETURNING) and the new id is read back with currval() —
    // inside one transaction, because currval() is per-connection and must see this insert's nextval.
    // The sequence is named explicitly: pg_get_serial_sequence('payment', 'payment_id') returns NULL
    // here, since the dump creates the sequence without OWNED BY.
    private async insert(entity: Payment): Promise<Payment> {
        return await this.repo.manager.transaction(async (manager) => {
            await manager.createQueryBuilder().insert().into(Payment).values(entity).updateEntity(false).execute();
            const [{ id }] = await manager.query(`SELECT currval('payment_payment_id_seq') AS id`);
            return await manager.findOneByOrFail(Payment, { id: Number(id) });
        });
    }

    async update(id: number, updateDto: UpdatePaymentDto): Promise<PaymentDto> {
        const entity = await this.repo.findOneBy({ id });
        if (!entity) throw new PaymentNotFoundException();

        await this.assertReferencesExist(updateDto.staffId, updateDto.rentalId);

        if (updateDto.customerId !== undefined) entity.customerId = updateDto.customerId;
        if (updateDto.staffId !== undefined) entity.staffId = updateDto.staffId;
        if (updateDto.rentalId !== undefined) entity.rentalId = updateDto.rentalId;
        if (updateDto.amount !== undefined) entity.amount = updateDto.amount;
        if (updateDto.paymentDate !== undefined) entity.paymentDate = new Date(updateDto.paymentDate);

        try {
            const saved = await this.repo.save(entity);
            return PaymentDto.fromEntity(saved);
        } catch (err) {
            if (isCheckViolation(err)) throw new PaymentDateOutOfRangeException();
            throw err;
        }
    }

    // customer_id is not checked here: customers live in customer-service and microservices don't
    // call each other; its FK is still in the schema, so Postgres rejects an unknown customer and
    // the global filter turns that into INVALID_CUSTOMER_ID. Undefined = not sent
    // (an update that leaves that field alone).
    private async assertReferencesExist(staffId?: number, rentalId?: number): Promise<void> {
        if (staffId !== undefined && !(await this.staffs.existsBy({ id: staffId }))) throw new InvalidStaffIdException(staffId);
        if (rentalId !== undefined && !(await this.rentals.existsBy({ id: rentalId }))) throw new InvalidRentalIdException(rentalId);
    }

    async remove(id: number): Promise<void> {
        const exists = await this.repo.existsBy({ id });
        if (!exists) throw new PaymentNotFoundException();
        await this.repo.delete(id);
    }
}
