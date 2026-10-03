import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto.js';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
    @ApiPropertyOptional({ example: false })
    @IsOptional() @IsBoolean()
    active?: boolean;
}
