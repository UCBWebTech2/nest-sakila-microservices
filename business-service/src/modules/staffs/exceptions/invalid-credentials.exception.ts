import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
    constructor() {
        super({ message: 'Invalid username or password.', error: 'INVALID_CREDENTIALS' });
    }
}
