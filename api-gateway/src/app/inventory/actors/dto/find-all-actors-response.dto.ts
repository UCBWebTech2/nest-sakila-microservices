import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../shared/dto/index.js';
import { ActorDto } from './actor.dto.js';

export class FindAllActorsResponseDto extends PaginationResponseDto<ActorDto> {
    @ApiProperty({ type: [ActorDto] })
    declare data: ActorDto[];
}
