import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { HealthModule } from './app/health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';
import { CitiesModule } from './modules/cities/cities.module.js';
import { CountriesModule } from './modules/countries/countries.module.js';

@Module({
    imports: [
        AppConfigModule,
        HealthModule,
        DatabaseModule,
        CustomersModule,
        AddressesModule,
        CitiesModule,
        CountriesModule,
    ],
})
export class AppModule {}
