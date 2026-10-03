import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('address')
export class Address {
    @PrimaryGeneratedColumn({ name: 'address_id' })
    id: number;

    @Column({ name: 'address', type: 'varchar', length: 50 })
    address: string;

    @Column({ name: 'address2', type: 'varchar', length: 50, nullable: true })
    address2: string | null;

    @Column({ name: 'district', type: 'varchar', length: 20 })
    district: string;

    // city lives in this same service, but stays a plain column like every other FK here.
    @Column({ name: 'city_id', type: 'int' })
    cityId: number;

    @Column({ name: 'postal_code', type: 'varchar', length: 10, nullable: true })
    postalCode: string | null;

    @Column({ name: 'phone', type: 'varchar', length: 20 })
    phone: string;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
