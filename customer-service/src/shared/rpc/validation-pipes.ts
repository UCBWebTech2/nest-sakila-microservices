import { ValidationError, ValidationPipe } from '@nestjs/common';
import { GrpcInvalidArgumentException, RpcException } from '@nestjs/microservices';

// Connected microservices don't inherit the HTTP app's global pipes unless connectMicroservice is
// given `inheritAppConfig: true` (NestJS hybrid-application docs). Instead of inheriting the whole
// HTTP config — including HttpExceptionFilter, which has no business on RPC handlers — each
// transport gets its own pipe, whose failures are translated to that transport's error format.
const options = {
    transform:            true,
    whitelist:            true,
    forbidNonWhitelisted: true,
    transformOptions:     { enableImplicitConversion: false },
};

function messages(errors: ValidationError[]): string[] {
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

export const grpcValidationPipe = new ValidationPipe({
    ...options,
    exceptionFactory: (errors) => new GrpcInvalidArgumentException(`VALIDATION_ERROR: ${messages(errors).join('; ')}`),
});

export const rmqValidationPipe = new ValidationPipe({
    ...options,
    exceptionFactory: (errors) => new RpcException({ statusCode: 400, error: 'VALIDATION_ERROR', message: messages(errors).join('; ') }),
});
