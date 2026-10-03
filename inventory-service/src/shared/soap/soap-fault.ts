// SOAP has no HTTP-style exception hierarchy — this is the equivalent of the exception classes
// used in the REST/GraphQL microservices (same spirit: a code + message + status), shaped the
// way the `soap` package expects a thrown fault: { Fault: { Code, Reason, statusCode } }.
// https://www.npmjs.com/package/soap#error-handling
export class SoapFault extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
    }

    toFaultObject() {
        return {
            Fault: {
                Code:       { Value: 'soap:Sender' },
                Reason:     { Text: `${this.code}: ${this.message}` },
                statusCode: this.statusCode,
            },
        };
    }
}

export class NotFoundFault extends SoapFault {
    constructor(resource: string) {
        super(`${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found.`, 404);
    }
}

export class StillReferencedFault extends SoapFault {
    constructor(table?: string) {
        super('STILL_REFERENCED', table
            ? `Cannot delete: it is still referenced by ${table} records.`
            : 'Cannot delete: other records still reference it.', 409);
    }
}

// The input pointed at a record that doesn't exist: INVALID_<RESOURCE>_ID, with the id in the
// message, so the caller learns *which* reference is wrong. Thrown by the explicit checks (same
// service) and by resolveFault() from Postgres's own FK error (any FK, including ones into
// another microservice's tables).
export class InvalidIdFault extends SoapFault {
    constructor(resource: string, id: number | string) {
        super(`INVALID_${resource.toUpperCase().replace(/ /g, '_')}_ID`, `${resource.charAt(0).toUpperCase()}${resource.slice(1)} ${id} does not exist.`, 400);
    }
}

export class InvalidReferenceFault extends SoapFault {
    constructor() {
        super('INVALID_REFERENCE', 'One of the referenced ids does not exist.', 400);
    }
}

export class MissingFieldFault extends SoapFault {
    constructor() {
        super('MISSING_FIELD', 'A required field is missing.', 400);
    }
}

export class InternalFault extends SoapFault {
    constructor() {
        super('INTERNAL_SERVER_ERROR', 'Internal server error.', 500);
    }
}
