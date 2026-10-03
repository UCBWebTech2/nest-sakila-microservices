import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck, HealthCheckService,
    TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly db:     TypeOrmHealthIndicator,
        private readonly memory: MemoryHealthIndicator,
        private readonly disk:   DiskHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            // Runs SELECT 1 against the TypeORM connection.
            () => this.db.pingCheck('database'),

            // Fails if Node.js heap exceeds 300 MB — adjust to your server specs.
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

            // Fails if disk usage exceeds 90%. Remove if the app writes no local files.
            () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
        ]);
    }
}
