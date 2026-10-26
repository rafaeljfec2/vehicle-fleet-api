export const openApiSchemas = {
  ErrorDetail: {
    type: 'object',
    required: ['field', 'message'],
    properties: {
      field: { type: 'string' },
      message: { type: 'string' },
    },
  },
  ErrorEnvelope: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: {
            type: 'array',
            items: { $ref: '#/components/schemas/ErrorDetail' },
          },
        },
      },
    },
  },
  Automobile: {
    type: 'object',
    required: ['id', 'plate', 'color', 'brand'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      plate: { type: 'string', example: 'ABC1D23' },
      color: { type: 'string', example: 'Silver' },
      brand: { type: 'string', example: 'Toyota' },
    },
  },
  AutomobileInput: {
    type: 'object',
    required: ['plate', 'color', 'brand'],
    properties: {
      plate: {
        type: 'string',
        minLength: 1,
        maxLength: 10,
        description: 'Normalized to uppercase; unique',
      },
      color: { type: 'string', minLength: 1, maxLength: 60 },
      brand: { type: 'string', minLength: 1, maxLength: 60 },
    },
  },
  Driver: {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', example: 'Ana Silva' },
    },
  },
  DriverInput: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 120 },
    },
  },
  Usage: {
    type: 'object',
    required: [
      'id',
      'automobileId',
      'driverId',
      'startDate',
      'endDate',
      'reason',
    ],
    properties: {
      id: { type: 'string', format: 'uuid' },
      automobileId: { type: 'string', format: 'uuid' },
      driverId: { type: 'string', format: 'uuid' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'null means the usage is active',
      },
      reason: { type: 'string' },
    },
  },
  UsageWithRelations: {
    allOf: [
      { $ref: '#/components/schemas/Usage' },
      {
        type: 'object',
        required: ['driver', 'automobile'],
        properties: {
          driver: { $ref: '#/components/schemas/Driver' },
          automobile: { $ref: '#/components/schemas/Automobile' },
        },
      },
    ],
  },
  CreateUsageInput: {
    type: 'object',
    required: ['automobileId', 'driverId', 'startDate', 'reason'],
    properties: {
      automobileId: { type: 'string', format: 'uuid' },
      driverId: { type: 'string', format: 'uuid' },
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'ISO-8601 datetime with time component',
      },
      reason: { type: 'string', minLength: 1, maxLength: 255 },
    },
  },
  FinishUsageInput: {
    type: 'object',
    required: ['endDate'],
    properties: {
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'Must be greater than or equal to startDate',
      },
    },
  },
  HealthStatus: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', example: 'ok' },
    },
  },
} as const;
