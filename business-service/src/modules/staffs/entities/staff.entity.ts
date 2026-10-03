import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// `picture` (bytea) is not mapped. `password` is 255 chars here, not the schema's original 40,
// to fit a bcrypt hash (the real column is widened manually — see the project README).
@Entity('staff')
export class Staff {
    @PrimaryGeneratedColumn({ name: 'staff_id' })
    id: number;

    @Column({ name: 'first_name', type: 'varchar', length: 45 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 45 })
    lastName: string;

    // Id of an address row owned by customer-service — no relation across service boundaries.
    @Column({ name: 'address_id', type: 'int' })
    addressId: number;

    @Column({ name: 'email', type: 'varchar', length: 50, nullable: true })
    email: string | null;

    @Column({ name: 'store_id', type: 'int' })
    storeId: number;

    @Column({ name: 'active', type: 'boolean', default: true })
    active: boolean;

    @Column({ name: 'username', type: 'varchar', length: 16 })
    username: string;

    @Column({ name: 'password', type: 'varchar', length: 255 })
    password: string;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
