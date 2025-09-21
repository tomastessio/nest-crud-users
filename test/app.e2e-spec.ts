import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const request = require('supertest');

describe('Users E2E (In-memory)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        validationError: { target: false },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users -> [] al inicio', async () => {
    await request(app.getHttpServer()).get('/users').expect(200).expect([]);
  });

  it('POST /users sin x-role -> 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        nombre: 'Bloqueado',
        correoElectronico: 'block@example.com',
        edad: 20,
        perfil: { id: 99, codigo: 'BLK', nombrePerfil: 'Bloqueado' },
      })
      .expect(403);
  });

  let createdId: number;

  it('POST /users -> crea usuario válido (201) con x-role: ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('x-role', 'ADMIN')
      .send({
        nombre: 'Juan Carlos',
        correoElectronico: 'carlos@example.com',
        edad: 28,
        perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      nombre: 'Juan Carlos',
      correoElectronico: 'carlos@example.com',
      edad: 28,
      perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
      createdAt: expect.any(String),
    });
    createdId = res.body.id;
  });

  it('POST /users -> 409 por email duplicado (case-insensitive)', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-role', 'ADMIN')
      .send({
        nombre: 'Otro',
        correoElectronico: 'CARLOS@EXAMPLE.COM',
        edad: 22,
        perfil: { id: 2, codigo: 'USR', nombrePerfil: 'Usuario' },
      })
      .expect(409)
      .expect((res: any) => {
        expect(res.body).toMatchObject({
          statusCode: 409,
          error: 'EmailAlreadyExists',
          message: expect.stringContaining('ya está en uso'),
          field: 'correoElectronico',
        });
      });
  });

  it('POST /users -> 400 por body inválido (falta nombre)', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('x-role', 'ADMIN')
      .send({
        correoElectronico: 'nuevo@example.com',
        edad: 20,
        perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
      })
      .expect(400)
      .expect((res: any) => {
        expect(res.body.statusCode).toBe(400);
        expect(res.body.message).toBeDefined();
      });
  });

  it('GET /users/:id -> obtiene el creado (200)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${createdId}`)
      .expect(200);

    expect(res.body.id).toBe(createdId);
    expect(res.body.correoElectronico).toBe('carlos@example.com');
  });

  it('GET /users?q=adm -> filtra por texto en nombre/correo/perfil (200)', async () => {
    // Crea otro usuario para comprobar que el filtro funcione
    await request(app.getHttpServer())
      .post('/users')
      .set('x-role', 'ADMIN')
      .send({
        nombre: 'Malta',
        correoElectronico: 'malta@example.com',
        edad: 33,
        perfil: { id: 2, codigo: 'USR', nombrePerfil: 'Usuario' },
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/users?q=adm') // debería matchear por perfil.codigo 'ADM' o nombrePerfil 'Administrador'
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].perfil.codigo).toBe('ADM');
  });

  it('PATCH /users/:id -> actualiza parcialmente (200) con x-role: ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${createdId}`)
      .set('x-role', 'ADMIN')
      .send({ nombre: 'Juan Carlos Updated', perfil: { nombrePerfil: 'Admin Global' } })
      .expect(200);

    expect(res.body.nombre).toBe('Juan Carlos Updated');
    expect(res.body.perfil).toMatchObject({
      id: 1,
      codigo: 'ADM',
      nombrePerfil: 'Admin Global',
    });
  });

  it('PATCH /users/:id -> 409 si intenta usar email duplicado', async () => {
    // Usa el segundo usuario creado más arriba (malta@example.com)
    // intentá ponerle el correo del primero
    await request(app.getHttpServer())
      .patch(`/users/${createdId + 1}`)
      .set('x-role', 'ADMIN')
      .send({ correoElectronico: 'CARLOS@example.com' }) // dup del primero
      .expect(409);
  });

  it('GET /users/999 -> 404 no encontrado', async () => {
    await request(app.getHttpServer()).get('/users/999').expect(404);
  });

  it('DELETE /users/:id -> elimina (200) con x-role: ADMIN y luego 404 al buscar', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${createdId}`)
      .set('x-role', 'ADMIN')
      .expect(200);

    await request(app.getHttpServer()).get(`/users/${createdId}`).expect(404);
  });
});
