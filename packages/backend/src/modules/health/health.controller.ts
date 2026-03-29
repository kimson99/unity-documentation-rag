import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { SkipAuth } from '../auth/auth.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get('/')
  @HealthCheck()
  @SkipAuth()
  check() {
    return this.health.check([
      () =>
        this.http.pingCheck(
          'unity-docs-rag',
          'http://localhost:5500/api/health/ping',
        ),
    ]);
  }

  @Get('/ping')
  @SkipAuth()
  public ping() {
    return 'pong';
  }
}
