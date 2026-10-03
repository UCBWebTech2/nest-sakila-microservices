import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateRentalDto } from './create-rental.dto.js';

@InputType()
export class UpdateRentalDto extends PartialType(CreateRentalDto) {
    @Field({ nullable: true, description: 'Set when the rental is returned.' })
    @IsOptional()
    @IsDateString()
    returnDate?: string;
}
