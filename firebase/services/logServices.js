import {

  collection,
  addDoc,
  serverTimestamp

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db }

from "../firestore.js";


// ========================================
// CRIAR LOG
// ========================================

export async function criarLog({

  usuarioId,

  nomeUsuario,

  matricula,

  tipo,

  livroId = null,

  tituloLivro = null,

  detalhes = {}

}) {

  try {

    await addDoc(

      collection(db, "logs"),

      {

        usuarioId,

        nomeUsuario,

        matricula,

        tipo,

        livroId,

        tituloLivro,

        detalhes,

        criadoEm:
          serverTimestamp()
      }
    );

  }

  catch (error) {

    console.error(
      "Erro ao criar log:",
      error
    );
  }
}