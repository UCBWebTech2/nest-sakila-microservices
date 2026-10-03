import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguagesModule } from '../languages/languages.module.js';
import { Film } from './entities/film.entity.js';
import { FilmsService } from './services/films.service.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Film]), LanguagesModule],
    providers: [FilmsService],
    exports:   [FilmsService],
})
export class FilmsModule {}
