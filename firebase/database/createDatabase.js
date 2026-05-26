import {
  doc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db } from '../firestore.js';


async function criarBancoBiblioteca() {

  const batch = writeBatch(db);

  // =========================
  // USUÁRIOS
  // =========================

  batch.set(doc(db, "usuarios", "uid_001"), {
    nome: "Lucas Sant'ana",
    email: "lucas@gmail.com",
    tipo: "aluno",
    matricula: "2026001",
    turma: "2A",
    ativo: true,
    criadoEm: serverTimestamp()
  });

  batch.set(doc(db, "usuarios", "uid_002"), {
    nome: "Carlos Silva",
    email: "prof@gmail.com",
    tipo: "professor",
    registroFuncional: "RF-1002",
    disciplina: "Matemática",
    ativo: true,
    criadoEm: serverTimestamp()
  });

  // =========================
  // LIVROS
  // =========================

  batch.set(doc(db, "livros", "livro_001"), {
    titulo: "Dom Casmurro",
    autor: "Machado de Assis",
    categoria: "Literatura",
    isbn: "9788535902775",
    ano: 1899,
    editora: "Garnier",
    exemplares: 3,
    disponiveis: 2,
    status: "disponivel",
    emoji: "📖",
    cor: "#E8EDFF",
    descricao: "Um dos maiores clássicos da literatura brasileira.",
    criadoEm: serverTimestamp()
  });

  batch.set(doc(db, "livros", "livro_002"), {
    titulo: "Harry Potter",
    autor: "J.K Rowling",
    categoria: "Fantasia",
    isbn: "9788532511011",
    ano: 1997,
    editora: "Rocco",
    exemplares: 10,
    disponiveis: 8,
    status: "disponivel",
    emoji: "🧙",
    cor: "#FFF7ED",
    descricao: "Série de fantasia com foco em aventura escolar.",
    criadoEm: serverTimestamp()
  });

  // =========================
  // EMPRÉSTIMOS
  // =========================

  batch.set(doc(db, "emprestimos", "emp_001"), {
    usuarioId: "uid_001",
    livroId: "livro_001",
    dataEmprestimo: "2026-05-09",
    dataPrevistaDevolucao: "2026-05-16",
    dataDevolucaoReal: null,
    status: "ativo",
    criadoEm: serverTimestamp()
  });

  // =========================
  // RESERVAS
  // =========================

  batch.set(doc(db, "reservas", "reserva_001"), {
    usuarioId: "uid_001",
    livroId: "livro_002",
    dataReserva: "2026-05-09",
    status: "esperando",
    criadoEm: serverTimestamp()
  });

  // =========================
  // CATEGORIAS
  // =========================

  batch.set(doc(db, "categorias", "cat_001"), {
    nome: "Literatura",
    ativo: true
  });

  batch.set(doc(db, "categorias", "cat_002"), {
    nome: "Matemática",
    ativo: true
  });

  batch.set(doc(db, "categorias", "cat_003"), {
    nome: "História",
    ativo: true
  });

  // =========================
  // CONFIGURAÇÕES
  // =========================

  batch.set(doc(db, "configuracoes", "sistema"), {
    diasEmprestimo: 7,
    multaPorDia: 2,
    maxLivrosPorAluno: 3,
    atualizadoEm: serverTimestamp()
  });

  await batch.commit();

  console.log("✅ Banco criado com sucesso.");
}

criarBancoBiblioteca().catch((error) => {
  console.error("❌ Erro:", error);
});