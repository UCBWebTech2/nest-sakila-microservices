import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RentalsService } from '../services/rentals.service.js';
import { RentalDto } from '../dto/rental.dto.js';
import { CreateRentalDto } from '../dto/create-rental.dto.js';
import { UpdateRentalDto } from '../dto/update-rental.dto.js';
import { FindAllRentalsResponseDto } from '../dto/find-all-rentals-response.dto.js';
import { PaginationArgs } from '../../../shared/dto/index.js';

@Resolver(() => RentalDto)
export class RentalsResolver {
    constructor(private readonly service: RentalsService) {}

    @Query(() => FindAllRentalsResponseDto, { name: 'rentals', description: 'Returns a paginated list of rentals.' })
    async findAll(@Args() params: PaginationArgs): Promise<FindAllRentalsResponseDto> {
        return await this.service.findAll(params);
    }

    @Query(() => RentalDto, { name: 'rental', description: 'Returns a single rental by id.' })
    async findOne(@Args('id', { type: () => Int }) id: number): Promise<RentalDto> {
        return (await this.service.findOneById(id)) as RentalDto;
    }

    @Mutation(() => RentalDto, { name: 'createRental', description: 'Creates a new rental.' })
    async create(@Args('input') input: CreateRentalDto): Promise<RentalDto> {
        return await this.service.create(input);
    }

    @Mutation(() => RentalDto, { name: 'updateRental', description: 'Partially updates a rental (e.g. set returnDate).' })
    async update(
        @Args('id', { type: () => Int }) id: number,
        @Args('input') input: UpdateRentalDto,
    ): Promise<RentalDto> {
        return await this.service.update(id, input);
    }

    @Mutation(() => Boolean, { name: 'removeRental', description: 'Permanently deletes a rental.' })
    async remove(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
        await this.service.remove(id);
        return true;
    }
}
