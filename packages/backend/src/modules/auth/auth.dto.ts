import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  password: string;
}

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsString()
  displayName: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;
}
