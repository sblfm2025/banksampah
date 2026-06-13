export class ServiceError extends Error {
  constructor(
    public readonly code:
      | 'VALIDATION_ERROR'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'INVALID_STATUS_TRANSITION',
    message: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
