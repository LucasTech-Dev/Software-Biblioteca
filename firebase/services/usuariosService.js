import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { updatePassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { auth } from "../auth.js";
import { db } from "../firestore.js";

class UsuarioService {

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

  async editarPerfil(uid, dados) {
    return this.atualizarPerfil(uid, dados);
  }

  async atualizarPerfil(uid, dados) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, dados);
  }

  async alterarSenha(novaSenha) {
    if (!auth.currentUser) {
      throw new Error("Usuário não autenticado.");
    }

    if (!novaSenha || novaSenha.length < 6) {
      throw new Error("A senha deve ter no mínimo 6 caracteres.");
    }

    await updatePassword(auth.currentUser, novaSenha);
  }

  async adicionarHistorico(uid, registro) {
    if (!uid) throw new Error("UID do usuário não fornecido.");
    const usuarioRef = doc(db, "usuarios", uid);
    await updateDoc(usuarioRef, {
      historico: arrayUnion(registro)
    });
  }

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