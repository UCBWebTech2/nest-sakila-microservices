import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationMeta } from '../../../shared/dto/index.js';
import { StaffDto } from './staff.dto.js';

@ObjectType()
export class FindAllStaffsResponseDto {
    @Field(() => [StaffDto])
    data: StaffDto[];

    @Field(() => PaginationMeta)
    meta: PaginationMeta;
}
