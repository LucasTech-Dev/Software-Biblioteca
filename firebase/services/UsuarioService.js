import { db } from "../firestore.js";
import { auth } from "../auth.js";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  writeBatch 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const UsuarioService = {
  /**
   * Obtém os dados de um usuário pelo seu UID (Usado por usuario.js e meusEmprestimos.js)
   */
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

  /**
   * Obtém os dados do usuário atualmente logado (Usado pelo ReservaService)
   */
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

  /**
   * Atualiza dados cadastrais do perfil do aluno
   */
  async atualizarUsuario(uid, dados) {
    if (!uid || !dados) return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, dados);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw error;
    }
  },

  /**
   * Vincula uma reserva ao perfil do aluno
   */
  async adicionarReserva(uid, reservaId) {
    if (!uid || !reservaId) return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, {
        reservas: arrayUnion(reservaId)
      });
    } catch (error) {
      console.error("Erro ao adicionar reserva ao usuário:", error);
    }
  },

  /**
   * Remove uma reserva do perfil do aluno
   */
  async removerReserva(uid, reservaId) {
    if (!uid || !reservaId) return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, {
        reservas: arrayRemove(reservaId)
      });
    } catch (error) {
      console.error("Erro ao remover reserva do usuário:", error);
    }
  },

  /**
   * Adiciona um registro no histórico do aluno
   */
  async adicionarHistorico(uid, item) {
    if (!uid || !item) return;
    try {
      const ref = doc(db, "usuarios", uid);
      await updateDoc(ref, {
        historico: arrayUnion(item)
      });
    } catch (error) {
      console.error("Erro ao adicionar histórico:", error);
    }
  },

  /**
   * Oculta uma lista de reservas para o aluno (Botão "Apagar")
   */
  async ocultarReservas(uid, idsReservas) {
    const validIds = (idsReservas || []).filter(id => typeof id === "string" && id.trim() !== "");
    if (validIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      validIds.forEach(id => {
        const ref = doc(db, "reservas", id);
        batch.update(ref, { visivelAluno: false });
      });
      await batch.commit();
    } catch (error) {
      console.error("Erro ao ocultar reservas:", error);
      throw error;
    }
  },

  /**
   * Oculta uma lista de empréstimos para o aluno (Botão "Apagar")
   */
  async ocultarEmprestimos(uid, idsEmprestimos) {
    const validIds = (idsEmprestimos || []).filter(id => typeof id === "string" && id.trim() !== "");
    if (validIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      validIds.forEach(id => {
        const ref = doc(db, "emprestimos", id);
        batch.update(ref, { visivelAluno: false });
      });
      await batch.commit();
    } catch (error) {
      console.error("Erro ao ocultar empréstimos:", error);
      throw error;
    }
  }
};

export default UsuarioService;