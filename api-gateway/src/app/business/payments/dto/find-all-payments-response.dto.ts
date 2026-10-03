import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { PaymentDto } from './payment.dto.js';

export class FindAllPaymentsResponseDto extends PaginationResponseDto<PaymentDto> {
    @ApiProperty({ type: [PaymentDto] })
    declare data: PaymentDto[];
}
