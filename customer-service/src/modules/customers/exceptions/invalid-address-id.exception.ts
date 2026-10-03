import { GrpcInvalidArgumentException } from '@nestjs/microservices';

// The body referenced an address that doesn't exist (checked before touching the DB).
export class InvalidAddressIdException extends GrpcInvalidArgumentException {
    constructor(id: number) { super(`INVALID_ADDRESS_ID: Address ${id} does not exist.`); }
}
