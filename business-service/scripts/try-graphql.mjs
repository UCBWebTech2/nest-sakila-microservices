// Prueba business-service por GraphQL, directo (sin el gateway). Funciona igual en Windows, macOS y Linux
// (Node 18+, usa fetch). También puedes usar el Playground en http://localhost:3001/graphql.
//
//   npm run try:graphql                                  -> demo con varias consultas
//   npm run try:graphql -- --file=consulta.graphql       -> ejecuta la consulta/mutation de ese archivo
//
// Dirección: GRAPHQL_URL (por defecto http://localhost:3001/graphql).
import { readFileSync } from 'node:fs';

const url = process.env.GRAPHQL_URL ?? 'http://localhost:3001/graphql';

async function run(title, query) {
    console.log(`\n> ${title}`);
    try {
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ query }),
            signal:  AbortSignal.timeout(5000),
        });
        console.log(JSON.stringify(await response.json(), null, 2));
    } catch (err) {
        console.error(`No se pudo llamar a ${url}: ${err.message}. ¿Está corriendo business-service?`);
        process.exitCode = 1;
    }
}

const fileArg = process.argv.slice(2).find((arg) => arg.startsWith('--file='));
if (fileArg) {
    await run(fileArg.slice('--file='.length), readFileSync(fileArg.slice('--file='.length), 'utf8'));
} else {
    console.log(`Demo contra GraphQL en ${url}`);
    await run('stores (lista paginada)', '{ stores(page: 1, limit: 2) { data { id managerStaffId addressId } meta { total pages } } }');
    await run('staffs', '{ staffs(page: 1, limit: 2) { data { id firstName lastName username storeId } meta { total } } }');
    await run('staff(id: 1)', '{ staff(id: 1) { id firstName lastName username storeId active } }');
    await run('rentals', '{ rentals(page: 1, limit: 2) { data { id customerId inventoryId staffId } meta { total } } }');
    await run('payments', '{ payments(page: 1, limit: 2) { data { id customerId amount } meta { total } } }');
    await run('store(id: 999999)  -> error STORE_NOT_FOUND', '{ store(id: 999999) { id } }');
    await run('staffLogin con credenciales incorrectas  -> error INVALID_CREDENTIALS',
        'mutation { staffLogin(input: { username: "nadie", password: "clave-incorrecta" }) { id username } }');
}
