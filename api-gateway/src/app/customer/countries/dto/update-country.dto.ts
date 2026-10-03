import { PartialType } from '@nestjs/swagger';
import { CreateCountryDto } from './create-country.dto.js';

export class UpdateCountryDto extends PartialType(CreateCountryDto) {}
