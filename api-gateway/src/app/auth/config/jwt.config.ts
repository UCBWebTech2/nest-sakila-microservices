import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfig {
    readonly secret:    string;
    readonly expiresIn: string;

    constructor(cfg: ConfigService) {
        this.secret    = cfg.get<string>('JWT_SECRET')!;
        this.expiresIn = cfg.get<string>('JWT_TIME_EXPIRE')!;
    }
}
