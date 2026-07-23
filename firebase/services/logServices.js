import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { db } from "../firestore.js";

// ========================================
// CRIAR LOG
// ========================================
export async function criarLog({
  usuarioId = "sistema",
  nomeUsuario = "Sistema",
  matricula = "",
  tipo,
  livroId = null,
  tituloLivro = null,
  detalhes = ""
}) {
  try {
    await addDoc(
      collection(db, "logs"),
      {
        usuarioId,
        nomeUsuario,
        matricula,
        tipo,
        livroId,
        tituloLivro,
        detalhes,
        criadoEm: serverTimestamp()
      }
    );
  } catch (error) {
    console.error("Erro ao criar log:", error);
  }
}

// ========================================
// LISTAR LOGS (Para o Painel Admin)
// ========================================
export async function listarLogs(quantidade = 50) {
  try {
    const q = query(
      collection(db, "logs"), 
      orderBy("criadoEm", "desc"), 
      limit(quantidade)
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(documento => ({ id: documento.id, ...documento.data() }));
  } catch (error) {
    console.error("Erro ao listar logs:", error);
    return [];
  }
}

// ========================================
// LIMPAR TODOS OS LOGS (Para o Painel Admin)
// ========================================
export async function limparTodosLogs() {
  try {
    const snap = await getDocs(collection(db, "logs"));
    
    // Apaga os documentos em paralelo
    const promises = snap.docs.map(documento => 
      deleteDoc(doc(db, "logs", documento.id))
    );
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error("Erro ao limpar logs:", error);
    throw error;
  }
}