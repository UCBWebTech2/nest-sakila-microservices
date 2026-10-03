import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from '../staffs/entities/staff.entity.js';
import { Rental } from './entities/rental.entity.js';
import { RentalsService } from './services/rentals.service.js';
import { RentalsResolver } from './resolvers/rentals.resolver.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Rental, Staff])],
    providers: [RentalsService, RentalsResolver],
    exports:   [RentalsService],
})
export class RentalsModule {}
