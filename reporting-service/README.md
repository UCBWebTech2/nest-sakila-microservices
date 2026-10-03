# reporting-service

Microservicio de **reportes** del ecosistema [`nest-sakila-microservices`](../README.md): consultas de
**solo lectura** sobre las vistas y funciones que ya trae el schema de Sakila (ventas por tienda,
catálogos combinados, stock, saldo de un cliente, etc.). No tiene tablas propias ni escribe nada.

## Resumen

| | |
|---|---|
| **Protocolo** | **WebSocket** (Socket.io, petición-respuesta con *acknowledgement*) |
| **Puerto** | `3004` — Socket.io en el namespace `/reports`, health REST en `/api/health` |
| **Lo consume** | `api-gateway` (rutas `/api/reporting/*`) |
| **Base de datos** | PostgreSQL `sakila`, compartida con los demás servicios (solo lectura) |
| **Tablas** | ninguna propia: lee **7 vistas** y llama **5 funciones** del schema; el saldo de un cliente lo calcula con una consulta equivalente a la sexta, `get_customer_balance` (y consulta `film`, `store`, `customer`, `inventory`, `rental`, `payment` para validar ids) |
| **Stack** | NestJS 12, TypeScript, `@nestjs/websockets` + Socket.io, TypeORM (solo `DataSource.query`), Joi |

## Vistas y funciones que usa

**Vistas (7):** `actor_info`, `customer_list`, `film_list`, `nicer_but_slower_film_list`,
`sales_by_film_category`, `sales_by_store`, `staff_list`.

**Funciones que llama (5):** `film_in_stock`, `film_not_in_stock`, `inventory_held_by_customer`,
`inventory_in_stock` y `rewards_report`. La sexta, `get_customer_balance`, existe en el schema pero no se llama,
por la razón de abajo.

> **`get_customer_balance`:** la función tal como viene en Sakila no corre en PostgreSQL (usa el
> `IF(cond, a, b)` de MySQL). Como el schema se deja sin modificar, este servicio no la llama: calcula
> el mismo saldo —tarifas de alquiler + 1 por cada día de retraso − pagos hechos— con una consulta
> equivalente (`CUSTOMER_BALANCE_SQL` en `src/modules/reports/services/reports.service.ts`).

## API (WebSocket / Socket.io)

Conexión: `ws://localhost:3004/reports` (namespace `reports`). 13 operaciones, que se llaman como
eventos con *acknowledgement*: el cliente hace `socket.emit(evento, args, callback)` y el resultado
llega por el `callback`.

| Evento | Argumentos | Qué devuelve |
|---|---|---|
| `getActorInfo` | `{ page?, limit? }` | cada actor con sus películas, agrupadas por categoría |
| `getCustomerList` | `{ page?, limit? }` | clientes con dirección, ciudad y país |
| `getFilmList` | `{ page?, limit? }` | películas con categoría y reparto |
| `getNicerButSlowerFilmList` | `{ page?, limit? }` | igual que `getFilmList`, con los nombres de actores en formato título |
| `getSalesByFilmCategory` | `{ page?, limit? }` | ventas totales por categoría |
| `getSalesByStore` | `{ page?, limit? }` | ventas totales por tienda, con su gerente |
| `getStaffList` | `{ page?, limit? }` | empleados con dirección, ciudad y país |
| `getFilmInStock` | `{ filmId, storeId }` | ids de inventario de esa película disponibles en esa tienda |
| `getFilmNotInStock` | `{ filmId, storeId }` | ids de inventario de esa película que están alquilados |
| `getCustomerBalance` | `{ customerId, effectiveDate }` | saldo del cliente a esa fecha |
| `getInventoryHeldByCustomer` | `{ inventoryId }` | id del cliente que tiene esa copia (`null` si está libre) |
| `getInventoryInStock` | `{ inventoryId }` | `true` / `false` |
| `getRewardsReport` | `{ minMonthlyPurchases, minDollarAmountPurchased }` | clientes que cumplen el criterio de recompensa |

Este servicio **no pide autenticación** por sí mismo (la valida el gateway); no lo expongas
directamente fuera de la red del ecosistema.

### Cómo llegan por el gateway

`GET /api/reporting/` + `actors/info`, `customers`, `films`, `films/nicer-but-slower`,
`sales/by-category`, `sales/by-store`, `staff`, `films/:filmId/in-stock?storeId=`,
`films/:filmId/not-in-stock?storeId=`, `customers/:customerId/balance?effectiveDate=`,
`customers/rewards?minMonthlyPurchases=&minDollarAmountPurchased=`, `inventory/:inventoryId/held-by`
y `inventory/:inventoryId/in-stock`.

## Errores

Los errores **no llegan por el `callback`** del `emit`: Socket.io entrega los errores de NestJS en un
evento aparte, `exception`. Un cliente tiene que escuchar los dos:

```javascript
socket.on('exception', (err) => console.log(err));
// err: { status: 'error', message: 'INVALID_PARAMS: filmId must be a positive integer.',
//        cause: { pattern: 'getFilmInStock', data: { filmId: -1, storeId: 1 } } }

socket.emit('getFilmInStock', { filmId: -1, storeId: 1 }, (response) => {
  // en este caso nunca se llama: el error llegó por 'exception'
});
```

El mensaje es `CODIGO: texto`, y `cause.pattern` indica qué evento falló. El gateway ya hace esto por ti
y lo traduce a un error REST:

| Código | HTTP | Cuándo |
|---|---|---|
| `INVALID_PARAMS` | 400 | un parámetro falta o no es un entero positivo |
| `FILM_NOT_FOUND`, `CUSTOMER_NOT_FOUND`, `INVENTORY_NOT_FOUND` | 404 | el id por el que se pregunta no existe (sin esto, el saldo de un cliente inexistente saldría como `0.00` y el stock como `[]`) |
| `INVALID_STORE_ID` | 400 | la tienda elegida como filtro no existe |
| `INTERNAL_SERVER_ERROR` | 500 | error inesperado (el detalle queda en el log del servicio) |

## Configuración (`.env`)

Se copia de `.env.example`.

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | `3004` | puerto HTTP (también el de Socket.io) |
| `API_PREFIX` | `api` | prefijo del health |
| `CORS_ORIGINS` | `*` | orígenes permitidos |
| `WEBSOCKET_NAMESPACE` | `reports` | namespace de Socket.io |
| `DB_HOST` / `DB_PORT` | `localhost` / `5433` | dónde está PostgreSQL (`5433` es la del `docker-compose.yml`; en una instalación local suele ser `5432`) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `postgres` / *(la de tu PostgreSQL)* / `sakila` | credenciales: la contraseña es la de tu PostgreSQL |
| `DB_LOGS` | `false` | muestra las consultas SQL |

## Correrlo por separado (sin Docker Compose)

Requiere Node.js 22+ y PostgreSQL con `sakila` cargada (ver *Preparar la base de datos* en el
[README de la raíz](../README.md)).

```bash
cp .env.example .env     # (Windows PowerShell: Copy-Item .env.example .env)
                         # y ajustar DB_PORT / DB_PASSWORD a tu PostgreSQL
npm install
npm run start:dev
```

Comprobar que quedó arriba: abre <http://localhost:3004/api/health> en el navegador (en la terminal: macOS / Linux
`curl localhost:3004/api/health`; Windows PowerShell `Invoke-RestMethod http://localhost:3004/api/health`).
Para probar un reporte sin el gateway hace falta un cliente de Socket.io: ver *Probarlo de forma individual*
(más abajo), que incluye un script listo.

**Conectarlo al gateway:** en `api-gateway/.env`, `REPORTING_SERVICE_WS_URL=http://localhost:3004`
(es el valor por defecto). El gateway agrega solo el namespace `/reports`, así que
`WEBSOCKET_NAMESPACE` de este servicio debe seguir siendo `reports`. Si este servicio está caído, las
rutas `/api/reporting/*` responden 503 `REPORTING_SERVICE_UNAVAILABLE`.

Con Docker Compose (todo el ecosistema junto): ver la opción B del [README de la raíz](../README.md).

## Probarlo de forma individual

### 1. Directo al servicio (sin el gateway)

Con el servicio corriendo (por separado o en Docker). Un WebSocket no se puede probar con el navegador ni con
`curl`, así que hay un script (carpeta `scripts/`) que funciona igual en Windows, macOS y Linux: los
argumentos van como `clave=valor` (sin comillas ni JSON) y usa `socket.io-client`, que es dependencia de
desarrollo de este servicio, así que hace falta haber corrido `npm install` en esta carpeta. Desde ella:

```bash
npm run try:ws                                                       # demo: varios reportes y dos errores
npm run try:ws -- getSalesByStore                                    # un reporte concreto
npm run try:ws -- getFilmInStock filmId=1 storeId=1
npm run try:ws -- getCustomerBalance customerId=1 effectiveDate=2006-01-01
npm run try:ws -- getFilmList page=1 limit=3
```

Los eventos son los 13 de la tabla de la sección *API*. El script maneja por ti lo que hay que saber de
Socket.io: los errores llegan por el evento `exception`, no por el callback. Otra dirección: variable `WS_URL`
(por defecto `http://localhost:3004/reports`).

Y su health: <http://localhost:3004/api/health>.

### 2. A través del gateway (este servicio, más el login)

1. Levanta la base de datos, este servicio, **`business-service`** y el gateway. `business-service` hace falta
   solo para el login: todas las rutas del gateway piden un token y es quien lo emite.
2. Inicia sesión y toma el token (ver *Primer login* e *Iniciar sesión y probar la API* en el
   [README de la raíz](../README.md)).
3. Prueba, por ejemplo, `GET /api/reporting/sales/by-store`, `/films`, `/customers`,
   `/films/1/in-stock?storeId=1` y `/customers/1/balance?effectiveDate=2006-01-01`. Las rutas de los demás
   servicios responden `503` mientras no estén arriba, y `GET /api/health` del gateway los muestra como `down`.

## Estructura

```
src/
├── app/         # health (REST)
├── modules/reports/
│   ├── services/    # ReportsService: SQL contra las 7 vistas y 6 funciones
│   └── gateways/    # ReportsGateway: un @SubscribeMessage por operación
├── database/    # configuración de TypeORM (solo DataSource, sin entidades)
├── config/      # configuración global y validación del entorno
└── shared/      # filtro de excepciones, WsFault, paginación
```

Fuera de `src/`: `scripts/try-ws.mjs` (probar el servicio por separado).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | servidor con recarga automática |
| `npm run build` | compila a `dist/` |
| `npm run start:prod` | corre lo compilado |
| `npm run lint` | lint (oxlint) |

Este proyecto no incluye pruebas automatizadas (`npm test` no tiene archivos que ejecutar). Se prueba a mano, con
los scripts de *Probarlo de forma individual* y a través del gateway.
