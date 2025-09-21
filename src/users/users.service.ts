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

  private users: User[] = [];
  private seq = 1;

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

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

  
  findAll(): User[] {
    return this.users;
  }

  
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
