import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('store')
export class Store {
    @PrimaryGeneratedColumn({ name: 'store_id' })
    id: number;

    // Id of a staff row owned by this same service — still a plain column (no TypeORM relation, by convention in this ecosystem).
    @Column({ name: 'manager_staff_id', type: 'int' })
    managerStaffId: number;

    // Id of an address row owned by customer-service.
    @Column({ name: 'address_id', type: 'int' })
    addressId: number;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
