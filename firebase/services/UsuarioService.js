import { db } from "../firestore.js";
import { auth } from "../auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const UsuarioService = {
  async obterUsuario(uid) {
    if (!uid) return null;
    try {
      const ref = doc(db, "usuarios", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, uid: snap.id, ...snap.data() };
    } catch (error) {
      console.error("Erro ao obter usuário por UID:", error);
      return null;
    }
  },

  async obterUsuarioAtual() {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await this.obterUsuario(user.uid);
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error);
      return null;
    }
  },

  async listarTodos() {
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      return snapshot.docs.map((item) => ({ id: item.id, uid: item.id, ...item.data() }));
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      throw error;
    }
  },

  async atualizar(uid, dados) {
    if (!uid || !dados || typeof dados !== "object") return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, dados);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw error;
    }
  },

  async atualizarUsuario(uid, dados) {
    return this.atualizar(uid, dados);
  },

  async adicionarReserva(uid, reservaId) {
    if (!uid || !reservaId) return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, { reservas: arrayUnion(reservaId) });
    } catch (error) {
      console.error("Erro ao adicionar reserva ao usuário:", error);
      throw error;
    }
  },

  async removerReserva(uid, reservaId) {
    if (!uid || !reservaId) return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, { reservas: arrayRemove(reservaId) });
    } catch (error) {
      console.error("Erro ao remover reserva do usuário:", error);
      throw error;
    }
  },

  async adicionarHistorico(uid, item) {
    if (!uid || !item) return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, { historico: arrayUnion(item) });
    } catch (error) {
      console.error("Erro ao adicionar histórico:", error);
      throw error;
    }
  },

  async ocultarReservas(uid, idsReservas) {
    const validIds = (idsReservas || []).filter(id => typeof id === "string" && id.trim() !== "");
    if (validIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      validIds.forEach(id => {
        batch.update(doc(db, "reservas", id), { visivelAluno: false });
      });
      await batch.commit();
    } catch (error) {
      console.error("Erro ao ocultar reservas:", error);
      throw error;
    }
  },

  async ocultarEmprestimos(uid, idsEmprestimos) {
    const validIds = (idsEmprestimos || []).filter(id => typeof id === "string" && id.trim() !== "");
    if (validIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      validIds.forEach(id => {
        batch.update(doc(db, "emprestimos", id), { visivelAluno: false });
      });
      await batch.commit();
    } catch (error) {
      console.error("Erro ao ocultar empréstimos:", error);
      throw error;
    }
  }
};

export default UsuarioService;
