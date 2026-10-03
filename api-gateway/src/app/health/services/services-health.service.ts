import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../config/services/app.config.js';

// How a microservice looks from here:
//   up         answered 200 — and `health` is what its own /api/health said (database, memory, disk)
//   unhealthy  answered, but its own health checks are failing (e.g. it lost its database) —
//              `health` still carries its report, so the reason is visible
//   down       didn't answer at all (not started, refused, timed out) — `error` says which
export type ServiceStatus = 'up' | 'unhealthy' | 'down';

export interface ServiceHealth {
    status:          ServiceStatus;
    responseTimeMs?: number;
    /** Only when `down`. */
    error?:          'unreachable' | 'timeout';
    /** The microservice's own /api/health body, verbatim. Absent when `down`. */
    health?:         unknown;
}

// Short on purpose: this runs inside the gateway's own health check (polled by Docker), and every
// service is asked in parallel, so a dead one costs at most this long, not this times four.
const TIMEOUT_MS = 2000;

// Purely informational. Nothing here can make the gateway's health fail or change its HTTP
// status: the gateway starts and serves fine with any subset of the microservices running (every
// client connects lazily), so "customer-service is down" is something to show, not to fail on.
@Injectable()
export class ServicesHealthService {
    constructor(private readonly config: AppConfig) {}

    async checkAll(): Promise<Record<string, ServiceHealth>> {
        const targets: Record<string, string> = {
            'business-service':  this.config.businessServiceHealthUrl,
            'customer-service':  this.config.customerServiceHealthUrl,
            'inventory-service': this.config.inventoryServiceHealthUrl,
            'reporting-service': this.config.reportingServiceHealthUrl,
        };

        const entries = await Promise.all(
            Object.entries(targets).map(async ([name, url]) => [name, await this.check(url)] as const),
        );
        return Object.fromEntries(entries);
    }

    private async check(url: string): Promise<ServiceHealth> {
        const startedAt = Date.now();
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
            const responseTimeMs = Date.now() - startedAt;
            const health = await response.json().catch(() => undefined);
            return { status: response.ok ? 'up' : 'unhealthy', responseTimeMs, health };
        } catch (err) {
            const timedOut = (err as Error)?.name === 'TimeoutError';
            return { status: 'down', error: timedOut ? 'timeout' : 'unreachable' };
        }
    }
}
