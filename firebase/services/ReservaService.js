import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db } from "../firestore.js";
import LivroService from "./LivroService.js";
import UsuarioService from "./usuariosService.js";
import NotificacaoService from "./NotificacaoService.js";

class ReservaService {
    constructor() {
        this.collectionName = "reservas";
    }

    /**
     * Fluxo completo para o aluno solicitar uma reserva.
     */
    async solicitarReserva({ supabaseId, observacao = "" }) {
        try {
            if (!supabaseId) {
                throw new Error("SupabaseId do livro não informado.");
            }

            // O Service agora busca o usuário de forma autônoma
            const usuario = await UsuarioService.obterUsuarioAtual();

            if (!usuario) {
                throw new Error("Usuário não autenticado.");
            }

            // 1. Busca os dados completos do livro (Catálogo + Acervo)
            const livroCompleto = await LivroService.buscarLivroCompleto(supabaseId);

            if (!livroCompleto) {
                throw new Error("Livro não encontrado.");
            }

            // Removido o bloqueio que impedia reservar caso não houvesse exemplares

            // 2. Cria o documento na coleção "reservas"
            const reservaRef = await addDoc(collection(db, this.collectionName), {
                livroId: livroCompleto.id || null, // ID do Firestore do Acervo
                supabaseId: supabaseId,
                isbn: livroCompleto.isbn || "",
                titulo: livroCompleto.titulo || "Sem título",
                
                // Extrai as informações diretamente do objeto retornado pelo UsuarioService
                usuarioId: usuario.id || usuario.uid,
                nomeUsuario: usuario.nome || usuario.displayName || "Sem nome",
                turma: usuario.turma || "",

                status: "PENDENTE",
                dataSolicitacao: serverTimestamp(),
                professorId: null,
                dataAprovacao: null,
                observacao: observacao
            });

            // 3. Bloqueia um exemplar no acervo (mesmo que fique negativo gerando fila)
            await LivroService.reservarExemplar(supabaseId);

            // 4. Atualiza os dados do usuário (adiciona a reserva no array do usuário)
            if (UsuarioService.adicionarReserva) {
                await UsuarioService.adicionarReserva(usuario.id || usuario.uid, reservaRef.id);
            }

            // 5. Adiciona histórico
            if (UsuarioService.adicionarHistorico) {
                await UsuarioService.adicionarHistorico(usuario.id || usuario.uid, {
                    nome: livroCompleto.titulo || "Sem título",
                    retirada: "-",
                    devolucao: "-",
                    status: "Reserva Solicitada"
                });
            }

            return { id: reservaRef.id };
        } catch (error) {
            console.error("Erro ao solicitar reserva:", error);
            throw error;
        }
    }

    async criarReserva(payload) {
        return this.solicitarReserva(payload);
    }

    async verificarReservaExistente({ usuarioId, supabaseId }) {
        try {
            if (!usuarioId || !supabaseId) return false;

            const q = query(
                collection(db, this.collectionName),
                where("usuarioId", "==", usuarioId),
                where("supabaseId", "==", supabaseId),
                where("status", "in", ["PENDENTE", "APROVADA"])
            );

            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error("Erro ao verificar reserva existente:", error);
            return false;
        }
    }

    /**
     * Busca os dados de uma reserva específica pelo seu ID.
     */
    async buscarReserva(reservaId) {
        try {
            const snapshot = await getDoc(doc(db, this.collectionName, reservaId));
            if (!snapshot.exists()) return null;

            return {
                id: snapshot.id,
                ...snapshot.data()
            };
        } catch (error) {
            console.error(`Erro ao buscar reserva ${reservaId}:`, error);
            throw error;
        }
    }

    async listarUsuario(uid) {
        return this.listarReservasAluno(uid);
    }

    /**
     * Lista todas as reservas de um aluno específico.
     */
    async listarReservasAluno(uid) {
        try {
            if (!uid) return [];
            const q = query(
                collection(db, this.collectionName),
                where("usuarioId", "==", uid)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Erro ao listar reservas do aluno ${uid}:`, error);
            throw error;
        }
    }

    /**
     * Lista apenas reservas com status PENDENTE (Para o painel do professor).
     */
    async listarPendentes() {
        try {
            const q = query(
                collection(db, this.collectionName),
                where("status", "==", "PENDENTE")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Erro ao listar reservas pendentes:", error);
            throw error;
        }
    }

    /**
     * Lista reservas para a visão geral do professor.
     */
    async listarReservasProfessor() {
        return await this.listarPendentes();
    }

    async aprovar({ reservaId, professorId, nomeProfessor, dataRetirada, dataEntrega }) {
        return this.aprovarReserva({ reservaId, professorId, nomeProfessor, dataRetirada, dataEntrega });
    }

    /**
     * Fluxo de aprovação da reserva (feita pelo professor).
     */
    async aprovarReserva({ reservaId, professorId, nomeProfessor, dataRetirada, dataEntrega }) {
        try {
            const reserva = await this.buscarReserva(reservaId);
            if (!reserva) throw new Error("Reserva não encontrada.");
            if (reserva.status !== "PENDENTE") throw new Error("A reserva não está pendente.");

            const EmprestimoService = (await import("./EmprestimoService.js")).default;

            await EmprestimoService.criarEmprestimo({
                usuario: {
                    uid: reserva.usuarioId,
                    nome: reserva.nomeUsuario,
                    matricula: reserva.matricula,
                    turma: reserva.turma
                },
                supabaseId: reserva.supabaseId,
                reservaId: reservaId,
                professorId: professorId,
                nomeProfessor: nomeProfessor,
                dataRetirada,
                dataEntrega
            });

            await updateDoc(doc(db, this.collectionName, reservaId), {
                status: "APROVADA",
                professorId: professorId,
                dataAprovacao: serverTimestamp()
            });

            if (UsuarioService.adicionarHistorico) {
                await UsuarioService.adicionarHistorico(reserva.usuarioId, {
                    nome: reserva.titulo,
                    retirada: "-",
                    devolucao: "-",
                    status: "Reserva Aprovada"
                });
            }

            await NotificacaoService.criar({
                usuarioId: reserva.usuarioId,
                titulo: "Reserva aprovada",
                mensagem: `Sua reserva de "${reserva.titulo}" foi aprovada.`,
                tipo: "reserva_aprovada"
            });
        } catch (error) {
            console.error("Erro ao aprovar reserva:", error);
            throw error;
        }
    }

    /**
     * Fluxo de recusa da reserva (feita pelo professor).
     */
    async recusarReserva(reservaId, professorId) {
        try {
            const reserva = await this.buscarReserva(reservaId);
            if (!reserva) throw new Error("Reserva não encontrada.");
            
            await updateDoc(doc(db, this.collectionName, reservaId), {
                status: "RECUSADA",
                professorId: professorId,
                dataAprovacao: serverTimestamp() 
            });

            await LivroService.cancelarReserva(reserva.supabaseId);

            if (UsuarioService.removerReserva) {
                await UsuarioService.removerReserva(reserva.usuarioId, reservaId);
            }

            if (UsuarioService.adicionarHistorico) {
                await UsuarioService.adicionarHistorico(reserva.usuarioId, {
                    nome: reserva.titulo,
                    retirada: "-",
                    devolucao: "-",
                    status: "Reserva Recusada"
                });
            }

            await NotificacaoService.criar({
                usuarioId: reserva.usuarioId,
                titulo: "Reserva recusada",
                mensagem: `Sua reserva de "${reserva.titulo}" foi recusada.`,
                tipo: "reserva_recusada"
            });
        } catch (error) {
            console.error("Erro ao recusar reserva:", error);
            throw error;
        }
    }

    async cancelar(reservaId) {
        return this.cancelarReserva(reservaId);
    }

    async remover(reservaId) {
        return this.cancelarReserva(reservaId);
    }

    /**
     * Aluno cancela sua própria reserva.
     */
    async cancelarReserva(reservaId) {
        try {
            const reserva = await this.buscarReserva(reservaId);
            if (!reserva) throw new Error("Reserva não encontrada.");

            await updateDoc(doc(db, this.collectionName, reservaId), {
                status: "CANCELADA"
            });

            await LivroService.cancelarReserva(reserva.supabaseId);

            if (UsuarioService.removerReserva) {
                await UsuarioService.removerReserva(reserva.usuarioId, reservaId);
            }

            if (UsuarioService.adicionarHistorico) {
                await UsuarioService.adicionarHistorico(reserva.usuarioId, {
                    nome: reserva.titulo,
                    retirada: "-",
                    devolucao: "-",
                    status: "Reserva Cancelada"
                });
            }

            await NotificacaoService.criar({
                usuarioId: reserva.usuarioId,
                titulo: "Reserva cancelada",
                mensagem: `Sua reserva de "${reserva.titulo}" foi cancelada.`,
                tipo: "reserva_cancelada"
            });
        } catch (error) {
            console.error("Erro ao cancelar reserva:", error);
            throw error;
        }
    }
}

export default new ReservaService();