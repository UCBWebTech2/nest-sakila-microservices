import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AppConfig } from './config/services/app.config.js';
import { getEnvSettings } from './config/helpers/environment.js';
import { getCorsOptions } from './config/helpers/cors.js';
import { setupSwagger } from './config/helpers/swagger.js';
import { logServerStatus } from './config/helpers/logger.js';
import { HttpExceptionFilter } from './shared/filters/index.js';

async function bootstrap() {
    const { logger, swagger } = getEnvSettings(process.env.NODE_ENV);

    const app = await NestFactory.create(AppModule, { logger });
    const cfg = app.get(AppConfig);

    app.setGlobalPrefix(cfg.apiPrefix);

    if (swagger) {
        setupSwagger(app, {
            title:       'api-gateway',
            description: 'API Documentation',
            version:     '1.0',
            path:        'api/docs',
        });
    }

    app.enableCors(getCorsOptions(cfg.corsOrigins));

    app.useGlobalPipes(new ValidationPipe({
        transform:            true,
        whitelist:            true,
        forbidNonWhitelisted: true,
        transformOptions:     { enableImplicitConversion: false },
    }));

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.listen(cfg.port);

    logServerStatus(cfg, 'api-gateway', {
        swagger:   swagger,
        docsPath:  'api/docs',
        cors:      cfg.corsOrigins,
        logLevels: logger,
    });
}
bootstrap();
