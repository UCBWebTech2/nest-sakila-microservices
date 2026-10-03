import { HttpException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';
import { AppConfig } from '../../../config/services/app.config.js';
import { serviceUnavailable, statusForDomainCode } from '../../../shared/utils/rpc-status.js';

interface WsExceptionBody {
    status:  string;
    message: string;
    cause?:  { pattern?: string; data?: unknown };
}

const CALL_TIMEOUT_MS = 10_000;

// Thin Socket.io client for reporting-service — this gateway never queries its views/functions
// directly, only over the socket. Mirrors Business/InventoryClientService's role for their own
// protocols.
//
// Critical, non-obvious bit: a thrown WsException on the server does NOT arrive through the ack
// callback — it fires as a separate 'exception' socket event instead (confirmed empirically
// against the real service, see its own decisions.md). So every call has to race the ack against
// a filtered 'exception' listener, not just await the ack.
//
// Known limitation: Nest's default WsException payload only carries the *event name* that
// failed (`cause.pattern`), not a per-call id — two concurrent calls to the *same* event could
// have their exception cross-matched to the wrong one. Acceptable here (teaching project,
// unlikely to matter), not acceptable as-is for a production system with real concurrency.
@Injectable()
export class ReportingSocketClientService implements OnModuleDestroy {
    private socket: Socket | null = null;

    constructor(private readonly config: AppConfig) {}

    private getSocket(): Socket {
        if (!this.socket) {
            this.socket = io(`${this.config.reportingServiceWsUrl}/reports`, { transports: ['websocket'] });
        }
        return this.socket;
    }

    onModuleDestroy(): void {
        this.socket?.close();
    }

    async call<T>(event: string, args: object): Promise<T> {
        const socket = this.getSocket();

        return new Promise<T>((resolve, reject) => {
            let settled = false;

            const onException = (body: WsExceptionBody) => {
                if (settled || body?.cause?.pattern !== event) return;
                settle(() => reject(this.toHttpException(body)));
            };

            // Socket.io buffers emits while disconnected and keeps retrying in the background, so
            // with reporting-service down a call would otherwise sit out the whole timeout.
            // connect_error fires on each failed attempt — fail fast instead.
            const onConnectError = () => settle(() => reject(serviceUnavailable('reporting')));

            const timer = setTimeout(() => settle(() => reject(serviceUnavailable('reporting'))), CALL_TIMEOUT_MS);

            const settle = (fn: () => void) => {
                settled = true;
                clearTimeout(timer);
                socket.off('exception', onException);
                socket.off('connect_error', onConnectError);
                fn();
            };

            socket.on('exception', onException);
            socket.on('connect_error', onConnectError);
            socket.emit(event, args, (response: T) => settle(() => resolve(response)));
        });
    }

    private toHttpException(body: WsExceptionBody): HttpException {
        if (!body?.message) {
            return serviceUnavailable('reporting');
        }

        // Faults are always sent as "CODE: message" — see reporting-service's WsFault.
        const [code, ...rest] = body.message.split(': ');
        const message = rest.join(': ') || body.message;
        return new HttpException({ message, error: code }, statusForDomainCode(code));
    }
}
