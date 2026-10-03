import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rental')
export class Rental {
    @PrimaryGeneratedColumn({ name: 'rental_id' })
    id: number;

    @Column({ name: 'rental_date', type: 'timestamp' })
    rentalDate: Date;

    // Id of an inventory row owned by inventory-service.
    @Column({ name: 'inventory_id', type: 'int' })
    inventoryId: number;

    // Id of a customer row owned by customer-service.
    @Column({ name: 'customer_id', type: 'int' })
    customerId: number;

    @Column({ name: 'return_date', type: 'timestamp', nullable: true })
    returnDate: Date | null;

    @Column({ name: 'staff_id', type: 'int' })
    staffId: number;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
