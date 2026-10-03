import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StoresService } from '../services/stores.service.js';
import { StoreDto } from '../dto/store.dto.js';
import { CreateStoreDto } from '../dto/create-store.dto.js';
import { UpdateStoreDto } from '../dto/update-store.dto.js';
import { FindAllStoresResponseDto } from '../dto/find-all-stores-response.dto.js';
import { PaginationArgs } from '../../../shared/dto/index.js';

@Resolver(() => StoreDto)
export class StoresResolver {
    constructor(private readonly service: StoresService) {}

    @Query(() => FindAllStoresResponseDto, { name: 'stores', description: 'Returns a paginated list of stores.' })
    async findAll(@Args() params: PaginationArgs): Promise<FindAllStoresResponseDto> {
        return await this.service.findAll(params);
    }

    @Query(() => StoreDto, { name: 'store', description: 'Returns a single store by id.' })
    async findOne(@Args('id', { type: () => Int }) id: number): Promise<StoreDto> {
        return (await this.service.findOneById(id)) as StoreDto;
    }

    @Mutation(() => StoreDto, { name: 'createStore', description: 'Creates a new store.' })
    async create(@Args('input') input: CreateStoreDto): Promise<StoreDto> {
        return await this.service.create(input);
    }

    @Mutation(() => StoreDto, { name: 'updateStore', description: 'Partially updates a store.' })
    async update(
        @Args('id', { type: () => Int }) id: number,
        @Args('input') input: UpdateStoreDto,
    ): Promise<StoreDto> {
        return await this.service.update(id, input);
    }

    @Mutation(() => Boolean, { name: 'removeStore', description: 'Permanently deletes a store.' })
    async remove(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
        await this.service.remove(id);
        return true;
    }
}
