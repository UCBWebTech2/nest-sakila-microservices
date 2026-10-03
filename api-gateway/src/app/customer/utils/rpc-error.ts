import { HttpException, HttpStatus } from '@nestjs/common';
import { TimeoutError } from 'rxjs';
import { serviceUnavailable } from '../../../shared/utils/rpc-status.js';

// gRPC status codes (grpc-js `status` enum) that customer-service uses, and what they mean over HTTP.
const HTTP_BY_GRPC_CODE: Record<number, number> = {
    3:  HttpStatus.BAD_REQUEST,          // INVALID_ARGUMENT
    5:  HttpStatus.NOT_FOUND,            // NOT_FOUND
    6:  HttpStatus.CONFLICT,             // ALREADY_EXISTS
    9:  HttpStatus.CONFLICT,             // FAILED_PRECONDITION
    14: HttpStatus.SERVICE_UNAVAILABLE,  // UNAVAILABLE
};

function unknownError(): HttpException {
    return new HttpException(
        { message: 'Unexpected error from customer-service.', error: 'CUSTOMER_SERVICE_ERROR' },
        HttpStatus.INTERNAL_SERVER_ERROR,
    );
}

/**
 * gRPC error -> HttpException. customer-service puts "<DOMAIN_CODE>: <human text>" in the gRPC
 * message (a gRPC error has no separate field for the domain code), which arrives in `details`.
 */
export function fromGrpcError(err: unknown): HttpException {
    if (err instanceof TimeoutError) return serviceUnavailable('customer');

    const e = err as { code?: number; details?: string };
    if (typeof e?.code !== 'number') return unknownError();

    const status = HTTP_BY_GRPC_CODE[e.code];
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return serviceUnavailable('customer');
    if (!status) return unknownError();

    const match = /^([A-Z][A-Z_]*): (.*)$/s.exec(e.details ?? '');
    return new HttpException(
        match ? { error: match[1], message: match[2] } : { error: 'CUSTOMER_SERVICE_ERROR', message: e.details ?? '' },
        status,
    );
}

/**
 * RabbitMQ error -> HttpException. customer-service's RpcExceptions carry { statusCode, error,
 * message } and arrive unchanged; anything else Nest produced itself ({ status: 'error', message })
 * is an unexpected failure there.
 */
export function fromRmqError(err: unknown): HttpException {
    if (err instanceof TimeoutError) return serviceUnavailable('customer');

    const e = err as { statusCode?: number; error?: string; message?: string };
    if (typeof e?.statusCode === 'number' && typeof e.error === 'string') {
        return new HttpException({ error: e.error, message: e.message }, e.statusCode);
    }
    return unknownError();
}
