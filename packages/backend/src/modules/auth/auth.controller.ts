import { Body, Controller, Post } from '@nestjs/common';
import { SkipAuth } from './auth.decorator';
import { LoginDto, LoginResponseDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  @SkipAuth()
  public async signIn(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.signIn(dto);
  }

  @Post('register')
  @SkipAuth()
  public async register(@Body() dto: RegisterDto): Promise<void> {
    return this.authService.register(dto);
  }
}
