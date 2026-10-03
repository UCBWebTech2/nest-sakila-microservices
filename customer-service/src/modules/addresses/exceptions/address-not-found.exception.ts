import { GrpcNotFoundException } from '@nestjs/microservices';

export class AddressNotFoundException extends GrpcNotFoundException {
    constructor() { super('ADDRESS_NOT_FOUND: Address not found.'); }
}
