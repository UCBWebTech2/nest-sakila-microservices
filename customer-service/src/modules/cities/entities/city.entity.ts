import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('city')
export class City {
    @PrimaryGeneratedColumn({ name: 'city_id' })
    id: number;

    @Column({ name: 'city', type: 'varchar', length: 50 })
    city: string;

    @Column({ name: 'country_id', type: 'int' })
    countryId: number;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
