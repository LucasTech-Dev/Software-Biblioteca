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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db } from "../firestore.js";

class FirestoreAcervoService {

    constructor() {
        this.collectionName = "acervo";
    }

    /**
     * Retorna todo o acervo da biblioteca.
     */
    async listar() {
        const snapshot = await getDocs(collection(db, this.collectionName));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Busca um livro do acervo pelo ID do documento.
     */
    async buscarPorId(id) {
        const snapshot = await getDoc(doc(db, this.collectionName, id));
        if (!snapshot.exists()) {
            return null;
        }
        return {
            id: snapshot.id,
            ...snapshot.data()
        };
    }

    /**
     * Busca um livro utilizando o ID do Supabase.
     */
    async buscarPorSupabaseId(supabaseId) {
        const q = query(
            collection(db, this.collectionName),
            where("supabaseId", "==", supabaseId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const documento = snapshot.docs[0];
        return {
            id: documento.id,
            ...documento.data()
        };
    }

    /**
     * Verifica se um livro já existe no acervo.
     */
    async existePorSupabaseId(supabaseId) {
        const livro = await this.buscarPorSupabaseId(supabaseId);
        return livro !== null;
    }

    /**
     * Adiciona um livro ao acervo.
     */
    async adicionar(dados) {
        const docRef = await addDoc(
            collection(db, this.collectionName),
            {
                ...dados,
                criadoEm: serverTimestamp(),
                atualizadoEm: serverTimestamp()
            }
        );
        return docRef.id;
    }

    /**
     * Atualiza qualquer informação genérica do acervo.
     */
    async atualizar(id, dados) {
        await updateDoc(
            doc(db, this.collectionName, id),
            {
                ...dados,
                atualizadoEm: serverTimestamp()
            }
        );
    }

    /**
     * Remove um livro do acervo fisicamente (hard delete).
     */
    async remover(id) {
        await deleteDoc(doc(db, this.collectionName, id));
    }

    // ====================================================
    // MÉTODOS DE DOMÍNIO DO ACERVO
    // ====================================================

    /**
     * Altera o status atual do livro.
     * Ex: disponivel, reservado, emprestado, indisponivel, manutencao.
     */
    async alterarStatus(id, status) {
        await this.atualizar(id, { status });
    }

    /**
     * Aumenta a quantidade de exemplares no acervo.
     * Afeta a quantidade total e a disponível.
     */
    async aumentarQuantidade(id, quantidade) {
        if (quantidade <= 0) {
            throw new Error("A quantidade a ser aumentada deve ser maior que zero.");
        }

        const livro = await this.buscarPorId(id);

        if (!livro) {
            throw new Error("Livro não encontrado no acervo.");
        }

        await this.atualizar(id, {
            quantidadeTotal: livro.quantidadeTotal + quantidade,
            quantidadeDisponivel: livro.quantidadeDisponivel + quantidade
        });
    }

    /**
     * Diminui a quantidade de exemplares no acervo.
     * Nunca permite que os valores fiquem negativos.
     */
    async diminuirQuantidade(id, quantidade) {
        if (quantidade <= 0) {
            throw new Error("A quantidade a ser diminuída deve ser maior que zero.");
        }

        const livro = await this.buscarPorId(id);

        if (!livro) {
            throw new Error("Livro não encontrado no acervo.");
        }

        if (livro.quantidadeDisponivel < quantidade) {
            throw new Error("Não há exemplares disponíveis suficientes para realizar esta baixa.");
        }

        await this.atualizar(id, {
            quantidadeTotal: livro.quantidadeTotal - quantidade,
            quantidadeDisponivel: livro.quantidadeDisponivel - quantidade
        });
    }

    /**
     * Atualiza diretamente a quantidade disponível.
     * Usado em orquestrações de empréstimos, devoluções e reservas.
     */
    async atualizarQuantidadeDisponivel(id, quantidade) {
        if (quantidade < 0) throw new Error("A quantidade disponível não pode ser negativa.");
        await this.atualizar(id, { quantidadeDisponivel: quantidade });
    }

    /**
     * Atualiza diretamente a quantidade reservada.
     */
    async atualizarQuantidadeReservada(id, quantidade) {
        if (quantidade < 0) throw new Error("A quantidade reservada não pode ser negativa.");
        await this.atualizar(id, { quantidadeReservada: quantidade });
    }

    /**
     * Atualiza diretamente a quantidade emprestada.
     */
    async atualizarQuantidadeEmprestada(id, quantidade) {
        if (quantidade < 0) throw new Error("A quantidade emprestada não pode ser negativa.");
        await this.atualizar(id, { quantidadeEmprestada: quantidade });
    }

}

export default new FirestoreAcervoService();