// Prueba customer-service por gRPC, directo (sin el gateway). Funciona igual en Windows, macOS y Linux.
//
//   npm run try:grpc                                          -> demo con varias llamadas
//   npm run try:grpc -- CustomersService FindOne id=1         -> una llamada concreta
//   npm run try:grpc -- CustomersService List page=1 limit=3
//   npm run try:grpc -- AddressesService FindOne id=5
//   npm run try:grpc -- CustomersService Create storeId=1 firstName=ANA lastName=PEREZ addressId=5
//
// Los argumentos van como clave=valor (así no hay problemas de comillas en ninguna terminal).
// Servicios y métodos: ver src/proto/customer.proto. Dirección: GRPC_ADDRESS (por defecto localhost:50051).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const protoPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'proto', 'customer.proto');
const address = process.env.GRPC_ADDRESS ?? 'localhost:50051';

// Mismas opciones que usa NestJS: los campos del .proto (snake_case) se ven en camelCase.
const definition = protoLoader.loadSync(protoPath, { keepCase: false, longs: Number, enums: String, defaults: false, oneofs: true });
const { customer } = grpc.loadPackageDefinition(definition);

function parseValue(text) {
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (text !== '' && !Number.isNaN(Number(text))) return Number(text);
    return text;
}

function parseArgs(args) {
    return Object.fromEntries(args.map((arg) => {
        const i = arg.indexOf('=');
        if (i < 1) throw new Error(`Argumento inválido "${arg}": usa clave=valor (por ejemplo id=1).`);
        return [arg.slice(0, i), parseValue(arg.slice(i + 1))];
    }));
}

function call(service, method, request) {
    return new Promise((resolve) => {
        const Service = customer[service];
        if (!Service) return resolve({ error: `No existe el servicio "${service}" (usa CustomersService o AddressesService).` });
        const client = new Service(address, grpc.credentials.createInsecure());
        const fn = client[method.charAt(0).toLowerCase() + method.slice(1)];
        if (!fn) { client.close(); return resolve({ error: `El servicio ${service} no tiene el método "${method}".` }); }
        fn.call(client, request, { deadline: Date.now() + 5000 }, (err, response) => {
            client.close();
            resolve(err ? { error: { status: grpc.status[err.code], message: err.details || err.message } } : { response });
        });
    });
}

async function run(service, method, request) {
    console.log(`\n> ${service}.${method} ${JSON.stringify(request)}`);
    console.log(JSON.stringify(await call(service, method, request), null, 2));
}

const [service, method, ...rest] = process.argv.slice(2);
if (service && method) {
    await run(service, method, parseArgs(rest));
} else {
    console.log(`Demo contra gRPC en ${address}`);
    await run('CustomersService', 'List', { page: 1, limit: 2 });
    await run('CustomersService', 'FindOne', { id: 1 });
    await run('AddressesService', 'FindOne', { id: 5 });
    await run('CustomersService', 'FindOne', { id: 999999 });              // error: CUSTOMER_NOT_FOUND
    await run('CustomersService', 'Create', { storeId: 1, firstName: 'X', lastName: 'Y', addressId: 999999 }); // error: INVALID_ADDRESS_ID
}
