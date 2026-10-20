const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/LivrariaRepository');
const {
  JWT_SECRET, JWT_EXPIRES_IN, JWT_ALGORITHM, BCRYPT_SALT_ROUNDS, ROLES
} = require('../config/security');

// Hash "fantasma" usado quando o e-mail não existe, para que o tempo de resposta
// seja parecido nos dois casos e não revele quais e-mails estão cadastrados.
const HASH_FANTASMA = bcrypt.hashSync('senha-inexistente', BCRYPT_SALT_ROUNDS);

class AuthService {
  async registrar({ nome, email, senha } = {}) {
    if (!nome || !email || !senha) {
      throw { status: 400, message: 'Campos obrigatórios ausentes: nome, email ou senha.' };
    }
    if ([nome, email, senha].some(v => typeof v !== 'string')) {
      throw { status: 400, message: 'Os campos nome, email e senha devem ser textos.' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw { status: 422, message: 'Formato de e-mail inválido.' };
    }
    if (senha.length < 6) {
      throw { status: 422, message: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    if (repository.buscarUsuarioPorEmail(emailNormalizado)) {
      throw { status: 409, message: 'E-mail já cadastrado no sistema.' };
    }

    // BCrypt gera um salt aleatório e o embute no próprio hash ($2b$<custo>$<salt><hash>)
    const senha_hash = await bcrypt.hash(senha, BCRYPT_SALT_ROUNDS);

    const novoUsuario = repository.salvarUsuario({
      nome: String(nome).trim(),
      email: emailNormalizado,
      senha_hash,
      // Cadastro público SEMPRE cria USER. O campo "role" do body é ignorado
      // para impedir escalonamento de privilégio (mass assignment).
      role: ROLES.USER
    });

    const { senha_hash: _, ...usuarioRetorno } = novoUsuario;
    return usuarioRetorno;
  }

  async login({ email, senha } = {}) {
    if (!email || !senha) {
      throw { status: 400, message: 'E-mail e senha são obrigatórios.' };
    }
    if (typeof email !== 'string' || typeof senha !== 'string') {
      throw { status: 422, message: 'E-mail e senha devem ser textos.' };
    }

    const usuario = repository.buscarUsuarioPorEmail(String(email).trim().toLowerCase());

    const senhaConfere = await bcrypt.compare(senha, usuario ? usuario.senha_hash : HASH_FANTASMA);

    // Mesma mensagem para e-mail inexistente e senha errada (evita enumeração de usuários)
    if (!usuario || !senhaConfere) {
      throw { status: 401, message: 'Credenciais inválidas.' };
    }

    const token = jwt.sign(
      { nome: usuario.nome, role: usuario.role },
      JWT_SECRET,
      { subject: String(usuario.id), expiresIn: JWT_EXPIRES_IN, algorithm: JWT_ALGORITHM }
    );

    return {
      usuario: { id: usuario.id, nome: usuario.nome, role: usuario.role },
      token,
      tipo: 'Bearer',
      expiraEm: JWT_EXPIRES_IN
    };
  }
}

module.exports = new AuthService();
