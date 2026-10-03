import { QueryFailedError } from 'typeorm';
import { InternalFault, InvalidIdFault, InvalidReferenceFault, MissingFieldFault, SoapFault, StillReferencedFault } from './soap-fault.js';
import { parseReferenceViolation } from './pg-errors.js';

// SQLSTATE 23502 = not-null violation. SOAP args arrive unvalidated (no ValidationPipe), so it's
// realistic here.
const PG_NOT_NULL_VIOLATION = '23502';

export function resolveFault(exception: unknown): SoapFault {
    if (exception instanceof SoapFault) return exception;

    // The schema is the official Sakila one, FKs included — also the ones into another
    // microservice's tables (inventory.store_id), which this service can't pre-check. Postgres is
    // the arbiter; its error names the table, which is turned into INVALID_<TABLE>_ID.
    const reference = parseReferenceViolation(exception);
    if (reference?.kind === 'missing') {
        return reference.table ? new InvalidIdFault(reference.table.replace(/_/g, ' '), reference.value ?? '') : new InvalidReferenceFault();
    }
    if (reference?.kind === 'referenced') return new StillReferencedFault(reference.table);

    if (exception instanceof QueryFailedError) {
        const code = (exception as unknown as { driverError?: { code?: string } }).driverError?.code;
        if (code === PG_NOT_NULL_VIOLATION) return new MissingFieldFault();
    }

    return new InternalFault();
}
