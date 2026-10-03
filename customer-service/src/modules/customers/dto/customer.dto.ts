import { Customer } from '../entities/customer.entity.js';

export class CustomerDto {
    id:         number;
    storeId:    number;
    firstName:  string;
    lastName:   string;
    email?:     string;
    addressId:  number;
    active:     boolean;
    createDate: string;
    lastUpdate: string;

    static fromEntity(entity: Customer): CustomerDto {
        const dto = new CustomerDto();
        dto.id         = entity.id;
        dto.storeId    = entity.storeId;
        dto.firstName  = entity.firstName;
        dto.lastName   = entity.lastName;
        // proto3 `optional` fields are simply left out when unset — null can't be encoded.
        dto.email      = entity.email ?? undefined;
        dto.addressId  = entity.addressId;
        dto.active     = entity.activebool;
        dto.createDate = entity.createDate;
        dto.lastUpdate = (entity.lastUpdate ?? new Date(0)).toISOString();
        return dto;
    }
}
