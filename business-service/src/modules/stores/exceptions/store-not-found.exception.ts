import { NotFoundException } from '@nestjs/common';

export class StoreNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Store not found.', error: 'STORE_NOT_FOUND' });
    }
}
