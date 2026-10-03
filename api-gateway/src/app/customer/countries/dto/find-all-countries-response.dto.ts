import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { CountryDto } from './country.dto.js';

export class FindAllCountriesResponseDto extends PaginationResponseDto<CountryDto> {
    @ApiProperty({ type: [CountryDto] })
    declare data: CountryDto[];
}
