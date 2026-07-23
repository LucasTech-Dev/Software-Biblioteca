import { db } from "../firestore.js"; 
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

class ConfiguracaoService {
  
  /**
   * Obtém as regras atuais do sistema.
   * Se não existirem, retorna valores padrão.
   */
  static async obterRegras() {
    try {
      const snap = await getDoc(doc(db, "configuracoes", "sistema"));
      if (snap.exists()) {
        return snap.data();
      }
      return { diasEmprestimo: 7, maxLivrosPorAluno: 3 };
    } catch (error) {
      console.error("Erro ao obter regras do sistema:", error);
      throw error;
    }
  }

  /**
   * Salva as novas regras de empréstimo.
   */
  static async salvarRegras(diasEmprestimo, maxLivrosPorAluno) {
    try {
      await setDoc(doc(db, "configuracoes", "sistema"), {
        diasEmprestimo: parseInt(diasEmprestimo),
        maxLivrosPorAluno: parseInt(maxLivrosPorAluno),
        atualizadoEm: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Erro ao salvar regras:", error);
      throw error;
    }
  }

  /**
   * Registra a data/hora em que o último backup foi realizado.
   */
  static async registrarBackup() {
    try {
      await updateDoc(doc(db, "configuracoes", "sistema"), {
        ultimoBackup: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Erro ao registrar backup:", error);
      throw error;
    }
  }
}

export default ConfiguracaoService;