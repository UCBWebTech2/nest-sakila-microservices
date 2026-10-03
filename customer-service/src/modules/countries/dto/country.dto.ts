import { Country } from '../entities/country.entity.js';

export class CountryDto {
    id:         number;
    country:    string;
    lastUpdate: string;

    static fromEntity(entity: Country): CountryDto {
        const dto = new CountryDto();
        dto.id         = entity.id;
        dto.country    = entity.country;
        dto.lastUpdate = entity.lastUpdate.toISOString();
        return dto;
    }
}
