import { ApiProperty } from '@nestjs/swagger';

class ServiceHealthDto {
    @ApiProperty({ enum: ['up', 'unhealthy', 'down'], example: 'up', description: 'up = answered 200; unhealthy = answered but its own checks fail; down = no answer.' })
    status: 'up' | 'unhealthy' | 'down';

    @ApiProperty({ required: false, example: 14 })
    responseTimeMs?: number;

    @ApiProperty({ required: false, enum: ['unreachable', 'timeout'], description: 'Only when down.' })
    error?: 'unreachable' | 'timeout';

    @ApiProperty({ required: false, description: "The microservice's own /api/health body, verbatim. Absent when down.", type: Object, additionalProperties: true })
    health?: object;
}

export class HealthResponseDto {
    @ApiProperty({ example: 'ok' })
    status: string;

    @ApiProperty({ type: Object, additionalProperties: true })
    info: object;

    @ApiProperty({ type: Object, additionalProperties: true })
    error: object;

    @ApiProperty({ type: Object, additionalProperties: true })
    details: object;

    @ApiProperty({
        description: 'Informational only: each microservice\'s reachability and its own health. Never affects `status` or the HTTP code above.',
        type: Object,
        additionalProperties: { $ref: '#/components/schemas/ServiceHealthDto' },
    })
    services: Record<string, ServiceHealthDto>;
}

export { ServiceHealthDto };
