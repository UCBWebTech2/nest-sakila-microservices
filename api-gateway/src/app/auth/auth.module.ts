import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfig } from './config/jwt.config.js';
import { BusinessModule } from '../business/business.module.js';
import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            // extraProviders bridges the gap between JwtModule's internal module and AuthModule's DI scope.
            extraProviders: [JwtConfig],
            inject:         [JwtConfig],
            useFactory: (cfg: JwtConfig) => ({
                secret:      cfg.secret,
                signOptions: { expiresIn: cfg.expiresIn as any },
            }),
        }),
        BusinessModule,
    ],
    providers: [
        // APP_GUARD applies this guard globally. Remove this module from AppModule to disable it.
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        JwtConfig,
        AuthService,
        JwtStrategy,
    ],
    controllers: [AuthController],
    exports:     [JwtStrategy, PassportModule],
})
export class AuthModule {}
