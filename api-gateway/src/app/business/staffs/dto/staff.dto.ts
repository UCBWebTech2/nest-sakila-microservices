import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Mirrors business-service's Staff GraphQL type — never includes `password`.
export class StaffDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Mike' })
    firstName: string;

    @ApiProperty({ example: 'Hillyer' })
    lastName: string;

    @ApiProperty({ example: 1, description: 'Id of an address owned by customer-service.' })
    addressId: number;

    @ApiPropertyOptional({ example: 'mike@example.com', nullable: true })
    email: string | null;

    @ApiProperty({ example: 1 })
    storeId: number;

    @ApiProperty({ example: true })
    active: boolean;

    @ApiProperty({ example: 'mhillyer' })
    username: string;

    @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
    lastUpdate: string;
}
