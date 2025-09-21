import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const request = require('supertest');

describe('Users E2E', () => {
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
    await request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect([]);
  });

  let createdId: number;

  it('POST /users -> crea usuario válido (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
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
      .send({
        nombre: 'Otro',
        correoElectronico: 'CARLOS@EXAMPLE.COM',
        edad: 22,
        perfil: { id: 2, codigo: 'USR', nombrePerfil: 'Usuario' },
      })
      .expect(409)
      .expect(res => {
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
      .send({
        correoElectronico: 'nuevo@example.com',
        edad: 20,
        perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
      })
      .expect(400)
      .expect(res => {
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

  it('PATCH /users/:id -> actualiza parcialmente (200)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${createdId}`)
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
    // Creamos un segundo usuario con otro correo
    const other = await request(app.getHttpServer())
      .post('/users')
      .send({
        nombre: 'Malta',
        correoElectronico: 'malta@example.com',
        edad: 33,
        perfil: { id: 2, codigo: 'USR', nombrePerfil: 'Usuario' },
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/users/${other.body.id}`)
      .send({ correoElectronico: 'CARLOS@example.com' }) // dup del primero
      .expect(409);
  });

  it('GET /users/999 -> 404 no encontrado', async () => {
    await request(app.getHttpServer()).get('/users/999').expect(404);
  });

  it('DELETE /users/:id -> elimina (200)', async () => {
    await request(app.getHttpServer()).delete(`/users/${createdId}`).expect(200);
    await request(app.getHttpServer()).get(`/users/${createdId}`).expect(404);
  });
});
