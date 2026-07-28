import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { auth } from "../firebase/auth.js";
import LivroService from "../firebase/services/LivroService.js";
import ReservaService from "../firebase/services/ReservaService.js";

window.PageGuard?.hold();

// ========================================
// ESTADO
// ========================================
let BOOKS = [];
let BOOKS_FILTRADOS = [];
let usuarioAtual = null;
const reservasEmAndamento = new Set();

let paginaAtual = 1;
const POR_PAGINA = 8;
let carregando = false;

// ========================================
// AUTH
// ========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.showAppMessage?.("Faça login.");
    window.location.href = "login.html";
    return;
  }

  usuarioAtual = user;

  try {
    await carregarLivros();
  } finally {
    window.PageGuard?.ready();
  }
});

// ========================================
// CARREGAR LIVROS
// ========================================
async function carregarLivros() {
  if (carregando) return;
  carregando = true;

  const btn = document.getElementById('btnAtualizarBusca');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Atualizando...';
  }

  try {
    const livros = await LivroService.listarAcervo();

    BOOKS = livros.map((livro) => ({
      id: livro.id || livro.supabaseId,
      title: livro.titulo,
      author: Array.isArray(livro.autores) ? livro.autores.join(", ") : (livro.autores || "Autor desconhecido"),
      category: livro.categoria || livro.categorias?.[0] || "Geral",
      year: livro.publicacao || "",
      isbn: livro.isbn || "-",
      emoji: livro.emoji || "📖"
    }));

    BOOKS_FILTRADOS = [...BOOKS];
    paginaAtual = 1;
    renderBooks();
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao carregar livros.");
  } finally {
    carregando = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔄 Atualizar';
    }
  }
}

// ========================================
// RENDER BOOKS (COM PAGINAÇÃO)
// ========================================
function renderBooks() {
  const container = document.getElementById('bookList');
  const countEl = document.getElementById('resultsCount');

  if (countEl) {
    countEl.innerHTML = `Exibindo <strong>${BOOKS_FILTRADOS.length}</strong> livros`;
  }

  if (BOOKS_FILTRADOS.length === 0) {
    container.innerHTML = `
      <div style="padding:40px;text-align:center;color:var(--ink-muted);">
        Nenhum livro encontrado.
      </div>
    `;
    renderPaginacao(0);
    return;
  }

  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = BOOKS_FILTRADOS.slice(inicio, inicio + POR_PAGINA);

  container.innerHTML = pagina.map((b) => {
    const isCarregando = reservasEmAndamento.has(b.id);

    return `
      <div class="book-card">
        <div class="book-cover">
          ${b.emoji}
        </div>

        <div class="book-info">
          <div class="book-title">${b.title}</div>
          <div class="book-author">${b.author}</div>
          <div class="book-meta">
            <span class="pill pill-muted">${b.category}</span>
            <span class="pill pill-muted">ISBN: ${b.isbn}</span>
          </div>
        </div>

        <div class="book-actions">
          <button
            class="btn btn-primary btn-sm"
            data-reserve-id="${b.id}"
            onclick="reservar('${b.id}')"
            ${isCarregando ? 'disabled aria-busy="true"' : ''}>
            ${isCarregando ? '⏳ Reservando...' : '📖 Reservar'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  renderPaginacao(BOOKS_FILTRADOS.length);
}

// ========================================
// ROLETA DE PAGINAÇÃO
// ========================================
function renderPaginacao(total) {
  const pag = document.getElementById('pagination');
  if (!pag) return;

  const pages = Math.ceil(total / POR_PAGINA);
  if (pages <= 1) {
    pag.innerHTML = '';
    return;
  }

  let html = `<button class="page-btn nav-btn" onclick="goPage(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''}>‹</button>`;

  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let lastPage;

  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= paginaAtual - delta && i <= paginaAtual + delta)) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (lastPage) {
      if (i - lastPage === 2) {
        rangeWithDots.push(lastPage + 1);
      } else if (i - lastPage !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    lastPage = i;
  }

  rangeWithDots.forEach(p => {
    if (p === '...') {
      html += `<span class="page-dots">...</span>`;
    } else {
      html += `<button class="page-btn ${p === paginaAtual ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    }
  });

  html += `<button class="page-btn nav-btn" onclick="goPage(${paginaAtual + 1})" ${paginaAtual === pages ? 'disabled' : ''}>›</button>`;

  pag.innerHTML = html;
}

function goPage(n) {
  paginaAtual = n;
  renderBooks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.goPage = goPage;

// ========================================
// FILTROS
// ========================================
function filterBooks() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';

  BOOKS_FILTRADOS = BOOKS.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.isbn.includes(q) ||
    b.category.toLowerCase().includes(q)
  );

  paginaAtual = 1;
  renderBooks();
}
window.filterBooks = filterBooks;

// ========================================
// ORDENAÇÃO
// ========================================
function sortBooks(val) {
  if (val === 'titulo') {
    BOOKS_FILTRADOS.sort((a, b) => a.title.localeCompare(b.title));
  } else if (val === 'autor') {
    BOOKS_FILTRADOS.sort((a, b) => a.author.localeCompare(b.author));
  } else if (val === 'recente') {
    BOOKS_FILTRADOS.sort((a, b) => (b.year || 0) - (a.year || 0));
  }

  paginaAtual = 1;
  renderBooks();
}
window.sortBooks = sortBooks;

// ========================================
// LIMPAR FILTROS
// ========================================
function clearFilters() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';

  BOOKS_FILTRADOS = [...BOOKS];
  paginaAtual = 1;
  renderBooks();
}
window.clearFilters = clearFilters;

// ========================================
// BOTÃO ATUALIZAR
// ========================================
document.getElementById('btnAtualizarBusca')?.addEventListener('click', () => {
  window.location.reload();
});

function setReservaLoading(livroId, loading) {
  document.querySelectorAll(`[data-reserve-id="${livroId}"]`).forEach((button) => {
    button.disabled = loading;
    button.setAttribute("aria-busy", loading ? "true" : "false");
    button.textContent = loading ? "⏳ Reservando..." : "📖 Reservar";
  });
}

// ========================================
// RESERVA
// ========================================
async function reservar(livroId) {
  if (reservasEmAndamento.has(livroId)) return;

  reservasEmAndamento.add(livroId);
  setReservaLoading(livroId, true);

  try {
    const livro = BOOKS.find(b => b.id === livroId);
    if (!livro) return;

    await ReservaService.solicitarReserva({
      supabaseId: livro.id
    });

    window.showAppMessage?.("Livro reservado com sucesso.");
    await carregarLivros();
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao reservar livro.");
  } finally {
    reservasEmAndamento.delete(livroId);
    setReservaLoading(livroId, false);
  }
}
window.reservar = reservar;