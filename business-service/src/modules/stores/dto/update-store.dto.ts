import { InputType, PartialType } from '@nestjs/graphql';
import { CreateStoreDto } from './create-store.dto.js';

@InputType()
export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
