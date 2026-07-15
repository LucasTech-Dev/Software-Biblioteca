import LivroService from "../firebase/services/LivroService.js";

window.PageGuard?.hold();

/* ========================= */
/* ESTADO GERAL              */
/* ========================= */

let LIVROS = []; // Agora virá do Firestore/Supabase
let resultadosBuscaCatalogo = []; // Substitui o localStorage

let filtroTexto  = '';
let filtroCateg  = '';
let filtroStatus = '';
let viewMode     = 'grid';
let paginaAtual  = 1;
const POR_PAGINA = 8;

/* ========================= */
/* INIT (Carregamento Real)  */
/* ========================= */

async function inicializarTela() {
    try {
        // Busca o acervo real unificado
        LIVROS = await LivroService.listarAcervo();
        
        renderStats();
        renderGrid();
        renderCatalogoBusca(); // Renderiza grid de busca vazio
        window.PageGuard?.ready();
    } catch (error) {
        console.error("Erro ao carregar acervo:", error);
        window.showAppMessage?.("Erro ao carregar o acervo. Tente novamente.");
    }
}

/* ========================= */
/* NAVEGAÇÃO ENTRE PÁGINAS   */
/* ========================= */

function navegarPara(paginaId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(paginaId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ========================= */
/* RENDER — Acervo           */
/* ========================= */

function livrosFiltrados() {
    return LIVROS.filter(l => {
        // Adaptado para usar l.autores (array) caso exista, senão string vazia
        const autorStr = Array.isArray(l.autores) ? l.autores.join(', ') : (l.autores || '');
        const tituloStr = l.titulo || '';

        const textoOk  = !filtroTexto  || tituloStr.toLowerCase().includes(filtroTexto.toLowerCase()) || autorStr.toLowerCase().includes(filtroTexto.toLowerCase());
        const categOk  = !filtroCateg  || l.categoria === filtroCateg;
        const statusOk = !filtroStatus || l.status === filtroStatus;
        return textoOk && categOk && statusOk;
    });
}

function renderStats() {
    document.getElementById('stat-total').textContent = LIVROS.length;
    document.getElementById('stat-disp').textContent  = LIVROS.filter(l => l.status === 'disponivel').length;
    document.getElementById('stat-emp').textContent   = LIVROS.filter(l => l.status === 'emprestado').length;
    document.getElementById('stat-res').textContent   = LIVROS.filter(l => l.status === 'reservado').length;
}

function labelStatus(s) {
    return { disponivel: 'Disponível', emprestado: 'Emprestado', reservado: 'Reservado' }[s] || s;
}

function renderGrid() {
    const grid   = document.getElementById('books-grid');
    const todos  = livrosFiltrados();
    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const pagina = todos.slice(inicio, inicio + POR_PAGINA);

    grid.className = 'books-grid' + (viewMode === 'list' ? ' list-view' : '');

    if (pagina.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">Nenhum livro encontrado</div><p class="empty-state-desc">Tente ajustar os filtros ou o termo de busca.</p></div>`;
        renderPaginacao(0);
        return;
    }

    grid.innerHTML = pagina.map((l, i) => {
        // Fallbacks visuais para dados que podem não existir no banco ainda
        const autorDisplay = Array.isArray(l.autores) ? l.autores[0] : (l.autores || 'Autor Desconhecido');
        const categoriaDisplay = l.categoria || 'Geral';
        const cor = l.cor || '#E8EDFF';
        const emoji = l.emoji || '📖';

        if (viewMode === 'list') {
            return `
            <div class="book-card" style="animation-delay:${(i*0.05)+0.04}s" onclick="openModal('${l.supabaseId}')">
                <div class="book-cover" style="background:${cor}">${emoji}<div class="book-cover-overlay"></div><span class="book-status-dot ${l.status}"></span></div>
                <div class="book-info">
                <div class="book-title-block">
                    <div class="book-category">${categoriaDisplay}</div>
                    <div class="book-title">${l.titulo}</div>
                    <div class="book-author">${autorDisplay}</div>
                </div>
                <div class="book-footer">
                    <span class="book-copies"><strong>${l.quantidadeDisponivel}</strong>/${l.quantidadeTotal} exempl.</span>
                    <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
                </div>
                </div>
            </div>`;
        }
        return `
        <div class="book-card" style="animation-delay:${(i*0.04)+0.04}s" onclick="openModal('${l.supabaseId}')">
            <div class="book-cover" style="background:${cor}">${emoji}<div class="book-cover-overlay"></div><span class="book-status-dot ${l.status}"></span></div>
            <div class="book-info">
            <div class="book-category">${categoriaDisplay}</div>
            <div class="book-title">${l.titulo}</div>
            <div class="book-author">${autorDisplay}</div>
            <div class="book-footer">
                <span class="book-copies"><strong>${l.quantidadeDisponivel}</strong>/${l.quantidadeTotal} exempl.</span>
                <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
            </div>
            </div>
        </div>`;
    }).join('');

    renderPaginacao(todos.length);
}

function renderPaginacao(total) {
    const pag   = document.getElementById('pagination');
    const pages = Math.ceil(total / POR_PAGINA);
    if (pages <= 1) { pag.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="goPage(${paginaAtual-1})" ${paginaAtual===1?'disabled':''}>‹</button>`;
    for (let i = 1; i <= pages; i++) {
        html += `<button class="page-btn ${i===paginaAtual?'active':''}" onclick="goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="goPage(${paginaAtual+1})" ${paginaAtual===pages?'disabled':''}>›</button>`;
    pag.innerHTML = html;
}

// Funções globais de UI (mantidas)
window.goPage = (n) => { paginaAtual = n; renderGrid(); window.scrollTo({top:0,behavior:'smooth'}); }
window.setView = (mode) => {
    viewMode = mode;
    document.getElementById('btn-grid').classList.toggle('active', mode === 'grid');
    document.getElementById('btn-list').classList.toggle('active', mode === 'list');
    renderGrid();
}
window.setStatus = (btn, status) => {
    filtroStatus = status;
    paginaAtual  = 1;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderGrid();
}

document.getElementById('search-input')?.addEventListener('input', e => {
    filtroTexto = e.target.value;
    paginaAtual = 1;
    renderGrid();
});

document.getElementById('filter-categoria')?.addEventListener('change', e => {
    filtroCateg = e.target.value;
    paginaAtual = 1;
    renderGrid();
});

/* ========================= */
/* MODAL                     */
/* ========================= */

window.openModal = async (supabaseId) => {
    // Busca os dados atualizados do acervo usando o novo serviço
    const l = await LivroService.buscarLivroCompleto(supabaseId);
    if (!l) return;

    const btnLabel = { disponivel: 'Reservar', emprestado: 'Fila de espera', reservado: 'Fila de espera' }[l.status] || 'Indisponível';
    const capaUrl = l.capa || `https://covers.openlibrary.org/b/isbn/${l.isbn}-M.jpg?default=false`;
    const autorDisplay = Array.isArray(l.autores) ? l.autores.join(', ') : (l.autores || 'Autor Desconhecido');
    const categoriaDisplay = l.categoria || 'Geral';
    const cor = l.cor || '#E8EDFF';
    const emoji = l.emoji || '📖';

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-book-header">
        <div class="modal-cover" style="background:${cor}">
            <img src="${capaUrl}" alt="${l.titulo}" onerror="this.style.display='none'; this.parentElement.textContent='${emoji}'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
        </div>
        <div class="modal-book-meta">
            <div class="modal-category">${categoriaDisplay}</div>
            <div class="modal-book-title">${l.titulo}</div>
            <div class="modal-book-author">${autorDisplay}</div>
            <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
        </div>
        </div>
        <div class="modal-info-grid">
        <div class="modal-info-item"><label>ISBN</label><span>${l.isbn}</span></div>
        <div class="modal-info-item"><label>Editora</label><span>${l.editora || '-'}</span></div>
        <div class="modal-info-item"><label>Exemplares</label><span>${l.quantidadeDisponivel} disponíveis de ${l.quantidadeTotal}</span></div>
        </div>
        <div class="modal-desc-title">Sinopse</div>
        <p class="modal-desc">${l.desc || 'Nenhuma sinopse cadastrada para este exemplar.'}</p>
        <div class="modal-actions">
        <button class="btn-reserve">${btnLabel}</button>
        <button class="btn-outline" onclick="closeModal()">Fechar</button>
        </div>
    `;

    document.getElementById('modal-overlay').classList.add('open');
}

window.closeModal = () => { document.getElementById('modal-overlay').classList.remove('open'); }
window.closeModalOnOverlay = (e) => { if (e.target === document.getElementById('modal-overlay')) closeModal(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ========================= */
/* BUSCA E ADIÇÃO (NOVO FLUXO)*/
/* ========================= */

function renderCatalogoBusca() {
    const grid = document.getElementById('catalogo-grid');
    if (!grid) return;

    if (resultadosBuscaCatalogo.length === 0) {
        grid.innerHTML = `
        <div class="catalogo-empty">
            <div class="catalogo-empty-icon">🔍</div>
            <div class="catalogo-empty-title">Busque no catálogo global</div>
            <p class="catalogo-empty-desc">Use o formulário acima para pesquisar por título ou ISBN.</p>
        </div>`;
        return;
    }

    grid.innerHTML = resultadosBuscaCatalogo.map((livro, i) => {
        const autorDisplay = Array.isArray(livro.autores) ? livro.autores[0] : 'Autor desconhecido';
        return `
        <div class="livro-card" style="animation-delay:${(i*0.05)+0.04}s">
            <button class="livro-remove" onclick="adicionarExemplarAoAcervo('${livro.id}')" title="Adicionar ao Acervo" style="background: var(--primary); color: white; border-radius: 4px; padding: 4px; font-size: 12px; width: auto; height: auto; top: 10px; right: 10px;">➕ Adicionar</button>
            <img
            class="livro-capa"
            src="${livro.capa || `https://covers.openlibrary.org/b/isbn/${livro.isbn}-L.jpg?default=false`}"
            alt="${livro.titulo}"
            onerror="this.src='https://placehold.co/300x200/EEF2FF/1E3A8A?text=SEM+CAPA'"
            >
            <div class="livro-info">
            <div class="livro-titulo">${livro.titulo}</div>
            <div class="livro-autor">✍️ ${autorDisplay}</div>
            <div class="livro-isbn">📖 ISBN: ${livro.isbn || '-'}</div>
            </div>
        </div>
        `;
    }).join('');
}

// Substituímos a lógica de salvar no LocalStorage por uma busca real
window.adicionarLivro = async () => {
    const titulo = document.getElementById('add-titulo')?.value.trim();
    const isbn   = document.getElementById('add-isbn')?.value.trim();

    if (!titulo && !isbn) {
        window.showAppMessage?.('Preencha o Título ou o ISBN para buscar!');
        return;
    }

    try {
        window.showAppMessage?.('Buscando no catálogo...');
        
        if (isbn) {
            const resultado = await LivroService.buscarCatalogoPorISBN(isbn);
            resultadosBuscaCatalogo = resultado ? [resultado] : [];
        } else {
            resultadosBuscaCatalogo = await LivroService.buscarCatalogoPorTitulo(titulo);
        }

        if (resultadosBuscaCatalogo.length === 0) {
            window.showAppMessage?.('Nenhum livro encontrado no catálogo do Supabase.');
        }

        renderCatalogoBusca();
    } catch (error) {
        console.error("Erro na busca:", error);
        window.showAppMessage?.('Erro ao buscar no catálogo.');
    }
}

document.getElementById('add-isbn')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') adicionarLivro();
});

// Nova função chamada quando o admin clica no "➕ Adicionar" no card de resultado
window.adicionarExemplarAoAcervo = async (supabaseId) => {
    const quantidadeInput = prompt("Quantos exemplares deste livro você deseja adicionar ao acervo da biblioteca?");
    
    if (!quantidadeInput) return; // Cancelou o prompt
    
    const quantidade = parseInt(quantidadeInput, 10);

    if (isNaN(quantidade) || quantidade <= 0) {
        alert("Quantidade inválida. Operação cancelada.");
        return;
    }

    try {
        window.showAppMessage?.('Adicionando ao acervo físico...');
        
        await LivroService.adicionarAoAcervo({
            supabaseId: supabaseId,
            quantidade: quantidade
        });

        window.showAppMessage?.('Livro adicionado com sucesso!');
        
        // Recarrega o Acervo para atualizar a tela automaticamente
        await inicializarTela();

    } catch (error) {
        console.error("Erro ao adicionar:", error);
        alert(`Não foi possível adicionar: ${error.message}`);
    }
}

// Inicia a aplicação
inicializarTela();