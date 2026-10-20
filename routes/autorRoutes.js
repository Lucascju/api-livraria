const { Router } = require('express');
const controller = require('../controllers/AutorController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/security');

const router = Router();

/**
 * @openapi
 * /api/v1/autores:
 *   get:
 *     tags: [Autores]
 *     summary: Lista os autores
 *     description: Rota **pública**. Útil para descobrir o `autor_id` antes de cadastrar um livro.
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de autores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Autor' }
 *       500: { $ref: '#/components/responses/InternalError' }
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

/**
 * @openapi
 * /api/v1/autores:
 *   post:
 *     tags: [Autores]
 *     summary: Cadastra um autor (ADMIN)
 *     description: |
 *       Rota **exclusiva do perfil ADMIN**. Exige `Authorization: Bearer <token>`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AutorInput' }
 *     responses:
 *       201:
 *         description: Autor criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Autor' }
 *             example: { id: 1791246744809, nome: 'Clarice Lispector', nacionalidade: 'Brasileira' }
 *       400:
 *         description: Nome ausente ou com tipo inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'O nome do autor é obrigatório e deve ser um texto.' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422:
 *         description: Nome com menos de 2 caracteres
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *             example: { erro: 'O nome do autor deve ter pelo menos 2 caracteres.' }
 */
router.post('/', autenticarToken, exigirRole(ROLES.ADMIN), (req, res, next) => controller.store(req, res, next));

module.exports = router;
