import {
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db } from "../firestore.js";

// ============================================
// BOTÃO
// ============================================

const botao = document.getElementById("criarBancoBtn");

botao.addEventListener("click", async () => {

  try {

    await criarBancoBiblioteca();

    alert("✅ Banco criado com sucesso.");

  } catch (error) {

    console.error(error);

    alert("❌ Erro ao criar banco.");
  }
});

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function criarBancoBiblioteca() {

  const batch = writeBatch(db);

  // =====================================================
  // USUÁRIOS
  // =====================================================

  batch.set(doc(db, "usuarios", "uid_001"), {

    uid: "uid_001",

    nome: "Lucas Sant'ana",

    email: "lucas@gmail.com",

    tipo: "aluno",

    matricula: "2026001",

    turma: "2A",

    ativo: true,

    bloqueado: false,

    livrosPegos: 1,

    reservasAtivas: 1,

    multas: 0,

    criadoEm: serverTimestamp(),

    atualizadoEm: serverTimestamp()
  });

  batch.set(doc(db, "usuarios", "uid_002"), {

    uid: "uid_002",

    nome: "Carlos Silva",

    email: "prof@gmail.com",

    tipo: "professor",

    registroFuncional: "RF-1002",

    disciplina: "Matemática",

    ativo: true,

    bloqueado: false,

    livrosPegos: 0,

    reservasAtivas: 0,

    multas: 0,

    criadoEm: serverTimestamp(),

    atualizadoEm: serverTimestamp()
  });

  // =====================================================
  // LIVROS
  // =====================================================

  batch.set(doc(db, "livros", "livro_001"), {

    livroId: "livro_001",

    titulo: "Dom Casmurro",

    autor: "Machado de Assis",

    categoria: "Literatura",

    isbn: "9788535902775",

    ano: 1899,

    editora: "Garnier",

    quantidadeTotal: 3,

    quantidadeDisponivel: 2,

    quantidadeReservada: 0,

    quantidadeEmprestada: 1,

    status: "ativo",

    emoji: "📖",

    cor: "#E8EDFF",

    descricao:
      "Um dos maiores clássicos da literatura brasileira.",

    criadoEm: serverTimestamp(),

    atualizadoEm: serverTimestamp()
  });

  batch.set(doc(db, "livros", "livro_002"), {

    livroId: "livro_002",

    titulo: "Harry Potter",

    autor: "J.K Rowling",

    categoria: "Fantasia",

    isbn: "9788532511011",

    ano: 1997,

    editora: "Rocco",

    quantidadeTotal: 10,

    quantidadeDisponivel: 8,

    quantidadeReservada: 1,

    quantidadeEmprestada: 1,

    status: "ativo",

    emoji: "🧙",

    cor: "#FFF7ED",

    descricao:
      "Série de fantasia com foco em aventura escolar.",

    criadoEm: serverTimestamp(),

    atualizadoEm: serverTimestamp()
  });

  // =====================================================
  // EMPRÉSTIMOS
  // =====================================================

  batch.set(doc(db, "emprestimos", "emp_001"), {

    emprestimoId: "emp_001",

    usuarioId: "uid_001",

    nomeUsuario: "Lucas Sant'ana",

    matricula: "2026001",

    turma: "2A",

    livroId: "livro_001",

    tituloLivro: "Dom Casmurro",

    retiradoEm: Timestamp.fromDate(
      new Date("2026-05-09")
    ),

    prazoEntrega: Timestamp.fromDate(
      new Date("2026-05-16")
    ),

    devolvidoEm: null,

    status: "ativo",

    multa: 0,

    renovacoes: 0,

    criadoEm: serverTimestamp()
  });

  // =====================================================
  // RESERVAS
  // =====================================================

  batch.set(doc(db, "reservas", "reserva_001"), {

    reservaId: "reserva_001",

    usuarioId: "uid_001",

    nomeUsuario: "Lucas Sant'ana",

    matricula: "2026001",

    turma: "2A",

    livroId: "livro_002",

    tituloLivro: "Harry Potter",

    reservadoEm: Timestamp.fromDate(
      new Date("2026-05-09")
    ),

    prazoReserva: Timestamp.fromDate(
      new Date("2026-05-11")
    ),

    status: "esperando",

    retirado: false,

    expirado: false,

    criadoEm: serverTimestamp()
  });

  // =====================================================
  // FAVORITOS
  // =====================================================

  batch.set(
    doc(
      db,
      "usuarios",
      "uid_001",
      "favoritos",
      "livro_002"
    ),

    {

      livroId: "livro_002",

      titulo: "Harry Potter",

      autor: "J.K Rowling",

      criadoEm: serverTimestamp()
    }
  );

  // =====================================================
  // LOGS
  // =====================================================

  batch.set(doc(db, "logs", "log_001"), {

    usuarioId: "uid_001",

    nomeUsuario: "Lucas Sant'ana",

    matricula: "2026001",

    tipo: "RESERVA_CRIADA",

    livroId: "livro_002",

    tituloLivro: "Harry Potter",

    detalhes: {
      status: "esperando"
    },

    criadoEm: serverTimestamp()
  });

  batch.set(doc(db, "logs", "log_002"), {

    usuarioId: "uid_001",

    nomeUsuario: "Lucas Sant'ana",

    matricula: "2026001",

    tipo: "EMPRESTIMO_REALIZADO",

    livroId: "livro_001",

    tituloLivro: "Dom Casmurro",

    detalhes: {
      prazoEntrega: "2026-05-16"
    },

    criadoEm: serverTimestamp()
  });

  // =====================================================
  // CATEGORIAS
  // =====================================================

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

  // =====================================================
  // CONFIGURAÇÕES
  // =====================================================

  batch.set(doc(db, "configuracoes", "sistema"), {

    diasEmprestimo: 7,

    multaPorDia: 2,

    maxLivrosPorAluno: 3,

    maxReservasPorAluno: 2,

    atualizadoEm: serverTimestamp()
  });

  // =====================================================
  // COMMIT
  // =====================================================

  await batch.commit();

  console.log("✅ Banco estruturado com sucesso.");
}