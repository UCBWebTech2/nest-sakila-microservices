import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health.controller.js';
import { ServicesHealthService } from './services/services-health.service.js';

@Module({
    imports:     [TerminusModule],
    controllers: [HealthController],
    providers:   [ServicesHealthService],
})
export class HealthModule {}
