import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { HealthModule } from './app/health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { FilmsModule } from './modules/films/films.module.js';
import { ActorsModule } from './modules/actors/actors.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { LanguagesModule } from './modules/languages/languages.module.js';
import { InventoriesModule } from './modules/inventories/inventories.module.js';

@Module({
    imports: [
        AppConfigModule,
        HealthModule,
        DatabaseModule,
        FilmsModule,
        ActorsModule,
        CategoriesModule,
        LanguagesModule,
        InventoriesModule,
    ],
})
export class AppModule {}
