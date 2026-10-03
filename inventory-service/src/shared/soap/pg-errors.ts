import { QueryFailedError } from 'typeorm';

// What Postgres says when a foreign key stops a write. The SQLSTATE alone can't tell the two
// situations apart (23503 is used both for "parent doesn't exist" and, when the FK is NO ACTION,
// for "children still exist"; RESTRICT uses 23001) — but the error's `detail` always spells it out:
//   Key (store_id)=(999) is not present in table "store".            -> missing parent
//   Key (store_id)=(1) is still referenced from table "staff".       -> children still exist
//   Key (country_id)=(110) is referenced from table "city".          -> same, RESTRICT wording
// so the translation reads that, which also names the table — enough to build a code like
// INVALID_STORE_ID for *any* FK in the schema, including ones that point into another microservice.
export interface ReferenceViolation {
    kind:   'missing' | 'referenced';
    /** missing: the parent table the id should exist in. referenced: the child table still pointing here. */
    table?: string;
    /** missing only: the id that wasn't found. */
    value?: string;
}

// payment is split in monthly partitions (payment_p2007_01...): report them as `payment`.
const normalizeTable = (table: string): string => table.replace(/_p\d{4}_\d{2}$/, '');

export function parseReferenceViolation(err: unknown): ReferenceViolation | undefined {
    if (!(err instanceof QueryFailedError)) return undefined;
    const driver = err.driverError as { code?: string; detail?: string } | undefined;
    if (driver?.code !== '23503' && driver?.code !== '23001') return undefined;

    const detail = driver.detail ?? '';
    const missing = /=\((.+?)\) is not present in table "(.+?)"/.exec(detail);
    if (missing) return { kind: 'missing', value: missing[1], table: normalizeTable(missing[2]) };

    const referenced = /is (?:still )?referenced from table "(.+?)"/.exec(detail);
    if (referenced) return { kind: 'referenced', table: normalizeTable(referenced[1]) };

    // No readable detail: fall back to what the SQLSTATE alone implies.
    return { kind: driver.code === '23001' ? 'referenced' : 'missing' };
}

/** 'store' -> 'STORE', 'film_category' -> 'FILM_CATEGORY' (for INVALID_<TABLE>_ID codes). */
export const resourceCode = (table: string): string => table.toUpperCase();

/** 'store' -> 'Store', 'film_category' -> 'Film category'. */
export const resourceLabel = (table: string): string => {
    const text = table.replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};
