import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateCountryDto {
    @IsInt() @Min(1)
    id: number;

    @IsOptional() @IsString() @Length(1, 50)
    country?: string;
}
