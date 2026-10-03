import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { fromRmqError } from '../utils/rpc-error.js';

export const CUSTOMER_RMQ_CLIENT = 'CUSTOMER_RMQ_CLIENT';

// With a broker in the middle, a request to a dead consumer is not refused — it just sits in the
// queue. So every call gets a deadline instead of waiting forever.
const REQUEST_TIMEOUT_MS = 5000;

// Thin RabbitMQ client for customer-service's cities + countries (request-response via `send`).
@Injectable()
export class CustomerRmqClientService {
    constructor(@Inject(CUSTOMER_RMQ_CLIENT) private readonly client: ClientProxy) {}

    async send<T>(pattern: string, data: object): Promise<T> {
        try {
            return await firstValueFrom(this.client.send<T>(pattern, data).pipe(timeout(REQUEST_TIMEOUT_MS)));
        } catch (err) {
            throw fromRmqError(err);
        }
    }
}
