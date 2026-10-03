import Joi from 'joi';
import { EnvironmentEnum } from '../shared/enums/index.js';

export const envValidation = Joi.object({

    // -- Server ---------------------------------------------------------------
    NODE_ENV:     Joi.string().valid(...Object.values(EnvironmentEnum)).default(EnvironmentEnum.DEVELOPMENT),
    PORT:         Joi.number().default(3000),
    API_PREFIX:   Joi.string().default('api'),
    CORS_ORIGINS: Joi.string().default('*'),

    // -- Database -------------------------------------------------------------
    DB_TYPE:     Joi.string().required(),
    DB_HOST:     Joi.string().required(),
    DB_PORT:     Joi.number().required(),
    DB_USER:     Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME:     Joi.string().required(),
    DB_LOGS:     Joi.boolean().default(false),


});
