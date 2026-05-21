import { initializeApp } from "firebase/app";

import {
  getFirestore,
  doc,
  setDoc
} from "firebase/firestore";


// ========================================
// CONFIG FIREBASE
// ========================================

const firebaseConfig = {

  apiKey: "AIzaSyAFzy56P9sgF6DIXKfaXvwIR1dlnhKKiU8",

  authDomain: "bancobiblioteca-24029.firebaseapp.com",

  projectId: "bancobiblioteca-24029",

  storageBucket: "bancobiblioteca-24029.firebasestorage.app",

  messagingSenderId: "691451184435",

  appId: "1:691451184435:web:c5b7492af74bcf6a116a46"
};


// ========================================
// INIT FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// ========================================
// SEED DATABASE
// ========================================

async function seed() {

  try {

    console.log("CRIANDO COLEÇÕES...");


    // =====================================
    // USUÁRIOS
    // =====================================

    await setDoc(
      doc(db, "usuarios", "uid_001"),
      {

        nome: "Lucas Sant'ana",

        email: "lucas@gmail.com",

        tipo: "aluno",

        turma: "2A",

        matricula: "2026001",

        ativo: true,

        criadoEm: "2026-05-09"

      }
    );


    await setDoc(
      doc(db, "usuarios", "uid_002"),
      {

        nome: "Carlos Silva",

        email: "prof@gmail.com",

        tipo: "professor",

        disciplina: "Matemática",

        ativo: true

      }
    );


    // =====================================
    // LIVROS
    // =====================================

    await setDoc(
      doc(db, "livros", "livro_001"),
      {

        titulo: "Dom Casmurro",

        autor: "Machado de Assis",

        categoria: "Literatura",

        isbn: "978123456",

        ano: 1899,

        quantidade: 5,

        disponiveis: 3,

        descricao: "Livro clássico brasileiro"

      }
    );


    await setDoc(
      doc(db, "livros", "livro_002"),
      {

        titulo: "Harry Potter",

        autor: "J.K Rowling",

        categoria: "Fantasia",

        isbn: "978654321",

        ano: 1997,

        quantidade: 10,

        disponiveis: 8

      }
    );


    // =====================================
    // EMPRÉSTIMOS
    // =====================================

    await setDoc(
      doc(db, "emprestimos", "emp_001"),
      {

        usuarioId: "uid_001",

        livroId: "livro_001",

        dataEmprestimo: "2026-05-09",

        dataDevolucao: "2026-05-16",

        status: "ativo"

      }
    );


    // =====================================
    // RESERVAS
    // =====================================

    await setDoc(
      doc(db, "reservas", "reserva_001"),
      {

        usuarioId: "uid_001",

        livroId: "livro_002",

        dataReserva: "2026-05-09",

        status: "esperando"

      }
    );


    // =====================================
    // CATEGORIAS
    // =====================================

    await setDoc(
      doc(db, "categorias", "cat_001"),
      {

        nome: "Literatura"

      }
    );


    await setDoc(
      doc(db, "categorias", "cat_002"),
      {

        nome: "Matemática"

      }
    );


    await setDoc(
      doc(db, "categorias", "cat_003"),
      {

        nome: "História"

      }
    );


    // =====================================
    // CONFIGURAÇÕES
    // =====================================

    await setDoc(
      doc(db, "configuracoes", "sistema"),
      {

        diasEmprestimo: 7,

        multaPorDia: 2,

        maxLivrosPorAluno: 3

      }
    );


    console.log("BANCO CRIADO COM SUCESSO");

  }

  catch(error) {

    console.error("ERRO:");

    console.error(error);

  }

}

seed();