const { Router } = require('express');
const controller = require('../controllers/LivroController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/security');

const router = Router();

/**
 * @openapi
 * /api/v1/livros:
 *   get:
 *     tags: [Livros]
 *     summary: Lista o catálogo de livros
 *     description: Rota **pública**. Retorna todos os livros com o nome do autor e seus comentários.
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de livros
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Livro' }
 *       500: { $ref: '#/components/responses/InternalError' }
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

/**
 * @openapi
 * /api/v1/livros/{id}:
 *   get:
 *     tags: [Livros]
 *     summary: Detalha um livro
 *     description: Rota **pública**. Retorna o livro, o nome do autor e os comentários.
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/LivroId'
 *     responses:
 *       200:
 *         description: Livro encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Livro' }
 *       404: { $ref: '#/components/responses/LivroNaoEncontrado' }
 */
router.get('/:id', (req, res, next) => controller.show(req, res, next));

/**
 * @openapi
 * /api/v1/livros:
 *   post:
 *     tags: [Livros]
 *     summary: Cadastra um livro (ADMIN)
 *     description: |
 *       Rota **exclusiva do perfil ADMIN**. Exige `Authorization: Bearer <token>`.
 *       O `autor_id` precisa referenciar um autor existente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LivroInput' }
 *     responses:
 *       201:
 *         description: Livro criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Livro' }
 *             example: { id: 1791246744819, titulo: 'Memórias Póstumas de Brás Cubas', ano: 1881, autor_id: 1, comentarios: [] }
 *       400:
 *         description: Campo obrigatório ausente ou com tipo inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'O título e o autor_id são obrigatórios.' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422:
 *         description: Autor inexistente ou ano de publicação inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             examples:
 *               autorInexistente: { summary: Autor inexistente, value: { erro: 'O autor informado não existe.' } }
 *               anoInvalido: { summary: Ano no futuro, value: { erro: 'O ano de publicação não pode ser negativo nem estar no futuro.' } }
 */
router.post('/', autenticarToken, exigirRole(ROLES.ADMIN), (req, res, next) => controller.store(req, res, next));

/**
 * @openapi
 * /api/v1/livros/{id}/comentarios:
 *   post:
 *     tags: [Comentários]
 *     summary: Adiciona um comentário a um livro
 *     description: |
 *       Rota para **usuários autenticados** (USER ou ADMIN). Exige `Authorization: Bearer <token>`.
 *       O nome do autor do comentário é extraído do token JWT, não do corpo da requisição.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LivroId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ComentarioInput' }
 *     responses:
 *       201:
 *         description: Comentário criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Comentario' }
 *       400:
 *         description: Texto ausente, vazio ou não textual
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'O texto do comentário não pode estar vazio.' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/LivroNaoEncontrado' }
 *       422:
 *         description: Comentário acima de 500 caracteres
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'O comentário deve ter no máximo 500 caracteres.' }
 */
router.post(
  '/:id/comentarios',
  autenticarToken,
  exigirRole(ROLES.USER, ROLES.ADMIN),
  (req, res, next) => controller.storeComment(req, res, next)
);

module.exports = router;
