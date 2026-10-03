import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../stores/entities/store.entity.js';
import { Staff } from './entities/staff.entity.js';
import { StaffsService } from './services/staffs.service.js';
import { StaffsResolver } from './resolvers/staffs.resolver.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Staff, Store])],
    providers: [StaffsService, StaffsResolver],
    exports:   [StaffsService],
})
export class StaffsModule {}
