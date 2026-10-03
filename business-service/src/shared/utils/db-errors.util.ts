import { QueryFailedError } from 'typeorm';

// SQLSTATE 23514 = check_violation (here: a payment partition's date-range CHECK).
export function isCheckViolation(err: unknown): boolean {
    return err instanceof QueryFailedError && (err.driverError as { code?: string } | undefined)?.code === '23514';
}
