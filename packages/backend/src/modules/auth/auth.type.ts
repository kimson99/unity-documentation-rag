import { Role } from 'src/database/models/user.model';

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
}
