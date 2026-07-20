class LivroMapper {

    /**
     * Junta um livro do Supabase com seu respectivo registro
     * do acervo (Firestore).
     */
    mapear(livroSupabase, livroAcervo = null) {

        return {

            //-------------------------
            // Identificação
            //-------------------------

            id: livroSupabase.id,

            supabaseId: livroSupabase.id,

            firestoreId: livroAcervo?.id ?? null,

            //-------------------------
            // Catálogo
            //-------------------------

            isbn: livroSupabase.isbn,

            titulo: livroSupabase.titulo,

            subtitulo: livroSupabase.subtitulo ?? "",

            autores: livroSupabase.autores ?? [],

            editora: livroSupabase.editora ?? "",

            publicacao: livroSupabase.publicacao ?? "",

            paginas: livroSupabase.paginas ?? 0,

            idioma: livroSupabase.idioma ?? "",

            categorias: livroSupabase.categorias ?? [],

            categoria: Array.isArray(livroSupabase.categorias) && livroSupabase.categorias.length > 0
                ? livroSupabase.categorias[0]
                : (livroSupabase.categoria ?? "Geral"),

            descricao: livroSupabase.descricao ?? "",

            desc: livroSupabase.descricao ?? "",

            capa: livroSupabase.capa ?? "",

            fonte: livroSupabase.fonte ?? "",

            //-------------------------
            // Acervo
            //-------------------------

            quantidadeTotal:
                livroAcervo?.quantidadeTotal ?? 0,

            quantidadeDisponivel:
                livroAcervo?.quantidadeDisponivel ?? 0,

            quantidadeReservada:
                livroAcervo?.quantidadeReservada ?? 0,

            quantidadeEmprestada:
                livroAcervo?.quantidadeEmprestada ?? 0,

            status:
                livroAcervo?.status ?? "fora_do_acervo",

            //-------------------------
            // Datas
            //-------------------------

            criadoEm:
                livroAcervo?.criadoEm ?? null,

            atualizadoEm:
                livroAcervo?.atualizadoEm ?? null

        };

    }

    /**
     * Faz o merge de uma lista inteira.
     */
    mapearLista(livrosSupabase, livrosAcervo) {

        const indiceAcervo = new Map();

        livrosAcervo.forEach(livro => {

            indiceAcervo.set(
                livro.supabaseId,
                livro
            );

        });

        return livrosSupabase.map(livroSupabase => {

            const livroAcervo =
                indiceAcervo.get(livroSupabase.id);

            return this.mapear(
                livroSupabase,
                livroAcervo
            );

        });

    }

}

export default new LivroMapper();