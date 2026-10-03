# business-service

Microservicio de **negocio** del ecosistema [`nest-sakila-microservices`](../README.md): quién trabaja
en qué tienda (`staff`, `store`), qué se alquiló (`rental`) y qué se cobró (`payment`). También es
quien **verifica las credenciales** del login del gateway.

## Resumen

| | |
|---|---|
| **Protocolo** | **GraphQL** (Apollo, code-first) |
| **Puerto** | `3001` — GraphQL en `/graphql`, health REST en `/api/health` |
| **Lo consume** | `api-gateway` (rutas `/api/business/*` y `/api/auth/login`) |
| **Base de datos** | PostgreSQL `sakila`, compartida con los demás servicios |
| **Tablas** | `staff`, `store`, `payment`, `rental` (lectura y escritura) |
| **Stack** | NestJS 12, TypeScript, TypeORM, Joi |

## Tablas que usa

| Tabla | Qué guarda | Referencias |
|---|---|---|
| `staff` | empleados (con su `username` y la contraseña en bcrypt) | `store_id` → `store` · `address_id` → `address` *(customer-service)* |
| `store` | tiendas | `manager_staff_id` → `staff` (único: un empleado gerencia una sola tienda) · `address_id` → `address` *(customer-service)* |
| `rental` | alquileres | `staff_id` → `staff` · `customer_id` → `customer` *(customer-service)* · `inventory_id` → `inventory` *(inventory-service)* |
| `payment` | pagos | `staff_id` → `staff` · `rental_id` → `rental` · `customer_id` → `customer` *(customer-service)* |

Las referencias a tablas de otros microservicios (`address`, `customer`, `inventory`) se declaran
como columnas simples (sin relaciones TypeORM). Aun así las **claves foráneas de la base siguen
activas**: ver *Errores*.

Notas de las tablas:

- **`staff.password`** se guarda con **bcrypt** (por eso la columna se ensanchó a `varchar(255)`, el
  único cambio al schema de Sakila; ver `../db/business-service.sql`). Los empleados que trae Sakila
  tienen la contraseña en un formato que el login no entiende y no pueden iniciar sesión hasta que se les
  asigne una. Para eso hay un script que funciona igual en Windows, macOS y Linux:

  ```bash
  npm run set-staff-password -- Mike Admin1234                                          # corriendo el servicio por separado
  docker compose exec business-service node dist/scripts/set-staff-password.js Mike Admin1234   # con Docker Compose
  ```

  (Detalle en *Primer login* del [README de la raíz](../README.md).)
- **`payment`** está particionada por mes en el schema de Sakila (`payment_p2007_01` … `_06`) con
  reglas de inserción. Por eso se inserta sin `RETURNING` y el id se lee con `currval`, y un pago no
  se puede mover a otro mes cambiando su fecha (`PAYMENT_DATE_OUT_OF_RANGE`, 422): hay que borrarlo y
  crear otro. Cambiar el día dentro del mismo mes sí funciona.
- Borrar un `rental` deja en `NULL` el `rental_id` de sus pagos (así está definido en Sakila).

## API (GraphQL)

Endpoint `http://localhost:3001/graphql` (con Playground). El schema se genera al arrancar
(`src/schema.gql`). Para cada recurso hay un listado paginado, una consulta por id y mutations de
alta, edición y baja:

| Tipo | Operación | Qué hace |
|---|---|---|
| Query | `staffs(page, limit)` · `staff(id)` | lista paginada / un empleado |
| Mutation | `createStaff` · `updateStaff(id, …)` · `removeStaff(id)` | CRUD de empleados |
| Mutation | `staffLogin(input: { username, password })` | verifica credenciales y devuelve el empleado; el hash nunca sale del servicio |
| Query | `stores(page, limit)` · `store(id)` | tiendas |
| Mutation | `createStore` · `updateStore` · `removeStore` | CRUD de tiendas |
| Query | `rentals(page, limit)` · `rental(id)` | alquileres |
| Mutation | `createRental` · `updateRental` · `removeRental` | CRUD de alquileres (`updateRental` con `returnDate` registra la devolución) |
| Query | `payments(page, limit)` · `payment(id)` | pagos |
| Mutation | `createPayment` · `updatePayment` · `removePayment` | CRUD de pagos |

Este servicio **no pide autenticación** por sí mismo (la valida el gateway); no lo expongas
directamente fuera de la red del ecosistema.

### Cómo llegan sus rutas por el gateway

`GET/POST /api/business/staffs`, `/stores`, `/rentals`, `/payments` (más `/:id` con `GET`, `PATCH` y
`DELETE`), y `POST /api/auth/login`.

## Errores

Salen como un error de GraphQL; el código y el status HTTP viajan en `errors[0].extensions`
(`code`, `statusCode`), que el gateway convierte en la respuesta REST.

| Código | HTTP | Cuándo |
|---|---|---|
| `STAFF_NOT_FOUND`, `STORE_NOT_FOUND`, `RENTAL_NOT_FOUND`, `PAYMENT_NOT_FOUND` | 404 | el id no existe |
| `INVALID_STORE_ID`, `INVALID_STAFF_ID`, `INVALID_RENTAL_ID` | 400 | el cuerpo apunta a un registro de este servicio que no existe (se valida antes de escribir) |
| `INVALID_ADDRESS_ID`, `INVALID_CUSTOMER_ID`, `INVALID_INVENTORY_ID` | 400 | el cuerpo apunta a un registro de **otro** microservicio que no existe: lo detecta Postgres por la clave foránea |
| `STILL_REFERENCED` | 409 | se borra algo que otros registros usan; el mensaje nombra la tabla |
| `STAFF_ALREADY_EXISTS`, `ALREADY_EXISTS` | 409 | `username` repetido / valor único repetido (p. ej. el gerente de otra tienda) |
| `INVALID_CREDENTIALS` | 401 | usuario o contraseña incorrectos (login) |
| `PAYMENT_DATE_OUT_OF_RANGE` | 422 | se intenta mover un pago a otro mes |

Las claves foráneas del schema original siguen vigentes, así que un id inexistente de otro
microservicio lo rechaza Postgres; el filtro global lee el detalle del error y arma un código como
`INVALID_CUSTOMER_ID` ("Customer 999 does not exist.") en vez de un error de SQL.

## Configuración (`.env`)

Se copia de `.env.example`.

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | `3001` | puerto HTTP |
| `API_PREFIX` | `api` | prefijo del health |
| `CORS_ORIGINS` | `*` | orígenes permitidos |
| `DB_HOST` / `DB_PORT` | `localhost` / `5433` | dónde está PostgreSQL (`5433` es la del `docker-compose.yml`; en una instalación local suele ser `5432`) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `postgres` / *(la de tu PostgreSQL)* / `sakila` | credenciales: la contraseña es la de tu PostgreSQL |
| `DB_LOGS` | `false` | muestra las consultas SQL |

## Correrlo por separado (sin Docker Compose)

Requiere Node.js 22+ y PostgreSQL con `sakila` cargada (schema, datos y `../db/business-service.sql`;
ver *Preparar la base de datos* en el [README de la raíz](../README.md)).

```bash
cp .env.example .env     # (Windows PowerShell: Copy-Item .env.example .env)
                         # y ajustar DB_PORT / DB_PASSWORD a tu PostgreSQL
npm install
npm run start:dev
```

Comprobar que quedó arriba: abre <http://localhost:3001/api/health> en el navegador (en la terminal: macOS / Linux
`curl localhost:3001/api/health`; Windows PowerShell `Invoke-RestMethod http://localhost:3001/api/health`). El
Playground de GraphQL está en <http://localhost:3001/graphql>.

**Conectarlo al gateway:** en `api-gateway/.env`,
`BUSINESS_SERVICE_GRAPHQL_URL=http://localhost:3001/graphql` (es el valor por defecto; cámbialo solo si
cambias `PORT` o corres el servicio en otra máquina). Si este servicio está caído, el login y las
rutas `/api/business/*` responden 503 `BUSINESS_SERVICE_UNAVAILABLE`.

Con Docker Compose (todo el ecosistema junto): ver la opción B del [README de la raíz](../README.md).

## Probarlo de forma individual

### 1. Directo al servicio (sin el gateway)

Con el servicio corriendo (por separado o en Docker):

**Playground, en el navegador (lo más simple):** abre <http://localhost:3001/graphql> y ejecuta, por ejemplo:

```graphql
{ stores(page: 1, limit: 2) { data { id managerStaffId } meta { total } } }
```

**Script incluido** (igual en Windows, macOS y Linux; no necesita instalar nada), desde esta carpeta:

```bash
node scripts/try-graphql.mjs        # o: npm run try:graphql
```

Ejecuta listas y consultas de las cuatro tablas y dos errores a propósito (`STORE_NOT_FOUND` e
`INVALID_CREDENTIALS`). Para tu propia consulta o mutation, guárdala en un archivo y pásala:
`node scripts/try-graphql.mjs --file=consulta.graphql`. Para otra dirección: variable `GRAPHQL_URL`.

**`curl` / PowerShell:**

```bash
# macOS / Linux
curl -s -X POST http://localhost:3001/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ stores(page:1,limit:2){ data { id } meta { total } } }"}'
```

```powershell
# Windows (PowerShell)
Invoke-RestMethod -Method Post -Uri http://localhost:3001/graphql -ContentType 'application/json' `
  -Body '{"query":"{ stores(page:1,limit:2){ data { id } meta { total } } }"}' | ConvertTo-Json -Depth 6
```

Y su health: <http://localhost:3001/api/health>.

### 2. A través del gateway, con solo este servicio arriba

1. Levanta este servicio (con la base de datos) y el gateway. Nada más.
2. Como este servicio **es** el del login, puedes iniciar sesión normalmente (ver *Primer login* en el
   [README de la raíz](../README.md)) y usar el token.
3. Prueba `GET /api/business/stores`, `/staffs`, `/rentals`, `/payments` (y sus `/:id`). Las rutas de los demás
   servicios responden `503` mientras no estén arriba, y `GET /api/health` del gateway los muestra como `down`.

## Estructura

```
src/
├── app/         # health (REST)
├── modules/     # staffs/, stores/, payments/, rentals/  (una carpeta = una tabla)
│   └── <modulo>/
│       ├── entities/     # entidad TypeORM (columnas reales de Sakila)
│       ├── dto/          # tipos de entrada y salida de GraphQL
│       ├── services/     # lógica y acceso a datos
│       ├── resolvers/    # resolvers GraphQL
│       └── exceptions/   # excepciones de dominio
├── database/    # configuración de TypeORM
├── config/      # configuración global y validación del entorno
└── shared/      # filtro de excepciones, utilidades (bcrypt, errores de Postgres)
```

Fuera de `src/`: `scripts/try-graphql.mjs` (probar el servicio por separado). Dentro de `src/scripts/`:
`set-staff-password.ts` (asigna contraseña a un empleado; ver *Primer login* en el README de la raíz).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | servidor con recarga automática |
| `npm run build` | compila a `dist/` |
| `npm run start:prod` | corre lo compilado |
| `npm run lint` | lint (oxlint) |

Este proyecto no incluye pruebas automatizadas (`npm test` no tiene archivos que ejecutar). Se prueba a mano, con
los scripts de *Probarlo de forma individual* y a través del gateway.
