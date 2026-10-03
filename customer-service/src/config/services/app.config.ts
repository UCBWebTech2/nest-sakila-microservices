import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentEnum } from '../../shared/enums/index.js';

@Injectable()
export class AppConfig {
    readonly nodeEnv:      string;
    readonly port:         number;
    readonly apiPrefix:    string;
    readonly corsOrigins:  string;
    readonly isProduction: boolean;
    readonly grpcUrl:      string;
    readonly rabbitmqUrl:  string;
    readonly rabbitmqQueue: string;

    constructor(cfg: ConfigService) {
        this.nodeEnv      = cfg.get<string>('NODE_ENV')!;
        this.port         = cfg.get<number>('PORT')!;
        this.apiPrefix    = cfg.get<string>('API_PREFIX')!;
        this.corsOrigins  = cfg.get<string>('CORS_ORIGINS')!;
        this.isProduction = this.nodeEnv === EnvironmentEnum.PRODUCTION;
        this.grpcUrl       = cfg.get<string>('GRPC_URL')!;
        this.rabbitmqUrl   = cfg.get<string>('RABBITMQ_URL')!;
        this.rabbitmqQueue = cfg.get<string>('RABBITMQ_QUEUE')!;
    }
}
