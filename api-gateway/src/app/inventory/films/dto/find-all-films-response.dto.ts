import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { FilmDto } from './film.dto.js';

export class FindAllFilmsResponseDto extends PaginationResponseDto<FilmDto> {
    @ApiProperty({ type: [FilmDto] })
    declare data: FilmDto[];
}
