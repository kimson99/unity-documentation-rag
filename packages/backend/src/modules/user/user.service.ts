import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/database/models/user.model';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  public async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  public async createUser(user: Partial<User>): Promise<User> {
    const { username, hashedPassword, email, displayName, role } = user;
    const newUser = this.userRepository.create({
      username,
      hashedPassword,
      email,
      displayName,
      role: role || Role.User,
    });
    return this.userRepository.save(newUser);
  }
}
