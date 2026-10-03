import { WsException } from '@nestjs/websockets';

// Same "CODE: message" convention business-service/inventory-service use for their own fault
// shapes (REST error body, SOAP Fault text) — WsException's constructor only takes a single
// value for `message`, so this keeps the error machine-readable for the gateway client without
// inventing a third shape for this one transport.
// https://docs.nestjs.com/websockets/exception-filters
export class WsFault extends WsException {
    constructor(code: string, message: string) {
        super(`${code}: ${message}`);
    }
}

export class InvalidParamsFault extends WsFault {
    constructor(message: string) {
        super('INVALID_PARAMS', message);
    }
}

// A path/identity id the report is about doesn't exist (customer, film, inventory item) — these are
// 404s. Without the check, e.g. get_customer_balance() on a nonexistent customer just answers 0.00
// and film_in_stock() answers [], indistinguishable from a real customer with no balance.
export class NotFoundFault extends WsFault {
    constructor(resource: string, id: number) {
        super(`${resource.toUpperCase()}_NOT_FOUND`, `${resource} ${id} not found.`);
    }
}

// A reference passed as a query param (store of a stock query) that doesn't exist — a 400, same
// as an id inside a body in the other services.
export class InvalidIdFault extends WsFault {
    constructor(resource: string, id: number) {
        super(`INVALID_${resource.toUpperCase()}_ID`, `${resource} ${id} does not exist.`);
    }
}

export class InternalFault extends WsFault {
    constructor() {
        super('INTERNAL_SERVER_ERROR', 'Internal server error.');
    }
}
