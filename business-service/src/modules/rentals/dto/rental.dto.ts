import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Rental } from '../entities/rental.entity.js';

@ObjectType('Rental')
export class RentalDto {
    @Field(() => Int)
    id: number;

    @Field()
    rentalDate: Date;

    @Field(() => Int, { description: 'Id of an inventory item owned by inventory-service.' })
    inventoryId: number;

    @Field(() => Int, { description: 'Id of a customer owned by customer-service.' })
    customerId: number;

    @Field(() => Date, { nullable: true })
    returnDate: Date | null;

    @Field(() => Int)
    staffId: number;

    @Field()
    lastUpdate: Date;

    static fromEntity(entity: Rental): RentalDto {
        const dto = new RentalDto();
        dto.id = entity.id;
        dto.rentalDate = entity.rentalDate;
        dto.inventoryId = entity.inventoryId;
        dto.customerId = entity.customerId;
        dto.returnDate = entity.returnDate;
        dto.staffId = entity.staffId;
        dto.lastUpdate = entity.lastUpdate;
        return dto;
    }
}
