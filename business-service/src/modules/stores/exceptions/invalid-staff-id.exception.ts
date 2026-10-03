import { BadRequestException } from '@nestjs/common';

// The input pointed at a staff that doesn't exist (checked before touching the DB).
export class InvalidStaffIdException extends BadRequestException {
    constructor(id: number) {
        super({ message: `Staff ${id} does not exist.`, error: 'INVALID_STAFF_ID' });
    }
}
