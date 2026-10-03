import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitiesModule } from '../cities/cities.module.js';
import { Address } from './entities/address.entity.js';
import { AddressesService } from './services/addresses.service.js';
import { AddressesController } from './controllers/addresses.controller.js';

@Module({
    imports:     [TypeOrmModule.forFeature([Address]), CitiesModule],
    controllers: [AddressesController],
    providers:   [AddressesService],
    exports:     [AddressesService],
})
export class AddressesModule {}
