import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Finpay API documentation",
    version: "1.0.0",
    description: `Visualise and test Finpay's API`,
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: "Development server",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
