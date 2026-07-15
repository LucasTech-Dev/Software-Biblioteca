import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import { criarLog } from "./logServices.js";

class EmprestimoService {
  async criarEmprestimo({ usuario, livro, reservaId = null }) {
    if (!usuario?.uid) {
      throw new Error("Usuário não informado.");
    }

    if (!livro) {
      throw new Error("Livro não informado.");
    }

    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 7);

    const emprestimoRef = await addDoc(collection(db, "emprestimos"), {
      usuarioId: usuario.uid,
      nomeUsuario: usuario.nome || usuario.displayName || "Sem nome",
      matricula: usuario.matricula || "",
      turma: usuario.turma || "",
      livroId: livro.id,
      tituloLivro: livro.titulo || livro.title || "Sem título",
      retiradoEm: serverTimestamp(),
      prazoEntrega: Timestamp.fromDate(prazo),
      status: "ativo",
      visivelAluno: true,
      criadoEm: serverTimestamp()
    });

    if (reservaId) {
      await deleteDoc(doc(db, "reservas", reservaId));
    }

    await UsuarioService.adicionarEmprestimo(usuario.uid, emprestimoRef.id);
    await criarLog({
      usuarioId: usuario.uid,
      nomeUsuario: usuario.nome || usuario.displayName || "Sem nome",
      matricula: usuario.matricula || "",
      tipo: "EMPRESTIMO",
      livroId: livro.id,
      tituloLivro: livro.titulo || livro.title || "Sem título"
    });

    return { id: emprestimoRef.id };
  }

  async listarPorUsuario(uid) {
    if (!uid) return [];

    const q = query(collection(db, "emprestimos"), where("usuarioId", "==", uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));
  }

  async listarTodos() {
    const snapshot = await getDocs(collection(db, "emprestimos"));
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));
  }

  async aprovarReserva({ reservaId, dataRetirada, dataEntrega }) {
    if (!reservaId) throw new Error("Reserva não informada.");

    const reservaRef = doc(db, "reservas", reservaId);
    const reservaSnap = await getDoc(reservaRef);

    if (!reservaSnap.exists()) {
      throw new Error("Reserva não encontrada.");
    }

    const reserva = reservaSnap.data();
    const dataInicio = dataRetirada instanceof Date ? dataRetirada : new Date(dataRetirada || Date.now());
    const dataFim = dataEntrega instanceof Date ? dataEntrega : new Date(dataEntrega || Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.criarEmprestimo({
      usuario: {
        uid: reserva.usuarioId,
        nome: reserva.nomeUsuario || "Sem nome",
        matricula: reserva.matricula || "",
        turma: reserva.turma || ""
      },
      livro: {
        id: reserva.livroId,
        titulo: reserva.tituloLivro || "Sem título"
      },
      reservaId
    });

    await updateDoc(reservaRef, {
      status: "aprovada",
      prazoEntrega: Timestamp.fromDate(dataFim),
      retiradoEm: Timestamp.fromDate(dataInicio)
    });

    return true;
  }

  async marcarComoDevolvido(emprestimoId) {
    if (!emprestimoId) throw new Error("Empréstimo não informado.");
    await updateDoc(doc(db, "emprestimos", emprestimoId), { status: "devolvido" });
    return true;
  }

  async excluir(emprestimoId) {
    if (!emprestimoId) throw new Error("Empréstimo não informado.");
    await deleteDoc(doc(db, "emprestimos", emprestimoId));
    return true;
  }
}

export default new EmprestimoService();
