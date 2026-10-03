import { GrpcNotFoundException } from '@nestjs/microservices';

export class CustomerNotFoundException extends GrpcNotFoundException {
    constructor() { super('CUSTOMER_NOT_FOUND: Customer not found.'); }
}
