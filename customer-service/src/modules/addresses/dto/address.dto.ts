import { Address } from '../entities/address.entity.js';

export class AddressDto {
    id:          number;
    address:     string;
    address2?:   string;
    district:    string;
    cityId:      number;
    postalCode?: string;
    phone:       string;
    lastUpdate:  string;

    static fromEntity(entity: Address): AddressDto {
        const dto = new AddressDto();
        dto.id         = entity.id;
        dto.address    = entity.address;
        dto.address2   = entity.address2 ?? undefined;
        dto.district   = entity.district;
        dto.cityId     = entity.cityId;
        dto.postalCode = entity.postalCode ?? undefined;
        dto.phone      = entity.phone;
        dto.lastUpdate = entity.lastUpdate.toISOString();
        return dto;
    }
}
