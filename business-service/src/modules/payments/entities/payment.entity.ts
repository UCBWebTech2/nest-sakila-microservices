import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payment')
export class Payment {
    @PrimaryGeneratedColumn({ name: 'payment_id' })
    id: number;

    // Id of a customer row owned by customer-service.
    @Column({ name: 'customer_id', type: 'int' })
    customerId: number;

    @Column({ name: 'staff_id', type: 'int' })
    staffId: number;

    @Column({ name: 'rental_id', type: 'int' })
    rentalId: number;

    @Column({ name: 'amount', type: 'numeric', precision: 5, scale: 2 })
    amount: string;

    @Column({ name: 'payment_date', type: 'timestamp' })
    paymentDate: Date;
}
