import { GrpcFailedPreconditionException, GrpcInvalidArgumentException } from '@nestjs/microservices';
import { parseReferenceViolation, resourceCode, resourceLabel } from './pg-errors.js';

// gRPC errors only carry a status code + one message string — no room for a separate domain code
// like the HTTP services' `error` field. So the message is "<DOMAIN_CODE>: <human text>", and
// api-gateway splits it back apart (see app/customer/utils/rpc-error.ts there).

/**
 * Postgres foreign-key error -> gRPC exception; anything else is returned untouched, to be rethrown.
 * The schema is the official Sakila one, FKs included — also store_id (customer.store_id -> store,
 * a table of business-service), which this service can't pre-check. Postgres is the arbiter and its
 * error names the table: INVALID_<TABLE>_ID (INVALID_ARGUMENT) when a referenced row is missing,
 * STILL_REFERENCED (FAILED_PRECONDITION) when deleting something other rows still point at.
 */
export function grpcDbError(err: unknown): unknown {
    const reference = parseReferenceViolation(err);
    if (!reference) return err;

    if (reference.kind === 'missing') {
        return reference.table
            ? new GrpcInvalidArgumentException(`INVALID_${resourceCode(reference.table)}_ID: ${resourceLabel(reference.table)} ${reference.value} does not exist.`)
            : new GrpcInvalidArgumentException('INVALID_REFERENCE: One of the referenced ids does not exist.');
    }
    return new GrpcFailedPreconditionException(reference.table
        ? `STILL_REFERENCED: Cannot delete: it is still referenced by ${reference.table} records.`
        : 'STILL_REFERENCED: Cannot delete: other records still reference it.');
}

