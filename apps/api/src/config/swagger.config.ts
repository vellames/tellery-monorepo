import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI History API',
      version: '1.0.0',
      description: 'Interactive story engine API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3232',
        description: 'Development server',
      },
    ],
    components: {
      parameters: {
        AcceptLanguage: {
          name: 'Accept-Language',
          in: 'header',
          required: false,
          description:
            'Preferred language for response messages. Supported: `en`, `pt-BR`. Defaults to `en`.',
          schema: {
            type: 'string',
            enum: ['en', 'pt-BR'],
            default: 'en',
          },
          example: 'pt-BR',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid request body',
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
