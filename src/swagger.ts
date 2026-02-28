import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend Paza API",
      version: "1.0.0",
      description:
        "A TypeScript Express backend application with Swagger documentation",
      contact: {
        name: "API Support",
        email: "support@backend-paza.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
      {
        url: "https://pbbackend-v1.onrender.com",
        description: "Production server (Render)",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "OK",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2025-09-29T21:00:00.000Z",
            },
          },
        },
        HelloResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Hello World! TypeScript Express server is running.",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2025-09-29T21:00:00.000Z",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Route not found",
            },
            path: {
              type: "string",
              example: "/unknown-route",
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/*.ts", "./src/routes/*.ts", "./src/webhooks/*.ts"],
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Application): void => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Backend Paza API Documentation",
    })
  );
};

export default specs;
