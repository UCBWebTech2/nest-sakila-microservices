import { Module } from '@nestjs/common';
import { ReportsService } from './services/reports.service.js';
import { ReportsGateway } from './gateways/reports.gateway.js';

@Module({
    providers: [ReportsService, ReportsGateway],
})
export class ReportsModule {}
