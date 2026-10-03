import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { HealthModule } from './app/health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';

@Module({
    imports: [
        AppConfigModule,
        HealthModule,
        DatabaseModule,
        ReportsModule,
    ],
})
export class AppModule {}
