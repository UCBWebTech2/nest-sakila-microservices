import { GrpcInvalidArgumentException } from '@nestjs/microservices';

// The body referenced a city that doesn't exist (checked before touching the DB).
export class InvalidCityIdException extends GrpcInvalidArgumentException {
    constructor(id: number) { super(`INVALID_CITY_ID: City ${id} does not exist.`); }
}
