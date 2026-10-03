import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { RentalDto } from './rental.dto.js';

export class FindAllRentalsResponseDto extends PaginationResponseDto<RentalDto> {
    @ApiProperty({ type: [RentalDto] })
    declare data: RentalDto[];
}
