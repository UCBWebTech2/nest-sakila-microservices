import { LogLevel } from '@nestjs/common';
import { EnvironmentEnum } from '../../shared/enums/index.js';

interface EnvSettings {
    logger: LogLevel[];
}

// Fixed per-environment settings — not env vars.
export const environmentSettings: Record<string, EnvSettings> = {
    [EnvironmentEnum.PRODUCTION]:  { logger: ['error'] },
    [EnvironmentEnum.DEVELOPMENT]: { logger: ['error', 'warn', 'log'] },
    [EnvironmentEnum.TEST]:        { logger: ['error'] },
    [EnvironmentEnum.DEBUG]:       { logger: ['error', 'warn', 'log', 'debug', 'verbose'] },
};

export function getEnvSettings(nodeEnv?: string): EnvSettings {
    return environmentSettings[nodeEnv ?? EnvironmentEnum.DEVELOPMENT];
}
