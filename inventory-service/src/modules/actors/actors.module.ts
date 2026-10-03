import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Actor } from './entities/actor.entity.js';
import { ActorsService } from './services/actors.service.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Actor])],
    providers: [ActorsService],
    exports:   [ActorsService],
})
export class ActorsModule {}
