const uuidParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
} as const;

const errorResponses = {
  '400': {
    description: 'Malformed JSON',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorEnvelope' },
      },
    },
  },
  '404': {
    description: 'Resource or route not found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorEnvelope' },
      },
    },
  },
  '409': {
    description: 'Business conflict',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorEnvelope' },
      },
    },
  },
  '422': {
    description: 'Validation error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorEnvelope' },
      },
    },
  },
} as const;

export const openApiPaths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Liveness check',
      responses: {
        '200': {
          description: 'Service is up',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HealthStatus' },
            },
          },
        },
      },
    },
  },
  '/automobiles': {
    get: {
      tags: ['Automobiles'],
      summary: 'List automobiles',
      parameters: [
        {
          name: 'brand',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Exact match, case-insensitive',
        },
        {
          name: 'color',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Exact match, case-insensitive; AND with brand',
        },
      ],
      responses: {
        '200': {
          description: 'Automobile list',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Automobile' },
              },
            },
          },
        },
        '422': errorResponses['422'],
      },
    },
    post: {
      tags: ['Automobiles'],
      summary: 'Create automobile',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AutomobileInput' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Created',
          headers: {
            Location: {
              schema: { type: 'string' },
              description: '/automobiles/{id}',
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Automobile' },
            },
          },
        },
        '409': errorResponses['409'],
        '422': errorResponses['422'],
      },
    },
  },
  '/automobiles/{id}': {
    get: {
      tags: ['Automobiles'],
      summary: 'Get automobile by id',
      parameters: [uuidParam],
      responses: {
        '200': {
          description: 'Automobile',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Automobile' },
            },
          },
        },
        '404': errorResponses['404'],
        '422': errorResponses['422'],
      },
    },
    put: {
      tags: ['Automobiles'],
      summary: 'Replace automobile',
      parameters: [uuidParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AutomobileInput' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Automobile' },
            },
          },
        },
        '404': errorResponses['404'],
        '409': errorResponses['409'],
        '422': errorResponses['422'],
      },
    },
    delete: {
      tags: ['Automobiles'],
      summary: 'Delete automobile',
      parameters: [uuidParam],
      responses: {
        '204': { description: 'Deleted' },
        '404': errorResponses['404'],
        '409': errorResponses['409'],
        '422': errorResponses['422'],
      },
    },
  },
  '/drivers': {
    get: {
      tags: ['Drivers'],
      summary: 'List drivers',
      parameters: [
        {
          name: 'name',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Exact match, case-insensitive',
        },
      ],
      responses: {
        '200': {
          description: 'Driver list',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Driver' },
              },
            },
          },
        },
        '422': errorResponses['422'],
      },
    },
    post: {
      tags: ['Drivers'],
      summary: 'Create driver',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DriverInput' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Created',
          headers: {
            Location: {
              schema: { type: 'string' },
              description: '/drivers/{id}',
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Driver' },
            },
          },
        },
        '422': errorResponses['422'],
      },
    },
  },
  '/drivers/{id}': {
    get: {
      tags: ['Drivers'],
      summary: 'Get driver by id',
      parameters: [uuidParam],
      responses: {
        '200': {
          description: 'Driver',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Driver' },
            },
          },
        },
        '404': errorResponses['404'],
        '422': errorResponses['422'],
      },
    },
    put: {
      tags: ['Drivers'],
      summary: 'Replace driver',
      parameters: [uuidParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DriverInput' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Driver' },
            },
          },
        },
        '404': errorResponses['404'],
        '422': errorResponses['422'],
      },
    },
    delete: {
      tags: ['Drivers'],
      summary: 'Delete driver',
      parameters: [uuidParam],
      responses: {
        '204': { description: 'Deleted' },
        '404': errorResponses['404'],
        '409': errorResponses['409'],
        '422': errorResponses['422'],
      },
    },
  },
  '/usages': {
    get: {
      tags: ['Usages'],
      summary: 'List usages with related driver and automobile',
      responses: {
        '200': {
          description: 'Usage list including active and finished history',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/UsageWithRelations' },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Usages'],
      summary: 'Start usage',
      description:
        'Rejects when the automobile or driver already has an active usage. If both are busy, AUTOMOBILE_IN_USE is returned first.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUsageInput' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Usage started (endDate is null)',
          headers: {
            Location: {
              schema: { type: 'string' },
              description: '/usages/{id}',
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Usage' },
            },
          },
        },
        '404': errorResponses['404'],
        '409': errorResponses['409'],
        '422': errorResponses['422'],
      },
    },
  },
  '/usages/{id}/finish': {
    post: {
      tags: ['Usages'],
      summary: 'Finish an active usage',
      parameters: [uuidParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FinishUsageInput' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Usage finished',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Usage' },
            },
          },
        },
        '404': errorResponses['404'],
        '409': errorResponses['409'],
        '422': errorResponses['422'],
      },
    },
  },
} as const;
