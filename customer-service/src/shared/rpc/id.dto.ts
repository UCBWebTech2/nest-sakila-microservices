import { IsInt, Min } from 'class-validator';

// Payload of every "find one" / "remove" call, over gRPC (ById) and RabbitMQ alike.
export class IdDto {
    @IsInt()
    @Min(1)
    id: number;
}
