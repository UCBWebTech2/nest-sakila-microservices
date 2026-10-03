import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumberString, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

export class CreateFilmDto {
    @ApiProperty({ example: 'Inception' })
    @IsString()
    @Length(1, 255)
    title: string;

    @ApiPropertyOptional({ example: 'A thief who steals corporate secrets through dream-sharing technology...' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 2010, minimum: 1901, maximum: 2155 })
    @IsOptional()
    @IsInt()
    @Min(1901)
    @Max(2155)
    releaseYear?: number;

    @ApiProperty({ example: 1, description: 'Id of a language owned by this same service.' })
    @IsInt()
    languageId: number;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    originalLanguageId?: number;

    @ApiPropertyOptional({ example: 5, default: 3, description: 'Days. Defaults to 3 if omitted.' })
    @IsOptional()
    @IsInt()
    rentalDuration?: number;

    @ApiPropertyOptional({ example: '2.99', default: '4.99' })
    @IsOptional()
    @IsNumberString()
    rentalRate?: string;

    @ApiPropertyOptional({ example: 148 })
    @IsOptional()
    @IsInt()
    length?: number;

    @ApiPropertyOptional({ example: '24.99', default: '19.99' })
    @IsOptional()
    @IsNumberString()
    replacementCost?: string;

    @ApiPropertyOptional({ example: 'PG-13', enum: RATINGS, default: 'G' })
    @IsOptional()
    @IsIn(RATINGS)
    rating?: string;
}
