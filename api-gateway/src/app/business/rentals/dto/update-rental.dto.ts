import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateRentalDto } from './create-rental.dto.js';

export class UpdateRentalDto extends PartialType(CreateRentalDto) {
    @ApiPropertyOptional({ example: '2026-10-02T18:30:00.000Z', description: 'Set when the rental is returned.' })
    @IsOptional()
    @IsDateString()
    returnDate?: string;
}
