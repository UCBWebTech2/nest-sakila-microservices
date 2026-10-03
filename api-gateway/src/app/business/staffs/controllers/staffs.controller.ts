import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBadRequest, ApiConflict, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { BusinessGraphqlClientService } from '../../services/business-graphql-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { StaffDto } from '../dto/staff.dto.js';
import { CreateStaffDto } from '../dto/create-staff.dto.js';
import { UpdateStaffDto } from '../dto/update-staff.dto.js';
import { FindAllStaffsResponseDto } from '../dto/find-all-staffs-response.dto.js';

/**
 * Staff accounts — the store employees who manage rentals, payments, and (via /auth/login) sign
 * into this API. Backed by business-service; this controller only forwards to it over GraphQL.
 *
 * Error dictionary: STAFF_NOT_FOUND 404, STAFF_ALREADY_EXISTS 409, STILL_REFERENCED 409,
 * INVALID_TOKEN 401
 */
@ApiTags('Staff')
@ApiBearerAuth('access-token')
@Controller('business/staffs')
export class StaffsController {
    constructor(private readonly client: BusinessGraphqlClientService) {}

    @Get()
    @ApiOperation({
        summary:     'List staff',
        description: 'Paginated list of staff accounts, across every store.',
    })
    @ApiOkResponse({ type: FindAllStaffsResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllStaffsResponseDto> {
        const data = await this.client.request<{ staffs: FindAllStaffsResponseDto }>(
            `query($page: Int, $limit: Int) {
                staffs(page: $page, limit: $limit) {
                    data { id firstName lastName addressId email storeId active username lastUpdate }
                    meta { page limit total pages }
                }
            }`,
            { page: params.page, limit: params.limit },
        );
        return data.staffs;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a staff account by id' })
    @ApiOkResponse({ type: StaffDto })
    @ApiNotFound({ code: 'STAFF_NOT_FOUND', message: 'Staff member not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<StaffDto> {
        const data = await this.client.request<{ staff: StaffDto }>(
            `query($id: Int!) {
                staff(id: $id) { id firstName lastName addressId email storeId active username lastUpdate }
            }`,
            { id },
        );
        return data.staff;
    }

    @Post()
    @ApiBadRequest({ code: 'INVALID_ADDRESS_ID', message: 'Address 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiOperation({
        summary:     'Create a staff account',
        description: "The password is hashed before it reaches storage — it's never kept in plain text, and no endpoint ever returns it back.",
    })
    @ApiCreatedResponse({ type: StaffDto })
    @ApiConflict({ code: 'STAFF_ALREADY_EXISTS', message: 'A staff member with this username already exists.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateStaffDto): Promise<StaffDto> {
        const data = await this.client.request<{ createStaff: StaffDto }>(
            `mutation($input: CreateStaffDto!) {
                createStaff(input: $input) { id firstName lastName addressId email storeId active username lastUpdate }
            }`,
            { input: createDto },
        );
        return data.createStaff;
    }

    @Patch(':id')
    @ApiBadRequest({ code: 'INVALID_ADDRESS_ID', message: 'Address 999 does not exist.' })
    @ApiBadRequest({ code: 'INVALID_STORE_ID', message: 'Store 999 does not exist.' })
    @ApiOperation({
        summary:     'Update a staff account',
        description: 'Partial update — only send the fields that changed. To change the password, include a new one here; it gets rehashed the same way as on creation.',
    })
    @ApiOkResponse({ type: StaffDto })
    @ApiNotFound({ code: 'STAFF_NOT_FOUND', message: 'Staff member not found.' })
    @ApiConflict({ code: 'STAFF_ALREADY_EXISTS', message: 'A staff member with this username already exists.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateStaffDto): Promise<StaffDto> {
        const data = await this.client.request<{ updateStaff: StaffDto }>(
            `mutation($id: Int!, $input: UpdateStaffDto!) {
                updateStaff(id: $id, input: $input) { id firstName lastName addressId email storeId active username lastUpdate }
            }`,
            { id, input: updateDto },
        );
        return data.updateStaff;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary:     'Delete a staff account',
        description: 'Fails with a 409 if the account still has payments or rentals recorded under it — remove or reassign those first.',
    })
    @ApiNotFound({ code: 'STAFF_NOT_FOUND', message: 'Staff member not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.request<{ removeStaff: boolean }>(
            `mutation($id: Int!) { removeStaff(id: $id) }`,
            { id },
        );
    }
}
