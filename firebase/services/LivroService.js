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
 
/**
 * Valida se o título do livro existe, não está em branco
 * e não é apenas o número do ISBN.
 */
function ehTituloValido(titulo) {
    if (!titulo || typeof titulo !== "string") return false;
    
    // Remove traços e espaços para checar se sobrou apenas um ISBN
    const limpo = titulo.replace(/[\s-]/g, '');
    const ehApenasISBN = /^\d{10,13}$/.test(limpo);

    return titulo.trim() !== '' && !ehApenasISBN;
}

class LivroService {

    /**
     * Retorna todo o catálogo do Supabase (ignora livros sem título válido).
     */
    async buscarCatalogo() {
        try {
            const catalogo = await SupabaseLivroService.buscarTodos();
            return (catalogo || []).filter(l => ehTituloValido(l.titulo));
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
     * AUTO-HEALING: Se o livro ainda não estiver no Firestore, gera os dados padrões dele.
     */
    async buscarLivroCompleto(supabaseId) {
        try {
            const livroSupabase = await SupabaseLivroService.buscarPorId(supabaseId);
            const livroAcervo = await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);

            const mapeado = LivroMapper.mapear(livroSupabase, livroAcervo);
            return {
                ...mapeado,
                status: livroAcervo?.status ?? "disponivel",
                quantidadeTotal: livroAcervo?.quantidadeTotal ?? 1,
                quantidadeDisponivel: livroAcervo?.quantidadeDisponivel ?? 1,
                quantidadeReservada: livroAcervo?.quantidadeReservada ?? 0,
                quantidadeEmprestada: livroAcervo?.quantidadeEmprestada ?? 0
            };
        } catch (error) {
            console.error(`Erro ao buscar livro completo para o supabaseId "${supabaseId}":`, error);
            throw error;
        }
    }

    /**
     * Lista todo o acervo já unificado.
     * Filtra automaticamente livros que possuem ISBN no lugar do título.
     */
    async listarAcervo() {
        try {
            const livrosCatalogo = await SupabaseLivroService.buscarTodos();

            if (!livrosCatalogo || livrosCatalogo.length === 0) {
                return [];
            }

            // Filtra o catálogo para manter apenas livros com título válido
            const catalogoFiltrado = livrosCatalogo.filter(livro => ehTituloValido(livro.titulo));

            const livrosAcervo = await FirestoreAcervoService.listar().catch(() => []);
            const indiceAcervo = new Map(
                livrosAcervo
                    .filter(livro => livro && livro.supabaseId !== null && livro.supabaseId !== undefined)
                    .map(livro => [livro.supabaseId, livro])
            );

            return catalogoFiltrado.map(livro => {
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
     * Adiciona um livro ao acervo de forma manual.
     */
    async adicionarAoAcervo(dados) {
        try {
            const { supabaseId, quantidade } = dados;

            if (!supabaseId) {
                throw new Error("SupabaseId não informado.");
            }

            if (!quantidade || quantidade <= 0) {
                throw new Error("A quantidade deve ser maior que zero.");
            }

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
                ativo: true 
            });

            return firestoreId;
        } catch (error) {
            console.error("Erro ao adicionar livro ao acervo:", error);
            throw error;
        }
    }

    // ====================================================
    // MÉTODOS DE ORQUESTRAÇÃO DE RESERVAS E EMPRÉSTIMOS
    // ====================================================

    /**
     * Reserva um exemplar do livro.
     * AUTO-HEALING: Se o livro não existir no Firestore, cria o registro automaticamente.
     */
    async reservarExemplar(supabaseId) {
        let livro = await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);

        // Se o livro ainda não existe no Firestore, criamos ele dinamicamente com 1 cópia padrão
        if (!livro) {
            const livroCatalogo = await SupabaseLivroService.buscarPorId(supabaseId);

            if (!livroCatalogo) {
                throw new Error("Livro não encontrado no catálogo geral do Supabase.");
            }

            await FirestoreAcervoService.adicionar({
                supabaseId: livroCatalogo.id,
                isbn: livroCatalogo.isbn,
                titulo: livroCatalogo.titulo,
                autores: livroCatalogo.autores ?? [],
                editora: livroCatalogo.editora ?? "",
                capa: livroCatalogo.capa ?? "",
                quantidadeTotal: 1,
                quantidadeDisponivel: 1,
                quantidadeReservada: 0,
                quantidadeEmprestada: 0,
                status: "disponivel",
                ativo: true
            });

            // Recupera o documento recém-criado do acervo do Firestore
            livro = await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);
        }

        await FirestoreAcervoService.atualizar(livro.id, {
            quantidadeDisponivel: livro.quantidadeDisponivel - 1,
            quantidadeReservada: livro.quantidadeReservada + 1,
            status: (livro.quantidadeDisponivel - 1) > 0 ? "disponivel" : "indisponivel"
        });
    }

    /**
     * Cancela uma reserva.
     */
    async cancelarReserva(supabaseId) {
        const livro = await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);

        if (!livro) {
            throw new Error("Livro não encontrado.");
        }

        await FirestoreAcervoService.atualizar(livro.id, {
            quantidadeDisponivel: livro.quantidadeDisponivel + 1,
            quantidadeReservada: Math.max(livro.quantidadeReservada - 1, 0),
            status: (livro.quantidadeDisponivel + 1) > 0 ? "disponivel" : "indisponivel"
        });
    }

    /**
     * Converte uma reserva em empréstimo.
     */
    async emprestarExemplar(supabaseId) {
        const livro = await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);

        if (!livro) {
            throw new Error("Livro não encontrado.");
        }

        await FirestoreAcervoService.atualizar(livro.id, {
            quantidadeReservada: Math.max(livro.quantidadeReservada - 1, 0),
            quantidadeEmprestada: livro.quantidadeEmprestada + 1,
            status: "emprestado"
        });
    }

    /**
     * Registra a devolução de um exemplar.
     */
    async devolverExemplar(supabaseId) {
        const livro = await FirestoreAcervoService.buscarPorSupabaseId(supabaseId);

        if (!livro) {
            throw new Error("Livro não encontrado.");
        }

        const emprestados = Math.max(livro.quantidadeEmprestada - 1, 0);
        const disponiveis = livro.quantidadeDisponivel + 1;

        await FirestoreAcervoService.atualizar(livro.id, {
            quantidadeEmprestada: emprestados,
            quantidadeDisponivel: disponiveis,
            status: disponiveis > 0 ? "disponivel" : "indisponivel"
        });
    }
}

export default new LivroService();