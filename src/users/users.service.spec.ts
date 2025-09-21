import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    // Para cada test arranco con un servicio "limpio" en memoria
    service = new UsersService();
  });

  // Helper para armar un CreateUserDto con defaults
  // Uso overrides para poder cambiar campos puntuales en cada caso de prueba
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

    // Valido que se haya asignado un id incremental y la fecha de creación
    // y que el payload devuelto matchee lo que guardé
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
    // Precargo un usuario con ese correo (en minúsculas)
    service.create(buildCreateDto());
    // Intento crear otro con mismo correo en mayúsculas para validar case-insensitive
    expect(() =>
      service.create(
        buildCreateDto({ nombre: 'Otro', correoElectronico: 'CARLOS@EXAMPLE.COM' }),
      ),
    ).toThrow(ConflictException);
  });

  it('findAll: devuelve todos los usuarios', () => {
    // Inserto dos usuarios distintos
    service.create(buildCreateDto());
    service.create(buildCreateDto({ correoElectronico: 'malta@example.com', nombre: 'Malta' }));

    // Debe devolver los dos (sin filtrar)
    const list = service.findAll();
    expect(list).toHaveLength(2);
  });

  it('findOne: devuelve el usuario por id', () => {
    // Creo uno y luego lo busco por su id asignado
    const u = service.create(buildCreateDto());
    const got = service.findOne(u.id);
    expect(got.id).toBe(u.id);
  });

  it('findOne: lanza NotFoundException si no existe', () => {
    // Id inexistente -> debe tirar 404 semántico (NotFoundException)
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });

  it('update: actualiza campos simples y perfil anidado', () => {
    // Creo un usuario base
    const u = service.create(buildCreateDto());

    // Armo un update parcial:
    // - cambio nombre y edad
    // - en perfil solo actualizo nombrePerfil (merge sobre lo existente)
    const dto: UpdateUserDto = {
      nombre: 'Juan Carlos Updated',
      edad: 29,
      perfil: { nombrePerfil: 'Admin Global' } as any, // parcial
    };

    const updated = service.update(u.id, dto);

    // Verifico que los campos simples hayan cambiado
    expect(updated.nombre).toBe('Juan Carlos Updated');
    expect(updated.edad).toBe(29);

    // Y que el perfil haya hecho merge manteniendo id/codigo, cambiando nombrePerfil
    expect(updated.perfil).toEqual({
      id: 1,
      codigo: 'ADM',
      nombrePerfil: 'Admin Global',
    });
  });

  it('update: respeta unicidad de correo', () => {
    // Creo dos usuarios con correos distintos
    const u1 = service.create(buildCreateDto()); // carlos@example.com
    const u2 = service.create(
      buildCreateDto({ correoElectronico: 'malta@example.com', nombre: 'Malta' }),
    );

    // Intento cambiar el correo del segundo por el del primero (case-insensitive)
    // Debe tirar ConflictException
    expect(() =>
      service.update(u2.id, { correoElectronico: 'CARLOS@example.com' }),
    ).toThrow(ConflictException);

    // Cambiar a un correo realmente nuevo sí debe funcionar
    const ok = service.update(u2.id, { correoElectronico: 'new@example.com' });
    expect(ok.correoElectronico).toBe('new@example.com');
  });

  it('remove: elimina un usuario existente', () => {
    // Creo uno, lo borro, y confirmo que luego findOne tire NotFound
    const u = service.create(buildCreateDto());
    service.remove(u.id);
    expect(() => service.findOne(u.id)).toThrow(NotFoundException);
  });

  it('remove: lanza NotFoundException si no existe', () => {
    // Borrado de id inexistente también debe reportar NotFound
    expect(() => service.remove(123)).toThrow(NotFoundException);
  });
});
