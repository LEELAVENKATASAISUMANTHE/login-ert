import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Login ERT API',
            version: '1.0.0',
            description: 'Complete API documentation for the Login ERT platform',
            contact: {
                name: 'Sumanth Eluri',
                url: 'https://www.sumantheluri.tech',
            },
        },
        servers: [
            {
                url: 'https://www.sumantheluri.tech/api',
                description: 'Production server',
            },
            {
                url: 'http://localhost:3225/api',
                description: 'Local development server',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                    description: 'JWT token set as an HttpOnly cookie after login',
                },
            },
        },
    },
    // Scan route files for JSDoc @swagger comments
    apis: ['./routes/*.route.js'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Sets up Swagger UI on the given Express app.
 * Visit /api/docs to see the interactive docs.
 */
export function setupSwagger(app) {
    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Login ERT API Docs',
        })
    );

    // Also expose the raw JSON spec
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

export default swaggerSpec;
