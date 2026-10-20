const repository = require('../repositories/LivrariaRepository');

class AutorService {
  listarTodos() {
    return repository.listarAutores();
  }

  criar({ nome, nacionalidade } = {}) {
    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      throw { status: 400, message: "O nome do autor é obrigatório e deve ser um texto." };
    }
    if (nacionalidade !== undefined && nacionalidade !== null && typeof nacionalidade !== "string") {
      throw { status: 400, message: "A nacionalidade deve ser um texto." };
    }
    if (nome.trim().length < 2) {
      throw { status: 422, message: "O nome do autor deve ter pelo menos 2 caracteres." };
    }

    return repository.salvarAutor({
      nome: nome.trim(),
      nacionalidade: (nacionalidade && nacionalidade.trim()) || "Não informada"
    });
  }
}

module.exports = new AutorService();