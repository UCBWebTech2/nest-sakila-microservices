import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfig } from '../config/jwt.config.js';

// Keep the payload minimal — data here is embedded in every token and may become stale.
export interface JwtPayload {
    sub:      number; // staff id
    username: string;
}

// Shape of request.user after validate() runs. Accessed via @CurrentUser().
export interface AuthUser {
    id:       number;
    username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(jwtConfig: JwtConfig) {
        super({
            jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey:      jwtConfig.secret,
        });
    }

    // payload is already verified by passport-jwt — no DB lookup needed here.
    validate(payload: JwtPayload): AuthUser {
        return {
            id:       payload.sub,
            username: payload.username,
        };
    }
}
