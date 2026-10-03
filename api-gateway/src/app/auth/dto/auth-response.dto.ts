import { ApiProperty } from '@nestjs/swagger';
import { StaffDto } from '../../business/staffs/dto/staff.dto.js';

export class AuthResponseDto {
    @ApiProperty({
        example:     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Access token (JWT_TIME_EXPIRE, default 15 min). Send as Authorization: Bearer <token> on every request.',
    })
    accessToken: string;

    @ApiProperty({ type: StaffDto })
    staff: StaffDto;
}
