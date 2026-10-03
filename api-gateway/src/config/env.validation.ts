import Joi from 'joi';
import { EnvironmentEnum } from '../shared/enums/index.js';

export const envValidation = Joi.object({

    // -- Server ---------------------------------------------------------------
    NODE_ENV:     Joi.string().valid(...Object.values(EnvironmentEnum)).default(EnvironmentEnum.DEVELOPMENT),
    PORT:         Joi.number().default(3000),
    API_PREFIX:   Joi.string().default('api'),
    CORS_ORIGINS: Joi.string().default('*'),

    // -- Auth (JWT) -------------------------------------------------------------
    // No DB here — this gateway holds no user data of its own. Credentials are verified by
    // business-service (staffLogin); this only signs the token.
    JWT_SECRET:      Joi.string().required(),
    JWT_TIME_EXPIRE: Joi.string().default('15m'),

    // -- Plugin: socket -------------------------------------------------------
    WEBSOCKET_NAMESPACE: Joi.string().default('app'),

    // -- Microservices (this gateway talks to, each in its own protocol) ------
    BUSINESS_SERVICE_GRAPHQL_URL: Joi.string().uri().default('http://localhost:3001/graphql'),
    INVENTORY_SERVICE_WSDL_URL:   Joi.string().uri().default('http://localhost:3003/soap?wsdl'),
    REPORTING_SERVICE_WS_URL:     Joi.string().uri().default('http://localhost:3004'),
    CUSTOMER_SERVICE_GRPC_URL:      Joi.string().default('localhost:50051'),
    CUSTOMER_SERVICE_RABBITMQ_URL:  Joi.string().uri().default('amqp://guest:guest@localhost:5672'),
    CUSTOMER_SERVICE_RABBITMQ_QUEUE: Joi.string().default('customer_queue'),

    // -- Microservices' own /api/health (informational — see app/health/) ---------
    BUSINESS_SERVICE_HEALTH_URL:  Joi.string().uri().default('http://localhost:3001/api/health'),
    CUSTOMER_SERVICE_HEALTH_URL:  Joi.string().uri().default('http://localhost:3002/api/health'),
    INVENTORY_SERVICE_HEALTH_URL: Joi.string().uri().default('http://localhost:3003/api/health'),
    REPORTING_SERVICE_HEALTH_URL: Joi.string().uri().default('http://localhost:3004/api/health'),

});
