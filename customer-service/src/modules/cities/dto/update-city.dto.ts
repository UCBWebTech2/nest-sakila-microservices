import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCityDto {
    @IsInt() @Min(1)
    id: number;

    @IsOptional() @IsString() @Length(1, 50)
    city?: string;

    @IsOptional() @IsInt() @Min(1)
    countryId?: number;
}
