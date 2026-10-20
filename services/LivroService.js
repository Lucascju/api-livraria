const repository = require('../repositories/LivrariaRepository');

class LivroService {
  listarTodos() {
    const livros = repository.listarLivros();
    const autores = repository.listarAutores();

    return livros.map(livro => {
      const autor = autores.find(a => a.id === livro.autor_id);
      return {
        ...livro,
        autor_nome: autor ? autor.nome : "Autor Desconhecido"
      };
    });
  }

  buscarPorId(id) {
    const livro = repository.buscarLivroPorId(id);
    if (!livro) {
      throw { status: 404, message: "Livro não localizado." };
    }

    const autor = repository.buscarAutorPorId(livro.autor_id);
    return {
      ...livro,
      autor_nome: autor ? autor.nome : "Autor Desconhecido"
    };
  }

  criar({ titulo, ano, autor_id } = {}) {
    // 400: estrutura/tipos inválidos
    if (titulo === undefined || titulo === null || autor_id === undefined || autor_id === null || autor_id === "") {
      throw { status: 400, message: "O título e o autor_id são obrigatórios." };
    }
    if (typeof titulo !== "string" || titulo.trim() === "") {
      throw { status: 400, message: "O título deve ser um texto não vazio." };
    }
    const autorId = Number(autor_id);
    if (!Number.isInteger(autorId) || autorId <= 0) {
      throw { status: 400, message: "O autor_id deve ser um número inteiro positivo." };
    }
    let anoFinal = new Date().getFullYear();
    if (ano !== undefined && ano !== null && ano !== "") {
      anoFinal = Number(ano);
      if (!Number.isInteger(anoFinal)) {
        throw { status: 400, message: "O ano deve ser um número inteiro." };
      }
    }

    // 422: dados bem formados, mas que violam regras de negócio
    if (anoFinal < 0 || anoFinal > new Date().getFullYear()) {
      throw { status: 422, message: "O ano de publicação não pode ser negativo nem estar no futuro." };
    }
    const autor = repository.buscarAutorPorId(autorId);
    if (!autor) {
      throw { status: 422, message: "O autor informado não existe." };
    }

    return repository.salvarLivro({
      titulo: titulo.trim(),
      ano: anoFinal,
      autor_id: autorId
    });
  }

  adicionarComentario(livroId, { texto, usuario }) {
    if (!usuario) {
      throw { status: 401, message: "Usuário não autenticado." };
    }

    if (!texto || typeof texto !== "string" || texto.trim() === "") {
      throw { status: 400, message: "O texto do comentário não pode estar vazio." };
    }
    if (texto.trim().length > 500) {
      throw { status: 422, message: "O comentário deve ter no máximo 500 caracteres." };
    }

    this.buscarPorId(livroId);

    // A autoria vem do JWT validado (req.usuario), nunca do body da requisição
    return repository.adicionarComentario(livroId, {
      usuario_id: usuario.id,
      autor_nome: usuario.nome,
      texto: texto.trim()
    });
  }
}

module.exports = new LivroService();