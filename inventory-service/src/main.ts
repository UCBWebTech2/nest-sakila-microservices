import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as soap from 'soap';
import { types } from 'pg';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AppConfig } from './config/services/app.config.js';
import { getEnvSettings } from './config/helpers/environment.js';
import { getCorsOptions } from './config/helpers/cors.js';
import { logServerStatus } from './config/helpers/logger.js';
import { HttpExceptionFilter } from './shared/filters/index.js';
import { DatabaseConfig } from './database/config/database.config.js';
import { buildSoapService } from './soap/build-soap-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
    const { logger } = getEnvSettings(process.env.NODE_ENV);

    // BigInt / bigserial (OID 20) arrives as string from pg — cast for auto-increment IDs.
    types.setTypeParser(20, Number);

    const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });
    const cfg = app.get(AppConfig);

    app.setGlobalPrefix(cfg.apiPrefix);

    // Mounted directly on the underlying Express instance, outside Nest's own routing — the
    // global prefix above doesn't apply to it, so the SOAP endpoint stays exactly at /soap,
    // matching the <soap:address> in the WSDL.
    const wsdlXml = readFileSync(join(__dirname, 'soap', 'inventory.wsdl'), 'utf8');
    soap.listen(app.getHttpAdapter().getInstance(), '/soap', buildSoapService(app), wsdlXml);

    app.enableCors(getCorsOptions(cfg.corsOrigins));

    app.useGlobalPipes(new ValidationPipe({
        transform:            true,
        whitelist:            true,
        forbidNonWhitelisted: true,
        transformOptions:     { enableImplicitConversion: false },
    }));

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.listen(cfg.port);

    const dbCfg  = app.get(DatabaseConfig, { strict: false });

    logServerStatus(cfg, 'inventory-service', {
        entries:   [
            ['SOAP', `http://localhost:${cfg.port}/soap`],
            ['WSDL', `http://localhost:${cfg.port}/soap?wsdl`],
        ],
        cors:      cfg.corsOrigins,
        logLevels: logger,
        dbLogs:    dbCfg.logging,
        database:  `${dbCfg.host}:${dbCfg.port}/${dbCfg.database}`,
    });
}
bootstrap();
