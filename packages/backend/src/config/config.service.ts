import { Injectable } from '@nestjs/common';

interface PgConfig {
  url: string;
}

interface GoogleChatConfig {
  apiKey: string;
  useVertex?: boolean;
}

interface IndexingConfig {
  chunkSize: number;
  chunkOverlap: number;
}

interface RedisConfig {
  url: string;
}

const ConfigKey = {
  NODE_ENV: 'NODE_ENV',
  DATABASE_URL: 'DATABASE_URL',
  PASSWORD_SALT: 'PASSWORD_SALT',
  JWT_SECRET: 'JWT_SECRET',
  GOOGLE_API_KEY: 'GOOGLE_API_KEY',
  USE_VERTEX: 'USE_VERTEX',
  REDIS_URL: 'REDIS_URL',
};

type ConfigKey = keyof typeof ConfigKey;

@Injectable()
export class ConfigService {
  public get(key: string, defVal?: string): string {
    return process.env[key] ?? defVal ?? '';
  }

  public get isProd(): boolean {
    return this.get(ConfigKey.NODE_ENV) === 'production';
  }

  public get isDev(): boolean {
    const nodeEnv = this.get(ConfigKey.NODE_ENV, 'development');
    return nodeEnv === 'development' || nodeEnv === 'local';
  }

  public get pg(): PgConfig {
    return {
      url: this.get(ConfigKey.DATABASE_URL),
    };
  }

  public get jwtSecret(): string {
    return this.get(ConfigKey.JWT_SECRET);
  }

  public get passwordSalt(): number {
    const salt = this.get(ConfigKey.PASSWORD_SALT);
    return parseInt(salt);
  }

  public get googleChatConfig(): GoogleChatConfig {
    return {
      apiKey: this.get(ConfigKey.GOOGLE_API_KEY),
      useVertex: this.get(ConfigKey.USE_VERTEX) === 'true',
    };
  }

  public get indexingConfig(): IndexingConfig {
    return {
      chunkSize: 200,
      chunkOverlap: 10,
    };
  }

  public get redisConfig(): RedisConfig {
    return {
      url: this.get(ConfigKey.REDIS_URL),
    };
  }
}
