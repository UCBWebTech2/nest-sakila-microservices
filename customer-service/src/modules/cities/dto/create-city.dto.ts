import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateCityDto {
    @IsString() @Length(1, 50)
    city: string;

    @IsInt() @Min(1)
    countryId: number;
}
