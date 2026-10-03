import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../auth/decorators/index.js';
import { ServicesHealthService } from '../services/services-health.service.js';
import { HealthResponseDto, ServiceHealthDto } from '../dto/health-response.dto.js';

// @Public() — Docker, Kubernetes, and monitoring tools have no JWT token.
// No TypeOrmHealthIndicator — this gateway holds no database of its own.
@ApiTags('Health')
@ApiExtraModels(ServiceHealthDto)
@Controller('health')
export class HealthController {
    constructor(
        private readonly health:   HealthCheckService,
        private readonly memory:   MemoryHealthIndicator,
        private readonly disk:     DiskHealthIndicator,
        private readonly services: ServicesHealthService,
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    @ApiOperation({
        summary:     'Application health',
        description:
            "The gateway's own status (memory, disk): 200 if all checks pass, 503 if any fails. Consumed by Docker, "
            + "Kubernetes, load balancers, and uptime monitors.\n\n"
            + "`services` is informational only: whether each microservice is up, and what its own /api/health reports. "
            + "A microservice being down or unhealthy never changes `status` or the HTTP code — the gateway works with "
            + "whichever subset of them is running.",
    })
    @ApiOkResponse({ type: HealthResponseDto })
    async check() {
        // Asked in parallel with the gateway's own checks; checkAll() never throws.
        const servicesPromise = this.services.checkAll();

        try {
            const own = await this.health.check([
                // Fails if Node.js heap exceeds 300 MB — adjust to your server specs.
                () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

                // Fails if disk usage exceeds 90%. Remove if the app writes no local files.
                () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
            ]);
            return { ...own, services: await servicesPromise };
        } catch (err) {
            // The gateway's *own* check failed: still a 503, but keep the services report in the body.
            if (err instanceof ServiceUnavailableException) {
                throw new ServiceUnavailableException({ ...(err.getResponse() as object), services: await servicesPromise });
            }
            throw err;
        }
    }
}
