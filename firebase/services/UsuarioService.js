import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { updatePassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { auth } from "../auth.js";
import { db } from "../firestore.js";

class UsuarioService {

  /**
   * Obtém os dados do usuário atualmente autenticado no Firebase Auth.
   */
  async obterUsuarioAtual() {
    const user = auth.currentUser;
    if (!user) return null;
    return this.obterUsuario(user.uid);
  }

  /**
   * Busca um usuário pelo seu UID no Firestore.
   */
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

  /**
   * Lista todos os usuários cadastrados (para o Painel Administrativo).
   */
  async listarTodos() {
    try {
      const snap = await getDocs(collection(db, "usuarios"));
      return snap.docs.map(documento => ({
        id: documento.id,
        ...documento.data()
      }));
    } catch (error) {
      console.error("Erro ao listar todos os usuários:", error);
      return [];
    }
  }

  /**
   * Métodos para atualização do perfil
   */
  async editarPerfil(uid, dados) {
    return this.atualizarPerfil(uid, dados);
  }

  async atualizar(uid, dados) {
    return this.atualizarPerfil(uid, dados);
  }

  async atualizarPerfil(uid, dados) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, dados);
  }

  /**
   * Altera a senha do usuário no Firebase Auth.
   */
  async alterarSenha(novaSenha) {
    if (!auth.currentUser) {
      throw new Error("Usuário não autenticado.");
    }

    if (!novaSenha || novaSenha.length < 6) {
      throw new Error("A senha deve ter no mínimo 6 caracteres.");
    }

    await updatePassword(auth.currentUser, novaSenha);
  }

  /**
   * Adiciona um registro ao histórico de leitura do usuário.
   */
  async adicionarHistorico(uid, registro) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      historico: arrayUnion(registro)
    });
  }

  /**
   * Gerenciamento de Reservas no perfil do usuário
   */
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

  /**
   * Gerenciamento de Empréstimos no perfil do usuário
   */
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

  /**
   * Gerenciamento de Favoritos
   */
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

  /**
   * Ocultar e limpar registros visíveis do painel do aluno
   */
  async ocultarEmprestimos(uid, ids) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
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

export default new UsuarioService();