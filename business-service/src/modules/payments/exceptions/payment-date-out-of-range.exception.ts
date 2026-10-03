import { UnprocessableEntityException } from '@nestjs/common';

// payment is partitioned by month and every partition has a CHECK on its date range, so an UPDATE
// can't move a row into another month's range (it would have to be deleted and re-created).
export class PaymentDateOutOfRangeException extends UnprocessableEntityException {
    constructor() {
        super({
            message: "A payment's date can't be moved into a different month: delete it and create a new one instead.",
            error:   'PAYMENT_DATE_OUT_OF_RANGE',
        });
    }
}
