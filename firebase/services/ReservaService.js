import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db } from "../firestore.js";
import UsuarioService from "./usuariosService.js";

class ReservaService {
  async criarReserva({ usuario, livro, firestoreId = null }) {
    if (!usuario?.uid) {
      throw new Error("Usuário não informado.");
    }

    if (!livro) {
      throw new Error("Livro não informado.");
    }

    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 2);

    const reservaRef = await addDoc(collection(db, "reservas"), {
      usuarioId: usuario.uid,
      nomeUsuario: usuario.nome || usuario.displayName || "Sem nome",
      matricula: usuario.matricula || "",
      turma: usuario.turma || "",
      livroId: livro.id,
      tituloLivro: livro.titulo || livro.title || "Sem título",
      autorLivro: livro.autor || livro.author || (Array.isArray(livro.autores) ? livro.autores[0] : ""),
      status: "esperando",
      visivelAluno: true,
      dataReserva: new Date().toISOString(),
      prazoReserva: Timestamp.fromDate(prazo),
      criadoEm: serverTimestamp()
    });

    if (firestoreId) {
      const acervoRef = doc(db, "acervo", firestoreId);
      await updateDoc(acervoRef, {
        status: "reservado",
        quantidadeDisponivel: increment(-1),
        quantidadeReservada: increment(1)
      });
    }

    await UsuarioService.adicionarReserva(usuario.uid, reservaRef.id);
    await UsuarioService.adicionarHistorico(usuario.uid, {
      nome: livro.titulo || livro.title || "Sem título",
      retirada: "-",
      devolucao: "-",
      status: "Reservado"
    });

    return { id: reservaRef.id };
  }

  async listarPorUsuario(uid) {
    if (!uid) return [];

    const q = query(collection(db, "reservas"), where("usuarioId", "==", uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));
  }

  async listarPendentes() {
    const q = query(collection(db, "reservas"), where("status", "==", "esperando"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));
  }

  async cancelar(reservaId) {
    if (!reservaId) throw new Error("Reserva não informada.");
    await deleteDoc(doc(db, "reservas", reservaId));
  }
}

export default new ReservaService();
