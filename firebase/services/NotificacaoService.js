import { db } from "../firestore.js";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const NotificacaoService = {

  /**
   * 1. Criar Notificação
   * Padroniza a estrutura com título, mensagem, tipo, lida: false e criadoEm automático.
   */
  async criar({ usuarioId, titulo, mensagem, tipo = "geral" }) {
    try {
      const novaNotificacao = {
        usuarioId,
        titulo,
        mensagem,
        tipo,
        lida: false,
        criadoEm: serverTimestamp() // Padrão uniforme de data do servidor
      };

      const docRef = await addDoc(collection(db, "notificacoes"), novaNotificacao);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      throw error;
    }
  },

  /**
   * 2. Listar Notificações do Usuário (Busca Única)
   * Agora faz a ordenação "desc" direto no Firestore (muito mais performático).
   */
  async listarUsuario(usuarioId) {
    try {
      const q = query(
        collection(db, "notificacoes"),
        where("usuarioId", "==", usuarioId),
        orderBy("criadoEm", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao listar notificações:", error);
      return [];
    }
  },

  async listarNotificacoesUsuario(usuarioId) {
    return this.listarUsuario(usuarioId);
  },

  /**
   * 3. Observar Notificações em Tempo Real
   * A tela se atualiza automaticamente assim que o status mudar ou uma nova notificação chegar.
   * Retorna a função de "unsubscribe" para desligar o listener ao fechar a tela.
   */
  observarUsuario(usuarioId, callback) {
    try {
      const q = query(
        collection(db, "notificacoes"),
        where("usuarioId", "==", usuarioId),
        orderBy("criadoEm", "desc")
      );

      return onSnapshot(q, (snapshot) => {
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(lista);
      }, (error) => {
        console.error("Erro no listener de notificações:", error);
      });
    } catch (error) {
      console.error("Erro ao iniciar observador de notificações:", error);
      return () => {}; // Retorna função vazia para evitar quebras se falhar
    }
  },

  /**
   * 4. Marcar uma Notificação como Lida
   */
  async marcarComoLida(notificacaoId) {
    try {
      const docRef = doc(db, "notificacoes", notificacaoId);
      await updateDoc(docRef, { lida: true });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      throw error;
    }
  },

  /**
   * 5. Marcar Todas como Lidas (Operação em Lote / Batch)
   * Busca todas as não lidas do usuário e executa a atualização em uma única requisição.
   */
  async marcarTodas(usuarioId) {
    return this.marcarTodasComoLidas(usuarioId);
  },

  async marcarTodasComoLidas(usuarioId) {
    try {
      const q = query(
        collection(db, "notificacoes"),
        where("usuarioId", "==", usuarioId),
        where("lida", "==", false)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        const docRef = doc(db, "notificacoes", docSnap.id);
        batch.update(docRef, { lida: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      throw error;
    }
  },

  /**
   * 6. Contar Não Lidas em Tempo Real
   * Ideal para renderizar um "badge" vermelho no ícone de notificações (ex: "🔔 3").
   */
  async contarNaoLidas(usuarioId) {
    try {
      const q = query(
        collection(db, "notificacoes"),
        where("usuarioId", "==", usuarioId),
        where("lida", "==", false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      return 0;
    }
  },

  observarNaoLidas(usuarioId, callback) {
    try {
      const q = query(
        collection(db, "notificacoes"),
        where("usuarioId", "==", usuarioId),
        where("lida", "==", false)
      );

      return onSnapshot(q, (snapshot) => {
        callback(snapshot.size);
      }, (error) => {
        console.error("Erro ao observar contagem de não lidas:", error);
      });
    } catch (error) {
      console.error("Erro ao observar contagem:", error);
      return () => {};
    }
  },

  /**
   * 7. Remover uma Notificação Específica
   */
  async remover(notificacaoId) {
    try {
      const docRef = doc(db, "notificacoes", notificacaoId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao remover notificação:", error);
      throw error;
    }
  },

  /**
   * 8. Remover Todas as Notificações do Usuário (Batch)
   */
  async removerTodas(usuarioId) {
    try {
      const q = query(
        collection(db, "notificacoes"),
        where("usuarioId", "==", usuarioId)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        const docRef = doc(db, "notificacoes", docSnap.id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao remover todas as notificações:", error);
      throw error;
    }
  }
};

export default NotificacaoService;