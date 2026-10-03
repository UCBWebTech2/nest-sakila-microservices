import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { CustomerDto } from './customer.dto.js';

export class FindAllCustomersResponseDto extends PaginationResponseDto<CustomerDto> {
    @ApiProperty({ type: [CustomerDto] })
    declare data: CustomerDto[];
}
