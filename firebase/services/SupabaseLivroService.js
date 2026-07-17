import { supabase } from "../supabase.js";

class SupabaseLivroService {

    /**
     * Busca todos os livros do catálogo.
     */
    async buscarTodos() {
        const { data, error } = await supabase
            .from("livros")
            .select("*")
            .order("titulo", { ascending: true });

        if (error) {
            console.error("Erro ao buscar catálogo:", error);
            throw error;
        }

        return data;
    }

    /**
     * Busca um livro pelo ID do Supabase.
     */
    async buscarPorId(id) {
        const { data, error } = await supabase
            .from("livros")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Erro ao buscar livro:", error);
            throw error;
        }

        return data;
    }

    /**
     * Busca um livro pelo ISBN.
     */
    async buscarPorISBN(isbn) {
        const { data, error } = await supabase
            .from("livros")
            .select("*")
            .eq("isbn", isbn)
            .single();

        if (error) {
            console.error("Erro ao buscar ISBN:", error);
            throw error;
        }

        return data;
    }

    /**
     * Pesquisa livros pelo título.
     */
    async buscarPorTitulo(texto) {
        const { data, error } = await supabase
            .from("livros")
            .select("*")
            .ilike("titulo", `%${texto}%`)
            .order("titulo");

        if (error) {
            console.error("Erro na pesquisa:", error);
            throw error;
        }

        return data;
    }

    /**
     * Busca livros por categoria.
     */
    async buscarPorCategoria(categoria) {
        const { data, error } = await supabase
            .from("livros")
            .select("*")
            .contains("categorias", [categoria]);

        if (error) {
            console.error("Erro ao buscar categoria:", error);
            throw error;
        }

        return data;
    }

    /**
     * Busca vários livros pelos IDs do Supabase.
     */
    async buscarPorIds(ids) {
        if (!ids || ids.length === 0) {
            return [];
        }

        const { data, error } = await supabase
            .from("livros")
            .select("*")
            .in("id", ids);

        if (error) {
            console.error("Erro ao buscar livros:", error);
            throw error;
        }

        return data;
    }

    /**
     * Registra um novo livro global no catálogo do Supabase.
     */
    async criarLivro(livro) {
        const { data, error } = await supabase
            .from("livros")
            .insert([livro])
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar livro no Supabase:", error);
            throw error;
        }

        return data;
    }
}

export default new SupabaseLivroService();