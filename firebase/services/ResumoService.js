import { db } from "../firestore.js";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  increment, 
  serverTimestamp  
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

class ResumoService {
  /**
   * Salva o resumo enviado pelo aluno
   */
  static async enviarResumo({ emprestimoId, alunoId, alunoNome, tituloLivro, resumo }) {
    const resumosRef = collection(db, "resumos");
    return await addDoc(resumosRef, {
      emprestimoId,
      alunoId,
      alunoNome,
      tituloLivro,
      resumo,
      status: "aguardando",
      criadoEm: serverTimestamp()
    });
  }

  /**
   * Busca o resumo atrelado ao empréstimo
   */
  static async obterResumoPorEmprestimo(emprestimoId) {
    const resumosRef = collection(db, "resumos");
    const q = query(resumosRef, where("emprestimoId", "==", emprestimoId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() };
  }

  /** 
   * Aprova o resumo e envia +1 moeda para a conta do aluno no Firestore
   */
  static async aprovarResumo(resumoId, alunoId) {
    const resumoRef = doc(db, "resumos", resumoId);
    const usuarioRef = doc(db, "usuarios", alunoId);

    await updateDoc(resumoRef, { status: "aprovado" });
    await updateDoc(usuarioRef, { moedas: increment(1) });
  }
}

export default ResumoService;