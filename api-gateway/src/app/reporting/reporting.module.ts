import { Module } from '@nestjs/common';
import { ReportingSocketClientService } from './services/reporting-socket-client.service.js';
import { ReportingController } from './controllers/reporting.controller.js';

// Adapter module for reporting-service (WebSocket). No entities, no DB — this gateway only
// proxies. Same pattern as app/business/ and app/inventory/, one layer down (Socket.io instead
// of GraphQL/SOAP).
@Module({
    controllers: [ReportingController],
    providers:   [ReportingSocketClientService],
    exports:     [ReportingSocketClientService],
})
export class ReportingModule {}
