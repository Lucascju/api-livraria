require("./config/security"); // carrega .env e valida JWT_SECRET antes de tudo
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const livroRoutes = require('./routes/livroRoutes');
const autorRoutes = require('./routes/autorRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(cors({
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

// Front-end de teste (http://localhost:3000)
app.use(express.static(path.join(__dirname, 'public')));

// Documentação OpenAPI 3.0
// Especificação bruta (JSON) — registrada antes da UI para não ser capturada pelo static do Swagger
app.get(['/docs/api.json', '/api-docs.json'], (req, res) => res.json(openapiSpec));
// Interface interativa (Swagger UI) com botão Authorize (Bearer JWT)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'Livraria API — Documentação',
  swaggerOptions: {
    persistAuthorization: true,   // mantém o token ao recarregar a página
    displayRequestDuration: true,
    tryItOutEnabled: true,
    docExpansion: 'list'
  }
}));

// Agrupamento Semântico de Rotas (RESTful /api/v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/livros', livroRoutes);
app.use('/api/v1/autores', autorRoutes);

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Livraria API rodando em http://localhost:${PORT}`);
  console.log(`Documentação:  http://localhost:${PORT}/docs  (JSON: /docs/api.json)`);
});
