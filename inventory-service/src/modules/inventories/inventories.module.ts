import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilmsModule } from '../films/films.module.js';
import { Inventory } from './entities/inventory.entity.js';
import { InventoriesService } from './services/inventories.service.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Inventory]), FilmsModule],
    providers: [InventoriesService],
    exports:   [InventoriesService],
})
export class InventoriesModule {}
