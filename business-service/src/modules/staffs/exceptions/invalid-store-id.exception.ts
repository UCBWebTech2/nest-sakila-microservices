import { BadRequestException } from '@nestjs/common';

// The input pointed at a store that doesn't exist (checked before touching the DB).
export class InvalidStoreIdException extends BadRequestException {
    constructor(id: number) {
        super({ message: `Store ${id} does not exist.`, error: 'INVALID_STORE_ID' });
    }
}
