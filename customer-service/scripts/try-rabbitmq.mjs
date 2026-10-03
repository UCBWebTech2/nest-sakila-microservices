// Prueba customer-service por RabbitMQ, directo (sin el gateway). Funciona igual en Windows, macOS y Linux.
//
//   npm run try:rabbitmq                                          -> demo con varias llamadas
//   npm run try:rabbitmq -- cities.find-one id=463                -> una llamada concreta
//   npm run try:rabbitmq -- countries.find-all page=1 limit=3
//   npm run try:rabbitmq -- cities.create city=Sucre countryId=20
//
// Patrones: cities.* y countries.* (find-all, find-one, create, update, remove). Los argumentos van como
// clave=valor. Broker: RABBITMQ_URL (por defecto amqp://guest:guest@localhost:5672); cola: RABBITMQ_QUEUE
// (por defecto customer_queue).
//
// Es el mismo protocolo que usa el gateway: se publica el mensaje { pattern, data, id } en la cola del
// servicio, indicando una cola de respuesta (replyTo) y un correlationId, y se espera la respuesta.
import { randomUUID } from 'node:crypto';
import amqp from 'amqplib';

const url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
const queue = process.env.RABBITMQ_QUEUE ?? 'customer_queue';

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

const connection = await amqp.connect(url).catch((err) => {
    console.error(`No se pudo conectar a RabbitMQ en ${url}: ${err.message}`);
    process.exit(1);
});
const channel = await connection.createChannel();
const { queue: replyQueue } = await channel.assertQueue('', { exclusive: true });

const pending = new Map();
await channel.consume(replyQueue, (msg) => {
    const resolve = pending.get(msg?.properties.correlationId);
    if (resolve) resolve(JSON.parse(msg.content.toString()));
}, { noAck: true });

function call(pattern, data) {
    return new Promise((resolve) => {
        const correlationId = randomUUID();
        const timer = setTimeout(() => {
            pending.delete(correlationId);
            resolve({ error: `Sin respuesta en 5 s: ¿está corriendo customer-service y escuchando la cola "${queue}"?` });
        }, 5000);
        pending.set(correlationId, (reply) => {
            clearTimeout(timer);
            pending.delete(correlationId);
            // Respuesta de Nest: { response } si salió bien, { err } si el handler lanzó un error.
            resolve(reply.err !== undefined ? { error: reply.err } : { response: reply.response });
        });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify({ pattern, data, id: correlationId })), { correlationId, replyTo: replyQueue });
    });
}

async function run(pattern, data) {
    console.log(`\n> ${pattern} ${JSON.stringify(data)}`);
    console.log(JSON.stringify(await call(pattern, data), null, 2));
}

const [pattern, ...rest] = process.argv.slice(2);
if (pattern) {
    await run(pattern, parseArgs(rest));
} else {
    console.log(`Demo contra RabbitMQ en ${url} (cola ${queue})`);
    await run('countries.find-all', { page: 1, limit: 2 });
    await run('cities.find-one', { id: 463 });
    await run('cities.find-one', { id: 999999 });                       // error: CITY_NOT_FOUND
    await run('cities.create', { city: 'Nowhere', countryId: 999999 }); // error: INVALID_COUNTRY_ID
}

await connection.close();
