import { NotFoundException } from '@nestjs/common';

export class RentalNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Rental not found.', error: 'RENTAL_NOT_FOUND' });
    }
}
