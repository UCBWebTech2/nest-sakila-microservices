import { NotFoundException } from '@nestjs/common';

export class StaffNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Staff member not found.', error: 'STAFF_NOT_FOUND' });
    }
}
