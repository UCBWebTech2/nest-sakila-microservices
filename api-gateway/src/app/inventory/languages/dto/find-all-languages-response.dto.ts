import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { LanguageDto } from './language.dto.js';

export class FindAllLanguagesResponseDto extends PaginationResponseDto<LanguageDto> {
    @ApiProperty({ type: [LanguageDto] })
    declare data: LanguageDto[];
}
