import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

/**
 * Script único para criação/seed do banco (Firestore)
 * Executar com Node (ESM) após ajustar o firebaseConfig.
 */

const firebaseConfig = {

  apiKey: "AIzaSyAFzy56P9sgF6DIXKfaXvwIR1dlnhKKiU8",

  authDomain: "bancobiblioteca-24029.firebaseapp.com",

  projectId: "bancobiblioteca-24029",

  storageBucket: "bancobiblioteca-24029.firebasestorage.app",

  messagingSenderId: "691451184435",

  appId: "1:691451184435:web:c5b7492af74bcf6a116a46"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function criarBancoBiblioteca() {
  const batch = writeBatch(db);

  // =========================
  // USUÁRIOS
  // =========================
  batch.set(doc(db, "usuarios", "uid_001"), {
    nome: "Lucas Sant'ana",
    email: "lucas@gmail.com",
    tipo: "aluno", // aluno | professor | admin
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
  // Campos alinhados ao frontend (addLivros.js)
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
    status: "disponivel", // disponivel | emprestado | reservado
    emoji: "📖",
    cor: "#E8EDFF",
    descricao:
      "Um dos maiores clássicos da literatura brasileira.",
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
    status: "ativo", // ativo | devolvido | atrasado
    criadoEm: serverTimestamp()
  });

  // =========================
  // RESERVAS
  // =========================
  batch.set(doc(db, "reservas", "reserva_001"), {
    usuarioId: "uid_001",
    livroId: "livro_002",
    dataReserva: "2026-05-09",
    status: "esperando", // esperando | atendida | cancelada
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
  console.log("✅ Banco criado/semeado com sucesso.");
}

criarBancoBiblioteca().catch((error) => {
  console.error("❌ Erro ao criar banco:", error);
});