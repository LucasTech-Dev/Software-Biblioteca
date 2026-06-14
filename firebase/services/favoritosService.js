import {

  collection,

  addDoc,

  getDocs,

  query,

  where,

  serverTimestamp

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db }

from "../firestore.js";


// ========================================
// FAVORITAR
// ========================================

export async function favoritarLivro({

  usuarioId,

  livroId,

  tituloLivro

}) {

  await addDoc(

    collection(db, "favoritos"),

    {

      usuarioId,

      livroId,

      tituloLivro,

      criadoEm:
        serverTimestamp()
    }
  );
}


// ========================================
// LISTAR FAVORITOS
// ========================================

export async function listarFavoritos(uid) {

  const q = query(

    collection(db, "favoritos"),

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