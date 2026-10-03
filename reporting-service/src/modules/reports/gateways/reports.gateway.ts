import { Logger } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ReportsService } from '../services/reports.service.js';
import type { PaginationArgs } from '../../../shared/ws/pagination.js';
import { InternalFault, WsFault } from '../../../shared/ws/ws-fault.js';

// Read before class definition — the decorator needs the value at class-evaluation time,
// same reasoning as the scaffold's original plugins/socket/socket.gateway.ts.
const NAMESPACE = process.env.WEBSOCKET_NAMESPACE ?? 'reports';

// All 13 reports (7 views + 6 functions) live on one gateway — they're all read-only, all the
// same domain ("Views"), and none of them need their own connection/room logic, so splitting
// into several gateways would just be ceremony. Returning a plain value from a @SubscribeMessage
// handler sends it back as the acknowledgement to the call that triggered it — see
// https://docs.nestjs.com/websockets/gateways#multiple-responses
@WebSocketGateway({ cors: { origin: '*' }, namespace: NAMESPACE })
export class ReportsGateway {
    private readonly logger = new Logger(ReportsGateway.name);

    constructor(private readonly reports: ReportsService) {}

    @SubscribeMessage('getActorInfo')
    async getActorInfo(@MessageBody() args: PaginationArgs) {
        return this.run(() => this.reports.getActorInfo(args));
    }

    @SubscribeMessage('getCustomerList')
    async getCustomerList(@MessageBody() args: PaginationArgs) {
        return this.run(() => this.reports.getCustomerList(args));
    }

    @SubscribeMessage('getFilmList')
    async getFilmList(@MessageBody() args: PaginationArgs) {
        return this.run(() => this.reports.getFilmList(args));
    }

    @SubscribeMessage('getNicerButSlowerFilmList')
    async getNicerButSlowerFilmList(@MessageBody() args: PaginationArgs) {
        return this.run(() => this.reports.getNicerButSlowerFilmList(args));
    }

    @SubscribeMessage('getSalesByFilmCategory')
    async getSalesByFilmCategory(@MessageBody() args: PaginationArgs) {
        return this.run(() => this.reports.getSalesByFilmCategory(args));
    }

    @SubscribeMessage('getSalesByStore')
    async getSalesByStore(@MessageBody() args: PaginationArgs) {
        return this.run(() => this.reports.getSalesByStore(args));
    }

    @SubscribeMessage('getStaffList')
    async getStaffList(@MessageBody() args: PaginationArgs) {
        return this.run(() => this.reports.getStaffList(args));
    }

    @SubscribeMessage('getFilmInStock')
    async getFilmInStock(@MessageBody() args: { filmId: number; storeId: number }) {
        return this.run(() => this.reports.getFilmInStock(args?.filmId, args?.storeId));
    }

    @SubscribeMessage('getFilmNotInStock')
    async getFilmNotInStock(@MessageBody() args: { filmId: number; storeId: number }) {
        return this.run(() => this.reports.getFilmNotInStock(args?.filmId, args?.storeId));
    }

    @SubscribeMessage('getCustomerBalance')
    async getCustomerBalance(@MessageBody() args: { customerId: number; effectiveDate: string }) {
        return this.run(() => this.reports.getCustomerBalance(args?.customerId, args?.effectiveDate));
    }

    @SubscribeMessage('getInventoryHeldByCustomer')
    async getInventoryHeldByCustomer(@MessageBody() args: { inventoryId: number }) {
        return this.run(() => this.reports.getInventoryHeldByCustomer(args?.inventoryId));
    }

    @SubscribeMessage('getInventoryInStock')
    async getInventoryInStock(@MessageBody() args: { inventoryId: number }) {
        return this.run(() => this.reports.getInventoryInStock(args?.inventoryId));
    }

    @SubscribeMessage('getRewardsReport')
    async getRewardsReport(@MessageBody() args: { minMonthlyPurchases: number; minDollarAmountPurchased: string }) {
        return this.run(() => this.reports.getRewardsReport(args?.minMonthlyPurchases, args?.minDollarAmountPurchased));
    }

    // WsFault (and subclasses, e.g. InvalidParamsFault) pass through as-is — anything else
    // (a raw Postgres error, say) gets logged and replaced with a generic InternalFault so the
    // client never sees a raw stack trace or query text.
    private async run<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (err) {
            if (err instanceof WsFault) throw err;
            this.logger.error('Unhandled error in a report handler', (err as Error)?.stack);
            throw new InternalFault();
        }
    }
}
