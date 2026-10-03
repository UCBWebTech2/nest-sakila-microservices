import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('category')
export class Category {
    @PrimaryGeneratedColumn({ name: 'category_id' })
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 25 })
    name: string;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
