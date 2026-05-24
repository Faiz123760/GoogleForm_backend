import swaggerJsDoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Google Forms Clone API",
            version: "1.0.0",
            description: "API documentation for the backend endpoints of the Google Forms Clone.",
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Development server"
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },

    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);

export default swaggerSpec;