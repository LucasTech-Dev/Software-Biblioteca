import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove // <-- Adicionado para remover itens de arrays
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth } from "../auth.js";
import { db } from "../firestore.js";

class UsuarioService {

  // ========================================
  // LEITURA
  // ========================================

  async obterUsuarioAtual() {
    const user = auth.currentUser;
    if (!user) return null;
    return this.obterUsuario(user.uid);
  }

  async obterUsuario(uid) {
    if (!uid) throw new Error("UID do usuário não fornecido.");

    const usuarioRef = doc(db, "usuarios", uid);
    const usuarioSnap = await getDoc(usuarioRef);

    if (!usuarioSnap.exists()) return null;

    return {
      id: usuarioSnap.id,
      ...usuarioSnap.data()
    };
  }

  // ========================================
  // PERFIL
  // ========================================

  async atualizarPerfil(uid, dados) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, dados);
  }

  // ========================================
  // HISTÓRICO
  // ========================================

  async adicionarHistorico(uid, registro) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      historico: arrayUnion(registro)
    });
  }

  // ========================================
  // RESERVAS
  // ========================================

  async adicionarReserva(uid, reservaId) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      reservas: arrayUnion(reservaId)
    });
  }

  async removerReserva(uid, reservaId) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      reservas: arrayRemove(reservaId)
    });
  }

  // ========================================
  // EMPRÉSTIMOS
  // ========================================

  async adicionarEmprestimo(uid, emprestimoId) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      emprestimos: arrayUnion(emprestimoId)
    });
  }

  async removerEmprestimo(uid, emprestimoId) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      emprestimos: arrayRemove(emprestimoId)
    });
  }

  // ========================================
  // FAVORITOS
  // ========================================

  async adicionarFavorito(uid, livroId) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      favoritos: arrayUnion(livroId)
    });
  }

  async removerFavorito(uid, livroId) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      favoritos: arrayRemove(livroId)
    });
  }

  // ========================================
  // UI / OCULTAR ITENS
  // ========================================

  async ocultarEmprestimos(uid, ids) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    
    // Passando os IDs usando spread operator para ser uma única chamada no arrayUnion
    await updateDoc(usuarioRef, {
      emprestimosOcultos: arrayUnion(...ids)
    });
  }

  async ocultarReservas(uid, ids) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    
    await updateDoc(usuarioRef, {
      reservasOcultas: arrayUnion(...ids)
    });
  }

  async limparEmprestimosOcultos(uid) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      emprestimosOcultos: []
    });
  }

  async limparReservasOcultas(uid) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      reservasOcultas: []
    });
  }
}

// Exporta como um Singleton
export default new UsuarioService();