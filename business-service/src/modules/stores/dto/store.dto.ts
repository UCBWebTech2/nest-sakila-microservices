import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Store } from '../entities/store.entity.js';

@ObjectType('Store')
export class StoreDto {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    managerStaffId: number;

    @Field(() => Int, { description: 'Id of an address owned by customer-service.' })
    addressId: number;

    @Field()
    lastUpdate: Date;

    static fromEntity(entity: Store): StoreDto {
        const dto = new StoreDto();
        dto.id = entity.id;
        dto.managerStaffId = entity.managerStaffId;
        dto.addressId = entity.addressId;
        dto.lastUpdate = entity.lastUpdate;
        return dto;
    }
}
