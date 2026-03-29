import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from 'src/config/config.service';
import { UserService } from 'src/modules/user/user.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthUser } from './auth.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async signIn(dto: LoginDto): Promise<{ accessToken: string }> {
    const { username, password } = dto;
    const user = await this.validateUser(username, password);

    const payload: AuthUser = {
      username: user.username,
      id: user.id,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  private async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    if ((await bcrypt.compare(password, user.hashedPassword)) === false) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  public async register(dto: RegisterDto): Promise<void> {
    const { username, password, email, displayName } = dto;
    const existingUser = await this.userService.findByUsername(username);
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    const salt = await bcrypt.genSalt(this.configService.passwordSalt);
    const hashedPassword = await bcrypt.hash(password, salt);
    await this.userService.createUser({
      username,
      hashedPassword,
      email,
      displayName,
    });
  }
}
