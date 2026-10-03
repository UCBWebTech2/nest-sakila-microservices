import { RpcException } from '@nestjs/microservices';

// The body referenced a country that doesn't exist (checked before touching the DB).
export class InvalidCountryIdException extends RpcException {
    constructor(id: number) {
        super({ statusCode: 400, error: 'INVALID_COUNTRY_ID', message: `Country ${id} does not exist.` });
    }
}
