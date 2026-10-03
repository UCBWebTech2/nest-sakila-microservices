import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customer')
export class Customer {
    @PrimaryGeneratedColumn({ name: 'customer_id' })
    id: number;

    // store lives in business-service — a plain column, no TypeORM relation. The FK to `store` is
    // still in the schema: an unknown store makes Postgres fail and grpcDbError() turns it into
    // INVALID_STORE_ID.
    @Column({ name: 'store_id', type: 'int' })
    storeId: number;

    @Column({ name: 'first_name', type: 'varchar', length: 45 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 45 })
    lastName: string;

    @Column({ name: 'email', type: 'varchar', length: 50, nullable: true })
    email: string | null;

    @Column({ name: 'address_id', type: 'int' })
    addressId: number;

    @Column({ name: 'activebool', type: 'boolean', default: true })
    activebool: boolean;

    // date column: the pg driver returns it as a 'YYYY-MM-DD' string.
    @Column({ name: 'create_date', type: 'date', default: () => 'now()' })
    createDate: string;

    @Column({ name: 'last_update', type: 'timestamp', nullable: true })
    lastUpdate: Date | null;

    // legacy 0/1 flag Sakila keeps next to activebool — kept in sync with it on write.
    @Column({ name: 'active', type: 'int', nullable: true })
    active: number | null;
}
