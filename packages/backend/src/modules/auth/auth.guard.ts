import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SKIP_AUTH_KEY } from './auth.decorator';
import { AuthUser } from './auth.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}
  private logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    const skipAuth = this.reflector.get<boolean>(
      SKIP_AUTH_KEY,
      context.getHandler(),
    );
    if (skipAuth) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload: AuthUser = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
