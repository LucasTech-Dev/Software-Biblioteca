import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion
}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  auth
}

from "../auth.js";

import {
  db
}

from "../firestore.js";


// ========================================
// USUÁRIO ATUAL
// ========================================

export async function obterUsuarioAtual() {

  const user =
    auth.currentUser;

  if (!user) {
    return null;
  }

  return obterUsuario(user.uid);

}


// ========================================
// OBTER USUÁRIO POR UID
// ========================================

export async function obterUsuario(uid) {

  const usuarioRef =
    doc(
      db,
      "usuarios",
      uid
    );

  const usuarioSnap =
    await getDoc(
      usuarioRef
    );

  if (!usuarioSnap.exists()) {
    return null;
  }

  return {

    id:
      usuarioSnap.id,

    ...usuarioSnap.data()

  };

}


// ========================================
// OCULTAR EMPRÉSTIMOS
// ========================================

export async function ocultarEmprestimos(ids) {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuarioRef =
    doc(
      db,
      "usuarios",
      user.uid
    );

  for (const id of ids) {

    await updateDoc(
      usuarioRef,
      {

        emprestimosOcultos:
          arrayUnion(id)

      }
    );

  }

}


// ========================================
// OCULTAR RESERVAS
// ========================================

export async function ocultarReservas(ids) {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuarioRef =
    doc(
      db,
      "usuarios",
      user.uid
    );

  for (const id of ids) {

    await updateDoc(
      usuarioRef,
      {

        reservasOcultas:
          arrayUnion(id)

      }
    );

  }

}


// ========================================
// LIMPAR EMPRÉSTIMOS OCULTOS
// ========================================

export async function limparEmprestimosOcultos() {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuarioRef =
    doc(
      db,
      "usuarios",
      user.uid
    );

  await updateDoc(
    usuarioRef,
    {

      emprestimosOcultos: []

    }
  );

}


// ========================================
// LIMPAR RESERVAS OCULTAS
// ========================================

export async function limparReservasOcultas() {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuarioRef =
    doc(
      db,
      "usuarios",
      user.uid
    );

  await updateDoc(
    usuarioRef,
    {

      reservasOcultas: []

    }
  ); 

}