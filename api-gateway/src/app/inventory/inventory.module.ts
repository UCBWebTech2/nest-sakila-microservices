import { Module } from '@nestjs/common';
import { InventorySoapClientService } from './services/inventory-soap-client.service.js';
import { FilmsController } from './films/controllers/films.controller.js';
import { ActorsController } from './actors/controllers/actors.controller.js';
import { CategoriesController } from './categories/controllers/categories.controller.js';
import { LanguagesController } from './languages/controllers/languages.controller.js';
import { InventoriesController } from './inventories/controllers/inventories.controller.js';

// Adapter module for inventory-service (SOAP). No entities, no DB — this gateway only proxies.
// Same pattern as app/business/, one layer down (SOAP instead of GraphQL).
@Module({
    controllers: [FilmsController, ActorsController, CategoriesController, LanguagesController, InventoriesController],
    providers:   [InventorySoapClientService],
    exports:     [InventorySoapClientService],
})
export class InventoryModule {}
