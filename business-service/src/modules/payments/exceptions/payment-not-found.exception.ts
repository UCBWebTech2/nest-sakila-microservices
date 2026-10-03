import { NotFoundException } from '@nestjs/common';

export class PaymentNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Payment not found.', error: 'PAYMENT_NOT_FOUND' });
    }
}
