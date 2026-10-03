import { City } from '../entities/city.entity.js';

export class CityDto {
    id:         number;
    city:       string;
    countryId:  number;
    lastUpdate: string;

    static fromEntity(entity: City): CityDto {
        const dto = new CityDto();
        dto.id         = entity.id;
        dto.city       = entity.city;
        dto.countryId  = entity.countryId;
        dto.lastUpdate = entity.lastUpdate.toISOString();
        return dto;
    }
}
