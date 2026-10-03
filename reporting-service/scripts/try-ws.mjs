// Prueba reporting-service por WebSocket (Socket.io), directo (sin el gateway). Funciona igual en Windows,
// macOS y Linux.
//
//   npm run try:ws                                                 -> demo con varios reportes
//   npm run try:ws -- getSalesByStore                              -> un reporte concreto
//   npm run try:ws -- getFilmInStock filmId=1 storeId=1
//   npm run try:ws -- getCustomerBalance customerId=1 effectiveDate=2006-01-01
//
// Eventos: getActorInfo, getCustomerList, getFilmList, getNicerButSlowerFilmList, getSalesByFilmCategory,
// getSalesByStore, getStaffList, getFilmInStock, getFilmNotInStock, getCustomerBalance,
// getInventoryHeldByCustomer, getInventoryInStock, getRewardsReport. Los argumentos van como clave=valor.
// Dirección: WS_URL (por defecto http://localhost:3004/reports, el namespace "reports").
//
// Ojo: en Socket.io los errores NO llegan por el callback del emit, sino por un evento aparte
// ("exception"); por eso cada llamada escucha las dos cosas.
import { io } from 'socket.io-client';

const url = process.env.WS_URL ?? 'http://localhost:3004/reports';

function parseValue(text) {
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (text !== '' && !Number.isNaN(Number(text))) return Number(text);
    return text;
}

function parseArgs(args) {
    return Object.fromEntries(args.map((arg) => {
        const i = arg.indexOf('=');
        if (i < 1) throw new Error(`Argumento inválido "${arg}": usa clave=valor (por ejemplo filmId=1).`);
        return [arg.slice(0, i), parseValue(arg.slice(i + 1))];
    }));
}

const socket = io(url, { transports: ['websocket'], reconnection: false, timeout: 5000 });
await new Promise((resolve) => {
    socket.on('connect', resolve);
    socket.on('connect_error', (err) => {
        console.error(`No se pudo conectar a ${url}: ${err.message}. ¿Está corriendo reporting-service?`);
        process.exit(1);
    });
});

function call(event, args) {
    return new Promise((resolve) => {
        const onException = (body) => {
            if (body?.cause?.pattern !== event) return;
            cleanup();
            resolve({ error: body.message });
        };
        const timer = setTimeout(() => { cleanup(); resolve({ error: 'Sin respuesta en 10 s.' }); }, 10_000);
        const cleanup = () => { clearTimeout(timer); socket.off('exception', onException); };
        socket.on('exception', onException);
        socket.emit(event, args, (response) => { cleanup(); resolve({ response }); });
    });
}

async function run(event, args) {
    console.log(`\n> ${event} ${JSON.stringify(args)}`);
    const result = await call(event, args);
    const text = JSON.stringify(result, null, 2);
    // Los listados son largos: se recortan para que la demo se pueda leer.
    console.log(text.length > 1400 ? `${text.slice(0, 1400)}\n  ... (recortado)` : text);
}

const [event, ...rest] = process.argv.slice(2);
if (event) {
    await run(event, parseArgs(rest));
} else {
    console.log(`Demo contra Socket.io en ${url}`);
    await run('getSalesByStore', { page: 1, limit: 5 });
    await run('getFilmInStock', { filmId: 1, storeId: 1 });
    await run('getCustomerBalance', { customerId: 1, effectiveDate: '2006-01-01' });
    await run('getInventoryInStock', { inventoryId: 1 });
    await run('getFilmInStock', { filmId: 999999, storeId: 1 });     // error: FILM_NOT_FOUND
    await run('getFilmInStock', { filmId: -1, storeId: 1 });         // error: INVALID_PARAMS
}
socket.close();
