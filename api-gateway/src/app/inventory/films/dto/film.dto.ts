import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilmDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'ACADEMY DINOSAUR' })
    title: string;

    @ApiPropertyOptional({ example: 'A Epic Drama of a Feminist...', nullable: true })
    description?: string;

    @ApiPropertyOptional({ example: 2006, nullable: true })
    releaseYear?: number;

    @ApiProperty({ example: 1, description: 'Id of a language owned by this same service.' })
    languageId: number;

    @ApiPropertyOptional({ example: 2, nullable: true })
    originalLanguageId?: number;

    @ApiProperty({ example: 6 })
    rentalDuration: number;

    @ApiProperty({ example: '0.99' })
    rentalRate: string;

    @ApiPropertyOptional({ example: 86, nullable: true })
    length?: number;

    @ApiProperty({ example: '20.99' })
    replacementCost: string;

    @ApiPropertyOptional({ example: 'PG', nullable: true })
    rating?: string;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    lastUpdate: string;
}
