import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// `fulltext` (tsvector, search index) and `special_features` (text[]) are not mapped.
@Entity('film')
export class Film {
    @PrimaryGeneratedColumn({ name: 'film_id' })
    id: number;

    @Column({ name: 'title', type: 'varchar', length: 255 })
    title: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'release_year', type: 'int', nullable: true })
    releaseYear: number | null;

    @Column({ name: 'language_id', type: 'int' })
    languageId: number;

    @Column({ name: 'original_language_id', type: 'int', nullable: true })
    originalLanguageId: number | null;

    @Column({ name: 'rental_duration', type: 'int' })
    rentalDuration: number;

    @Column({ name: 'rental_rate', type: 'numeric', precision: 4, scale: 2 })
    rentalRate: string;

    @Column({ name: 'length', type: 'int', nullable: true })
    length: number | null;

    @Column({ name: 'replacement_cost', type: 'numeric', precision: 5, scale: 2 })
    replacementCost: string;

    @Column({ name: 'rating', type: 'varchar', nullable: true })
    rating: string | null;

    @Column({ name: 'last_update', type: 'timestamp' })
    lastUpdate: Date;
}
