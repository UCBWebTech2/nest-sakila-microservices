import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * HTTP status for a domain error code that arrived over a protocol with no status of its own
 * (a SOAP Fault's Reason text, a WebSocket exception message). The microservices share one
 * vocabulary, so the code alone is enough:
 *   *_NOT_FOUND            404   a path id doesn't exist
 *   INVALID_*              400   INVALID_REFERENCE, INVALID_PARAMS, INVALID_STORE_ID, ...
 *   MISSING_FIELD          400
 *   STILL_REFERENCED       409
 *   *_ALREADY_EXISTS       409
 * anything else is treated as an unexpected failure (500).
 */
export function statusForDomainCode(code: string): number {
    if (code.endsWith('_NOT_FOUND')) return HttpStatus.NOT_FOUND;
    if (code.startsWith('INVALID_') || code === 'MISSING_FIELD') return HttpStatus.BAD_REQUEST;
    if (code === 'STILL_REFERENCED' || code.endsWith('ALREADY_EXISTS')) return HttpStatus.CONFLICT;
    return HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * 503 for "that microservice isn't answering" (down, refused, timed out) — a different thing from
 * the microservice answering with an error, and one the caller can retry. `service` is the
 * lower-case name used in the error code: 'business' -> BUSINESS_SERVICE_UNAVAILABLE.
 */
export function serviceUnavailable(service: string): HttpException {
    return new HttpException(
        { message: `${service}-service is not reachable.`, error: `${service.toUpperCase()}_SERVICE_UNAVAILABLE` },
        HttpStatus.SERVICE_UNAVAILABLE,
    );
}
