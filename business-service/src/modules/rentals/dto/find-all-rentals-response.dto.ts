import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationMeta } from '../../../shared/dto/index.js';
import { RentalDto } from './rental.dto.js';

@ObjectType()
export class FindAllRentalsResponseDto {
    @Field(() => [RentalDto])
    data: RentalDto[];

    @Field(() => PaginationMeta)
    meta: PaginationMeta;
}
