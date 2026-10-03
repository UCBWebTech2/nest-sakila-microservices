import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { HealthModule } from './app/health/health.module.js';
import { BusinessModule } from './app/business/business.module.js';
import { InventoryModule } from './app/inventory/inventory.module.js';
import { CustomerModule } from './app/customer/customer.module.js';
import { ReportingModule } from './app/reporting/reporting.module.js';
import { AuthModule } from './app/auth/auth.module.js';
import { SocketModule } from './plugins/socket/socket.module.js';

@Module({
    imports: [
        AppConfigModule,
        HealthModule,
        BusinessModule,
        InventoryModule,
        CustomerModule,
        ReportingModule,
        AuthModule,
        SocketModule,
    ],
})
export class AppModule {}
