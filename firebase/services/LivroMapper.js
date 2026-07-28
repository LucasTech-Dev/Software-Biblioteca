class LivroMapper {

    /**
     * Verifica se uma string é apenas um ISBN (sequência de números e traços)
     */
    _ehApenasISBN(texto) {
        if (!texto) return false;
        // Remove traços e espaços para checar se sobraram apenas dígitos
        const limpo = String(texto).replace(/[\s-]/g, '');
        // Se tiver entre 10 e 13 dígitos numéricos e nada mais, é um ISBN
        return /^\d{10,13}$/.test(limpo);
    }

    /**
     * Garante que o título retornado seja válido e não o próprio ISBN
     */
    _obterTituloValido(livroSupabase, livroAcervo) {
        const candidatos = [
            livroSupabase?.titulo,
            livroSupabase?.title,
            livroSupabase?.nome,
            livroAcervo?.titulo
        ];

        // Encontra o primeiro candidato que não seja nulo e NÃO seja apenas um ISBN
        for (const cand of candidatos) {
            if (cand && !this._ehApenasISBN(cand)) {
                return cand;
            }
        }

        return "Título não informado";
    }

    /**
     * Junta um livro do Supabase com seu respectivo registro
     * do acervo (Firestore).
     */
    mapear(livroSupabase, livroAcervo = null) {

        const tituloTratado = this._obterTituloValido(livroSupabase, livroAcervo);

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

            isbn: livroSupabase.isbn || (this._ehApenasISBN(livroSupabase.titulo) ? livroSupabase.titulo : ""),

            titulo: tituloTratado,

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