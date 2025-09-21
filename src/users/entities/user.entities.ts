import { Profile } from './profile.entity';

export class User {
  id: number;
  nombre: string;
  correoElectronico: string;
  edad: number;
  perfil: Profile;
  createdAt: Date;
}
