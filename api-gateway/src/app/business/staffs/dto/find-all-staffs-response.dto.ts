import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { StaffDto } from './staff.dto.js';

export class FindAllStaffsResponseDto extends PaginationResponseDto<StaffDto> {
    @ApiProperty({ type: [StaffDto] })
    declare data: StaffDto[];
}
