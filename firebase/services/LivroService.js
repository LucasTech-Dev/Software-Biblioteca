/*
====================================================
LivroService

Responsável pela integração e orquestração entre:
- Supabase (Catálogo Geral)
- Firestore (Acervo Físico/Local)

Nenhuma tela ou componente deve acessar os bancos
de dados (Supabase/Firestore) diretamente.
====================================================
*/

import SupabaseLivroService from "./SupabaseLivroService.js";
import FirestoreAcervoService from "./FirestoreAcervoService.js";
import LivroMapper from "./LivroMapper.js";

class LivroService {

    /**
     * Retorna todo o catálogo do Supabase.
     */
    async buscarCatalogo() {
        try {
            return await SupabaseLivroService.buscarTodos();
        } catch (error) {
            console.error("Erro ao buscar catálogo do Supabase:", error);
            throw error;
        }
    }

    /**
     * Pesquisa livros do catálogo pelo título.
     */
    async buscarCatalogoPorTitulo(titulo) {
        try {
            return await SupabaseLivroService.buscarPorTitulo(titulo);
        } catch (error) {
            console.error(`Erro ao buscar catálogo por título "${titulo}":`, error);
            throw error;
        }
    }

    /**
     * Pesquisa livro pelo ISBN.
     */
    async buscarCatalogoPorISBN(isbn) {
        try {
            return await SupabaseLivroService.buscarPorISBN(isbn);
        } catch (error) {
            console.error(`Erro ao buscar catálogo por ISBN "${isbn}":`, error);
            throw error;
        }
    }

    /**
     * Pesquisa livros por categoria.
     */
    async buscarCatalogoPorCategoria(categoria) {
        try {
            return await SupabaseLivroService.buscarPorCategoria(categoria);
        } catch (error) {
            console.error(`Erro ao buscar catálogo por categoria "${categoria}":`, error);
            throw error;
        }
    }

    /**
     * Busca um livro do catálogo (Supabase) por ID.
     * Nome alterado de buscarLivro para buscarLivroCatalogo para evitar ambiguidade.
     */
    async buscarLivroCatalogo(id) {
        try {
            return await SupabaseLivroService.buscarPorId(id);
        } catch (error) {
            console.error(`Erro ao buscar livro no catálogo pelo ID "${id}":`, error);
            throw error;
        }
    }

    /**
     * Retorna um livro completo (Supabase + Firestore).
     */
    async buscarLivroCompleto(supabaseId) {
        try {
            const livroSupabase =
                await SupabaseLivroService.buscarPorId(supabaseId);

            const livroAcervo =
                await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);

            return LivroMapper.mapear(
                livroSupabase,
                livroAcervo
            );
        } catch (error) {
            console.error(`Erro ao buscar livro completo para o supabaseId "${supabaseId}":`, error);
            throw error;
        }
    }

    /**
     * Lista todo o acervo já unificado.
     */
    async listarAcervo() {
        try {
            const livrosCatalogo = await SupabaseLivroService.buscarTodos();

            if (!livrosCatalogo || livrosCatalogo.length === 0) {
                return [];
            }

            const livrosAcervo = await FirestoreAcervoService.listar().catch(() => []);
            const indiceAcervo = new Map(
                livrosAcervo
                    .filter(livro => livro && livro.supabaseId !== null && livro.supabaseId !== undefined)
                    .map(livro => [livro.supabaseId, livro])
            );

            return (livrosCatalogo || []).map(livro => {
                const acervo = indiceAcervo.get(livro.id);
                return {
                    ...LivroMapper.mapear(livro, acervo),
                    status: acervo?.status ?? "disponivel",
                    quantidadeTotal: acervo?.quantidadeTotal ?? 1,
                    quantidadeDisponivel: acervo?.quantidadeDisponivel ?? 1,
                    quantidadeReservada: acervo?.quantidadeReservada ?? 0,
                    quantidadeEmprestada: acervo?.quantidadeEmprestada ?? 0
                };
            });
        } catch (error) {
            console.error("Erro ao listar acervo unificado:", error);
            throw error;
        }
    }

    /**
     * Verifica se um livro já existe no acervo físico (Firestore).
     */
    async existeNoAcervo(supabaseId) {
        try {
            const livro = await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);
            return livro !== null;
        } catch (error) {
            console.error(`Erro ao verificar existência no acervo para o supabaseId "${supabaseId}":`, error);
            throw error;
        }
    }

    /**
     * Busca um registro de livro diretamente no Firestore.
     */
    async buscarRegistroAcervo(supabaseId) {
        try {
            return await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);
        } catch (error) {
            console.error(`Erro ao buscar registro do acervo para o supabaseId "${supabaseId}":`, error);
            throw error;
        }
    }

    /**
     * Adiciona um livro ao acervo.
     */
    async adicionarAoAcervo(dados) {
        try {
            const {
                supabaseId,
                quantidade
            } = dados;

            if (!supabaseId) {
                throw new Error("SupabaseId não informado.");
            }

            if (!quantidade || quantidade <= 0) {
                throw new Error("A quantidade deve ser maior que zero.");
            }

            // Melhoria: Usando o novo método encapsulado existeNoAcervo
            const existente = await this.existeNoAcervo(supabaseId);

            if (existente) {
                throw new Error("Este livro já está no acervo.");
            }

            const livro = await SupabaseLivroService.buscarPorId(supabaseId);

            if (!livro) {
                throw new Error("Livro não encontrado no catálogo.");
            }

            const firestoreId = await FirestoreAcervoService.adicionar({
                supabaseId: livro.id,
                isbn: livro.isbn,
                titulo: livro.titulo,
                autores: livro.autores ?? [],
                editora: livro.editora ?? "",
                capa: livro.capa ?? "",
                quantidadeTotal: quantidade,
                quantidadeDisponivel: quantidade,
                quantidadeReservada: 0,
                quantidadeEmprestada: 0,
                status: "disponivel",
                ativo: true // Melhoria: Soft delete preparado para o futuro
            });

            return firestoreId;
        } catch (error) {
            console.error("Erro ao adicionar livro ao acervo:", error);
            throw error;
        }
    }

    // TODO: aumentarQuantidade()
    // TODO: diminuirQuantidade()
    // TODO: atualizarStatus()
    // TODO: reservarLivro()
    // TODO: cancelarReserva()
    // TODO: emprestarLivro()
    // TODO: devolverLivro()
    // TODO: listarHistorico()
}

export default new LivroService();