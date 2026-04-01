import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { SkipAuth } from './auth.decorator';
import { LoginDto, LoginResponseDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  @SkipAuth()
  @ApiResponse({
    status: 201,
    description: 'User signed in successfully.',
    type: LoginResponseDto,
  })
  public async signIn(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.signIn(dto);
  }

  @Post('register')
  @SkipAuth()
  public async register(@Body() dto: RegisterDto): Promise<void> {
    return this.authService.register(dto);
  }
}
