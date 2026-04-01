import { Controller, Get, NotFoundException, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { type Request } from 'express';
import { UserDto } from './user.dto';
import { UserService } from './user.service';

@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @ApiResponse({
    status: 200,
    description: 'Returns the current authenticated user.',
    type: () => UserDto,
  })
  public async getMe(@Req() req: Request): Promise<UserDto> {
    const user = await this.userService.findByEmail(req.user.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
