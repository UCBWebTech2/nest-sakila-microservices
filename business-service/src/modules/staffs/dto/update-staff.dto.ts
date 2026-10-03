import { InputType, PartialType } from '@nestjs/graphql';
import { CreateStaffDto } from './create-staff.dto.js';

@InputType()
export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
