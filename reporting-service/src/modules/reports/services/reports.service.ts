import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InvalidIdFault, InvalidParamsFault, NotFoundFault } from '../../../shared/ws/ws-fault.js';
import { PaginationArgs, PaginationMeta, buildMeta, normalizePagination } from '../../../shared/ws/pagination.js';

export interface PaginatedReport<T> {
    data: T[];
    meta: PaginationMeta;
}

// Sakila's get_customer_balance() can't run on Postgres as shipped: it calls IF(cond, a, b) as an
// expression (MySQL syntax; Postgres only has IF as a PL/pgSQL statement) and sums an INTERVAL
// into an INTEGER. The schema is kept exactly as the official dump (the ecosystem's only schema
// change is staff.password), so the same business logic — rental fees + $1 per overdue day -
// payments made, per the original function's own comments — is expressed here as a plain query,
// with CASE WHEN and EXTRACT(DAY ...). Verified equal to the corrected function for all 599
// customers at several dates.
const CUSTOMER_BALANCE_SQL = `
    SELECT (
        COALESCE((SELECT SUM(f.rental_rate)
                  FROM rental r
                  JOIN inventory i ON i.inventory_id = r.inventory_id
                  JOIN film f ON f.film_id = i.film_id
                  WHERE r.rental_date <= $2::timestamp AND r.customer_id = $1), 0)
      + COALESCE((SELECT SUM(CASE WHEN (r.return_date - r.rental_date) > (f.rental_duration * '1 day'::interval)
                                  THEN EXTRACT(DAY FROM (r.return_date - r.rental_date) - (f.rental_duration * '1 day'::interval))::integer
                                  ELSE 0 END)
                  FROM rental r
                  JOIN inventory i ON i.inventory_id = r.inventory_id
                  JOIN film f ON f.film_id = i.film_id
                  WHERE r.rental_date <= $2::timestamp AND r.customer_id = $1), 0)
      - COALESCE((SELECT SUM(p.amount)
                  FROM payment p
                  WHERE p.payment_date <= $2::timestamp AND p.customer_id = $1), 0)
    ) AS balance`;

// These 7 views and 6 functions already exist in the shared Sakila schema — this service never
// defines or owns their SQL, it only reads from them (same spirit as every other microservice
// here not owning the schema). Several of them join across tables that belong to *other*
// microservices (customer, inventory, business) — that's fine specifically because the join
// itself is baked into a pre-existing Postgres view/function, not something this service's own
// code joins across service boundaries to build.
@Injectable()
export class ReportsService {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {}

    // Views have no natural "id" column in common (film_list uses `fid`, sales_by_store has none
    // at all) — `ORDER BY 1` (positional) keeps LIMIT/OFFSET pagination stable across all of them
    // without hard-coding a different column name per view.
    private async paginateView<T>(viewName: string, args: PaginationArgs): Promise<PaginatedReport<T>> {
        const { page, limit } = normalizePagination(args);
        const offset = (page - 1) * limit;

        const [data, [{ count }]] = await Promise.all([
            this.dataSource.query(`SELECT * FROM ${viewName} ORDER BY 1 LIMIT $1 OFFSET $2`, [limit, offset]),
            this.dataSource.query(`SELECT COUNT(*) FROM ${viewName}`),
        ]);

        return { data, meta: buildMeta(page, limit, Number(count)) };
    }

    // -- Views ----------------------------------------------------------------
    async getActorInfo(args: PaginationArgs) {
        return this.paginateView('actor_info', args);
    }

    async getCustomerList(args: PaginationArgs) {
        return this.paginateView('customer_list', args);
    }

    async getFilmList(args: PaginationArgs) {
        return this.paginateView('film_list', args);
    }

    async getNicerButSlowerFilmList(args: PaginationArgs) {
        return this.paginateView('nicer_but_slower_film_list', args);
    }

    async getSalesByFilmCategory(args: PaginationArgs) {
        return this.paginateView('sales_by_film_category', args);
    }

    async getSalesByStore(args: PaginationArgs) {
        return this.paginateView('sales_by_store', args);
    }

    async getStaffList(args: PaginationArgs) {
        return this.paginateView('staff_list', args);
    }

    // -- Functions --------------------------------------------------------------
    // film_in_stock/film_not_in_stock return rows shaped { p_film_count: inventoryId } — that's
    // the function's OUT parameter name verbatim, not a meaningful column (it's actually an
    // inventory id, not a count — a naming leftover from upstream Sakila). Flattened to a plain
    // number[] here so no caller has to know about that quirk.
    async getFilmInStock(filmId: number, storeId: number): Promise<number[]> {
        this.assertPositiveInt(filmId, 'filmId');
        this.assertPositiveInt(storeId, 'storeId');
        await this.assertFilmAndStoreExist(filmId, storeId);
        const rows = await this.dataSource.query('SELECT * FROM film_in_stock($1, $2)', [filmId, storeId]);
        return rows.map((row: { p_film_count: number }) => row.p_film_count);
    }

    async getFilmNotInStock(filmId: number, storeId: number): Promise<number[]> {
        this.assertPositiveInt(filmId, 'filmId');
        this.assertPositiveInt(storeId, 'storeId');
        await this.assertFilmAndStoreExist(filmId, storeId);
        const rows = await this.dataSource.query('SELECT * FROM film_not_in_stock($1, $2)', [filmId, storeId]);
        return rows.map((row: { p_film_count: number }) => row.p_film_count);
    }

    async getCustomerBalance(customerId: number, effectiveDate: string) {
        this.assertPositiveInt(customerId, 'customerId');
        await this.assertExists('customer', 'customer_id', customerId, () => new NotFoundFault('Customer', customerId));
        const [row] = await this.dataSource.query(CUSTOMER_BALANCE_SQL, [customerId, effectiveDate]);
        return row;
    }

    async getInventoryHeldByCustomer(inventoryId: number) {
        this.assertPositiveInt(inventoryId, 'inventoryId');
        await this.assertExists('inventory', 'inventory_id', inventoryId, () => new NotFoundFault('Inventory', inventoryId));
        const [row] = await this.dataSource.query(
            'SELECT inventory_held_by_customer($1) AS "customerId"',
            [inventoryId],
        );
        return row;
    }

    async getInventoryInStock(inventoryId: number) {
        this.assertPositiveInt(inventoryId, 'inventoryId');
        await this.assertExists('inventory', 'inventory_id', inventoryId, () => new NotFoundFault('Inventory', inventoryId));
        const [row] = await this.dataSource.query(
            'SELECT inventory_in_stock($1) AS "inStock"',
            [inventoryId],
        );
        return row;
    }

    async getRewardsReport(minMonthlyPurchases: number, minDollarAmountPurchased: string) {
        this.assertPositiveInt(minMonthlyPurchases, 'minMonthlyPurchases');
        return await this.dataSource.query(
            'SELECT * FROM rewards_report($1, $2)',
            [minMonthlyPurchases, minDollarAmountPurchased],
        );
    }

    // This service has no entities, so existence is a plain SELECT 1. The tables belong to other
    // microservices, but reading them is what every view/function here already does; table and
    // column names below are hard-coded literals, never user input.
    private async assertExists(table: string, column: string, id: number, fault: () => Error): Promise<void> {
        const rows = await this.dataSource.query(`SELECT 1 FROM ${table} WHERE ${column} = $1`, [id]);
        if (rows.length === 0) throw fault();
    }

    // The film is the thing being asked about (404 if absent); the store is a filter the caller
    // chose (400 if it doesn't exist).
    private async assertFilmAndStoreExist(filmId: number, storeId: number): Promise<void> {
        await this.assertExists('film', 'film_id', filmId, () => new NotFoundFault('Film', filmId));
        await this.assertExists('store', 'store_id', storeId, () => new InvalidIdFault('Store', storeId));
    }

    private assertPositiveInt(value: number, field: string): void {
        if (!Number.isInteger(value) || value <= 0) {
            throw new InvalidParamsFault(`${field} must be a positive integer.`);
        }
    }
}
