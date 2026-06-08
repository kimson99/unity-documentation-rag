import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/config/config.module';
import { DatabaseModule } from 'src/database/database.module';
import { File } from 'src/database/models/file.model';
import { Command, CommandFactory, CommandRunner, Option } from 'nest-commander';
import z from 'zod';
import { UserModule } from 'src/modules/user/user.module';
import { AuthService } from 'src/modules/auth/auth.service';
import { AuthModule } from 'src/modules/auth/auth.module';

interface AccountCreatorCommandOptions {
  email: string;
  password: string;
  name: string;
}

@Command({ name: 'AccountCreator' })
export class AccountCreatorCommand extends CommandRunner {
  private logger = new Logger(AccountCreatorCommand.name);

  constructor(private readonly authService: AuthService) {
    super();
  }

  async run(passedParam: string[], options: AccountCreatorCommandOptions) {
    if (!options) {
      throw Error('Missing options');
    }
    await this.authService.register({
      displayName: options.name,
      email: options.email,
      password: options.password,
    });

    this.logger.log('Account created successfully!');
  }

  @Option({
    flags: '-e, --email [string]',
  })
  parseEmail(val: string): string {
    return z.email().parse(val);
  }

  @Option({
    flags: '-p, --password [string]',
  })
  parsePassword(val: string): string {
    return z.string().trim().parse(val);
  }

  @Option({
    flags: '-n, --name [string]',
  })
  parseName(val: string): string {
    return z.string().trim().parse(val);
  }
}

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    TypeOrmModule.forFeature([File]),
  ],
  providers: [AccountCreatorCommand],
})
class AppModule {}

async function bootstrap() {
  await CommandFactory.run(AppModule);
}

void bootstrap();
