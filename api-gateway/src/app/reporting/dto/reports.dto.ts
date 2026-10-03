import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../shared/dto/index.js';

export class ActorInfoDto {
    @ApiProperty({ example: 1 }) actorId: number;
    @ApiProperty({ example: 'PENELOPE' }) firstName: string;
    @ApiProperty({ example: 'GUINESS' }) lastName: string;
    @ApiProperty({ example: 'Animation: ANACONDA CONFESSIONS, Classics: COLOR PHILADELPHIA' }) filmInfo: string;
}
export class FindAllActorInfoResponseDto extends PaginationResponseDto<ActorInfoDto> {
    @ApiProperty({ type: [ActorInfoDto] }) declare data: ActorInfoDto[];
}

export class ReportingCustomerDto {
    @ApiProperty({ example: 1 }) id: number;
    @ApiProperty({ example: 'MARY SMITH' }) name: string;
    @ApiProperty({ example: '1913 Hanoi Way' }) address: string;
    @ApiProperty({ example: '35200', nullable: true }) zipCode: string | null;
    @ApiProperty({ example: '28303384290' }) phone: string;
    @ApiProperty({ example: 'Sasebo' }) city: string;
    @ApiProperty({ example: 'Japan' }) country: string;
    @ApiProperty({ example: 'active' }) notes: string;
    @ApiProperty({ example: 1 }) storeId: number;
}
export class FindAllCustomersReportResponseDto extends PaginationResponseDto<ReportingCustomerDto> {
    @ApiProperty({ type: [ReportingCustomerDto] }) declare data: ReportingCustomerDto[];
}

export class FilmListItemDto {
    @ApiProperty({ example: 1 }) id: number;
    @ApiProperty({ example: 'ACADEMY DINOSAUR' }) title: string;
    @ApiProperty({ example: 'A Epic Drama of a Feminist...' }) description: string;
    @ApiProperty({ example: 'Documentary' }) category: string;
    @ApiProperty({ example: '0.99' }) price: string;
    @ApiProperty({ example: 86 }) length: number;
    @ApiProperty({ example: 'PG' }) rating: string;
    @ApiProperty({ example: 'PENELOPE GUINESS, CHRISTIAN GABLE' }) actors: string;
}
export class FindAllFilmListResponseDto extends PaginationResponseDto<FilmListItemDto> {
    @ApiProperty({ type: [FilmListItemDto] }) declare data: FilmListItemDto[];
}

export class SalesByCategoryDto {
    @ApiProperty({ example: 'Action' }) category: string;
    @ApiProperty({ example: '4375.85' }) totalSales: string;
}
export class FindAllSalesByCategoryResponseDto extends PaginationResponseDto<SalesByCategoryDto> {
    @ApiProperty({ type: [SalesByCategoryDto] }) declare data: SalesByCategoryDto[];
}

export class SalesByStoreDto {
    @ApiProperty({ example: 'Lethbridge,Canada' }) store: string;
    @ApiProperty({ example: 'Mike Hillyer' }) manager: string;
    @ApiProperty({ example: '33689.74' }) totalSales: string;
}
export class FindAllSalesByStoreResponseDto extends PaginationResponseDto<SalesByStoreDto> {
    @ApiProperty({ type: [SalesByStoreDto] }) declare data: SalesByStoreDto[];
}

export class ReportingStaffDto {
    @ApiProperty({ example: 1 }) id: number;
    @ApiProperty({ example: 'Mike Hillyer' }) name: string;
    @ApiProperty({ example: '23 Workhaven Lane' }) address: string;
    @ApiProperty({ example: '35200', nullable: true }) zipCode: string | null;
    @ApiProperty({ example: '14033335568' }) phone: string;
    @ApiProperty({ example: 'Lethbridge' }) city: string;
    @ApiProperty({ example: 'Canada' }) country: string;
    @ApiProperty({ example: 1 }) storeId: number;
}
export class FindAllStaffReportResponseDto extends PaginationResponseDto<ReportingStaffDto> {
    @ApiProperty({ type: [ReportingStaffDto] }) declare data: ReportingStaffDto[];
}

export class RewardsCustomerDto {
    @ApiProperty({ example: 1 }) customerId: number;
    @ApiProperty({ example: 1 }) storeId: number;
    @ApiProperty({ example: 'MARY' }) firstName: string;
    @ApiProperty({ example: 'SMITH' }) lastName: string;
    @ApiProperty({ example: 1 }) addressId: number;
    @ApiProperty({ example: 'MARY.SMITH@sakilacustomer.org' }) email: string;
    @ApiProperty({ example: true }) activebool: boolean;
    @ApiProperty({ example: '2026-01-01T00:00:00.000Z' }) createDate: string;
}
