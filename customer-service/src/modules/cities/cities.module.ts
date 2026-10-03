import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountriesModule } from '../countries/countries.module.js';
import { City } from './entities/city.entity.js';
import { CitiesService } from './services/cities.service.js';
import { CitiesController } from './controllers/cities.controller.js';

@Module({
    imports:     [TypeOrmModule.forFeature([City]), CountriesModule],
    controllers: [CitiesController],
    providers:   [CitiesService],
    exports:     [CitiesService],
})
export class CitiesModule {}
