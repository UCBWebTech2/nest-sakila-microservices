import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Action' })
    name: string;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    lastUpdate: string;
}
