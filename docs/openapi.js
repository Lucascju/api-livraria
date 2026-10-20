const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const { version } = require('../package.json');

const erro = (mensagem) => ({
  'application/json': {
    schema: { $ref: '#/components/schemas/Erro' },
    example: { erro: mensagem }
  }
});

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Livraria Comunitária API',
    version,
    description: [
      'API RESTful de Livros e Autores com autenticação **JWT** e controle de acesso por perfil (**RBAC**).',
      '',
      '### Como testar rotas protegidas',
      '1. Abra **POST /api/v1/auth/login** → *Try it out* → *Execute* (os exemplos já trazem as credenciais).',
      '2. Copie o valor de `token` da resposta.',
      '3. Clique em **Authorize** 🔓 no topo, cole o token (sem a palavra `Bearer`) e confirme.',
      '4. As rotas com cadeado passam a enviar `Authorization: Bearer <token>` automaticamente.',
      '',
      '| Perfil | E-mail | Senha |',
      '|---|---|---|',
      '| ADMIN | admin@livraria.com | admin123 |',
      '| USER | leitor@gmail.com | leitor123 |',
      '',
      '### Matriz de permissões',
      '| Rota | Perfil |',
      '|---|---|',
      '| GET /livros, GET /livros/{id}, GET /autores | Público |',
      '| POST /auth/register, POST /auth/login | Público |',
      '| POST /livros/{id}/comentarios | Autenticado (USER ou ADMIN) |',
      '| POST /autores, POST /livros | Exclusivo ADMIN |',
      '',
      '**Códigos de erro:** `400` estrutura ou tipo inválido · `422` dado bem formado que viola regra de negócio · ',
      '`401` token ausente, expirado ou corrompido · `403` perfil sem permissão · `404` recurso inexistente.'
    ].join('\n')
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Autenticação', description: 'Cadastro de usuários e emissão de tokens JWT' },
    { name: 'Livros', description: 'Catálogo público e cadastro administrativo' },
    { name: 'Comentários', description: 'Avaliações de leitores autenticados' },
    { name: 'Autores', description: 'Consulta pública e cadastro administrativo' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtido em POST /api/v1/auth/login. Cole apenas o token; o prefixo "Bearer" é adicionado automaticamente.'
      }
    },
    parameters: {
      LivroId: {
        name: 'id', in: 'path', required: true,
        description: 'Identificador numérico do livro',
        schema: { type: 'integer', minimum: 1 },
        example: 1
      }
    },
    schemas: {
      Erro: {
        type: 'object',
        required: ['erro'],
        properties: { erro: { type: 'string', description: 'Mensagem legível do erro' } }
      },
      RegisterInput: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        additionalProperties: false,
        properties: {
          nome: { type: 'string', minLength: 1, example: 'Maria Souza' },
          email: { type: 'string', format: 'email', example: 'maria.souza@gmail.com' },
          senha: { type: 'string', format: 'password', minLength: 6, example: 'maria123' }
        }
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@livraria.com' },
          senha: { type: 'string', format: 'password', example: 'admin123' }
        }
      },
      Usuario: {
        type: 'object',
        required: ['id', 'nome', 'email', 'role'],
        properties: {
          id: { type: 'integer', example: 3 },
          nome: { type: 'string', example: 'Maria Souza' },
          email: { type: 'string', format: 'email', example: 'maria.souza@gmail.com' },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' }
        }
      },
      LoginResponse: {
        type: 'object',
        required: ['usuario', 'token', 'tipo', 'expiraEm'],
        properties: {
          usuario: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              nome: { type: 'string', example: 'Admin' },
              role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'ADMIN' }
            }
          },
          token: { type: 'string', description: 'JWT assinado (HS256), válido por 2h', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21lIjoiQWRtaW4iLCJyb2xlIjoiQURNSU4iLCJzdWIiOiIxIn0.assinatura' },
          tipo: { type: 'string', example: 'Bearer' },
          expiraEm: { type: 'string', example: '2h' }
        }
      },
      Comentario: {
        type: 'object',
        required: ['id', 'autor_nome', 'texto'],
        properties: {
          id: { type: 'integer', example: 1791246744698 },
          usuario_id: { type: 'string', description: 'ID do autor do comentário (extraído do JWT)', example: '2' },
          autor_nome: { type: 'string', description: 'Nome extraído do JWT, não do body', example: 'Leitor' },
          texto: { type: 'string', example: 'Leitura envolvente, recomendo!' }
        }
      },
      ComentarioInput: {
        type: 'object',
        required: ['texto'],
        properties: {
          texto: { type: 'string', minLength: 1, maxLength: 500, example: 'Leitura envolvente, recomendo!' }
        }
      },
      Livro: {
        type: 'object',
        required: ['id', 'titulo', 'ano', 'autor_id', 'comentarios'],
        properties: {
          id: { type: 'integer', example: 1 },
          titulo: { type: 'string', example: 'Dom Casmurro' },
          ano: { type: 'integer', example: 1899 },
          autor_id: { type: 'integer', example: 1 },
          autor_nome: { type: 'string', example: 'Machado de Assis' },
          comentarios: { type: 'array', items: { $ref: '#/components/schemas/Comentario' } }
        }
      },
      LivroInput: {
        type: 'object',
        required: ['titulo', 'autor_id'],
        properties: {
          titulo: { type: 'string', minLength: 1, example: 'Memórias Póstumas de Brás Cubas' },
          ano: { type: 'integer', description: 'Opcional. Padrão: ano atual. Não pode ser futuro.', example: 1881 },
          autor_id: { type: 'integer', minimum: 1, description: 'Deve referenciar um autor existente', example: 1 }
        }
      },
      Autor: {
        type: 'object',
        required: ['id', 'nome', 'nacionalidade'],
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Machado de Assis' },
          nacionalidade: { type: 'string', example: 'Brasileira' }
        }
      },
      AutorInput: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', minLength: 2, example: 'Clarice Lispector' },
          nacionalidade: { type: 'string', description: 'Opcional. Padrão: "Não informada".', example: 'Brasileira' }
        }
      }
    },
    responses: {
      Unauthorized: {
        description: 'Token ausente, malformado, corrompido ou expirado',
        content: erro('Token de autenticação não fornecido.')
      },
      Forbidden: {
        description: 'Autenticado, mas sem o perfil ADMIN',
        content: erro('Acesso proibido: privilégio de ADMIN exigido.')
      },
      LivroNaoEncontrado: {
        description: 'Livro não encontrado',
        content: erro('Livro não localizado.')
      },
      InternalError: {
        description: 'Erro interno inesperado',
        content: erro('Ocorreu um erro interno no servidor.')
      }
    }
  }
};

module.exports = swaggerJsdoc({
  definition,
  apis: [path.join(__dirname, '..', 'routes', '*.js')]
});
