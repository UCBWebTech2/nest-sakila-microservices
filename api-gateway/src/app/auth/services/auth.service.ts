import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BusinessGraphqlClientService } from '../../business/services/business-graphql-client.service.js';
import { StaffDto } from '../../business/staffs/dto/staff.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { AuthResponseDto } from '../dto/auth-response.dto.js';
import { JwtPayload } from '../strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly businessClient: BusinessGraphqlClientService,
        private readonly jwtService:     JwtService,
    ) {}

    // Credential verification happens in business-service — staff.password (the hash) never
    // leaves it, StaffDto doesn't even have that field. This gateway only mints the JWT.
    async login(dto: LoginDto): Promise<AuthResponseDto> {
        const data = await this.businessClient.request<{ staffLogin: StaffDto }>(
            `mutation($input: StaffLoginDto!) {
                staffLogin(input: $input) { id firstName lastName addressId email storeId active username lastUpdate }
            }`,
            { input: { username: dto.username, password: dto.password } },
        );

        const payload: JwtPayload = { sub: data.staffLogin.id, username: data.staffLogin.username };
        const accessToken = this.jwtService.sign(payload);

        return { accessToken, staff: data.staffLogin };
    }
}
