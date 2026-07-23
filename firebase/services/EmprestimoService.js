import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db } from "../firestore.js";
import LivroService from "./LivroService.js";
import ConfiguracaoService from "./ConfiguracaoService.js"; // <--- Novo Service importado
import { criarLog } from "./logServices.js";
import NotificacaoService from "./NotificacaoService.js";

class EmprestimoService {
    constructor() {
        this.collectionName = "emprestimos";
    }

    /**
     * Função auxiliar para garantir consistência nas datas que chegam do front-end.
     */
    _normalizarData(data) {
        if (!data) return null;
        let d;

        if (data instanceof Date) {
            d = data;
        } else if (data?.toDate) {
            d = data.toDate();
        } else if (typeof data === "string") {
            d = new Date(data.includes("T") ? data : data + "T00:00:00");
        } else if (typeof data === "number") {
            d = new Date(data);
        } else {
            throw new Error("Tipo inválido de data: " + typeof data);
        }

        if (isNaN(d.getTime())) {
            throw new Error("Data inválida: " + data);
        }

        return Timestamp.fromDate(d);
    }

    /**
     * Fluxo completo de criação de empréstimo (direto ou a partir de reserva).
     */
    async criarEmprestimo({ usuario, supabaseId, reservaId = null, professorId = null, nomeProfessor = null, dataRetirada = null, dataEntrega = null }) {
        try {
            if (!usuario?.uid) throw new Error("Usuário não informado.");
            if (!supabaseId) throw new Error("SupabaseId do livro não informado.");

            // 1. Busca os dados completos do livro e as regras do sistema
            const [livroCompleto, regras] = await Promise.all([
                LivroService.buscarLivroCompleto(supabaseId),
                ConfiguracaoService.obterRegras()
            ]);
            
            if (!livroCompleto) {
                throw new Error("Livro não encontrado no acervo.");
            }

            // 1.5. Verifica o limite de livros do aluno (Regra do Painel de Admin)
            const historicoAluno = await this.listarEmprestimosAluno(usuario.uid);
            const qtdEmprestados = historicoAluno.filter(emp => emp.status === "EMPRESTADO").length;
            
            if (qtdEmprestados >= regras.maxLivrosPorAluno) {
                throw new Error(`Limite de empréstimos atingido! O máximo permitido é de ${regras.maxLivrosPorAluno} livros simultâneos.`);
            }

            // Define os prazos
            const dataInicio = dataRetirada ? this._normalizarData(dataRetirada) : serverTimestamp();
            
            // Prazo dinâmico baseado nas configurações caso não seja enviado (Regra do Painel de Admin)
            let dataFim;
            if (dataEntrega) {
                dataFim = this._normalizarData(dataEntrega);
            } else {
                const dataCalculada = new Date();
                dataCalculada.setDate(dataCalculada.getDate() + regras.diasEmprestimo);
                dataFim = Timestamp.fromDate(dataCalculada);
            }

            // 2. Cria o documento na coleção "emprestimos"
            const emprestimoRef = await addDoc(collection(db, this.collectionName), {
                usuarioId: usuario.uid,
                nomeUsuario: usuario.nome || usuario.displayName || "Sem nome",
                matricula: usuario.matricula || "",
                turma: usuario.turma || "",
                
                livroId: livroCompleto.id || null, // ID do acervo físico no Firestore
                supabaseId: supabaseId,
                isbn: livroCompleto.isbn || "",
                tituloLivro: livroCompleto.titulo || "Sem título",

                reservaId: reservaId, // Relacionamento permanente (pode ser null)
                professorId: professorId,
                nomeProfessor: nomeProfessor || "Não informado",

                retiradoEm: dataInicio,
                prazoEntrega: dataFim,
                devolvidoEm: null,

                status: "EMPRESTADO",
                visivelAluno: true,
                criadoEm: serverTimestamp()
            });

            // 3. Orquestra a baixa no acervo físico via LivroService
            await LivroService.emprestarExemplar(supabaseId);

            // 4. Registra no Log do sistema
            await criarLog({
                usuarioId: usuario.uid,
                nomeUsuario: usuario.nome || "Sem nome",
                matricula: usuario.matricula || "",
                tipo: "EMPRESTIMO",
                livroId: livroCompleto.id || "",
                tituloLivro: livroCompleto.titulo || "Sem título"
            });

            return { id: emprestimoRef.id };
        } catch (error) {
            console.error("Erro ao criar empréstimo:", error);
            throw error;
        }
    }

    /**
     * Busca dados de um empréstimo específico.
     */
    async buscarEmprestimo(emprestimoId) {
        try {
            const snap = await getDoc(doc(db, this.collectionName, emprestimoId));
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() };
        } catch (error) {
            console.error(`Erro ao buscar empréstimo ${emprestimoId}:`, error);
            throw error;
        }
    }

    async listarUsuario(uid) {
        return this.listarEmprestimosAluno(uid);
    }

    /**
     * Lista TODOS os empréstimos (ativos ou finalizados) vinculados a um aluno específico.
     */
    async listarEmprestimosAluno(uid) {
        try {
            if (!uid) return [];
            const q = query(
                collection(db, this.collectionName),
                where("usuarioId", "==", uid)
            );
            const snapshot = await getDocs(q);
            
            // Mapeia e ordena do mais recente para o mais antigo
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const dataA = a.criadoEm?.seconds || 0;
                    const dataB = b.criadoEm?.seconds || 0;
                    return dataB - dataA;
                });
        } catch (error) {
            console.error(`Erro ao listar empréstimos do aluno ${uid}:`, error);
            throw error;
        }
    }

    /**
     * NOVO: Lista o Histórico Real do Usuário (apenas os livros com status DEVOLVIDO).
     * Ideal para alimentar a Área do Usuário de forma dinâmica.
     */
    async listarHistoricoUsuario(usuarioId) {
        try {
            if (!usuarioId) return [];
            const q = query(
                collection(db, this.collectionName),
                where("usuarioId", "==", usuarioId),
                where("status", "==", "DEVOLVIDO")
            );
            const snapshot = await getDocs(q);
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Ordena localmente pela data de devolução decrescente (mais recentes primeiro)
            return lista.sort((a, b) => {
                const dataA = a.devolvidoEm?.seconds || 0;
                const dataB = b.devolvidoEm?.seconds || 0;
                return dataB - dataA;
            });
        } catch (error) {
            console.error("Erro ao listar histórico do usuário no EmprestimoService:", error);
            return [];
        }
    }

    /**
     * Lista empréstimos para o painel do professor (todos).
     */
    async listarEmprestimosProfessor() {
        try {
            return await this.listarTodos();
        } catch (error) {
            console.error("Erro ao listar empréstimos para o professor:", error);
            throw error;
        }
    }

    async listarAtivos() {
        const todos = await this.listarTodos();
        return todos.filter(emprestimo => emprestimo.status === "EMPRESTADO");
    }

    async listarAtrasados() {
        const ativos = await this.listarAtivos();
        return ativos.filter(emprestimo => {
            if (!emprestimo.prazoEntrega) return false;
            const prazo = emprestimo.prazoEntrega?.toDate ? emprestimo.prazoEntrega.toDate() : new Date(emprestimo.prazoEntrega);
            return new Date() > prazo;
        });
    }

    async listarDevolvidos() {
        const todos = await this.listarTodos();
        return todos.filter(emprestimo => emprestimo.status === "DEVOLVIDO");
    }

    /**
     * Retorna todos os empréstimos do banco de dados (geral).
     */
    async listarTodos() {
        try {
            const snapshot = await getDocs(collection(db, this.collectionName));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Erro ao listar todos os empréstimos:", error);
            throw error;
        }
    }

    async aprovarReserva(payload) {
        const ReservaService = (await import("./ReservaService.js")).default;
        return ReservaService.aprovar(payload);
    }

    async marcarComoDevolvido(emprestimoId) {
        return this.registrarDevolucao(emprestimoId);
    }

    /**
     * Registra a devolução de um exemplar.
     */
    async registrarDevolucao(emprestimoId) {
        try {
            if (!emprestimoId) throw new Error("Empréstimo não informado.");

            // 1. Busca os detalhes do empréstimo ativo
            const emprestimo = await this.buscarEmprestimo(emprestimoId);
            if (!emprestimo) throw new Error("Empréstimo não encontrado.");
            if (emprestimo.status === "DEVOLVIDO") throw new Error("Este livro já foi devolvido.");

            // 2. Atualiza o status do empréstimo no Firestore
            await updateDoc(doc(db, this.collectionName, emprestimoId), {
                status: "DEVOLVIDO",
                devolvidoEm: serverTimestamp()
            });

            // 3. Orquestra o retorno do exemplar para o acervo via LivroService
            await LivroService.devolverExemplar(emprestimo.supabaseId);

            // 4. Registra no Log do sistema
            await criarLog({
                usuarioId: emprestimo.usuarioId,
                nomeUsuario: emprestimo.nomeUsuario || "Sem nome",
                matricula: emprestimo.matricula || "",
                tipo: "DEVOLUCAO",
                livroId: emprestimo.livroId || "",
                tituloLivro: emprestimo.tituloLivro || "Sem título"
            });

            await NotificacaoService.criar({
                usuarioId: emprestimo.usuarioId,
                titulo: "Devolução registrada",
                mensagem: `A devolução de "${emprestimo.tituloLivro || "o livro"}" foi registrada com sucesso.`,
                tipo: "devolucao"
            });

            return true;
        } catch (error) {
            console.error("Erro ao registrar devolução:", error);
            throw error;
        }
    }

    /**
     * Marca um empréstimo como ATRASADO.
     */
    async marcarAtrasado(emprestimoId) {
        try {
            if (!emprestimoId) throw new Error("Empréstimo não informado.");

            await updateDoc(doc(db, this.collectionName, emprestimoId), {
                status: "ATRASADO"
            });

            return true;
        } catch (error) {
            console.error("Erro ao marcar empréstimo como atrasado:", error);
            throw error;
        }
    }

    /**
     * Remove um empréstimo fisicamente (hard delete) - Apenas administrativo.
     */
    async excluir(emprestimoId) {
        try {
             if (!emprestimoId) throw new Error("Empréstimo não informado.");
            await deleteDoc(doc(db, this.collectionName, emprestimoId));
            return true;
        } catch (error) {
            console.error("Erro ao excluir empréstimo:", error);
            throw error;
        }
    }
}

export default new EmprestimoService();