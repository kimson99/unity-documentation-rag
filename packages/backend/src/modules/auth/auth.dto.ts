import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  password: string;
}

export class RegisterDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;
}
