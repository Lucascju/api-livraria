const { Router } = require('express');
const controller = require('../controllers/AuthController');

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Autenticação]
 *     summary: Cadastra um novo usuário leitor
 *     description: |
 *       Cria um usuário com perfil **USER**. A senha é armazenada como hash BCrypt (salt + work factor).
 *       Qualquer campo `role` enviado no corpo é **ignorado** para impedir escalonamento de privilégio.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterInput' }
 *     responses:
 *       201:
 *         description: Usuário criado (o hash da senha nunca é retornado)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usuario' }
 *       400:
 *         description: Campo obrigatório ausente ou com tipo inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'Campos obrigatórios ausentes: nome, email ou senha.' }
 *       409:
 *         description: E-mail já cadastrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'E-mail já cadastrado no sistema.' }
 *       422:
 *         description: E-mail com formato inválido ou senha com menos de 6 caracteres
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             examples:
 *               emailInvalido: { summary: E-mail inválido, value: { erro: 'Formato de e-mail inválido.' } }
 *               senhaCurta: { summary: Senha curta, value: { erro: 'A senha deve ter pelo menos 6 caracteres.' } }
 */
router.post('/register', (req, res, next) => controller.register(req, res, next));

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Autentica o usuário e emite um token JWT
 *     description: |
 *       Valida as credenciais com `bcrypt.compare` e retorna um JWT (HS256, validade de 2h)
 *       com `sub`, `nome` e `role`. Use o `token` retornado no botão **Authorize**.
 *
 *       E-mail inexistente e senha errada retornam a mesma mensagem (evita enumeração de usuários).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginInput' }
 *           examples:
 *             admin: { summary: Administrador, value: { email: admin@livraria.com, senha: admin123 } }
 *             leitor: { summary: Leitor (USER), value: { email: leitor@gmail.com, senha: leitor123 } }
 *     responses:
 *       200:
 *         description: Login realizado; token emitido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400:
 *         description: E-mail ou senha ausentes
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'E-mail e senha são obrigatórios.' }
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'Credenciais inválidas.' }
 *       422:
 *         description: E-mail ou senha enviados com tipo diferente de texto
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'E-mail e senha devem ser textos.' }
 */
router.post('/login', (req, res, next) => controller.login(req, res, next));

module.exports = router;
