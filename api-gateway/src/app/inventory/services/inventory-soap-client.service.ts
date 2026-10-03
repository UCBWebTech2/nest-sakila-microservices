import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as soap from 'soap';
import { AppConfig } from '../../../config/services/app.config.js';
import { serviceUnavailable, statusForDomainCode } from '../../../shared/utils/rpc-status.js';

// SOAP faults don't carry an HTTP status over the wire (only Code/Reason survive serialization —
// a custom `statusCode` property on the thrown fault object gets silently dropped, confirmed
// empirically against the real inventory-service), so the status is rebuilt here from the error
// code — see statusForDomainCode.

// Thin SOAP client for inventory-service — this gateway never talks to its DB directly, only
// through its WSDL. Mirrors BusinessGraphqlClientService's role for business-service, one layer
// down: a single place that knows how to call the other protocol and translate its errors.
@Injectable()
export class InventorySoapClientService {
    private client: soap.Client | null = null;

    constructor(private readonly config: AppConfig) {}

    private async getClient(): Promise<soap.Client> {
        if (!this.client) {
            // inventory-service's WSDL always advertises `<soap:address location="http://localhost:3003/soap"/>`
            // — correct when both run on the host machine, wrong once they're separate Docker
            // containers (that "localhost" would mean the gateway's own container). `endpoint`
            // overrides whatever address the WSDL embeds with where this gateway actually reaches
            // it — confirmed necessary by this exact failure running both over the ecosystem's
            // docker-compose.
            this.client = await soap.createClientAsync(this.config.inventoryServiceWsdlUrl, {
                endpoint: this.config.inventoryServiceWsdlUrl.replace(/\?wsdl$/, ''),
            });
        }
        return this.client;
    }

    async call<T>(operation: string, args: object): Promise<T> {
        let client: soap.Client;
        try {
            client = await this.getClient();
        } catch {
            // The WSDL itself couldn't be fetched: the service is down.
            throw serviceUnavailable('inventory');
        }
        const method = client[`${operation}Async`] as ((args: unknown) => Promise<[T, ...unknown[]]>) | undefined;

        if (!method) {
            throw new InternalServerErrorException({
                message: `Unknown SOAP operation: ${operation}.`,
                error:   'INVENTORY_SERVICE_ERROR',
            });
        }

        try {
            const [result] = await method.call(client, args, { timeout: 10_000 });
            return result;
        } catch (err) {
            throw this.toHttpException(err);
        }
    }

    private toHttpException(err: unknown): HttpException {
        const fault = (err as { root?: { Envelope?: { Body?: { Fault?: { Reason?: { Text?: string } } } } } })
            ?.root?.Envelope?.Body?.Fault;

        if (!fault?.Reason?.Text) {
            // No SOAP Fault came back at all: connection refused, reset or timed out.
            return serviceUnavailable('inventory');
        }

        // Faults are always sent as "CODE: message" — see inventory-service's SoapFault.
        const [code, ...rest] = fault.Reason.Text.split(': ');
        const message = rest.join(': ') || fault.Reason.Text;

        return new HttpException({ message, error: code }, statusForDomainCode(code));
    }
}
