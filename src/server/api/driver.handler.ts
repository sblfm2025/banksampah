import { completePickupInputSchema } from '../../shared/schemas/pickup-proof.schema';
import { DriverPickupService } from '../services/driver-pickup.service';
import { ServiceError } from '../services/service-errors';
import type { ApiResult } from './operator.handler';

export class DriverApiHandler {
  constructor(private readonly pickups = new DriverPickupService()) {}

  async today(driverId: string): Promise<ApiResult> {
    return this.wrap(() => this.pickups.listToday(driverId));
  }

  async detail(id: string, driverId: string): Promise<ApiResult> {
    return this.wrap(() => this.pickups.getAssigned(id, driverId));
  }

  async start(id: string, driverId: string): Promise<ApiResult> {
    return this.wrap(() => this.pickups.start(id, driverId));
  }

  async complete(
    id: string,
    driverId: string,
    body: unknown,
  ): Promise<ApiResult> {
    return this.wrap(() =>
      this.pickups.complete(
        id,
        driverId,
        completePickupInputSchema.parse(body),
      ),
    );
  }

  private async wrap(action: () => Promise<unknown>): Promise<ApiResult> {
    try {
      return { status: 200, body: await action() };
    } catch (error) {
      if (error instanceof ServiceError) {
        return {
          status: error.code === 'NOT_FOUND' ? 404 : 409,
          body: {
            success: false,
            error: { code: error.code, message: error.message },
          },
        };
      }
      return {
        status: 400,
        body: {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Data tidak valid.' },
        },
      };
    }
  }
}
