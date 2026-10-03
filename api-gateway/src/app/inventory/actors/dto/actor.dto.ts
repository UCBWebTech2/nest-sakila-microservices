import { ApiProperty } from '@nestjs/swagger';

export class ActorDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'PENELOPE' })
    firstName: string;

    @ApiProperty({ example: 'GUINESS' })
    lastName: string;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    lastUpdate: string;
}
