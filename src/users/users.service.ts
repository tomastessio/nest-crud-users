import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entities';

@Injectable()
export class UsersService {
  // Guardo los usuarios en memoria para simplificar (prueba técnica)
  private users: User[] = [];
  // Secuencia incremental para asignar IDs únicos
  private seq = 1;

  // Normalizo el correo para comparar siempre en minúsculas y sin espacios
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  // Verifico unicidad del email. Si existe, lanzo 409 con payload consistente.
  // Si paso ignoreId, permito que el mismo usuario conserve su correo en update.
  private ensureEmailUnique(email: string, ignoreId?: number) {
    const normalized = this.normalizeEmail(email);
    const exists = this.users.find(
      (u) => u.correoElectronico === normalized && u.id !== ignoreId,
    );

    if (exists) {
      throw new ConflictException({
        error: 'EmailAlreadyExists',
        message: `El correo '${normalized}' ya está en uso.`,
        field: 'correoElectronico',
      });
    }

    return normalized;
  }

  // Listado con filtro de texto opcional (q). Busco en nombre, correo y datos de perfil.
  // Si no mandan q, devuelvo una copia para evitar mutaciones desde afuera.
  findAll(q?: string) {
    if (!q || q.trim() === '') {
      return [...this.users];
    }
    const needle = q.trim().toLowerCase();
    return this.users.filter((u) => {
      const haystack = [
        u.nombre,
        u.correoElectronico,
        u?.perfil?.codigo,
        u?.perfil?.nombrePerfil,
      ]
        .filter(Boolean)
        .map((s: string) => s.toLowerCase());
      return haystack.some((s: string) => s.includes(needle));
    });
  }

  // Obtengo un usuario por id. Si no existe, devuelvo 404 con mensaje claro.
  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);

    if (!user) {
      throw new NotFoundException({
        error: 'UserNotFound',
        message: `Usuario ${id} no encontrado`,
      });
    }

    return user;
  }

  // Creo un usuario nuevo:
  // 1) valido unicidad de email
  // 2) genero id y timestamp
  // 3) clono/armo el objeto para no arrastrar referencias accidentales
  create(dto: CreateUserDto): User {
    const correo = this.ensureEmailUnique(dto.correoElectronico);
    const now = new Date();

    const user: User = {
      id: this.seq++,
      nombre: dto.nombre,
      correoElectronico: correo,
      edad: dto.edad,
      perfil: {
        id: dto.perfil.id,
        codigo: dto.perfil.codigo,
        nombrePerfil: dto.perfil.nombrePerfil,
      },
      createdAt: now,
    };

    this.users.push(user);
    return user;
  }

  // Actualizo parcialmente:
  // - si viene correo, vuelvo a chequear unicidad (ignorando el propio id)
  // - actualizo campos primitivos si están definidos
  // - en perfil, mergeo campo a campo para mantener lo existente si no lo envían
  update(id: number, dto: UpdateUserDto): User {
    const u = this.findOne(id);

    if (dto.correoElectronico) {
      u.correoElectronico = this.ensureEmailUnique(dto.correoElectronico, id);
    }
    if (dto.nombre !== undefined) u.nombre = dto.nombre;
    if (dto.edad !== undefined) u.edad = dto.edad;

    if (dto.perfil !== undefined) {
      u.perfil = {
        id: dto.perfil.id ?? u.perfil.id,
        codigo: dto.perfil.codigo ?? u.perfil.codigo,
        nombrePerfil: dto.perfil.nombrePerfil ?? u.perfil.nombrePerfil,
      };
    }

    return u;
  }

  // Elimino por id. Si no existe, respondo 404.
  // Uso splice para mantener el array compacto.
  remove(id: number): void {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new NotFoundException({
        error: 'UserNotFound',
        message: `Usuario ${id} no encontrado`,
      });
    }
    this.users.splice(idx, 1);
  }
}
