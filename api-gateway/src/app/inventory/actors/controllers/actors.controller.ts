import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiConflict, ApiNotFound, ApiUnauthorized } from '../../../../shared/utils/swagger/index.js';
import { InventorySoapClientService } from '../../services/inventory-soap-client.service.js';
import { PaginationParamsDto } from '../../../../shared/dto/index.js';
import { ActorDto } from '../dto/actor.dto.js';
import { CreateActorDto } from '../dto/create-actor.dto.js';
import { UpdateActorDto } from '../dto/update-actor.dto.js';
import { FindAllActorsResponseDto } from '../dto/find-all-actors-response.dto.js';

/**
 * Error dictionary: ACTOR_NOT_FOUND 404, STILL_REFERENCED 409, INVALID_TOKEN 401
 */
@ApiTags('Actors')
@ApiBearerAuth('access-token')
@Controller('inventory/actors')
export class ActorsController {
    constructor(private readonly client: InventorySoapClientService) {}

    @Get()
    @ApiOperation({ summary: 'List actors' })
    @ApiOkResponse({ type: FindAllActorsResponseDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findAll(@Query() params: PaginationParamsDto): Promise<FindAllActorsResponseDto> {
        return await this.client.call('ListActors', { page: params.page, limit: params.limit });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an actor by id' })
    @ApiOkResponse({ type: ActorDto })
    @ApiNotFound({ code: 'ACTOR_NOT_FOUND', message: 'Actor not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ActorDto> {
        return await this.client.call('GetActor', { id });
    }

    @Post()
    @ApiOperation({ summary: 'Add an actor' })
    @ApiCreatedResponse({ type: ActorDto })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async create(@Body() createDto: CreateActorDto): Promise<ActorDto> {
        return await this.client.call('CreateActor', createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an actor' })
    @ApiOkResponse({ type: ActorDto })
    @ApiNotFound({ code: 'ACTOR_NOT_FOUND', message: 'Actor not found.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateActorDto): Promise<ActorDto> {
        return await this.client.call('UpdateActor', { id, ...updateDto });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove an actor' })
    @ApiNotFound({ code: 'ACTOR_NOT_FOUND', message: 'Actor not found.' })
    @ApiConflict({ code: 'STILL_REFERENCED', message: 'Cannot delete: other records still reference it.' })
    @ApiUnauthorized({ code: 'INVALID_TOKEN', message: 'Invalid or expired token.' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.client.call('DeleteActor', { id });
    }
}
