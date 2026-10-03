# customer-service

Microservicio de **clientes** del ecosistema [`nest-sakila-microservices`](../README.md): los clientes
y los datos de ubicación que los acompañan (dirección, ciudad, país). Es el único servicio que habla
**dos protocolos a la vez**: parte de sus tablas se atiende por **gRPC** y la otra parte por
**RabbitMQ**, en un mismo proceso.

## Resumen

| | |
|---|---|
| **Protocolos** | **gRPC** (`customer`, `address`) y **RabbitMQ** (`city`, `country`) |
| **Puertos** | `50051` gRPC · `3002` HTTP, solo `GET /api/health` |
| **Cola de RabbitMQ** | `customer_queue` |
| **Lo consume** | `api-gateway` (rutas `/api/customer/*`) |
| **Base de datos** | PostgreSQL `sakila`, compartida con los demás servicios |
| **Tablas** | `customer`, `address`, `city`, `country` (lectura y escritura) |
| **Stack** | NestJS 12, TypeScript, TypeORM, `@nestjs/microservices`, Joi |

## Qué tabla va por qué protocolo

| Tabla | Protocolo | Contrato | Ruta en el gateway |
|---|---|---|---|
| `customer` | **gRPC** | `service CustomersService` en `src/proto/customer.proto` | `/api/customer/customers` |
| `address` | **gRPC** | `service AddressesService` en `src/proto/customer.proto` | `/api/customer/addresses` |
| `city` | **RabbitMQ** | mensajes `cities.find-all` · `find-one` · `create` · `update` · `remove` | `/api/customer/cities` |
| `country` | **RabbitMQ** | mensajes `countries.find-all` · `find-one` · `create` · `update` · `remove` | `/api/customer/countries` |

`customer` y `address` son las entidades principales y se benefician de un contrato tipado (`.proto`) con
llamadas síncronas; `city` y `country` son datos de catálogo, pequeños y estables, y sirven para ver
mensajería con un broker (petición-respuesta con `send`).

## Tablas que usa

| Tabla | Qué guarda | Referencias |
|---|---|---|
| `customer` | clientes (nombre, email, activo, fecha de alta) | `address_id` → `address` · `store_id` → `store` *(business-service)* |
| `address` | direcciones | `city_id` → `city` |
| `city` | ciudades | `country_id` → `country` |
| `country` | países | — |

Las claves foráneas de la base siguen activas, incluida la que apunta a `store` (de otro
microservicio). Otros servicios también apuntan a estas tablas: `rental` y `payment` →
`customer`, y `staff` y `store` → `address`; por eso borrar un cliente o una dirección en uso
da `STILL_REFERENCED`.

## Contrato gRPC (`src/proto/customer.proto`)

Paquete `customer`. Los campos del `.proto` van en `snake_case` y en el código llegan como `camelCase`.
Las fechas viajan como texto ISO-8601.

| Servicio | Métodos |
|---|---|
| `CustomersService` | `List(PaginationRequest)` · `FindOne(ById)` · `Create` · `Update` · `Remove` |
| `AddressesService` | `List(PaginationRequest)` · `FindOne(ById)` · `Create` · `Update` · `Remove` |

## Mensajes de RabbitMQ

Cola `customer_queue` (durable). Cada patrón recibe un JSON y responde con otro (petición-respuesta):

| Patrón | Recibe | Responde |
|---|---|---|
| `cities.find-all` / `countries.find-all` | `{ page, limit }` | `{ data: [...], meta: { page, limit, total, pages } }` |
| `cities.find-one` / `countries.find-one` | `{ id }` | la ciudad / el país |
| `cities.create` | `{ city, countryId }` | la ciudad creada |
| `countries.create` | `{ country }` | el país creado |
| `cities.update` / `countries.update` | `{ id, ...campos }` | el registro actualizado |
| `cities.remove` / `countries.remove` | `{ id }` | `{ id }` |

## Errores

| Código | gRPC status | RabbitMQ (`statusCode`) | HTTP en el gateway | Cuándo |
|---|---|---|---|---|
| `CUSTOMER_NOT_FOUND`, `ADDRESS_NOT_FOUND`, `CITY_NOT_FOUND`, `COUNTRY_NOT_FOUND` | `NOT_FOUND` | 404 | 404 | el id no existe |
| `INVALID_COUNTRY_ID`, `INVALID_CITY_ID`, `INVALID_ADDRESS_ID` | `INVALID_ARGUMENT` | 400 | 400 | el cuerpo apunta a un padre que no existe (se valida antes de escribir) |
| `INVALID_STORE_ID` (y otros `INVALID_<TABLA>_ID`) | `INVALID_ARGUMENT` | 400 | 400 | referencia a otro microservicio que no existe: lo detecta Postgres por la clave foránea |
| `STILL_REFERENCED` | `FAILED_PRECONDITION` | 409 | 409 | se borra algo que otros registros usan; el mensaje nombra la tabla |
| `VALIDATION_ERROR` | `INVALID_ARGUMENT` | 400 | 400 | cuerpo mal formado |

En gRPC el código de dominio viaja dentro del mensaje, como `"CODIGO: texto"` (un error gRPC solo tiene
estado y mensaje); en RabbitMQ viaja el objeto `{ statusCode, error, message }`. El gateway convierte
ambos a la misma respuesta REST.

## Configuración (`.env`)

Se copia de `.env.example`.

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | `3002` | puerto HTTP (solo health) |
| `API_PREFIX` | `api` | prefijo del health |
| `CORS_ORIGINS` | `*` | orígenes permitidos |
| `DB_HOST` / `DB_PORT` | `localhost` / `5433` | dónde está PostgreSQL (`5433` es la del `docker-compose.yml`; en una instalación local suele ser `5432`) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `postgres` / *(la de tu PostgreSQL)* / `sakila` | credenciales: la contraseña es la de tu PostgreSQL |
| `DB_LOGS` | `false` | muestra las consultas SQL |
| `GRPC_URL` | `0.0.0.0:50051` | dirección donde escucha gRPC |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | broker de RabbitMQ |
| `RABBITMQ_QUEUE` | `customer_queue` | cola que consume el servicio |

## Correrlo por separado (sin Docker Compose)

Requiere Node.js 22+, PostgreSQL con `sakila` cargada y **RabbitMQ** corriendo (ver *Preparar la base
de datos* y *Levantar RabbitMQ* en el [README de la raíz](../README.md)).

```bash
cp .env.example .env     # (Windows PowerShell: Copy-Item .env.example .env)
                         # y ajustar DB_PORT / DB_PASSWORD y RABBITMQ_URL
npm install
npm run start:dev
```

Comprobar que quedó arriba: abre <http://localhost:3002/api/health> en el navegador (en la terminal: macOS / Linux
`curl localhost:3002/api/health`; Windows PowerShell `Invoke-RestMethod http://localhost:3002/api/health`). En el
log deben aparecer dos líneas `Nest microservice successfully started` (gRPC y RabbitMQ). Con RabbitMQ en
marcha, su consola (<http://localhost:15672>) muestra la cola `customer_queue` con un consumidor.

Para probarlo sin el gateway, ver *Probarlo de forma individual* (más abajo).

**Conectarlo al gateway:** en `api-gateway/.env`, tres variables que deben coincidir con las de este
servicio:

| En `api-gateway/.env` | Valor | Debe coincidir con (en este servicio) |
|---|---|---|
| `CUSTOMER_SERVICE_GRPC_URL` | `localhost:50051` | el puerto de `GRPC_URL` |
| `CUSTOMER_SERVICE_RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | `RABBITMQ_URL` (el mismo broker) |
| `CUSTOMER_SERVICE_RABBITMQ_QUEUE` | `customer_queue` | `RABBITMQ_QUEUE` (el mismo nombre de cola) |

Si el servicio está caído, las rutas `/api/customer/*` responden 503 `CUSTOMER_SERVICE_UNAVAILABLE`
(en menos de 5 segundos).

Con Docker Compose (todo el ecosistema junto): ver la opción B del [README de la raíz](../README.md).

## Documentación oficial de NestJS en la que se basa

- [Microservicios: conceptos básicos](https://docs.nestjs.com/microservices/basics)
- [gRPC](https://docs.nestjs.com/microservices/grpc)
- [RabbitMQ](https://docs.nestjs.com/microservices/rabbitmq)
- [Aplicación híbrida](https://docs.nestjs.com/faq/hybrid-application) (HTTP + gRPC + RabbitMQ en un solo proceso)
- [Excepciones en microservicios](https://docs.nestjs.com/microservices/exception-filters)

Los microservicios conectados no heredan los pipes ni los filtros globales de la parte HTTP, así que
cada controlador RPC declara los suyos (`src/shared/rpc/validation-pipes.ts`).

## Probarlo de forma individual

### 1. Directo al servicio (sin el gateway)

Ni gRPC ni RabbitMQ se pueden probar desde el navegador ni con `curl`, así que hay un script para cada uno
(en la carpeta `scripts/`). Funcionan igual en Windows, macOS y Linux: los argumentos van como `clave=valor`
(sin comillas ni JSON) y usan las dependencias del propio servicio, así que hace falta haber corrido
`npm install` en esta carpeta. Valen contra el servicio corriendo por separado o dentro de Docker.

**gRPC** (`customer` y `address`), desde esta carpeta:

```bash
npm run try:grpc                                                  # demo: varias llamadas y dos errores
npm run try:grpc -- CustomersService FindOne id=1                 # una llamada concreta
npm run try:grpc -- CustomersService List page=1 limit=3
npm run try:grpc -- AddressesService FindOne id=5
npm run try:grpc -- CustomersService Create storeId=1 firstName=ANA lastName=PEREZ addressId=5
```

Servicios y métodos: `CustomersService` y `AddressesService` con `List`, `FindOne`, `Create`, `Update` y
`Remove` (contrato en `src/proto/customer.proto`). Otra dirección: variable `GRPC_ADDRESS`
(por defecto `localhost:50051`).

**RabbitMQ** (`city` y `country`), desde esta carpeta:

```bash
npm run try:rabbitmq                                              # demo: varias llamadas y dos errores
npm run try:rabbitmq -- cities.find-one id=463                    # una llamada concreta
npm run try:rabbitmq -- countries.find-all page=1 limit=3
npm run try:rabbitmq -- cities.create city=Sucre countryId=20
```

Patrones: `cities.*` y `countries.*` con `find-all`, `find-one`, `create`, `update` y `remove`. Es el mismo
protocolo que usa el gateway (publica el mensaje en la cola `customer_queue` y espera la respuesta). Otro
broker o cola: variables `RABBITMQ_URL` y `RABBITMQ_QUEUE`. Con RabbitMQ en marcha, su consola
(<http://localhost:15672>, `guest` / `guest`) muestra la cola `customer_queue` con **un consumidor** cuando
este servicio está conectado.

Su health: <http://localhost:3002/api/health>.

### 2. A través del gateway (este servicio, más el login)

1. Levanta la base de datos, RabbitMQ, este servicio, **`business-service`** y el gateway. `business-service`
   hace falta solo para el login: todas las rutas del gateway piden un token y es quien lo emite.
2. Inicia sesión y toma el token (ver *Primer login* e *Iniciar sesión y probar la API* en el
   [README de la raíz](../README.md)).
3. Prueba `GET /api/customer/customers`, `/addresses` (por gRPC) y `/cities`, `/countries` (por RabbitMQ), y sus
   `/:id`. Las rutas de los demás servicios responden `503` mientras no estén arriba, y `GET /api/health` del
   gateway los muestra como `down`.

## Estructura

```
src/
├── main.ts          # aplicación híbrida: HTTP + gRPC + RabbitMQ
├── proto/           # customer.proto (el contrato gRPC)
├── app/             # health (REST)
├── modules/         # customers/, addresses/ (gRPC) · cities/, countries/ (RabbitMQ)
│   └── <modulo>/
│       ├── entities/     # entidad TypeORM (columnas reales de Sakila)
│       ├── dto/          # validación de entrada y respuesta
│       ├── services/     # lógica y acceso a datos
│       ├── controllers/  # handlers gRPC (@GrpcMethod) o RabbitMQ (@MessagePattern)
│       └── exceptions/   # excepciones de dominio
├── database/        # configuración de TypeORM
├── config/          # configuración global y validación del entorno
└── shared/          # DTOs, utilidades RPC (validación, errores, traducción de errores de Postgres)
```

Fuera de `src/`: `scripts/try-grpc.mjs` y `scripts/try-rabbitmq.mjs` (probar el servicio por separado).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | servidor con recarga automática |
| `npm run build` | compila a `dist/` (copia también el `.proto`) |
| `npm run start:prod` | corre lo compilado |
| `npm run lint` | lint (oxlint) |

Este proyecto no incluye pruebas automatizadas (`npm test` no tiene archivos que ejecutar). Se prueba a mano, con
los scripts de *Probarlo de forma individual* y a través del gateway.
