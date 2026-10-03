import {
    ExceptionFilter, Catch, ArgumentsHost,
    HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { GraphQLError } from 'graphql';
import { parseReferenceViolation, resourceCode, resourceLabel } from '../utils/pg-errors.util.js';

// Postgres error code this filter translates itself (foreign keys go through parseReferenceViolation) —
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_UNIQUE_VIOLATION = '23505';

// Normalizes every exception (HttpException AND uncaught ones, e.g. a TypeORM QueryFailedError)
// to a consistent error for both transports this app serves: REST (health) and GraphQL (every
// domain module). For REST: { statusCode, error, message, path, timestamp } written to the
// response. For GraphQL: returning a plain object here does NOT surface as a GraphQL error —
// graphql-js treats a non-Error return value as a successful (null) result and then fails on its
// own non-nullable-field check instead, hiding the real cause. A GraphQLError must be returned
// instead; `error`/`statusCode` still travel in `extensions` so clients can branch on them.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const { status, errorCode, message } = this.resolve(exception);

        if (host.getType<'graphql'>() === 'graphql') {
            if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
                this.logger.error('[GraphQL]', (exception as Error)?.stack);
            }
            return new GraphQLError(message, { extensions: { code: errorCode, statusCode: status } });
        }

        const ctx      = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request  = ctx.getRequest<Request>();

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`[${request.method}] ${request.url} → ${status}`, (exception as Error)?.stack);
        }

        response.status(status).json({
            statusCode: status,
            error:      errorCode,
            message,
            path:       request.url,
            timestamp:  new Date().toISOString(),
        });
    }

    private resolve(exception: unknown): { status: number; errorCode: string; message: string } {
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const body   = exception.getResponse();
            const message = typeof body === 'string' ? body : ((body as any).message ?? exception.message);

            // Domain error codes (e.g. USER_NOT_FOUND) take priority over generic HTTP codes.
            // This lets clients distinguish between multiple 404s without parsing messages.
            const domainError = typeof body === 'object' ? (body as any).error : undefined;
            return { status, errorCode: domainError ?? this.statusToCode(status), message };
        }

        if (exception instanceof QueryFailedError) {
            // The schema is the official Sakila one, FKs included — also the ones that point into
            // another microservice's tables (staff.address_id, rental.customer_id, ...), which no
            // service here can pre-check. Postgres is the arbiter; this turns its answer into the
            // same codes the explicit checks use. See shared/utils/pg-errors.util.ts.
            const reference = parseReferenceViolation(exception);
            if (reference?.kind === 'missing') {
                return reference.table
                    ? {
                        status:    HttpStatus.BAD_REQUEST,
                        errorCode: `INVALID_${resourceCode(reference.table)}_ID`,
                        message:   `${resourceLabel(reference.table)} ${reference.value} does not exist.`,
                    }
                    : { status: HttpStatus.BAD_REQUEST, errorCode: 'INVALID_REFERENCE', message: 'One of the referenced ids does not exist.' };
            }
            if (reference?.kind === 'referenced') {
                return {
                    status:    HttpStatus.CONFLICT,
                    errorCode: 'STILL_REFERENCED',
                    message:   reference.table
                        ? `Cannot delete: it is still referenced by ${reference.table} records.`
                        : 'Cannot delete: other records still reference it.',
                };
            }

            const code = (exception as unknown as { driverError?: { code?: string } }).driverError?.code;
            if (code === PG_UNIQUE_VIOLATION) {
                return {
                    status:    HttpStatus.CONFLICT,
                    errorCode: 'ALREADY_EXISTS',
                    message:   'A record with that value already exists.',
                };
            }
        }

        return {
            status:    HttpStatus.INTERNAL_SERVER_ERROR,
            errorCode: 'INTERNAL_SERVER_ERROR',
            message:   'Internal server error.',
        };
    }

    private statusToCode(status: number): string {
        const map: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_SERVER_ERROR',
        };
        return map[status] ?? 'HTTP_ERROR';
    }
}
