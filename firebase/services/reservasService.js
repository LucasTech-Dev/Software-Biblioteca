import {

  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
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
from "./logServices.js";


// ========================================
// RESERVAR LIVRO
// ========================================

export async function reservarLivro({

  usuario,
  livro

}) {

  try {

    const prazo = new Date();

    prazo.setDate(
      prazo.getDate() + 2
    );

    await addDoc(

      collection(db, "reservas"),

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

        reservadoEm:
          serverTimestamp(),

        prazoReserva:
          Timestamp.fromDate(
            prazo
          ),

        status:
          "esperando",

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

      quantidadeReservada:
        increment(1),

      quantidadeDisponivel:
        increment(-1)

    });

    // USUÁRIO

    const usuarioRef = doc(
      db,
      "usuarios",
      usuario.uid
    );

    await updateDoc(usuarioRef, {

      reservasAtivas:
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
        "RESERVA", 
 
      livroId:
        livro.id,

      tituloLivro:
        livro.titulo

    });

    alert("Livro reservado.");

  }

  catch (error) {

    console.error(error);

    alert("Erro ao reservar.");

  }

}


// ========================================
// LISTAR RESERVAS DO USUÁRIO
// ========================================

export async function listarReservasUsuario(uid) {

  const q = query(

    collection(db, "reservas"),

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
// LISTAR TODAS AS RESERVAS
// ========================================

export async function listarTodasReservas() {

  const snapshot =
    await getDocs(
      collection(db, "reservas")
    );

  return snapshot.docs.map(doc => ({

    id: doc.id,

    ...doc.data()

  }));

}


// ========================================
// LISTAR RESERVAS PENDENTES
// ========================================

export async function listarReservasPendentes() {

  const q = query(

    collection(db, "reservas"),

    where(
      "status",
      "==",
      "esperando"
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
// EXCLUIR RESERVA
// ========================================

export async function excluirReserva(
  reservaId
) {

  try {

    await deleteDoc(
      doc(
        db,
        "reservas",
        reservaId
      )
    );

    return true;

  }

  catch (error) {

    console.error(error);

    throw error;

  }

}