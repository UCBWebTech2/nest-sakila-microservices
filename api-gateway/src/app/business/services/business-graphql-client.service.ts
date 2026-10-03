import { HttpException, Injectable } from '@nestjs/common';
import { serviceUnavailable } from '../../../shared/utils/rpc-status.js';
import { AppConfig } from '../../../config/services/app.config.js';

interface GraphQLErrorResponse {
    message: string;
    extensions?: { code?: string; statusCode?: number };
}

interface GraphQLResponseBody<T> {
    data?: T;
    errors?: GraphQLErrorResponse[];
}

// Thin GraphQL client for business-service — this gateway never talks to its DB directly, only
// through its GraphQL API. Errors carry the same { code, statusCode } business-service's own
// HttpExceptionFilter puts in `extensions`, so they re-surface here with the same meaning.
@Injectable()
export class BusinessGraphqlClientService {
    constructor(private readonly config: AppConfig) {}

    async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
        let response: Response;
        try {
            response = await fetch(this.config.businessServiceGraphqlUrl, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ query, variables }),
                // fetch has no default deadline: a service that accepts the connection and never
                // answers would hang the request forever.
                signal:  AbortSignal.timeout(10_000),
            });
        } catch {
            throw serviceUnavailable('business');
        }

        const body = (await response.json()) as GraphQLResponseBody<T>;

        if (body.errors?.length) {
            const [{ message, extensions }] = body.errors;
            throw new HttpException(
                { message, error: extensions?.code ?? 'BUSINESS_SERVICE_ERROR' },
                extensions?.statusCode ?? 500,
            );
        }

        return body.data as T;
    }
}
