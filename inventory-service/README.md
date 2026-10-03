# inventory-service

Microservicio de **inventario** del ecosistema [`nest-sakila-microservices`](../README.md): el catálogo de
películas (`film`, `actor`, `category`, `language`) y dónde hay copias disponibles (`inventory`).

## Resumen

| | |
|---|---|
| **Protocolo** | **SOAP** (WSDL escrito a mano) |
| **Puerto** | `3003` — SOAP en `/soap`, WSDL en `/soap?wsdl`, health REST en `/api/health` |
| **Lo consume** | `api-gateway` (rutas `/api/inventory/*`) |
| **Base de datos** | PostgreSQL `sakila`, compartida con los demás servicios |
| **Tablas** | `film`, `actor`, `category`, `language`, `inventory` (lectura y escritura) |
| **Stack** | NestJS 12, TypeScript, TypeORM, [`soap`](https://www.npmjs.com/package/soap), Joi |

## Tablas que usa

| Tabla | Qué guarda | Referencias |
|---|---|---|
| `film` | películas | `language_id` y `original_language_id` → `language` |
| `actor` | actores | — |
| `category` | categorías de películas | — |
| `language` | idiomas | — |
| `inventory` | copias físicas de una película en una tienda | `film_id` → `film` · `store_id` → `store` *(business-service)* |

`film_actor` y `film_category` (tablas de unión puras) y `film_text` (no existe en la versión
PostgreSQL de Sakila) no tienen CRUD propio. Las claves foráneas de la base siguen activas, incluida la
que apunta a `store` (de otro microservicio). Otros servicios también apuntan a estas tablas
(`rental` → `inventory`): por eso borrar una copia con alquileres da `STILL_REFERENCED`.

## API (SOAP)

- Endpoint: `http://localhost:3003/soap`
- WSDL: `http://localhost:3003/soap?wsdl` (es la fuente de verdad de cada operación, sus parámetros y tipos)

25 operaciones, 5 por recurso (`Film`, `Actor`, `Category`, `Language`, `Inventory`):

| Operación | Qué hace |
|---|---|
| `List{Recurso}s(page?, limit?)` | lista paginada |
| `Get{Recurso}(id)` | uno por id |
| `Create{Recurso}(...)` | alta |
| `Update{Recurso}(id, ...)` | edición parcial |
| `Delete{Recurso}(id)` | baja |

(La lista de categorías es `ListCategories` y la de inventario `ListInventories`.)

Ejemplo con `curl` (macOS / Linux / Git Bash; en Windows PowerShell las comillas de este ejemplo no funcionan:
prueba el SOAP a través del gateway con Swagger, o con una herramienta como SoapUI o Postman):

```bash
curl -X POST http://localhost:3003/soap \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "SOAPAction: http://inventory-service.sakila/wsdl/ListFilms" \
  -d '<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://inventory-service.sakila/wsdl">
  <soap:Body>
    <tns:ListFilmsRequest><tns:page>1</tns:page><tns:limit>5</tns:limit></tns:ListFilmsRequest>
  </soap:Body>
</soap:Envelope>'
```

Este servicio **no pide autenticación** por sí mismo (la valida el gateway); no lo expongas
directamente fuera de la red del ecosistema.

### Cómo llegan sus rutas por el gateway

| Ruta REST | Tabla |
|---|---|
| `/api/inventory/films` | `film` |
| `/api/inventory/actors` | `actor` |
| `/api/inventory/categories` | `category` |
| `/api/inventory/languages` | `language` |
| `/api/inventory/items` | `inventory` |

Todas con `GET` (lista paginada) y `POST`, y `GET`, `PATCH` y `DELETE` en `/:id`.

## Errores

Los errores salen como un **SOAP Fault**; el código de dominio va en el texto de la razón:

```xml
<soap:Fault>
  <soap:Code><soap:Value>soap:Sender</soap:Value></soap:Code>
  <soap:Reason><soap:Text>FILM_NOT_FOUND: Film not found.</soap:Text></soap:Reason>
</soap:Fault>
```

SOAP no transporta un status HTTP, así que el gateway lo deduce del código:

| Código | HTTP | Cuándo |
|---|---|---|
| `FILM_NOT_FOUND`, `ACTOR_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `LANGUAGE_NOT_FOUND`, `INVENTORY_NOT_FOUND` | 404 | el id no existe |
| `INVALID_LANGUAGE_ID`, `INVALID_FILM_ID` | 400 | el cuerpo apunta a un registro de este servicio que no existe (se valida antes de escribir) |
| `INVALID_STORE_ID` (y otros `INVALID_<TABLA>_ID`) | 400 | referencia a otro microservicio que no existe: lo detecta Postgres por la clave foránea |
| `STILL_REFERENCED` | 409 | se borra algo que otros registros usan; el mensaje nombra la tabla |
| `MISSING_FIELD` | 400 | falta un campo requerido (las operaciones SOAP no pasan por validación de formato) |

## Configuración (`.env`)

Se copia de `.env.example`.

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | `3003` | puerto HTTP (también el de `/soap`) |
| `API_PREFIX` | `api` | prefijo del health (el endpoint SOAP queda siempre en `/soap`) |
| `CORS_ORIGINS` | `*` | orígenes permitidos |
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

Comprobar que quedó arriba: abre <http://localhost:3003/api/health> en el navegador (en la terminal: macOS / Linux
`curl localhost:3003/api/health`; Windows PowerShell `Invoke-RestMethod http://localhost:3003/api/health`). El
WSDL está en <http://localhost:3003/soap?wsdl>.

**Conectarlo al gateway:** en `api-gateway/.env`,
`INVENTORY_SERVICE_WSDL_URL=http://localhost:3003/soap?wsdl` (es el valor por defecto; cámbialo solo
si cambias `PORT` o corres el servicio en otra máquina). Si este servicio está caído, las rutas
`/api/inventory/*` responden 503 `INVENTORY_SERVICE_UNAVAILABLE`.

Con Docker Compose (todo el ecosistema junto): ver la opción B del [README de la raíz](../README.md).

## Por qué `soap` y no `nestjs-soap`

`nestjs-soap` solo envuelve el **cliente** SOAP del paquete `soap`: sirve para consumir un servicio SOAP
externo, no para levantar uno. Además su dependencia tope es `@nestjs/common@^11`, que choca con la v12
de este ecosistema. Por eso el servidor SOAP se arma con el paquete `soap` directo, montado sobre la
instancia de Express que NestJS ya trae (`soap.listen(app.getHttpAdapter().getInstance(), '/soap', ...)`
en `src/main.ts`).

## Probarlo de forma individual

### 1. Directo al servicio (sin el gateway)

Con el servicio corriendo (por separado o en Docker):

- **WSDL, en el navegador:** <http://localhost:3003/soap?wsdl> (lista todas las operaciones y sus tipos).
- **Script incluido** (igual en Windows, macOS y Linux; los argumentos van como `clave=valor`, sin XML ni
  comillas). Usa el paquete `soap` del propio servicio, así que hace falta haber corrido `npm install` en esta
  carpeta. Desde ella:

```bash
npm run try:soap                                  # demo: varias operaciones y tres faults a propósito
npm run try:soap -- ListFilms page=1 limit=3      # una operación concreta
npm run try:soap -- GetFilm id=1
npm run try:soap -- ListLanguages
npm run try:soap -- CreateLanguage name=Quechua
```

Las operaciones son las del WSDL (`List`, `Get`, `Create`, `Update`, `Delete` de `Film`, `Actor`,
`Category`, `Language` e `Inventory`). Los errores se muestran como el texto del *Fault*
(`FILM_NOT_FOUND: Film not found.`, `INVALID_LANGUAGE_ID: ...`, `STILL_REFERENCED: ...`). Otra dirección:
variable `SOAP_WSDL_URL`.

- **`curl`:** el ejemplo de arriba (en la sección *API*), en macOS / Linux / Git Bash.

Y su health: <http://localhost:3003/api/health>.

### 2. A través del gateway (este servicio, más el login)

1. Levanta la base de datos, este servicio, **`business-service`** y el gateway. `business-service` hace falta
   solo para el login: todas las rutas del gateway piden un token y es quien lo emite.
2. Inicia sesión y toma el token (ver *Primer login* e *Iniciar sesión y probar la API* en el
   [README de la raíz](../README.md)).
3. Prueba `GET /api/inventory/films`, `/actors`, `/categories`, `/languages`, `/items` (y sus `/:id`). Las rutas
   de los demás servicios responden `503` mientras no estén arriba, y `GET /api/health` del gateway los muestra
   como `down`.

## Estructura

```
src/
├── app/         # health (REST)
├── modules/     # films/, actors/, categories/, languages/, inventories/  (una carpeta = una tabla)
│   └── <modulo>/
│       ├── entities/     # entidad TypeORM (columnas reales de Sakila)
│       └── services/     # CRUD; devuelve entidades planas
├── soap/        # inventory.wsdl, conexión operación → servicio, serializadores
├── database/    # configuración de TypeORM
├── config/      # configuración global y validación del entorno
└── shared/      # filtro de excepciones, SoapFault, paginación, traducción de errores de Postgres
```

Fuera de `src/`: `scripts/try-soap.mjs` (probar el servicio por separado).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | servidor con recarga automática |
| `npm run build` | compila a `dist/` (copia también el `.wsdl`) |
| `npm run start:prod` | corre lo compilado |
| `npm run lint` | lint (oxlint) |

Este proyecto no incluye pruebas automatizadas (`npm test` no tiene archivos que ejecutar). Se prueba a mano, con
los scripts de *Probarlo de forma individual* y a través del gateway.
