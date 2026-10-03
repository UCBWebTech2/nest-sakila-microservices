import { Field, ObjectType } from '@nestjs/graphql';
import { PaginationMeta } from '../../../shared/dto/index.js';
import { StoreDto } from './store.dto.js';

@ObjectType()
export class FindAllStoresResponseDto {
    @Field(() => [StoreDto])
    data: StoreDto[];

    @Field(() => PaginationMeta)
    meta: PaginationMeta;
}
