import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Staff } from '../entities/staff.entity.js';

// Never includes `password` — this is the public shape returned by the API.
@ObjectType('Staff')
export class StaffDto {
    @Field(() => Int)
    id: number;

    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field(() => Int, { description: 'Id of an address owned by customer-service.' })
    addressId: number;

    @Field(() => String, { nullable: true })
    email: string | null;

    @Field(() => Int)
    storeId: number;

    @Field()
    active: boolean;

    @Field()
    username: string;

    @Field()
    lastUpdate: Date;

    static fromEntity(entity: Staff): StaffDto {
        const dto = new StaffDto();
        dto.id = entity.id;
        dto.firstName = entity.firstName;
        dto.lastName = entity.lastName;
        dto.addressId = entity.addressId;
        dto.email = entity.email;
        dto.storeId = entity.storeId;
        dto.active = entity.active;
        dto.username = entity.username;
        dto.lastUpdate = entity.lastUpdate;
        return dto;
    }
}
