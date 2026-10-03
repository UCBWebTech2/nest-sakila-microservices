import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from '../staffs/entities/staff.entity.js';
import { Store } from './entities/store.entity.js';
import { StoresService } from './services/stores.service.js';
import { StoresResolver } from './resolvers/stores.resolver.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Store, Staff])],
    providers: [StoresService, StoresResolver],
    exports:   [StoresService],
})
export class StoresModule {}
