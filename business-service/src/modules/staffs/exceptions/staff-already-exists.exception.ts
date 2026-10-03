import { ConflictException } from '@nestjs/common';

export class StaffAlreadyExistsException extends ConflictException {
    constructor() {
        super({ message: 'A staff member with this username already exists.', error: 'STAFF_ALREADY_EXISTS' });
    }
}
