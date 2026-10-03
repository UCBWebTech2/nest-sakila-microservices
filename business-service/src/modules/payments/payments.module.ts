import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from '../staffs/entities/staff.entity.js';
import { Rental } from '../rentals/entities/rental.entity.js';
import { Payment } from './entities/payment.entity.js';
import { PaymentsService } from './services/payments.service.js';
import { PaymentsResolver } from './resolvers/payments.resolver.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Payment, Staff, Rental])],
    providers: [PaymentsService, PaymentsResolver],
    exports:   [PaymentsService],
})
export class PaymentsModule {}
