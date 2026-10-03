import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity.js';
import { CountriesService } from './services/countries.service.js';
import { CountriesController } from './controllers/countries.controller.js';

@Module({
    imports:     [TypeOrmModule.forFeature([Country])],
    controllers: [CountriesController],
    providers:   [CountriesService],
    exports:     [CountriesService],
})
export class CountriesModule {}
