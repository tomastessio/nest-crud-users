# Users API CRUD (NestJS)

API REST con NestJS que implementa un CRUD de usuarios, incluye validaciones, manejo de errores consistente, documentación Swagger, pruebas unitarias y e2e. La persistencia es en memoria (array) para simplificar la prueba técnica; está preparada para enchufar un ORM más adelante.

## Tecnologías y librerías

- **Node.js** + **TypeScript**
- **NestJS** (Controllers, Services, Modules)
- **class-validator / class-transformer** (validaciones)
- **@nestjs/swagger** (documentación)
- **Jest** (unit tests) + **Supertest** (e2e tests)

## Requisitos

- Node.js 18+ (recomendado LTS)
- npm 9+ / 10+
- Puerto **3000** libre

## Instalación

```bash
# Clonar el repo
git clone <URL_DEL_REPO>
cd users-api-crud

# Instalar dependencias
npm install
```

Dependencias de test e2e (si no las tenés):
```bash
npm i -D supertest @types/supertest
```

Asegurate de tener en `tsconfig.json`:
```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Ejecutar en desarrollo

```bash
npm run start:dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/docs

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
│     ├─ users.module.ts
│     ├─ users.service.ts
│     ├─ dto/
│     │  ├─ create-profile.dto.ts
│     │  ├─ create-user.dto.ts
│     │  ├─ update-profile.dto.ts
│     │  └─ update-user.dto.ts      
│     └─ entities/
│        ├─ profile.entity.ts
│        └─ user.entity.ts
├─ test/
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
└─ package.json
```

## Configuración global de la app

- **Validación**: `ValidationPipe` con `whitelist`, `forbidNonWhitelisted`, `transform`.
- **Errores**: filtro global `HttpExceptionFilter` que retorna JSON consistente.
- **Swagger**: configurado en `main.ts` (ruta `/docs`).

## Contrato de datos

**Usuario**
```ts
{
  id: number;
  nombre: string;
  correoElectronico: string;  // único (case-insensitive)
  edad: number;
  perfil: {
    id: number;
    codigo: string;
    nombrePerfil: string;
  };
  createdAt: string; // ISO
}
```

## Endpoints

Base: `http://localhost:3000`

- `GET /users` – Lista de usuarios
- `GET /users/:id` – Usuario por ID
- `POST /users` – Crea usuario
- `PATCH /users/:id` – Actualiza parcialmente
- `DELETE /users/:id` – Elimina usuario

### Ejemplos (curl)

Crear:
```bash
curl -X POST http://localhost:3000/users   -H "Content-Type: application/json"   -d '{
    "nombre": "Juan Carlos",
    "correoElectronico": "carlos@example.com",
    "edad": 28,
    "perfil": { "id": 1, "codigo": "ADM", "nombrePerfil": "Administrador" }
  }'
```

Listar:
```bash
curl http://localhost:3000/users
```

Obtener uno:
```bash
curl http://localhost:3000/users/1
```

Actualizar parcialmente (nota: `perfil` acepta parcial):
```bash
curl -X PATCH http://localhost:3000/users/1   -H "Content-Type: application/json"   -d '{
    "nombre": "Juan Carlos Updated",
    "perfil": { "nombrePerfil": "Admin Global" }
  }'
```

Eliminar:
```bash
curl -X DELETE http://localhost:3000/users/1
```

## Validaciones

- `nombre`: requerido, string no vacío.
- `correoElectronico`: email válido, **único** (comparación case-insensitive).
- `edad`: entero ≥ 0.
- `perfil`: requerido en creación (id, codigo, nombrePerfil).  
  En actualización **parcial** (`PATCH`) `perfil` admite cualquier subset de sus campos (gracias a `UpdateProfileDto` + `IntersectionType` en `UpdateUserDto`).

## Manejo de errores

Formato uniforme del filtro global:
```json
{
  "statusCode": 409,
  "error": "EmailAlreadyExists",
  "message": "El correo 'carlos@example.com' ya está en uso.",
  "field": "correoElectronico",
  "timestamp": "2025-09-21T13:00:00.000Z",
  "path": "/users"
}
```

Códigos usados:
- 400: validaciones / body inválido
- 404: usuario no encontrado
- 409: email duplicado
- 500: error no controlado

## Documentación (Swagger)

- URL: `http://localhost:3000/docs`
- DTOs anotados con `@ApiProperty` / `@ApiPropertyOptional`
- Controllers con `@ApiTags`, `@ApiOperation`, etc.

## Testing

### Unit tests

Ubicación junto al código fuente:
- `src/users/users.service.spec.ts`
- `src/users/users.controller.spec.ts`

Correr:
```bash
npm run test
npm run test:watch
npm run test:cov
```

### E2E tests

- Carpeta: `test/`
- Archivo: `app.e2e-spec.ts`
- Config: `test/jest-e2e.json`

Script:
```bash
npm run test:e2e
```

**Notas importantes e2e**
- Importación de Supertest:
  ```ts
  import request from 'supertest';
  ```
  Alternativa sin tocar tsconfig:
  ```ts
  const request = require('supertest');
  ```
- `jest-e2e.json` no debe contener claves de `package.json` (como `scripts`).

## Scripts útiles

`package.json` mínimo:
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest -c ./test/jest-e2e.json"
  }
}
```

## Decisiones de diseño

- **In-memory repository**: facilita la prueba técnica y los tests.  
  Para producción, reemplazar por ORM (Prisma/TypeORM).
- **Unicidad de email**: normaliza a minúsculas y compara por valor.
- **Update parcial de perfil**: se resolvió con `IntersectionType` y `OmitType` para evitar conflictos de tipos con `PartialType(CreateUserDto)`.


