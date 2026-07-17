import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { auth } from "../firebase/auth.js";

import LivroService from "../firebase/services/LivroService.js";
import ReservaService from "../firebase/services/ReservaService.js";

window.PageGuard?.hold();

/* ========================= */
/* ESTADO GERAL              */
/* ========================= */
let LIVROS = [];
let usuarioAtual = null;

let filtroTexto = '';
let filtroCateg = '';
let filtroStatus = '';

let viewMode = 'grid';
let paginaAtual = 1;
const POR_PAGINA = 8;
const reservasEmAndamento = new Set();
let carregandoAcervo = false;

/* ========================= */
/* AUTH & INICIALIZAÇÃO      */
/* ========================= */
onAuthStateChanged(auth, async (user) => {
  usuarioAtual = user;
  try {
    await carregarLivros();
  } finally {
    window.PageGuard?.ready();
  }
});

/* ========================= */
/* CARREGAR LIVROS           */
/* ========================= */
async function carregarLivros() {
  if (carregandoAcervo) return;
  carregandoAcervo = true;
  const btn = document.getElementById('btnAtualizarAcervo');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Atualizando...';
  }

  try {
    LIVROS = await LivroService.listarAcervo();
    renderStats();
    renderGrid();
  } catch (error) {
    console.error("Erro ao carregar livros:", error);
    window.showAppMessage?.("Erro ao atualizar o acervo.");
  } finally {
    carregandoAcervo = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '↻ Atualizar';
    }
  }
}

/* ========================= */
/* FILTRAGEM                 */
/* ========================= */
function livrosFiltrados() {
  return LIVROS.filter(l => {
    const autorStr = Array.isArray(l.autores) ? l.autores.join(', ') : (l.autores || '');
    const tituloStr = l.titulo || '';

    const textoOk = !filtroTexto ||
      tituloStr.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      autorStr.toLowerCase().includes(filtroTexto.toLowerCase());

    const categOk = !filtroCateg || l.categoria === filtroCateg;
    const statusOk = !filtroStatus || l.status === filtroStatus;

    return textoOk && categOk && statusOk;
  });
}

/* ========================= */
/* RENDER STATS              */
/* ========================= */
function renderStats() {
  document.getElementById('stat-total').textContent = LIVROS.length;
  document.getElementById('stat-disp').textContent = LIVROS.filter(l => l.status === 'disponivel').length;
  document.getElementById('stat-emp').textContent = LIVROS.filter(l => l.status === 'emprestado').length;
  document.getElementById('stat-res').textContent = LIVROS.filter(l => l.status === 'reservado').length;
}

function labelStatus(s) {
  return {
    disponivel: 'Disponível',
    emprestado: 'Emprestado',
    reservado: 'Reservado'
  }[s] || s;
}

/* ========================= */
/* RENDER GRID (ESTILO NOVO) */
/* ========================= */
function renderGrid() {
  const grid = document.getElementById('books-grid');
  const todos = livrosFiltrados();
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = todos.slice(inicio, inicio + POR_PAGINA);

  grid.className = 'books-grid' + (viewMode === 'list' ? ' list-view' : '');

  if (pagina.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📥</div>
        <div class="empty-state-title">Nenhum livro encontrado</div>
        <p class="empty-state-desc">Tente ajustar os filtros ou o termo de busca.</p>
      </div>
    `;
    renderPaginacao(0);
    return;
  }

  grid.innerHTML = pagina.map((l, i) => {
    const autorDisplay = Array.isArray(l.autores) ? l.autores[0] : (l.autores || 'Autor desconhecido');
    const categoriaDisplay = l.categoria || 'Geral';
    const idParaClicar = l.supabaseId || l.id;
    const cor = l.cor || '#E8EDFF';
    const emoji = l.emoji || '📖';
    const capaUrl = l.capa || `https://covers.openlibrary.org/b/isbn/${l.isbn}-M.jpg?default=false`;

    return `
    <div class="book-card" style="animation-delay:${(i*0.04)+0.04}s" onclick="openModal('${idParaClicar}')">
      <div class="book-cover" style="background:${cor}">
        <img src="${capaUrl}" alt="${l.titulo}" onerror="this.style.display='none'; this.parentElement.textContent='${emoji}'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
        <div class="book-cover-overlay"></div>
        <span class="book-status-dot ${l.status}"></span>
      </div>
      <div class="book-info">
        <div class="book-category">${categoriaDisplay}</div>
        <div class="book-title">${l.titulo}</div>
        <div class="book-author">${autorDisplay}</div>
        <div class="book-footer">
          <span class="book-copies">
            <strong>${Math.max(0, l.quantidadeDisponivel)}</strong>/${l.quantidadeTotal} exempl.
          </span>
          <span class="status-badge ${l.status}">
            ${labelStatus(l.status)}
          </span>
        </div>
      </div>
    </div>
    `;
  }).join('');

  renderPaginacao(todos.length);
}
window.renderGrid = renderGrid;

/* ========================= */
/* PAGINAÇÃO DINÂMICA        */
/* ========================= */
function renderPaginacao(total) {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  const pages = Math.ceil(total / POR_PAGINA);
  if (pages <= 1) { pag.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="goPage(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === paginaAtual ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${paginaAtual + 1})" ${paginaAtual === pages ? 'disabled' : ''}>›</button>`;
  pag.innerHTML = html;
}

function goPage(n) {
  paginaAtual = n;
  renderGrid();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.goPage = goPage;

/* ========================= */
/* CONTROLES VISUAIS (CHIPS) */
/* ========================= */
function setView(mode) {
  viewMode = mode;
  document.getElementById('btn-grid')?.classList.toggle('active', mode === 'grid');
  document.getElementById('btn-list')?.classList.toggle('active', mode === 'list');
  renderGrid();
}
window.setView = setView;

function setStatus(btn, status) {
  filtroStatus = status;
  paginaAtual = 1;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}
window.setStatus = setStatus;

// Listeners de pesquisa e categorias
document.getElementById('search-input')?.addEventListener('input', (e) => {
  filtroTexto = e.target.value;
  paginaAtual = 1;
  renderGrid();
});

document.getElementById('filter-categoria')?.addEventListener('change', (e) => {
  filtroCateg = e.target.value;
  paginaAtual = 1;
  renderGrid();
});

document.getElementById('btnAtualizarAcervo')?.addEventListener('click', () => {
  carregarLivros();
});

/* ========================= */
/* MODAL DETALHES (ESTILO NOVO)*/
/* ========================= */
async function openModal(id) {
  const l = LIVROS.find(x => String(x.id) === String(id) || String(x.supabaseId) === String(id));
  if (!l) {
    console.error("Livro não encontrado:", id);
    return;
  }

  const reserveId = l.supabaseId || l.id;
  const autorDisplay = Array.isArray(l.autores) ? l.autores.join(', ') : (l.autores || 'Autor desconhecido');
  const categoriaDisplay = l.categoria || 'Geral';
  const cor = l.cor || '#E8EDFF';
  const emoji = l.emoji || '📖';
  const capaUrl = l.capa || `https://covers.openlibrary.org/b/isbn/${l.isbn}-M.jpg?default=false`;

  const btnLabel = {
    disponivel: 'Reservar Livro',
    emprestado: 'Fila de Espera',
    reservado: 'Fila de Espera'
  }[l.status] || 'Indisponível';

  const isCarregando = reservasEmAndamento.has(reserveId);

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-book-header">
      <div class="modal-cover" style="background:${cor}">
        <img src="${capaUrl}" alt="${l.titulo}" onerror="this.style.display='none'; this.parentElement.textContent='${emoji}'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
      </div>
      <div class="modal-book-meta">
        <div class="modal-category">${categoriaDisplay}</div>
        <div class="modal-book-title" style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">${l.titulo}</div>
        <div class="modal-book-author">${autorDisplay}</div>
        <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
      </div>
    </div>
    
    <div class="modal-info-grid" style="margin-top: 15px;">
      <div class="modal-info-item"><label>ISBN</label><span>${l.isbn || '-'}</span></div>
      <div class="modal-info-item"><label>Editora</label><span>${l.editora || '-'}</span></div>
      <div class="modal-info-item"><label>Exemplares</label><span>${l.quantidadeDisponivel} disponíveis de ${l.quantidadeTotal}</span></div>
    </div>

    <div class="modal-desc-title" style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">Sinopse</div>
    <p class="modal-desc" style="color:#555; font-size:14px; line-height:1.5;">${l.desc || l.descricao || 'Nenhuma sinopse cadastrada para este exemplar.'}</p>
    
    <div class="modal-actions" style="margin-top:20px; display:flex; gap: 10px;">
      <button
        class="btn-primary btn-reserve"
        style="flex: 1;"
        data-reserve-id="${reserveId}"
        onclick="reservarLivro('${reserveId}')"
        ${isCarregando ? 'disabled aria-busy="true"' : ''}>
        ${isCarregando ? '⏳ Reservando...' : `📚 ${btnLabel}`}
      </button>
      <button class="btn-outline" onclick="closeModal()" style="border: 1px solid #ccc; background: white; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Fechar</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}
window.openModal = openModal;

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
window.closeModal = closeModal;

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) {
    closeModal();
  }
}
window.closeModalOnOverlay = closeModalOnOverlay;

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function setReservaLivroLoading(livroId, loading) {
  document.querySelectorAll(`[data-reserve-id="${livroId}"]`).forEach((button) => {
    button.disabled = loading;
    button.setAttribute("aria-busy", loading ? "true" : "false");
    button.textContent = loading ? "⏳ Reservando..." : "📚 Reservar Livro";
  });
}

/* ========================= */
/* SOLICITAR RESERVA         */
/* ========================= */
async function reservarLivro(livroId) {
  if (reservasEmAndamento.has(livroId)) return;

  reservasEmAndamento.add(livroId);
  setReservaLivroLoading(livroId, true);

  try {
    const livro = LIVROS.find(x => String(x.id) === String(livroId) || String(x.supabaseId) === String(livroId));
    if (!livro) throw new Error("Livro não encontrado.");

    if (!usuarioAtual) {
      window.showAppMessage?.("Faça login para solicitar uma reserva.");
      return;
    }

    await ReservaService.solicitarReserva({
      supabaseId: livro.supabaseId || livro.id
    });

    window.showAppMessage?.("Livro solicitado com sucesso!");
    closeModal();
    await carregarLivros();

  } catch (error) {
    console.error(error);
    window.showAppMessage?.(error.message || "Erro ao solicitar reserva.");
  } finally {
    reservasEmAndamento.delete(livroId);
    setReservaLivroLoading(livroId, false);
  }
}
window.reservarLivro = reservarLivro;