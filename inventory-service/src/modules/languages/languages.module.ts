import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './entities/language.entity.js';
import { LanguagesService } from './services/languages.service.js';

@Module({
    imports:   [TypeOrmModule.forFeature([Language])],
    providers: [LanguagesService],
    exports:   [LanguagesService],
})
export class LanguagesModule {}
