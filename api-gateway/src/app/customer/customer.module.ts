import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { AppConfig } from '../../config/services/app.config.js';
import { CUSTOMER_GRPC_CLIENT, CustomerGrpcClientService } from './services/customer-grpc-client.service.js';
import { CUSTOMER_RMQ_CLIENT, CustomerRmqClientService } from './services/customer-rmq-client.service.js';
import { CustomersController } from './customers/controllers/customers.controller.js';
import { AddressesController } from './addresses/controllers/addresses.controller.js';
import { CitiesController } from './cities/controllers/cities.controller.js';
import { CountriesController } from './countries/controllers/countries.controller.js';

// Adapter module for customer-service — two protocols at once. Same pattern as app/business/
// (GraphQL) and app/inventory/ (SOAP): no entities, no DB, this gateway only proxies.
//   customers + addresses -> gRPC     (typed contract: ./proto/customer.proto)
//   cities    + countries -> RabbitMQ (request-response on the customer-service queue)
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name:       CUSTOMER_GRPC_CLIENT,
                inject:     [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.GRPC,
                    options: {
                        package:   'customer',
                        protoPath: join(import.meta.dirname, 'proto/customer.proto'),
                        url:       config.customerServiceGrpcUrl,
                        // grpc-js retries a dead connection with an exponential backoff that grows up to
                        // 2 minutes, so after customer-service had been down for a while the gateway kept
                        // answering 503 for a long time after it came back. Capping it makes it reconnect
                        // within a couple of seconds.
                        channelOptions: {
                            'grpc.initial_reconnect_backoff_ms': 500,
                            'grpc.max_reconnect_backoff_ms':     2000,
                        },
                    },
                }),
            },
            {
                name:       CUSTOMER_RMQ_CLIENT,
                inject:     [AppConfig],
                useFactory: (config: AppConfig) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls:         [config.customerServiceRabbitmqUrl],
                        queue:        config.customerServiceRabbitmqQueue,
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    controllers: [CustomersController, AddressesController, CitiesController, CountriesController],
    providers:   [CustomerGrpcClientService, CustomerRmqClientService],
})
export class CustomerModule {}
