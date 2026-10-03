import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('country')
export class Country {
    @PrimaryGeneratedColumn({ name: 'country_id' })
    id: number;

    @Column({ name: 'country', type: 'varchar', length: 50 })
    country: string;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
