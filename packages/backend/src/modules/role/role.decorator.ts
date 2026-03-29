import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/database/models/user.model';

export const ROLES_KEY = 'roles';
export const AuthRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
