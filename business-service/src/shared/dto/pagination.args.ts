import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
    @Field(() => Int, { defaultValue: 1, description: 'Page number (starts at 1).' })
    @IsInt({ message: "The 'page' argument must be an integer." })
    @Min(1, { message: "The 'page' argument must be >= 1." })
    page: number = 1;

    @Field(() => Int, { defaultValue: 10, description: 'Results per page.' })
    @IsInt({ message: "The 'limit' argument must be an integer." })
    @Min(1, { message: "The 'limit' argument must be >= 1." })
    limit: number = 10;
}
