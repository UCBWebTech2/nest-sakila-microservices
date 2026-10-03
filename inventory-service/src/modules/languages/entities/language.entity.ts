import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('language')
export class Language {
    @PrimaryGeneratedColumn({ name: 'language_id' })
    id: number;

    @Column({ name: 'name', type: 'char', length: 20 })
    name: string;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
