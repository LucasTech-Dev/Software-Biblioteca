import { db } from "../firestore.js";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  increment, 
  serverTimestamp  
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

class ResumoService {
  /**
   * Salva o resumo enviado pelo aluno (evita duplicações para o mesmo empréstimo)
   */
  static async enviarResumo({ emprestimoId, alunoId, alunoNome, tituloLivro, resumo }) {
    if (!emprestimoId || !alunoId || !resumo?.trim()) {
      throw new Error("Parâmetros obrigatórios ausentes para envio do resumo.");
    }

    // 1. Verifica se o aluno já enviou um resumo para este empréstimo
    const resumoExistente = await this.obterResumoPorEmprestimo(emprestimoId);
    if (resumoExistente) {
      throw new Error("Você já enviou um resumo para este empréstimo.");
    }

    // 2. Salva o resumo na coleção 'resumos'
    const resumosRef = collection(db, "resumos");
    const docRef = await addDoc(resumosRef, {
      emprestimoId,
      alunoId,
      alunoNome: alunoNome || "Aluno",
      tituloLivro: tituloLivro || "Livro",
      resumo: resumo.trim(),
      status: "aguardando",
      criadoEm: serverTimestamp()
    });

    // 3. Marca no documento do empréstimo que o resumo foi enviado
    try {
      const emprestimoRef = doc(db, "emprestimos", emprestimoId);
      await updateDoc(emprestimoRef, { resumoEnviado: true });
    } catch (err) {
      console.warn("Não foi possível atualizar a flag no empréstimo:", err);
    }

    return docRef;
  }

  /**
   * Busca um resumo específico atrelado a um empréstimo
   */
  static async obterResumoPorEmprestimo(emprestimoId) {
    if (!emprestimoId) return null;

    const resumosRef = collection(db, "resumos");
    const q = query(resumosRef, where("emprestimoId", "==", emprestimoId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() };
  }

  /**
   * Busca todos os resumos enviados por um aluno específico
   */
  static async obterResumosPorAluno(alunoId) {
    if (!alunoId) return [];

    const resumosRef = collection(db, "resumos");
    const q = query(resumosRef, where("alunoId", "==", alunoId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /** * Aprova o resumo e envia +1 moeda para a conta do aluno no Firestore
   */
  static async aprovarResumo(resumoId, alunoId) {
    if (!resumoId || !alunoId) {
      throw new Error("IDs inválidos para aprovação.");
    }

    const resumoRef = doc(db, "resumos", resumoId);
    const resumoSnap = await getDoc(resumoRef);

    if (!resumoSnap.exists()) {
      throw new Error("Resumo não encontrado.");
    }

    const resumoData = resumoSnap.data();

    if (resumoData.status === "aprovado") {
      throw new Error("Este resumo já foi aprovado anteriormente.");
    }

    const usuarioRef = doc(db, "usuarios", alunoId);

    await updateDoc(resumoRef, { 
      status: "aprovado",
      aprovadoEm: serverTimestamp() 
    });

    await updateDoc(usuarioRef, { 
      moedas: increment(1) 
    });
  }
}

export default ResumoService;