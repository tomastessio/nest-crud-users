import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controllers';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const now = new Date();

  // Mock del servicio: sólo me interesan las firmas
  const mockService: jest.Mocked<UsersService> = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('GET /users -> findAll', () => {
    // Devuelvo una lista con un usuario de prueba
    service.findAll.mockReturnValue([
      {
        id: 1,
        nombre: 'Ada',
        correoElectronico: 'ada@example.com',
        edad: 28,
        perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
        createdAt: now,
      },
    ]);

    // El controller espera un DTO de query; paso {} para “sin filtro”
    const res = controller.findAll({} as any);
    expect(res).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalledTimes(1);
    // Y como no hay q, el servicio debe haber sido llamado con undefined
    expect(service.findAll).toHaveBeenCalledWith(undefined);
  });

  it('GET /users/:id -> findOne', () => {
    service.findOne.mockReturnValue({
      id: 2,
      nombre: 'Grace',
      correoElectronico: 'grace@example.com',
      edad: 30,
      perfil: { id: 2, codigo: 'USR', nombrePerfil: 'Usuario' },
      createdAt: now,
    });

    // El controller recibe id como string y adentro hace +id
    const res = controller.findOne('2');
    expect(res.id).toBe(2);
    expect(service.findOne).toHaveBeenCalledWith(2);
  });

  it('POST /users -> create', () => {
    service.create.mockImplementation((dto: any) => ({
      id: 3,
      ...dto,
      createdAt: now,
    }));

    const res = controller.create({
      nombre: 'New',
      correoElectronico: 'new@example.com',
      edad: 18,
      perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
    } as any);

    expect(res.id).toBe(3);
    expect(service.create).toHaveBeenCalledTimes(1);
  });

  it('POST /users -> Conflict (email duplicado) propagado', () => {
    service.create.mockImplementation(() => {
      throw new ConflictException();
    });

    expect(() =>
      controller.create({
        nombre: 'Dup',
        correoElectronico: 'dup@example.com',
        edad: 20,
        perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
      } as any),
    ).toThrow(ConflictException);
  });

  it('PATCH /users/:id -> update', () => {
    service.update.mockImplementation((id: number, dto: any) => ({
      id,
      nombre: 'Updated',
      correoElectronico: 'updated@example.com',
      edad: 40,
      perfil: { id: 9, codigo: 'MGR', nombrePerfil: 'Manager' },
      createdAt: now,
      ...dto,
    }));

    // Igual que en findOne: el controller recibe string y castea a number
    const res = controller.update('10', { nombre: 'Updated' } as any);
    expect(res.id).toBe(10);
    expect(service.update).toHaveBeenCalledWith(10, { nombre: 'Updated' });
  });

  it('DELETE /users/:id -> remove', () => {
    service.remove.mockReturnValue(undefined);

    // Paso string para matchear la firma del controller
    expect(controller.remove('7')).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(7);
  });

  it('GET /users/:id -> NotFound propagado', () => {
    service.findOne.mockImplementation(() => {
      throw new NotFoundException();
    });

    // De nuevo, el controller recibe string
    expect(() => controller.findOne('999')).toThrow(NotFoundException);
  });
});
