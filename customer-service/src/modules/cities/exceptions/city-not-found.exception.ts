import { RpcException } from '@nestjs/microservices';

export class CityNotFoundException extends RpcException {
    constructor() { super({ statusCode: 404, error: 'CITY_NOT_FOUND', message: 'City not found.' }); }
}
