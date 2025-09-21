# Users API CRUD (NestJS)

API REST construida con **NestJS + TypeScript** que implementa un CRUD de usuarios con:
- **Validaciones** (`class-validator` / `class-transformer`)
- **Manejo de errores** consistente mediante un **HttpExceptionFilter**
- **Documentación** con **Swagger** (`/docs`)
- **Roles/Permisos** (header `x-role`; crear/actualizar/eliminar requieren `ADMIN`)
- **Filtro de búsqueda** en `GET /users?q=...`
- **Testing**: unit tests (service/controller) y e2e (supertest)
- **Docker** (opcional) para ejecutar el backend como contenedor

> Por simplicidad, **el almacenamiento es en memoria** (array en `UsersService`). No requiere base de datos.
> Si quisieras persistencia real, podés enchufar Prisma + Mongo/Postgres más adelante.

---

## Requisitos

- **Node.js 18+** (recomendado LTS)
- **npm 9/10+**
- (Opcional) **Docker 24+**
- Puerto **3000** libre

---

## Estructura del proyecto
```
.
├─ src/
│  ├─ app.module.ts
│  ├─ main.ts
│  ├─ common/
│  │  └─ filters/
│  │     └─ http-exception.filter.ts
│  └─ users/
│     ├─ users.controller.ts
│     ├─ users.service.ts
│     ├─ users.module.ts
│     ├─ dto/
│     │  ├─ create-user.dto.ts
│     │  ├─ update-user.dto.ts
│     │  ├─ list-users.dto.ts             # q (filtro de texto)
│     │  ├─ create-profile.dto.ts
│     │  └─ update-profile.dto.ts
│     └─ entities/
│        ├─ user.entities.ts
│        └─ profile.entity.ts
├─ test/
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## Instalación y ejecución (dev)

```bash
npm install
npm run start:dev
# API en http://localhost:3000
# Swagger en http://localhost:3000/docs
```

---

## Scripts útiles

```bash
npm run start         # Nest en modo prod (requiere compilar antes)
npm run start:dev     # Hot reload con ts-node/tsc-watch
npm run build         # Compila a dist/
npm run format        # Prettier
npm run lint          # ESLint
npm run test          # Unit tests (Jest)
npm run test:watch    # Unit tests en watch
npm run test:e2e      # End-to-end tests (supertest)
npm run test:cov      # Cobertura
```

---

## Documentación (Swagger)

- Abrí: **http://localhost:3000/docs**
- Tag principal: `users`
- En rutas protegidas verás el header `x-role` (pasalo como `ADMIN` para crear/actualizar/eliminar).

---

## Modelo de datos (in-memory)

```ts
type User = {
  id: number;
  nombre: string;
  correoElectronico: string; // único (case-insensitive)
  edad: number;
  perfil: {
    id: number;
    codigo: string;
    nombrePerfil: string;
  };
  createdAt: Date; // ISO string en respuestas HTTP
}
```

---

## Endpoints

Base URL: `http://localhost:3000`

### Users

- `GET /users` — Lista de usuarios
  - Query: `q` (opcional) → filtro por texto (nombre, correo, perfil.codigo / perfil.nombrePerfil)
- `GET /users/:id` — Obtiene un usuario por ID
- `POST /users` — **Crea usuario** (requiere `x-role: ADMIN`)
- `PATCH /users/:id` — **Actualiza usuario parcialmente** (requiere `x-role: ADMIN`)
- `DELETE /users/:id` — **Elimina usuario** (requiere `x-role: ADMIN`)

### Errores estandarizados

Formato del filtro global:
```json
{
  "statusCode": 409,
  "error": "EmailAlreadyExists",
  "message": "El correo 'carlos@example.com' ya está en uso.",
  "field": "correoElectronico",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/users"
}
```

Códigos más comunes:
- `400` Body inválido / validaciones
- `403` Falta rol `ADMIN` en rutas protegidas
- `404` Usuario no encontrado
- `409` Email duplicado
- `500` Error inesperado

---

## Ejemplos (curl)

### 1) Listar (vacío al inicio)
```bash
curl -s http://localhost:3000/users | jq
# []
```

### 2) Crear (rol ADMIN requerido)
```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "x-role: ADMIN" \
  -d '{
    "nombre": "Juan Carlos",
    "correoElectronico": "carlos@example.com",
    "edad": 28,
    "perfil": { "id": 1, "codigo": "ADM", "nombrePerfil": "Administrador" }
  }' | jq
```
Respuesta esperada:
```json
{
  "id": 1,
  "nombre": "Juan Carlos",
  "correoElectronico": "carlos@example.com",
  "edad": 28,
  "perfil": { "id": 1, "codigo": "ADM", "nombrePerfil": "Administrador" },
  "createdAt": "2025-09-21T21:00:00.000Z"
}
```

### 3) Obtener por ID
```bash
curl -s http://localhost:3000/users/1 | jq
```

### 4) Filtro por texto (q)
```bash
# Matchea por "adm" en perfil.codigo / perfil.nombrePerfil
curl -s "http://localhost:3000/users?q=adm" | jq
```

### 5) Actualizar parcialmente (rol ADMIN requerido)
```bash
curl -s -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -H "x-role: ADMIN" \
  -d '{ "nombre": "Juan Carlos Updated", "perfil": { "nombrePerfil": "Admin Global" } }' | jq
```

### 6) Intento de email duplicado (espera 409)
```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "x-role: ADMIN" \
  -d '{
    "nombre": "Otro",
    "correoElectronico": "CARLOS@EXAMPLE.COM",
    "edad": 22,
    "perfil": { "id": 2, "codigo": "USR", "nombrePerfil": "Usuario" }
  }' | jq
```

### 7) Eliminar (rol ADMIN requerido)
```bash
curl -s -X DELETE http://localhost:3000/users/1 -H "x-role: ADMIN" -i
```

> Si no pasás `x-role: ADMIN` en **POST/PATCH/DELETE**, obtendrás `403 Forbidden` (por el `RolesGuard`).

---

## Testing

### Unit
```bash
npm run test
npm run test:watch
npm run test:cov
```

### E2E
```bash
npm run test:e2e
```
- Los tests E2E usan `supertest`, validan el filtro `q`, unicidad de email, permisos vía header `x-role`, y errores (400/404/409).
- Si ves “No tests found”, revisá `test/jest-e2e.json` y/o la ruta del spec.

---

## Ejecutar con Docker (opcional)

> Usá esto si querés empaquetar solo el backend (sin DB, ya que es in-memory).

### Dockerfile mínimo
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Build & Run
```bash
docker build -t users-api:latest .
docker run --rm -p 3000:3000 --name users-api users-api:latest
```

### Variables (opcional)
```bash
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  --name users-api users-api:latest
```

---

## Permisos / Seguridad

- Decorator `@Roles(Role.ADMIN)` + `RolesGuard` usando header `x-role` para proteger **POST/PATCH/DELETE**.
- Lecturas (`GET`) son públicas.
- Si implementás auth real, podés mapear `req.user.role` en el guard y dejar `x-role` solo para tests/manual.

---

## Troubleshooting

- **Swagger no muestra `x-role`** → verificá que `@ApiHeader` está aplicado en `POST/PATCH/DELETE`.
- **400 en PATCH** → chequeá que el body cumpla con DTOs (`UpdateUserDto` permite parciales).
- **409 en create/update** → email duplicado (comparación **case-insensitive**).
- **404** → usuario no encontrado.
- **“No tests found”** → asegurate de tener el spec `test/app.e2e-spec.ts` y el `jest-e2e.json` correcto.
- **Puerto ocupado** → usá `-p 8080:3000` y accedé a `http://localhost:8080`.

---

## Roadmap / extensiones (opcional)

- Persistencia con **Prisma** + Mongo/Postgres
- Autenticación JWT y roles desde token
- Paginación y ordenamiento en `GET /users`
- Validación avanzada en perfil (códigos predefinidos, etc.)

---

Hecho con NestJS.
