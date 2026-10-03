import { BadRequestException } from '@nestjs/common';

// The input pointed at a rental that doesn't exist (checked before touching the DB).
export class InvalidRentalIdException extends BadRequestException {
    constructor(id: number) {
        super({ message: `Rental ${id} does not exist.`, error: 'INVALID_RENTAL_ID' });
    }
}
