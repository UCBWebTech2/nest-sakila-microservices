import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory')
export class Inventory {
    @PrimaryGeneratedColumn({ name: 'inventory_id' })
    id: number;

    @Column({ name: 'film_id', type: 'int' })
    filmId: number;

    // Id of a store row owned by business-service.
    @Column({ name: 'store_id', type: 'int' })
    storeId: number;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
