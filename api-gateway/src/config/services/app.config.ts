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

    // -- Microservices this gateway talks to --------------------------------
    readonly businessServiceGraphqlUrl: string;
    readonly inventoryServiceWsdlUrl:   string;
    readonly reportingServiceWsUrl:     string;
    readonly customerServiceGrpcUrl:       string;
    readonly customerServiceRabbitmqUrl:   string;
    readonly customerServiceRabbitmqQueue: string;

    // -- Each microservice's own /api/health, polled by this gateway's /api/health (informational) --
    readonly businessServiceHealthUrl:  string;
    readonly customerServiceHealthUrl:  string;
    readonly inventoryServiceHealthUrl: string;
    readonly reportingServiceHealthUrl: string;

    constructor(cfg: ConfigService) {
        this.nodeEnv      = cfg.get<string>('NODE_ENV')!;
        this.port         = cfg.get<number>('PORT')!;
        this.apiPrefix    = cfg.get<string>('API_PREFIX')!;
        this.corsOrigins  = cfg.get<string>('CORS_ORIGINS')!;
        this.isProduction = this.nodeEnv === EnvironmentEnum.PRODUCTION;

        this.businessServiceGraphqlUrl = cfg.get<string>('BUSINESS_SERVICE_GRAPHQL_URL')!;
        this.inventoryServiceWsdlUrl   = cfg.get<string>('INVENTORY_SERVICE_WSDL_URL')!;
        this.reportingServiceWsUrl     = cfg.get<string>('REPORTING_SERVICE_WS_URL')!;
        this.customerServiceGrpcUrl       = cfg.get<string>('CUSTOMER_SERVICE_GRPC_URL')!;
        this.customerServiceRabbitmqUrl   = cfg.get<string>('CUSTOMER_SERVICE_RABBITMQ_URL')!;
        this.customerServiceRabbitmqQueue = cfg.get<string>('CUSTOMER_SERVICE_RABBITMQ_QUEUE')!;

        this.businessServiceHealthUrl  = cfg.get<string>('BUSINESS_SERVICE_HEALTH_URL')!;
        this.customerServiceHealthUrl  = cfg.get<string>('CUSTOMER_SERVICE_HEALTH_URL')!;
        this.inventoryServiceHealthUrl = cfg.get<string>('INVENTORY_SERVICE_HEALTH_URL')!;
        this.reportingServiceHealthUrl = cfg.get<string>('REPORTING_SERVICE_HEALTH_URL')!;
    }
}
