import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { CityDto } from './city.dto.js';

export class FindAllCitiesResponseDto extends PaginationResponseDto<CityDto> {
    @ApiProperty({ type: [CityDto] })
    declare data: CityDto[];
}
