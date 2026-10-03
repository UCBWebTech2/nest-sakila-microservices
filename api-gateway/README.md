# api-gateway

Punto de entrada único del ecosistema [`nest-sakila-microservices`](../README.md). Expone una API
**REST con Swagger** y autenticación **JWT**, y por detrás habla con cada microservicio en el
protocolo que ese microservicio usa. No tiene base de datos ni lógica de negocio propia: cada
microservicio tiene un módulo adaptador que traduce REST ↔ su protocolo.

## Resumen

| | |
|---|---|
| **Protocolo hacia afuera** | REST (JSON) + Swagger |
| **Protocolos hacia los microservicios** | GraphQL, gRPC, RabbitMQ, SOAP, WebSocket (Socket.io) |
| **Puerto** | `3000` |
| **Base de datos** | ninguna |
| **Tablas** | ninguna |
| **Stack** | NestJS 12, TypeScript, JWT, Swagger, Joi |

## Microservicios que integra

| Módulo (`src/app/`) | Microservicio | Protocolo | Rutas REST |
|---|---|---|---|
| `business/` | `business-service` | GraphQL | `/api/business/staffs`, `/stores`, `/payments`, `/rentals` |
| `customer/` | `customer-service` | gRPC | `/api/customer/customers`, `/addresses` |
| `customer/` | `customer-service` | RabbitMQ | `/api/customer/cities`, `/countries` |
| `inventory/` | `inventory-service` | SOAP | `/api/inventory/films`, `/actors`, `/categories`, `/languages`, `/items` |
| `reporting/` | `reporting-service` | WebSocket | `/api/reporting/...` (13 reportes de solo lectura) |
| `auth/` | `business-service` (login) | GraphQL | `POST /api/auth/login` |
| `health/` | todos (informativo) | HTTP | `GET /api/health` |

Las rutas de `business`, `customer` e `inventory` tienen CRUD completo (`GET` lista paginada con
`?page=&limit=`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id`); `reporting` es solo lectura. El detalle de cada ruta,
con sus cuerpos y errores posibles, está en Swagger: <http://localhost:3000/api/docs>.

Rutas de `reporting`: `actors/info`, `customers`, `films`, `films/nicer-but-slower`,
`sales/by-category`, `sales/by-store`, `staff`, `films/:filmId/in-stock?storeId=`,
`films/:filmId/not-in-stock?storeId=`, `customers/:customerId/balance?effectiveDate=`,
`customers/rewards?minMonthlyPurchases=&minDollarAmountPurchased=`,
`inventory/:inventoryId/held-by`, `inventory/:inventoryId/in-stock`.

## Autenticación

No hay usuarios propios: el login valida contra la tabla `staff` en `business-service` (su mutation
`staffLogin`, que es quien puede comparar el hash de la contraseña). Si son válidas, el gateway firma
su propio JWT. Hay un solo token de acceso, sin refresh token ni roles.

En Swagger (<http://localhost:3000/api/docs>): `POST /api/auth/login` → *Try it out* → copia el
`accessToken` → botón **Authorize** → pégalo. Desde la terminal:

```bash
# macOS / Linux
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"Mike","password":"Admin1234"}'
# -> { "accessToken": "eyJ..." }
curl -s http://localhost:3000/api/business/stores -H "Authorization: Bearer <accessToken>"
```

```powershell
# Windows (PowerShell)
$T = (Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login `
        -ContentType 'application/json' `
        -Body '{"username":"Mike","password":"Admin1234"}').accessToken
Invoke-RestMethod http://localhost:3000/api/business/stores -Headers @{ Authorization = "Bearer $T" }
```

Todas las rutas piden el token excepto `POST /api/auth/login` y `GET /api/health`.

> Los empleados originales de Sakila (`Mike`, `Jon`) no pueden iniciar sesión hasta que se les asigne una
> contraseña: `npm run set-staff-password -- Mike Admin1234` desde `business-service` (o, con Docker,
> `docker compose exec business-service node dist/scripts/set-staff-password.js Mike Admin1234`). Ver
> *Primer login* en el [README de la raíz](../README.md).

## Health

`GET /api/health` (público) devuelve el estado propio del gateway (memoria, disco) y, en `services`,
si cada microservicio está arriba y qué reporta **su propio** `/api/health`:

```json
{
  "status": "ok",
  "info": { "...": "..." },
  "services": {
    "business-service": { "status": "up", "responseTimeMs": 14, "health": { "status": "ok", "info": { "database": { "status": "up" } } } },
    "customer-service": { "status": "down", "error": "unreachable" }
  }
}
```

- `up`: respondió bien. `health` es el body de su propio `/api/health`.
- `unhealthy`: respondió, pero sus propios chequeos fallan (por ejemplo, perdió la base). `health`
  dice por qué.
- `down`: no respondió (`error`: `unreachable` o `timeout`).

Es **solo informativo**: un microservicio caído o enfermo nunca cambia el `status` ni el HTTP 200 del
gateway, que funciona con cualquier subconjunto de microservicios levantados. Los microservicios se
consultan en paralelo con un timeout de 2 segundos.

## Errores

Cada protocolo transporta el error a su manera y el gateway lo convierte siempre en la misma forma:
`{ statusCode, error, message, path, timestamp }`.

| Protocolo | Cómo llega el error del microservicio |
|---|---|
| GraphQL | `errors[0].extensions` (`code`, `statusCode`) |
| SOAP | `Fault` con el texto `CODIGO: mensaje` |
| WebSocket | evento `exception` con el texto `CODIGO: mensaje` |
| gRPC | status gRPC + el mensaje `CODIGO: texto` |
| RabbitMQ | el objeto `{ statusCode, error, message }` del `RpcException` |

Vocabulario común: `<RECURSO>_NOT_FOUND` → 404, `INVALID_<RECURSO>_ID` → 400 (el cuerpo apunta a un
registro que no existe), `STILL_REFERENCED` → 409 (se intenta borrar algo que otros registros usan),
`INVALID_TOKEN` → 401. Si un microservicio no responde (apagado, conexión rechazada o más de 5–10 s
sin contestar) → **503** `<SERVICIO>_SERVICE_UNAVAILABLE`.

## Configuración (`.env`)

Solo se usa al correr el gateway por separado: se copia de `.env.example` (`cp .env.example .env`; en Windows
PowerShell, `Copy-Item .env.example .env`). Con Docker Compose no hace falta: la configuración ya está en el
`docker-compose.yml`.

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | `3000` | puerto del gateway |
| `API_PREFIX` | `api` | prefijo de todas las rutas |
| `CORS_ORIGINS` | `*` | orígenes permitidos (`*` o lista separada por comas) |
| `JWT_SECRET` | *(cambiar)* | clave con la que se firman los tokens |
| `JWT_TIME_EXPIRE` | `15m` | duración del token |
| `WEBSOCKET_NAMESPACE` | `app` | namespace del Socket.io propio del gateway (`src/plugins/socket`); no tiene relación con el `reports` de `reporting-service` |
| `BUSINESS_SERVICE_GRAPHQL_URL` | `http://localhost:3001/graphql` | dónde está `business-service` |
| `INVENTORY_SERVICE_WSDL_URL` | `http://localhost:3003/soap?wsdl` | dónde está `inventory-service` |
| `REPORTING_SERVICE_WS_URL` | `http://localhost:3004` | dónde está `reporting-service` (se conecta al namespace `/reports`) |
| `CUSTOMER_SERVICE_GRPC_URL` | `localhost:50051` | `customer-service` por gRPC |
| `CUSTOMER_SERVICE_RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | broker de RabbitMQ |
| `CUSTOMER_SERVICE_RABBITMQ_QUEUE` | `customer_queue` | cola de `customer-service` |
| `BUSINESS_SERVICE_HEALTH_URL`, `CUSTOMER_SERVICE_HEALTH_URL`, `INVENTORY_SERVICE_HEALTH_URL`, `REPORTING_SERVICE_HEALTH_URL` | `http://localhost:<puerto>/api/health` | solo para el campo `services` del health |

## Correrlo por separado (sin Docker Compose)

Requiere Node.js 22+. Los microservicios que quieras usar tienen que estar corriendo (el gateway
arranca igual aunque no lo estén).

```bash
cp .env.example .env     # (Windows PowerShell: Copy-Item .env.example .env)
                         # y poner un JWT_SECRET propio
npm install
npm run start:dev
```

Queda en <http://localhost:3000>: Swagger en `/api/docs`, health en `/api/health`.

**Cómo conectarlo a un microservicio:** cada uno se conecta con las variables de la tabla de
arriba; los valores por defecto ya apuntan a los puertos estándar (3001, 3002/50051, 3003, 3004).
Si cambias el puerto de un servicio o lo corres en otra máquina, cambia la variable
correspondiente. Dos cosas tienen que coincidir con `customer-service`: la cola de RabbitMQ
(`CUSTOMER_SERVICE_RABBITMQ_QUEUE` = su `RABBITMQ_QUEUE`) y el puerto gRPC (`CUSTOMER_SERVICE_GRPC_URL`
= su `GRPC_URL`). Con el gateway arriba, `GET /api/health` muestra qué microservicios alcanza.

Guía completa (base de datos, RabbitMQ, cada servicio, primer login):
[README de la raíz](../README.md). Para levantar todo con Docker, ver la opción B de ese README.

## Probarlo de forma individual

### 1. El gateway solo, sin ningún microservicio

No necesita a los microservicios para arrancar. Con solo el gateway levantado:

- Swagger abre normal: <http://localhost:3000/api/docs>.
- `GET /api/health` responde `200` con `"status": "ok"` y marca los 4 microservicios como `down`.
- Cualquier ruta de un microservicio (y el login) responde `503` con su código
  (`BUSINESS_SERVICE_UNAVAILABLE`, `CUSTOMER_SERVICE_UNAVAILABLE`, etc.).

### 2. El gateway con un solo microservicio

Levanta el gateway, **`business-service`** (emite el token: todas las rutas lo piden) y **un** microservicio
más, con la base de datos (`customer-service` además necesita RabbitMQ). Las rutas de ese microservicio
funcionan; las de los demás responden `503`.

| Levantas (además de `business-service`) | Rutas que funcionan |
|---|---|
| `customer-service` (+ RabbitMQ) | `/api/customer/customers`, `/addresses` (gRPC) y `/cities`, `/countries` (RabbitMQ) |
| `inventory-service` | `/api/inventory/*` |
| `reporting-service` | `/api/reporting/*` |

Con solo `business-service` funcionan `/api/business/*` y `POST /api/auth/login`. Cada microservicio tiene en su
README cómo probarlo directo, sin gateway, y las rutas del gateway que le corresponden.

## Estructura

```
src/
├── app/
│   ├── auth/        # login JWT, guard global — sin tabla propia
│   ├── business/    # adaptador GraphQL → REST
│   ├── customer/    # adaptador gRPC + RabbitMQ → REST (incluye proto/customer.proto)
│   ├── inventory/   # adaptador SOAP → REST
│   ├── reporting/   # adaptador WebSocket → REST
│   └── health/      # health del gateway + estado de los microservicios
├── plugins/socket/  # gateway Socket.io propio del gateway
├── config/          # configuración global y validación del entorno
└── shared/          # DTOs, filtro de excepciones, utilidades de Swagger y de errores
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | servidor con recarga automática |
| `npm run build` | compila a `dist/` (copia también el `.proto`) |
| `npm run start:prod` | corre lo compilado |
| `npm run lint` | lint (oxlint) |

Este proyecto no incluye pruebas automatizadas (`npm test` no tiene archivos que ejecutar). Se prueba a mano, con
Swagger y con la sección *Probarlo de forma individual*.
