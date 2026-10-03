// Prueba inventory-service por SOAP, directo (sin el gateway). Funciona igual en Windows, macOS y Linux.
//
//   npm run try:soap                                       -> demo con varias operaciones
//   npm run try:soap -- ListFilms page=1 limit=3           -> una operación concreta
//   npm run try:soap -- GetFilm id=1
//   npm run try:soap -- CreateLanguage name=Quechua
//
// Operaciones: List/Get/Create/Update/Delete + Film, Actor, Category, Language, Inventory (ver el WSDL).
// Los argumentos van como clave=valor. WSDL: SOAP_WSDL_URL (por defecto http://localhost:3003/soap?wsdl).
import * as soap from 'soap';

const wsdlUrl = process.env.SOAP_WSDL_URL ?? 'http://localhost:3003/soap?wsdl';

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

// El WSDL anuncia siempre http://localhost:3003/soap como destino; se usa la misma dirección de donde
// se leyó el WSDL (importa si el servicio corre en otra máquina o puerto).
const client = await soap.createClientAsync(wsdlUrl, { endpoint: wsdlUrl.replace(/\?wsdl$/, '') }).catch((err) => {
    console.error(`No se pudo leer el WSDL en ${wsdlUrl}: ${err.message}. ¿Está corriendo inventory-service?`);
    process.exit(1);
});

async function run(operation, args) {
    console.log(`\n> ${operation} ${JSON.stringify(args)}`);
    const method = client[`${operation}Async`];
    if (!method) {
        console.log(JSON.stringify({ error: `No existe la operación "${operation}". Mira el WSDL: ${wsdlUrl}` }, null, 2));
        return;
    }
    try {
        const [result] = await method.call(client, args, { timeout: 5000 });
        console.log(JSON.stringify({ response: result }, null, 2));
    } catch (err) {
        // Los errores llegan como SOAP Fault; el código de dominio va en el texto: "CODIGO: mensaje".
        const reason = err?.root?.Envelope?.Body?.Fault?.Reason?.Text;
        console.log(JSON.stringify({ fault: reason ?? err.message }, null, 2));
    }
}

const [operation, ...rest] = process.argv.slice(2);
if (operation) {
    await run(operation, parseArgs(rest));
} else {
    console.log(`Demo contra SOAP en ${wsdlUrl}`);
    await run('ListFilms', { page: 1, limit: 2 });
    await run('GetFilm', { id: 1 });
    await run('ListLanguages', {});
    await run('GetFilm', { id: 999999 });                           // fault: FILM_NOT_FOUND
    await run('CreateFilm', { title: 'X', languageId: 999 });       // fault: INVALID_LANGUAGE_ID
    await run('DeleteLanguage', { id: 1 });                         // fault: STILL_REFERENCED
}
