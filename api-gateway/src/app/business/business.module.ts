import { Module } from '@nestjs/common';
import { BusinessGraphqlClientService } from './services/business-graphql-client.service.js';
import { StaffsController } from './staffs/controllers/staffs.controller.js';
import { StoresController } from './stores/controllers/stores.controller.js';
import { PaymentsController } from './payments/controllers/payments.controller.js';
import { RentalsController } from './rentals/controllers/rentals.controller.js';

// Adapter module for business-service (GraphQL). No entities, no DB — this gateway only proxies.
// One module like this per microservice in the ecosystem, each speaking that service's protocol.
@Module({
    controllers: [StaffsController, StoresController, PaymentsController, RentalsController],
    providers:   [BusinessGraphqlClientService],
    exports:     [BusinessGraphqlClientService],
})
export class BusinessModule {}
