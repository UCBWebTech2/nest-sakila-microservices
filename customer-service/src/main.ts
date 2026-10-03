import 'dotenv/config';

import { types } from 'pg';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AppConfig } from './config/services/app.config.js';
import { getEnvSettings } from './config/helpers/environment.js';
import { getCorsOptions } from './config/helpers/cors.js';
import { logServerStatus } from './config/helpers/logger.js';
import { HttpExceptionFilter } from './shared/filters/index.js';
import { DatabaseConfig } from './database/config/database.config.js';

async function bootstrap() {
    const { logger } = getEnvSettings(process.env.NODE_ENV);

    // BigInt / bigserial (OID 20) arrives as string from pg — cast for auto-increment IDs.
    types.setTypeParser(20, Number);

    const app = await NestFactory.create(AppModule, { logger });
    const cfg = app.get(AppConfig);

    app.setGlobalPrefix(cfg.apiPrefix);

    app.enableCors(getCorsOptions(cfg.corsOrigins));

    app.useGlobalPipes(new ValidationPipe({
        transform:            true,
        whitelist:            true,
        forbidNonWhitelisted: true,
        transformOptions:     { enableImplicitConversion: false },
    }));

    app.useGlobalFilters(new HttpExceptionFilter());

    // Hybrid application (NestJS docs: FAQ > Hybrid application): one process serving HTTP (health)
    // plus two microservice transports — gRPC for customers/addresses, RabbitMQ for cities/countries.
    // Global pipes/filters are NOT inherited by connected microservices (no `inheritAppConfig`):
    // each RPC controller binds its own transport-specific pipe/filter instead.
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package:   'customer',
            protoPath: join(import.meta.dirname, 'proto/customer.proto'),
            url:       cfg.grpcUrl,
        },
    });

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls:         [cfg.rabbitmqUrl],
            queue:        cfg.rabbitmqQueue,
            queueOptions: { durable: true },
        },
    });

    // listen() before startAllMicroservices() so no message is handled before the app is fully up.
    await app.listen(cfg.port);
    await app.startAllMicroservices();

    const dbCfg  = app.get(DatabaseConfig, { strict: false });

    logServerStatus(cfg, 'customer-service', {
        // Broker credentials stay out of the log: only where the queue lives.
        entries:   [
            ['gRPC',     `localhost:${cfg.grpcUrl.split(':').pop()}`],
            ['RabbitMQ', `queue ${cfg.rabbitmqQueue} @ ${new URL(cfg.rabbitmqUrl).host}`],
        ],
        cors:      cfg.corsOrigins,
        logLevels: logger,
        dbLogs:    dbCfg.logging,
        database:  `${dbCfg.host}:${dbCfg.port}/${dbCfg.database}`,
    });
}
bootstrap();
