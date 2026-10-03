import { IsString, Length } from 'class-validator';

export class CreateCountryDto {
    @IsString() @Length(1, 50)
    country: string;
}
