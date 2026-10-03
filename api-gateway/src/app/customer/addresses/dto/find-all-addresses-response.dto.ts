import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { AddressDto } from './address.dto.js';

export class FindAllAddressesResponseDto extends PaginationResponseDto<AddressDto> {
    @ApiProperty({ type: [AddressDto] })
    declare data: AddressDto[];
}
