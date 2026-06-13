import {
  JsonOperationalLogger,
  type OperationalLogger,
} from '../observability/operational-logger';
import { HealthService } from '../observability/health.service';

export interface HealthResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

const noStoreHeaders = { 'Cache-Control': 'no-store' };

export class HealthApiHandler {
  constructor(
    private readonly health = new HealthService(),
    private readonly logger: OperationalLogger = new JsonOperationalLogger(),
  ) {}

  liveness(): HealthResponse {
    return {
      status: 200,
      body: this.health.liveness(),
      headers: noStoreHeaders,
    };
  }

  async readiness(requestId?: string): Promise<HealthResponse> {
    const result = await this.health.readiness();
    this.logger.log('readiness_checked', {
      requestId,
      ready: result.status === 'ready',
      missingConfigCount: result.missingConfiguration.length,
    });
    return {
      status: result.status === 'ready' ? 200 : 503,
      body: result,
      headers: noStoreHeaders,
    };
  }
}
