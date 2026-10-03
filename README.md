# nest-sakila-microservices

Ecosistema de microservicios en **NestJS** sobre la base de datos de ejemplo **Sakila** (versión
PostgreSQL), pensado para ver **distintos medios de comunicación entre servicios** funcionando
juntos. Un único punto de entrada (`api-gateway`, REST + Swagger) recibe las peticiones y habla con
cada microservicio en el protocolo que ese microservicio usa.

Funciona en **Windows, macOS y Linux**. Hay dos formas de correrlo:

- **[Opción B — todo con Docker Compose](#opción-b--todo-con-docker-compose)** (la más corta: no
  necesitas instalar Node, PostgreSQL ni RabbitMQ, solo Docker).
- **[Opción A — cada servicio por separado](#opción-a--cada-servicio-por-separado-sin-docker-compose)**
  (sin Docker Compose: para trabajar sobre el código de un servicio, depurar, etc.).

```
                          ┌─────────────────┐
   cliente (REST/JSON) ──▶│   api-gateway   │  :3000  REST + Swagger + JWT
                          └────────┬────────┘
        ┌───────────────┬──────────┼──────────────┬─────────────────┐
        │ GraphQL       │ gRPC +   │ SOAP         │ WebSocket       │
        ▼               ▼ RabbitMQ ▼              ▼
 business-service  customer-service  inventory-service  reporting-service
      :3001          :3002 / :50051        :3003              :3004
        └───────────────┴──────────┴──────────────┴─────────────────┘
                                   │
                         PostgreSQL (una sola base: sakila)
```

| Servicio | Protocolo con el gateway | Puerto | Tablas de Sakila |
|---|---|---|---|
| [`api-gateway`](api-gateway/README.md) | REST + Swagger (entrada única) | `3000` | ninguna |
| [`business-service`](business-service/README.md) | GraphQL | `3001` | `staff`, `store`, `payment`, `rental` |
| [`customer-service`](customer-service/README.md) | gRPC (`customer`, `address`) + RabbitMQ (`city`, `country`) | `3002` (solo health), `50051` (gRPC) | `customer`, `address`, `city`, `country` |
| [`inventory-service`](inventory-service/README.md) | SOAP | `3003` | `film`, `actor`, `category`, `language`, `inventory` |
| [`reporting-service`](reporting-service/README.md) | WebSocket (Socket.io) | `3004` | 7 vistas y 6 funciones (solo lectura) |

Cada servicio tiene su propio README con el detalle de su contrato, sus tablas, su configuración y
cómo correrlo.

## Estructura

```
nest-sakila-microservices/
├── api-gateway/          # REST + Swagger + JWT; un módulo adaptador por microservicio
├── business-service/     # GraphQL
├── customer-service/     # gRPC + RabbitMQ
├── inventory-service/    # SOAP
├── reporting-service/    # WebSocket
├── db/                   # dump oficial de Sakila + el único ajuste al schema
├── docker-compose.yml    # levanta todo (base de datos, RabbitMQ, los 5 servicios); no usa los .env de los servicios
└── .env.example          # OPCIONAL: valores que se pueden cambiar del compose (no hace falta para usarlo)
```

## La base de datos

Todos los servicios usan **la misma base PostgreSQL** (`sakila`), con el **schema oficial de Sakila
sin modificar**: todas sus claves foráneas, restricciones, vistas y funciones quedan como vienen. La
única diferencia es una columna:

```sql
ALTER TABLE staff ALTER COLUMN password TYPE varchar(255);   -- db/business-service.sql
```

(`staff.password` es `varchar(40)` en Sakila, pensado para un SHA-1; un hash de bcrypt mide 60
caracteres.)

Como las claves foráneas siguen activas, un id que apunta a algo que no existe —incluso si ese algo
pertenece a otro microservicio— lo rechaza Postgres, y el servicio traduce el error: el cliente recibe
`400 INVALID_STORE_ID` ("Store 999 does not exist.") en vez de un error de SQL. Borrar algo que otros
registros usan da `409 STILL_REFERENCED`, indicando qué tabla lo sigue usando.

| Archivo de `db/` | Qué es |
|---|---|
| `postgres-sakila-schema.sql` | schema oficial de Sakila para PostgreSQL |
| `postgres-sakila-insert-data.sql` | datos de ejemplo |
| `business-service.sql` | el ajuste del password (se corre después de los dos anteriores) |

## Cómo leer los comandos de este README

Casi todo es idéntico en los tres sistemas (`docker`, `docker compose`, `npm`, `node`, `psql`). Solo
cambia la sintaxis de la terminal en unos pocos comandos (copiar archivos, llamar a la API); en esos
casos hay dos versiones:

| Sistema | Terminal | Bloque a usar |
|---|---|---|
| **macOS** | Terminal (zsh o bash) | **macOS / Linux** |
| **Linux** | cualquier terminal (bash, zsh) | **macOS / Linux** |
| **Windows** | **PowerShell** (no CMD) | **Windows (PowerShell)** |
| Windows con Git Bash o WSL | Git Bash / terminal de WSL | **macOS / Linux** |

Todos los comandos se ejecutan **desde la carpeta raíz del proyecto** (la que contiene este README),
salvo los que dicen `cd <servicio>`.

## Requisitos

Se asume que lo necesario **ya está instalado**:

| Para… | Debe estar instalado |
|---|---|
| **Opción B (Docker Compose)** | **Docker** con Compose (`docker compose`), **en ejecución** |
| **Opción A (por separado)** | **Node.js 22 o superior** con npm (se recomienda Node 24, el mismo que usan las imágenes de Docker), **PostgreSQL** con un usuario y su contraseña, y **Docker** (solo para levantar RabbitMQ con un `docker run`) |

Para comprobar que están disponibles: `docker --version`, `docker compose version`, `node --version`,
`npm --version` y `psql --version`.

---

# Opción B — Todo con Docker Compose

Un único `docker-compose.yml` levanta la base de datos (PostgreSQL 18, cargada sola con `db/`),
RabbitMQ y los cinco servicios. Solo necesitas **Docker en marcha**.

El compose es **independiente de los `.env` de cada servicio**: esos archivos son solo para correr un
servicio por separado (opción A). Aquí toda la configuración, y las conexiones entre servicios, ya están
escritas en el propio `docker-compose.yml`. **No hay que crear ni editar ningún archivo.**

## B.1 Levantar todo

Desde la carpeta raíz del proyecto, **igual en los tres sistemas**:

```bash
docker compose up -d --build
docker compose ps          # esperar a que los 7 digan "healthy"
```

La primera vez construye las imágenes y carga la base (unos minutos). Para ver el arranque:
`docker compose logs -f` (Ctrl+C para salir; no apaga nada).

**Cómo está armado:**

- **Una red propia**, `nest-sakila-network`, que une a los 7 contenedores. Dentro de ella cada servicio
  se encuentra por el nombre de su servicio (`db`, `rabbitmq`, `business-service`...) y por su puerto
  interno; por eso el gateway ya sabe dónde está cada microservicio.
- **Cada servicio publica su puerto** para poder probarlo por separado desde tu máquina (tabla de
  abajo). Se publican solo en `127.0.0.1`: se pueden usar desde este equipo, pero no quedan abiertos a
  otros equipos de la red (los servicios no tienen autenticación propia). Para abrirlos, quita el
  `127.0.0.1:` de `docker-compose.yml`.
- **La base de datos** usa el puerto **5433** del host (no el 5432) para no chocar con un PostgreSQL ya
  instalado en tu máquina. Dentro de la red sigue siendo `db:5432`.

**Valores por defecto** (para desarrollo; se pueden cambiar sin editar el compose, ver abajo):

| Qué | Valor por defecto |
|---|---|
| PostgreSQL | usuario `postgres`, contraseña `postgres`, base `sakila` |
| RabbitMQ | `guest` / `guest` |
| `JWT_SECRET` del gateway | una clave de desarrollo incluida en el compose |

Para cambiar alguno, define la variable al ejecutar o crea un archivo `.env` junto al compose (copia
`.env.example`; es **opcional**):

| macOS / Linux | Windows (PowerShell) |
|---|---|
| `DB_PASSWORD=otraclave docker compose up -d --build` | `$env:DB_PASSWORD='otraclave'; docker compose up -d --build` |

(`DB_PASSWORD` solo se aplica cuando se crea el volumen de la base; ver *Ojo* en B.4.)

## B.2 Qué queda corriendo

| Qué | Dónde (desde tu máquina) |
|---|---|
| Gateway (REST) | <http://localhost:3000> · Swagger <http://localhost:3000/api/docs> · health <http://localhost:3000/api/health> |
| `business-service` (GraphQL) | <http://localhost:3001/graphql> · `/api/health` |
| `customer-service` (gRPC + RabbitMQ) | gRPC en `localhost:50051` · <http://localhost:3002/api/health> |
| `inventory-service` (SOAP) | <http://localhost:3003/soap?wsdl> · `/api/health` |
| `reporting-service` (WebSocket) | `ws://localhost:3004/reports` · `/api/health` |
| PostgreSQL | `localhost:5433` (usuario `postgres`, contraseña `postgres`, base `sakila`) |
| RabbitMQ | `localhost:5672` · consola <http://localhost:15672> (`guest` / `guest`) |

Cada microservicio se puede probar **directamente**, sin pasar por el gateway: ver *Probar un servicio de
forma individual* más abajo.

## B.3 Primer login

Todas las rutas del gateway piden un token, que se obtiene iniciando sesión con un empleado
(`staff`). Los empleados de Sakila (`Mike` y `Jon`) traen la contraseña en un formato que el login no
entiende, así que **la primera vez hay que asignarle una contraseña a uno de ellos**. Este comando es
**igual en los tres sistemas** (reemplaza `Admin1234` por la contraseña que quieras):

```bash
docker compose exec business-service node dist/scripts/set-staff-password.js Mike Admin1234
```

Debe responder `Password updated for "Mike"`. Luego sigue en **[Iniciar sesión y probar](#iniciar-sesión-y-probar-la-api)**.

## B.4 Comandos útiles

Iguales en los tres sistemas:

```bash
docker compose ps                                  # estado de cada contenedor
docker compose logs -f api-gateway                 # logs de un servicio
docker compose up -d --build business-service      # reconstruir y reiniciar solo uno
docker compose stop customer-service               # apagar uno (el gateway sigue y lo marca "down")
docker compose up -d --no-deps api-gateway         # levantar el gateway sin arrancar los demás
docker compose down                                # apagar todo (los datos de la base se conservan)
docker compose down -v                             # apagar todo Y borrar la base (vuelve a cargarse limpia)
```

La base se carga **una sola vez**, la primera vez que arranca con el volumen vacío. Si cambias algo en
`db/` o quieres volver a los datos originales, usa `docker compose down -v` y vuelve a levantar.

Ojo con `DB_PASSWORD`: PostgreSQL toma la contraseña solo cuando crea el volumen. Si la cambias después
de la primera vez, los servicios dejarán de poder conectarse (`password authentication failed`) hasta que
recrees el volumen con `docker compose down -v`.

---

# Opción A — Cada servicio por separado (sin Docker Compose)

Los servicios no dependen entre sí para arrancar: el gateway arranca aunque no haya ningún
microservicio levantado, y cada ruta del gateway funciona cuando *su* microservicio está arriba. Se
puede levantar solo lo que se necesite. Cada servicio corre en **su propia terminal** (abre una
ventana o pestaña por servicio).

## A.1 Preparar la base de datos

Desde la carpeta raíz del proyecto, con tu PostgreSQL en marcha, carga la base **en este
orden**. Los comandos son iguales en los tres sistemas; `psql` te pedirá la contraseña de tu usuario
`postgres` cada vez:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE sakila;"
psql -U postgres -h localhost -d sakila -f db/postgres-sakila-schema.sql
psql -U postgres -h localhost -d sakila -f db/postgres-sakila-insert-data.sql
psql -U postgres -h localhost -d sakila -f db/business-service.sql
```

Si tu PostgreSQL no usa el puerto 5432, agrega `-p <puerto>` a cada comando (por ejemplo `-p 5433`).
Los scripts son ASCII y con saltos de línea LF, así que no hay problemas de codificación en Windows.
Para empezar de cero: `psql -U postgres -h localhost -c "DROP DATABASE sakila;"` y repetir.

## A.2 Levantar RabbitMQ (solo `customer-service`)

Un único contenedor independiente, con `docker run` (no hace falta el compose). Es **igual en los tres
sistemas**:

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:4-management-alpine
```

Queda en `localhost:5672` con usuario y contraseña `guest` / `guest`, y su consola web en
<http://localhost:15672>. Para apagarlo o volver a encenderlo: `docker stop rabbitmq` /
`docker start rabbitmq`.

## A.3 Levantar cada microservicio

Los cuatro microservicios (`business-service`, `customer-service`, `inventory-service`,
`reporting-service`) siguen el mismo procedimiento. Desde la raíz, entra a uno (aquí, `business-service`):

```bash
cd business-service
```

Crea su `.env` a partir del ejemplo:

| macOS / Linux | Windows (PowerShell) |
|---|---|
| `cp .env.example .env` | `Copy-Item .env.example .env` |

Abre ese `.env` y revisa la conexión a la base de datos (ver tabla abajo). Después, **igual en los tres
sistemas**:

```bash
npm install
npm run start:dev
```

Deja esa terminal abierta (es el servidor). Repite en otra terminal para cada servicio.

Variables del `.env` de **business**, **customer**, **inventory** y **reporting** que debes revisar:

| Variable | Valor |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | el puerto de **tu** PostgreSQL (`5432` por defecto en una instalación normal) |
| `DB_USER` | tu usuario de PostgreSQL (normalmente `postgres`) |
| `DB_PASSWORD` | **la contraseña de tu PostgreSQL** (el `.env.example` solo trae un valor de ejemplo) |
| `DB_NAME` | `sakila` |

> `DB_PORT` viene en `5433` en los `.env.example` porque es el puerto en el que el
> `docker-compose.yml` publica su propia base (para no chocar con un PostgreSQL ya instalado). Si usas
> tu propio PostgreSQL, cámbialo (normalmente `5432`).

`customer-service` además necesita RabbitMQ (`RABBITMQ_URL`, por defecto `amqp://guest:guest@localhost:5672`).

Para comprobar que cada uno quedó arriba, abre su health en el navegador o pídelo desde la terminal:

| Servicio | Puerto | Health (navegador) | Otros |
|---|---|---|---|
| `business-service` | 3001 | <http://localhost:3001/api/health> | GraphQL: <http://localhost:3001/graphql> |
| `customer-service` | 3002 y 50051 | <http://localhost:3002/api/health> | gRPC en `localhost:50051` |
| `inventory-service` | 3003 | <http://localhost:3003/api/health> | WSDL: <http://localhost:3003/soap?wsdl> |
| `reporting-service` | 3004 | <http://localhost:3004/api/health> | Socket.io: `ws://localhost:3004/reports` |

Desde la terminal: `curl http://localhost:3001/api/health` (macOS / Linux) o
`Invoke-RestMethod http://localhost:3001/api/health` (Windows PowerShell). Responde
`"status":"ok"` cuando está bien (incluye el estado de su conexión a la base de datos).

## A.4 Levantar el gateway y conectarlo a los microservicios

Igual que los demás (desde la raíz: `cd api-gateway`, copiar `.env.example` a `.env` con el comando de
tu sistema, `npm install`, `npm run start:dev`).

El gateway sabe dónde está cada microservicio por las variables de su `.env`. Los valores por
defecto ya apuntan a los puertos de arriba; solo hay que tocarlos si cambiaste el puerto de algún
servicio o lo corres en otra máquina:

| Variable del gateway | Valor por defecto | Debe coincidir con |
|---|---|---|
| `BUSINESS_SERVICE_GRAPHQL_URL` | `http://localhost:3001/graphql` | puerto de `business-service` |
| `INVENTORY_SERVICE_WSDL_URL` | `http://localhost:3003/soap?wsdl` | puerto de `inventory-service` |
| `REPORTING_SERVICE_WS_URL` | `http://localhost:3004` | puerto de `reporting-service` (el gateway agrega el namespace `/reports`, que es el `WEBSOCKET_NAMESPACE` del servicio) |
| `CUSTOMER_SERVICE_GRPC_URL` | `localhost:50051` | `GRPC_URL` de `customer-service` |
| `CUSTOMER_SERVICE_RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | `RABBITMQ_URL` de `customer-service` (mismo broker) |
| `CUSTOMER_SERVICE_RABBITMQ_QUEUE` | `customer_queue` | `RABBITMQ_QUEUE` de `customer-service` (mismo nombre de cola) |
| `*_SERVICE_HEALTH_URL` (4) | `http://localhost:<puerto>/api/health` | solo para el health del gateway (ver abajo) |
| `JWT_SECRET` | *(cambiar)* | cualquier cadena larga y secreta (la firma de los tokens) |

Con el gateway arriba:

- Swagger (todas las rutas, probables desde el navegador): <http://localhost:3000/api/docs>
- Estado del ecosistema: <http://localhost:3000/api/health>

## A.5 Primer login

Igual que en Docker: hay que asignarle una contraseña a un empleado la primera vez. Desde la carpeta
`business-service` (con su `.env` ya apuntando a tu base de datos), **igual en los tres sistemas**
(reemplaza `Admin1234`):

```bash
cd business-service
npm run set-staff-password -- Mike Admin1234
```

Debe responder `Password updated for "Mike"`. Si dice `password authentication failed`, revisa
`DB_PASSWORD` en el `.env` de `business-service`.

Luego sigue en **[Iniciar sesión y probar](#iniciar-sesión-y-probar-la-api)**.

---

# Iniciar sesión y probar la API

(Vale para las dos opciones.) Todas las rutas del gateway piden un token JWT, excepto el login y
`/api/health`. El token dura lo que diga `JWT_TIME_EXPIRE` (15 minutos por defecto); cuando expire,
vuelve a iniciar sesión.

## Lo más simple en cualquier sistema: Swagger

1. Abre <http://localhost:3000/api/docs>.
2. En `POST /api/auth/login` → **Try it out**, escribe `{"username":"Mike","password":"Admin1234"}` y
   **Execute**. Copia el `accessToken` de la respuesta.
3. Arriba a la derecha, **Authorize**, pega el token, **Authorize** y cierra.
4. Ya puedes probar cualquier ruta con **Try it out**.

## Desde la terminal

**macOS / Linux:**

```bash
# 1) login -> responde { "accessToken": "..." }
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"Mike","password":"Admin1234"}'

# 2) copiar el token y probar un protocolo distinto en cada línea
T=<accessToken>
curl -s http://localhost:3000/api/business/stores         -H "Authorization: Bearer $T"   # GraphQL
curl -s http://localhost:3000/api/customer/customers/1    -H "Authorization: Bearer $T"   # gRPC
curl -s http://localhost:3000/api/customer/countries/20   -H "Authorization: Bearer $T"   # RabbitMQ
curl -s http://localhost:3000/api/inventory/films/1       -H "Authorization: Bearer $T"   # SOAP
curl -s http://localhost:3000/api/reporting/sales/by-store -H "Authorization: Bearer $T"  # WebSocket
```

**Windows (PowerShell):**

```powershell
# 1) login (guarda el token en $T)
$T = (Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login `
        -ContentType 'application/json' `
        -Body '{"username":"Mike","password":"Admin1234"}').accessToken
$H = @{ Authorization = "Bearer $T" }

# 2) un protocolo distinto en cada línea
Invoke-RestMethod http://localhost:3000/api/business/stores          -Headers $H   # GraphQL
Invoke-RestMethod http://localhost:3000/api/customer/customers/1     -Headers $H   # gRPC
Invoke-RestMethod http://localhost:3000/api/customer/countries/20    -Headers $H   # RabbitMQ
Invoke-RestMethod http://localhost:3000/api/inventory/films/1        -Headers $H   # SOAP
Invoke-RestMethod http://localhost:3000/api/reporting/sales/by-store -Headers $H   # WebSocket
```

> En Windows PowerShell, `curl` es un alias de otro comando (`Invoke-WebRequest`) y no acepta las
> mismas opciones; por eso se usa `Invoke-RestMethod`. (Si prefieres `curl`, escribe `curl.exe`.)

---

## Probar un servicio de forma individual

Cada microservicio se puede ejecutar **y probar por sí solo**, sin el gateway y sin los demás. En el README
de cada uno hay una sección *Probarlo de forma individual* con dos partes: probarlo **directo** (su
protocolo, con una herramienta o con un script incluido) y probarlo **a través del gateway** (ese servicio,
más `business-service` para el login).

| Servicio | Directo | Script incluido (desde su carpeta) |
|---|---|---|
| [`business-service`](business-service/README.md#probarlo-de-forma-individual) | Playground GraphQL en el navegador | `npm run try:graphql` |
| [`customer-service`](customer-service/README.md#probarlo-de-forma-individual) | gRPC y RabbitMQ (no hay herramienta de navegador) | `npm run try:grpc` · `npm run try:rabbitmq` |
| [`inventory-service`](inventory-service/README.md#probarlo-de-forma-individual) | WSDL en el navegador | `npm run try:soap` |
| [`reporting-service`](reporting-service/README.md#probarlo-de-forma-individual) | cliente Socket.io | `npm run try:ws` |
| [`api-gateway`](api-gateway/README.md#probarlo-de-forma-individual) | Swagger en el navegador | — |

Los scripts son archivos de Node (carpeta `scripts/` de cada servicio): funcionan igual en Windows, macOS y
Linux, no dependen de la sintaxis de la terminal (los argumentos van como `clave=valor`) y usan las
dependencias que el servicio ya tiene (hace falta haber corrido `npm install` en esa carpeta; el de
`business-service` no necesita ni eso). Funcionan igual contra el servicio corriendo por separado o dentro
de Docker, porque Docker publica el puerto de cada servicio.

**A través del gateway.** Todas las rutas del gateway piden un token y quien lo emite es `business-service`
(su login). Por eso, para probar cualquier servicio por el gateway hay que tener levantado también
`business-service` e iniciar sesión (ver *Primer login* e *Iniciar sesión y probar la API*). El gateway arranca
igual si falta cualquiera de los demás servicios: sus rutas responden `503` y el health los marca como `down`.

## El health del gateway muestra qué está levantado

`GET /api/health` devuelve el estado del propio gateway y, en `services`, si cada microservicio está
arriba y qué reporta **su propio** `/api/health`:

```json
{
  "status": "ok",
  "services": {
    "business-service": { "status": "up", "responseTimeMs": 14, "health": { "status": "ok", "info": { "database": { "status": "up" } } } },
    "customer-service": { "status": "down", "error": "unreachable" }
  }
}
```

`up` = respondió bien · `unhealthy` = respondió pero sus propios chequeos fallan (por ejemplo, perdió la
base de datos) · `down` = no respondió. Es **solo informativo**: que un microservicio esté caído no
cambia el `status` ni el HTTP 200 del gateway, que sigue sirviendo las rutas de los demás. Las rutas de
un microservicio apagado responden `503` con un código claro (por ejemplo `CUSTOMER_SERVICE_UNAVAILABLE`).

## Formato de los errores

Todos los errores salen del gateway con la misma forma, sin importar el protocolo del microservicio:

```json
{ "statusCode": 400, "error": "INVALID_STORE_ID", "message": "Store 999 does not exist.", "path": "/api/customer/customers", "timestamp": "..." }
```

| `error` | HTTP | Cuándo |
|---|---|---|
| `<RECURSO>_NOT_FOUND` | 404 | el id pedido no existe |
| `INVALID_<RECURSO>_ID` | 400 | el cuerpo apunta a un registro que no existe (`INVALID_STORE_ID`, `INVALID_ADDRESS_ID`...) |
| `STILL_REFERENCED` | 409 | se intenta borrar algo que otros registros todavía usan |
| `*_ALREADY_EXISTS` / `ALREADY_EXISTS` | 409 | valor duplicado |
| `<SERVICIO>_SERVICE_UNAVAILABLE` | 503 | el microservicio no responde |
| `INVALID_TOKEN` | 401 | falta el JWT o es inválido / expiró |

## Problemas frecuentes

**En cualquier sistema**

- **`503 ..._SERVICE_UNAVAILABLE`**: ese microservicio no está levantado (míralo en `/api/health`) o el
  gateway apunta a un puerto equivocado.
- **`401 INVALID_CREDENTIALS` al iniciar sesión**: todavía no le asignaste una contraseña a un empleado
  (B.3 / A.5), o escribiste otra.
- **`401 INVALID_TOKEN` en cualquier otra ruta**: falta el header `Authorization: Bearer <token>`, o el token
  expiró (dura 15 minutos): vuelve a iniciar sesión.
- **El microservicio no conecta a la base (`ECONNREFUSED`, `ENOTFOUND`, `password authentication
  failed`)**: (corriendo el servicio por separado) revisa `DB_HOST`, `DB_PORT` y `DB_PASSWORD` de su
  `.env`. Con la base de Docker, desde tu máquina es `localhost:5433`, usuario `postgres` y contraseña `postgres` (salvo que hayas definido otra).
- **Puerto ocupado** (`EADDRINUSE`, `port is already allocated`): cada servicio usa un puerto fijo
  (3000–3004, 50051, 5433, 5672, 15672). Dos copias a la vez chocan, por ejemplo un servicio por
  separado y el mismo en Docker. Para ver quién usa un puerto: macOS / Linux `lsof -i :3000`; Windows
  `netstat -ano | findstr :3000`.
- **`npm install` modifica el `package-lock.json`**: es normal que npm lo ajuste un poco según su
  versión. Las imágenes de Docker usan Node 24 (npm 11), que acepta los lockfiles tanto de npm 10 como de
  npm 11, así que no afecta a `docker compose up --build`. Si no quieres tocarlo, `npm ci` instala
  exactamente lo que dice el lockfile sin modificarlo.
- **`npm install` muestra avisos `allow-scripts` / `npm warn`**: son solo avisos de npm sobre scripts de
  instalación de dependencias; la instalación termina bien y los servicios arrancan normalmente.
- **Quiero empezar de cero con Docker**: `docker compose down -v` y luego `docker compose up -d --build`.

**Windows**

- **"cannot connect to the Docker daemon"**: Docker Desktop no está abierto o todavía está iniciando.
  Ábrelo y espera a que diga que está en ejecución.
- **`psql` no se reconoce**: agrega `C:\Program Files\PostgreSQL\<versión>\bin` al `PATH` y abre una
  terminal nueva.
- **`npm install` intenta compilar `bcrypt` y falla**: normalmente baja un binario ya compilado; si no puede,
  instala las *Visual Studio Build Tools* (carga de trabajo "Desarrollo para el escritorio con C++") y
  vuelve a intentar.
- **Los scripts `.sql` o el `.env` tienen saltos de línea CRLF**: el repositorio trae un `.gitattributes`
  que fuerza LF al clonar; si copiaste los archivos a mano, conviértelos a LF.

**Linux**

- **`permission denied` al hablar con Docker**: agrega tu usuario al grupo `docker`
  (`sudo usermod -aG docker $USER`) y vuelve a iniciar sesión, o usa `sudo`.
- **`psql: FATAL: Peer authentication failed`**: en Linux `psql` usa por defecto el socket local; el
  comando de este README pasa `-h localhost` para usar la conexión con contraseña. Ponle una contraseña
  a `postgres`: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'MiClave123';"`.

**macOS**

- **"Cannot connect to the Docker daemon"**: abre Docker Desktop y espera a que termine de iniciar.
- **Chip Apple Silicon (M1/M2/M3)**: las imágenes que usa el compose (`node`, `postgres`, `rabbitmq`)
  tienen versión para ARM; no hace falta ningún ajuste.
