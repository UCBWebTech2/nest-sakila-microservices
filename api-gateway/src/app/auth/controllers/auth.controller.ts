import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { AuthResponseDto } from '../dto/auth-response.dto.js';
import { Public } from '../decorators/index.js';
import { ApiValidationError, ApiUnauthorized } from '../../../shared/utils/swagger/index.js';

/**
 * Error dictionary for this module:
 *   INVALID_CREDENTIALS 401 — Username not found, inactive, or password doesn't match.
 *   INVALID_TOKEN        401 — Access JWT is missing, malformed, or expired (guard — applies to protected routes).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:     'Login',
        description: 'Validates a staff username and password and returns an access token. The generic 401 message intentionally hides whether the username exists.',
    })
    @ApiOkResponse({ type: AuthResponseDto })
    @ApiValidationError()
    @ApiUnauthorized({ code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return await this.authService.login(dto);
    }
}
