# 📚 Livraria API — Camada de Segurança

API RESTful de Livros e Autores (Clean Architecture) com:

1. **Armazenamento seguro de credenciais** — senhas com BCrypt (`bcrypt`, salt aleatório + work factor 10).
2. **Autenticação stateless** — JWT (HS256) no header `Authorization: Bearer <token>`.
3. **RBAC** — middlewares `autenticarToken` e `exigirRole(...)` protegendo as rotas.
4. **Documentação OpenAPI 3.0** — Swagger UI interativo com botão **Authorize** (Bearer JWT).

## 📖 Documentação da API

| Recurso | URL |
|---|---|
| Swagger UI (interativo) | http://localhost:3000/docs |
| Especificação OpenAPI (JSON) | http://localhost:3000/docs/api.json (alias: `/api-docs.json`) |

**Testando rotas protegidas pelo navegador:**
1. Em `/docs`, abra **POST /api/v1/auth/login** → *Try it out* → escolha o exemplo *Administrador* ou *Leitor* → *Execute*.
2. Copie o `token` da resposta.
3. Clique em **Authorize** 🔓, cole o token (sem `Bearer`) e confirme. O token persiste ao recarregar a página.
4. Teste comentários, autores e livros. O Swagger envia `Authorization: Bearer <token>` automaticamente.

A especificação é gerada por **swagger-jsdoc** a partir de anotações `@openapi` em `routes/*.js`
(contrato ao lado do código). Schemas, respostas de erro reutilizáveis (`401`, `403`, `404`) e o
`securityScheme` `bearerAuth` ficam em `docs/openapi.js`.

**Convenção de erros:** `400` campo obrigatório ausente ou tipo inválido · `422` dado bem formado
que viola regra de negócio (e-mail inválido, senha curta, autor inexistente, ano no futuro, comentário com mais de 500 caracteres) ·
`401` token ausente/expirado/corrompido · `403` perfil sem permissão · `404` recurso inexistente · `409` e-mail duplicado.

## Como rodar

```bash
npm install
node server.js
```

Documentação interativa: **http://localhost:3000/docs**

Front-end de teste: abra **http://localhost:3000** (servido pela própria API a partir de `public/index.html`)
ou abra `public/index.html` com o **Live Server** do VS Code.

Opcional: copie `.env.example` para `.env` e defina `JWT_SECRET`. Sem ele, a API gera um segredo
aleatório a cada inicialização (funciona normalmente, mas os tokens deixam de valer ao reiniciar).

> Se existir um `database.txt` antigo (com os hashes de exemplo do projeto original), apague-o.
> Ele é recriado no primeiro start com hashes BCrypt reais.

## Cenários de teste

- **A — Anônimo:** lista de livros carrega (200); cadastrar livro sem login → **401**.
- **B — Leitor** (`leitor@gmail.com` / `leitor123`): comentário gravado com o nome vindo do token (201); cadastrar livro → **403**.
- **C — Admin** (`admin@livraria.com` / `admin123`): cadastrar autor e livro → **201**.

## Credenciais de laboratório

| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | admin@livraria.com | admin123 |
| USER | leitor@gmail.com | leitor123 |

## Matriz de permissões

| Método | Rota | Acesso | Sucesso | Falhas documentadas |
|---|---|---|---|---|
| GET | `/api/v1/livros` | Público | 200 | 500 |
| GET | `/api/v1/livros/{id}` | Público | 200 | 404 |
| GET | `/api/v1/autores` | Público | 200 | 500 |
| POST | `/api/v1/auth/register` | Público | 201 | 400, 409, 422 |
| POST | `/api/v1/auth/login` | Público | 200 | 400, 401, 422 |
| POST | `/api/v1/livros/{id}/comentarios` | USER ou ADMIN | 201 | 400, 401, 404, 422 |
| POST | `/api/v1/autores` | ADMIN | 201 | 400, 401, 403, 422 |
| POST | `/api/v1/livros` | ADMIN | 201 | 400, 401, 403, 422 |

## Decisões de segurança

- **BCrypt**: `bcrypt.hash(senha, 10)` — o salt é gerado por senha e embutido no hash (`$2b$12$...`). Os usuários seed são hasheados no momento da criação da base, sem hash fixo no código.
- **Login sem enumeração**: e-mail inexistente e senha errada retornam a mesma mensagem, e é feita uma comparação com hash "fantasma" para igualar o tempo de resposta.
- **JWT**: payload com `sub`, `nome` e `role`; expiração configurável (`JWT_EXPIRES_IN`, padrão 2h); `jwt.verify` com `algorithms: ['HS256']` fixo (bloqueia tokens `alg: none`). Não há segredo fixo no código: sem `JWT_SECRET` no `.env`, é gerado um aleatório em memória.
- **Sem escalonamento de privilégio**: o `/register` ignora o campo `role` do body e sempre cria `USER`.
- **Autoria de comentários** vem do token validado, nunca do body.
- **Front-end**: escape de HTML em títulos/comentários (evita XSS armazenado que poderia roubar o JWT do localStorage) e header `Authorization` só é enviado quando há token.
- **Erros 5xx** não vazam detalhes internos; JSON malformado retorna 400; body limitado a 10 kb.

## Testes rápidos (curl)

```bash
# Login
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@livraria.com","senha":"admin123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

# Rota ADMIN
curl -i -X POST localhost:3000/api/v1/autores \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nome":"Clarice Lispector","nacionalidade":"Brasileira"}'
```
