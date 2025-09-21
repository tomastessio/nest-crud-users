import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  function buildCreateDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
    return {
      nombre: 'Juan Carlos',
      correoElectronico: 'carlos@example.com',
      edad: 28,
      perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
      ...overrides,
    };
  }

  it('create: crea un usuario y asigna id y createdAt', () => {
    const dto = buildCreateDto();
    const u = service.create(dto);
    expect(u).toEqual({
      id: expect.any(Number),
      nombre: 'Juan Carlos',
      correoElectronico: 'carlos@example.com',
      edad: 28,
      perfil: { id: 1, codigo: 'ADM', nombrePerfil: 'Administrador' },
      createdAt: expect.any(Date),
    });
  });

  it('create: lanza ConflictException si el email ya existe (unicidad)', () => {
    service.create(buildCreateDto()); 
    expect(() =>
      service.create(
        buildCreateDto({ nombre: 'Otro', correoElectronico: 'CARLOS@EXAMPLE.COM' }), 
      ),
    ).toThrow(ConflictException);
  });

  it('findAll: devuelve todos los usuarios', () => {
    service.create(buildCreateDto());
    service.create(buildCreateDto({ correoElectronico: 'malta@example.com', nombre: 'Malta' }));
    const list = service.findAll();
    expect(list).toHaveLength(2);
  });

  it('findOne: devuelve el usuario por id', () => {
    const u = service.create(buildCreateDto());
    const got = service.findOne(u.id);
    expect(got.id).toBe(u.id);
  });

  it('findOne: lanza NotFoundException si no existe', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });

  it('update: actualiza campos simples y perfil anidado', () => {
    const u = service.create(buildCreateDto());
    const dto: UpdateUserDto = {
      nombre: 'Juan Carlos Updated',
      edad: 29,
      perfil: { nombrePerfil: 'Admin Global' } as any, // parcial
    };
    const updated = service.update(u.id, dto);
    expect(updated.nombre).toBe('Juan Carlos Updated');
    expect(updated.edad).toBe(29);
    expect(updated.perfil).toEqual({
      id: 1,
      codigo: 'ADM',
      nombrePerfil: 'Admin Global',
    });
  });

  it('update: respeta unicidad de correo', () => {
    const u1 = service.create(buildCreateDto()); 
    const u2 = service.create(
      buildCreateDto({ correoElectronico: 'malta@example.com', nombre: 'Malta' }),
    );

    expect(() =>
      service.update(u2.id, { correoElectronico: 'CARLOS@example.com' }), 
    ).toThrow(ConflictException);

    const ok = service.update(u2.id, { correoElectronico: 'new@example.com' });
    expect(ok.correoElectronico).toBe('new@example.com');
  });

  it('remove: elimina un usuario existente', () => {
    const u = service.create(buildCreateDto());
    service.remove(u.id);
    expect(() => service.findOne(u.id)).toThrow(NotFoundException);
  });

  it('remove: lanza NotFoundException si no existe', () => {
    expect(() => service.remove(123)).toThrow(NotFoundException);
  });
});
