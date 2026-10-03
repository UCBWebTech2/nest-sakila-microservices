import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StaffsService } from '../services/staffs.service.js';
import { StaffDto } from '../dto/staff.dto.js';
import { CreateStaffDto } from '../dto/create-staff.dto.js';
import { UpdateStaffDto } from '../dto/update-staff.dto.js';
import { StaffLoginDto } from '../dto/staff-login.dto.js';
import { FindAllStaffsResponseDto } from '../dto/find-all-staffs-response.dto.js';
import { PaginationArgs } from '../../../shared/dto/index.js';

@Resolver(() => StaffDto)
export class StaffsResolver {
    constructor(private readonly service: StaffsService) {}

    @Query(() => FindAllStaffsResponseDto, { name: 'staffs', description: 'Returns a paginated list of staff members.' })
    async findAll(@Args() params: PaginationArgs): Promise<FindAllStaffsResponseDto> {
        return await this.service.findAll(params);
    }

    @Query(() => StaffDto, { name: 'staff', description: 'Returns a single staff member by id.' })
    async findOne(@Args('id', { type: () => Int }) id: number): Promise<StaffDto> {
        return (await this.service.findOneById(id)) as StaffDto;
    }

    @Mutation(() => StaffDto, { name: 'createStaff', description: 'Creates a new staff member.' })
    async create(@Args('input') input: CreateStaffDto): Promise<StaffDto> {
        return await this.service.create(input);
    }

    @Mutation(() => StaffDto, { name: 'updateStaff', description: 'Partially updates a staff member.' })
    async update(
        @Args('id', { type: () => Int }) id: number,
        @Args('input') input: UpdateStaffDto,
    ): Promise<StaffDto> {
        return await this.service.update(id, input);
    }

    @Mutation(() => Boolean, { name: 'removeStaff', description: 'Permanently deletes a staff member.' })
    async remove(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
        await this.service.remove(id);
        return true;
    }

    @Mutation(() => StaffDto, { name: 'staffLogin', description: 'Verifies username/password and returns the staff member on success.' })
    async login(@Args('input') input: StaffLoginDto): Promise<StaffDto> {
        return await this.service.verifyCredentials(input);
    }
}
