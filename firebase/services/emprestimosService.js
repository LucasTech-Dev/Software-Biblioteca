import {

  collection,

  addDoc,

  getDocs,

  query,

  where,

  updateDoc,

  doc,

  increment,

  serverTimestamp,

  Timestamp

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db }

from "../firestore.js";

import {

  criarLog

}

from "./logsService.js";


// ========================================
// REALIZAR EMPRÉSTIMO
// ========================================

export async function realizarEmprestimo({

  usuario,

  livro

}) {

  try {

    const prazo =
      new Date();

    prazo.setDate(
      prazo.getDate() + 7
    );

    await addDoc(

      collection(db, "emprestimos"),

      {

        usuarioId:
          usuario.uid,

        nomeUsuario:
          usuario.nome,

        matricula:
          usuario.matricula,

        turma:
          usuario.turma,

        livroId:
          livro.id,

        tituloLivro:
          livro.titulo,

        retiradoEm:
          serverTimestamp(),

        prazoEntrega:
          Timestamp.fromDate(
            prazo
          ),

        status:
          "ativo",

        criadoEm:
          serverTimestamp()
      }
    );

    // LIVRO

    const livroRef = doc(
      db,
      "livros",
      livro.id
    );

    await updateDoc(livroRef, {

      quantidadeEmprestada:
        increment(1)
    });

    // USUÁRIO

    const usuarioRef = doc(
      db,
      "usuarios",
      usuario.uid
    );

    await updateDoc(usuarioRef, {

      livrosPegos:
        increment(1)
    });

    // LOG

    await criarLog({

      usuarioId:
        usuario.uid,

      nomeUsuario:
        usuario.nome,

      matricula:
        usuario.matricula,

      tipo:
        "EMPRESTIMO",

      livroId:
        livro.id,

      tituloLivro:
        livro.titulo
    });

    alert(
      "Empréstimo realizado."
    );

  }

  catch (error) {

    console.error(error);

    alert(
      "Erro ao emprestar."
    );
  }
}


// ========================================
// LISTAR USUÁRIO
// ========================================

export async function listarEmprestimosUsuario(uid) {

  const q = query(

    collection(db, "emprestimos"),

    where(
      "usuarioId",
      "==",
      uid
    )
  );

  const snapshot =
    await getDocs(q);

  return snapshot.docs.map(doc => ({

    id: doc.id,

    ...doc.data()
  }));
}


// ========================================
// LISTAR TODOS
// ========================================

export async function listarTodosEmprestimos() {

  const snapshot =
    await getDocs(
      collection(db, "emprestimos")
    );

  return snapshot.docs.map(doc => ({

    id: doc.id,

    ...doc.data()
  }));
}