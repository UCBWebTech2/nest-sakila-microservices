import { RpcException } from '@nestjs/microservices';
import { parseReferenceViolation, resourceCode, resourceLabel } from './pg-errors.js';

// Over RabbitMQ the error object passed to RpcException travels back to the caller as-is, so it
// can carry the same { statusCode, error, message } shape as the HTTP services.

/**
 * Postgres foreign-key error -> RpcException; anything else is returned untouched, to be rethrown.
 * Same translation as grpcDbError, in this transport's shape: INVALID_<TABLE>_ID (400) when a
 * referenced row is missing, STILL_REFERENCED (409) when deleting something still pointed at.
 */
export function rmqDbError(err: unknown): unknown {
    const reference = parseReferenceViolation(err);
    if (!reference) return err;

    if (reference.kind === 'missing') {
        return new RpcException(reference.table
            ? { statusCode: 400, error: `INVALID_${resourceCode(reference.table)}_ID`, message: `${resourceLabel(reference.table)} ${reference.value} does not exist.` }
            : { statusCode: 400, error: 'INVALID_REFERENCE', message: 'One of the referenced ids does not exist.' });
    }
    return new RpcException({
        statusCode: 409,
        error:      'STILL_REFERENCED',
        message:    reference.table ? `Cannot delete: it is still referenced by ${reference.table} records.` : 'Cannot delete: other records still reference it.',
    });
}
