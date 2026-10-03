import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom, timeout } from 'rxjs';
import { fromGrpcError } from '../utils/rpc-error.js';

export const CUSTOMER_GRPC_CLIENT = 'CUSTOMER_GRPC_CLIENT';

// Mirrors the two services in proto/customer.proto. Method names are the rpc names, lower-cased
// first letter (that's how @nestjs/microservices exposes them on the object getService() returns).
interface GrpcCrudService {
    list(data: { page: number; limit: number }): Observable<unknown>;
    findOne(data: { id: number }): Observable<unknown>;
    create(data: object): Observable<unknown>;
    update(data: object): Observable<unknown>;
    remove(data: { id: number }): Observable<unknown>;
}

// grpc-js keeps retrying to connect to an unreachable server with its own exponential backoff (a
// first call against a stopped customer-service took ~70s to fail), so every call gets a deadline.
const REQUEST_TIMEOUT_MS = 5000;

type Resource = 'customers' | 'addresses';

// Thin gRPC client for customer-service's customers + addresses. Counterpart of
// InventorySoapClientService / BusinessGraphqlClientService: the one place that knows how to speak
// this protocol and translate its errors into HTTP ones.
@Injectable()
export class CustomerGrpcClientService implements OnModuleInit {
    private services: Record<Resource, GrpcCrudService>;

    constructor(@Inject(CUSTOMER_GRPC_CLIENT) private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.services = {
            customers: this.client.getService<GrpcCrudService>('CustomersService'),
            addresses: this.client.getService<GrpcCrudService>('AddressesService'),
        };
    }

    async call<T>(resource: Resource, method: keyof GrpcCrudService, data: object): Promise<T> {
        try {
            const fn = this.services[resource][method] as (d: object) => Observable<T>;
            return await firstValueFrom(fn.call(this.services[resource], data).pipe(timeout(REQUEST_TIMEOUT_MS)));
        } catch (err) {
            throw fromGrpcError(err);
        }
    }
}
