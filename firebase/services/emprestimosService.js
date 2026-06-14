import {

  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  getDoc,
  doc, 
  deleteDoc,
  increment,
  serverTimestamp,
  Timestamp

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db }

from "../firestore.js";

import { criarLog } from "./logServices.js";


// ========================================
// EXCLUIR RESERVA
// ========================================

export async function excluirReserva(
  reservaId
) {

  await deleteDoc(
    doc(
      db,
      "reservas",
      reservaId
    )
  );

}

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

  const lista = snapshot.docs.map(doc => ({

    id: doc.id,

    ...doc.data()

  }));

  lista.sort((a, b) => {

    const dataA =
      a.criadoEm?.seconds || 0;

    const dataB =
      b.criadoEm?.seconds || 0;

    return dataB - dataA;

  });

  return lista;
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

// ========================================
// APROVAR RESERVA
// ========================================

export async function aprovarReserva({

  reservaId,
  dataRetirada,
  dataEntrega

}) {

  // FIX: normaliza string YYYY-MM-DD → Date local (evita timezone shift)
  const normalizarData = (data) => {

  if (!data) {
    throw new Error("Data inválida: vazia");
  }

  let d;

  // CASO 1: já é Date
  if (data instanceof Date) {
    d = data;
  }

  // CASO 2: Timestamp do Firestore
  else if (data?.toDate) {
    d = data.toDate();
  }

  // CASO 3: string
  else if (typeof data === "string") {
    d = new Date(data.includes("T") ? data : data + "T00:00:00");
  }

  // CASO 4: número (timestamp)
  else if (typeof data === "number") {
    d = new Date(data);
  }

  else {
    throw new Error("Tipo inválido de data: " + typeof data);
  }

  if (isNaN(d.getTime())) {
    throw new Error("Data inválida: " + data);
  }

  return Timestamp.fromDate(d);
};

  try {

    console.log("DATA RETIRADA RAW:", dataRetirada);
    console.log("DATA ENTREGA RAW:", dataEntrega);
    console.log("DATA RETIRADA JS:", new Date(dataRetirada + "T00:00:00"));
    console.log("DATA ENTREGA JS:", new Date(dataEntrega + "T00:00:00"));

    const reservaRef =
      doc(db, "reservas", reservaId);

    const reservaSnap =
      await getDoc(reservaRef);

    if (!reservaSnap.exists()) {

      throw new Error(
        "Reserva não encontrada."
      );

    }

    const reserva =
      reservaSnap.data();

    await addDoc(

      collection(db, "emprestimos"),

      {

        usuarioId:
          reserva.usuarioId,

        // FIX: fallback para inconsistência de schema (nomeUsuario ou nome)
        nomeUsuario:
          reserva.nomeUsuario ||
          reserva.nome ||
          "Sem nome",

        matricula:
          reserva.matricula,

        turma:
          reserva.turma,

        livroId:
          reserva.livroId,

        tituloLivro:
          reserva.tituloLivro,

        // FIX: normalização de data com timezone seguro
        retiradoEm:
          normalizarData(dataRetirada),

        prazoEntrega:
          normalizarData(dataEntrega),

        status:
          "ativo",

        criadoEm:
          serverTimestamp()

      }

    );

    await updateDoc(

      reservaRef,

      {

        status:
          "aprovado"

      }

    );

    await criarLog({

      usuarioId:
        reserva.usuarioId,

      // FIX: consistência com o resto do sistema
        nomeUsuario:
          reserva.nomeUsuario ||
          reserva.nome ||
          "Sem nome",
      matricula:
        reserva.matricula,

      tipo:
        "APROVACAO_RESERVA",

      livroId:
        reserva.livroId,

      tituloLivro:
        reserva.tituloLivro

    });

    return true;

  }

  catch (error) {

    console.error(error);

    throw error;

  }

}
// ========================================
// EXCLUIR EMPRÉSTIMO
// ========================================

export async function excluirEmprestimo(
  emprestimoId
) {

  try {

    await deleteDoc(
      doc(
        db,
        "emprestimos",
        emprestimoId
      )
    );

    return true;

  }

  catch (error) {

    console.error(error);

    throw error;

  }

}


// ========================================
// EXCLUIR TODOS EMPRÉSTIMOS
// ========================================

export async function excluirTodosEmprestimos() {

  const snapshot =
    await getDocs(
      collection(db, "emprestimos")
    );

  for (const item of snapshot.docs) {

    await deleteDoc(item.ref);

  }

}


// ========================================
// MARCAR COMO DEVOLVIDO
// ========================================

export async function marcarComoDevolvido(
  emprestimoId
) {

  try {

    const emprestimoRef =
      doc(
        db,
        "emprestimos",
        emprestimoId
      );

    await updateDoc(
      emprestimoRef,
      {
        status: "devolvido"
      }
    );

    return true;

  }

  catch (error) {

    console.error(error);

    throw error;

  }

}