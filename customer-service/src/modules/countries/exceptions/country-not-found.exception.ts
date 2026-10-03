import { RpcException } from '@nestjs/microservices';

export class CountryNotFoundException extends RpcException {
    constructor() { super({ statusCode: 404, error: 'COUNTRY_NOT_FOUND', message: 'Country not found.' }); }
}
