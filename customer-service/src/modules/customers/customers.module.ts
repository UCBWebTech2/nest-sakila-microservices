import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesModule } from '../addresses/addresses.module.js';
import { Customer } from './entities/customer.entity.js';
import { CustomersService } from './services/customers.service.js';
import { CustomersController } from './controllers/customers.controller.js';

@Module({
    imports:     [TypeOrmModule.forFeature([Customer]), AddressesModule],
    controllers: [CustomersController],
    providers:   [CustomersService],
})
export class CustomersModule {}
