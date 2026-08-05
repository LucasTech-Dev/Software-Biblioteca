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
// AUTH E VALIDAÇÃO DE PERFIL
// ========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.showAppMessage?.("Faça login.");
    window.location.href = "login.html";
    return;
  }

  usuarioAtual = user;

  // Lógica de redirecionamento dinâmico do botão "Voltar"
  const email = user.email || "";
  const btnVoltar = document.getElementById("btnVoltar");

  if (btnVoltar) {
    if (email.includes("@educar")) {
      btnVoltar.href = "telaProfessor.html";
    } else if (email.includes("@estudante")) {
      btnVoltar.href = "indexTelaAluno.html";
    } else {
      // Fallback de segurança para perfil de aluno
      btnVoltar.href = "indexTelaAluno.html"; 
    }
  }

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
      supabaseId: livro.supabaseId || livro.id, 
      title: livro.titulo,
      author: Array.isArray(livro.autores) ? livro.autores.join(", ") : (livro.autores || "Autor desconhecido"),
      category: livro.categoria || livro.categorias?.[0] || "Geral",
      year: livro.publicacao || "",
      isbn: livro.isbn || "-",
      emoji: livro.emoji || "📖",
      cor: livro.cor || "#E8EDFF",
      capa: livro.capa || `https://covers.openlibrary.org/b/isbn/${livro.isbn}-M.jpg?default=false`,
      editora: livro.editora || "-",
      desc: livro.desc || livro.descricao || "Nenhuma sinopse cadastrada para este exemplar."
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
    return `
      <div class="book-card" onclick="openModal('${b.id}')" style="cursor: pointer;">
        <div class="book-cover" style="background:${b.cor};">
           <img src="${b.capa}" alt="${b.title}" onerror="this.style.display='none'; this.parentElement.textContent='${b.emoji}'" style="width:100%;height:100%;object-fit:cover;">
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
          <button class="btn btn-primary btn-sm" type="button" onclick="event.stopPropagation(); openModal('${b.id}')">
            📖 Detalhes
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

// ========================================
// MODAL DE DETALHES
// ========================================
async function openModal(id) {
  const l = BOOKS.find(x => String(x.id) === String(id));
  if (!l) {
    console.error("Livro não encontrado:", id);
    return;
  }

  const isCarregando = reservasEmAndamento.has(String(l.id));

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-book-header">
      <div class="modal-cover" style="background:${l.cor}">
        <img src="${l.capa}" alt="${l.title}" onerror="this.style.display='none'; this.parentElement.textContent='${l.emoji}'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
      </div>
      <div class="modal-book-meta">
        <div class="modal-category">${l.category}</div>
        <div class="modal-book-title" style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">${l.title}</div>
        <div class="modal-book-author">${l.author}</div>
      </div>
    </div>
    
    <div class="modal-info-grid" style="margin-top: 15px;">
      <div class="modal-info-item"><label>ISBN</label><span>${l.isbn || '-'}</span></div>
      <div class="modal-info-item"><label>Editora</label><span>${l.editora || '-'}</span></div>
    </div>

    <div class="modal-desc-title" style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">Sinopse</div>
    <p class="modal-desc" style="color:#555; font-size:14px; line-height:1.5;">${l.desc}</p>
    
    <div class="modal-actions" style="margin-top:20px; display:flex; gap: 10px;">
      <button
        class="btn-primary btn"
        style="flex: 1;"
        data-reserve-id="${l.id}"
        onclick="reservar('${l.id}')"
        ${isCarregando ? 'disabled aria-busy="true"' : ''}>
        ${isCarregando ? '⏳ Reservando...' : '📖 Reservar Livro'}
      </button>
      <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
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

// ========================================
// LÓGICA DE RESERVA
// ========================================
function setReservaLoading(livroId, loading) {
  document.querySelectorAll(`[data-reserve-id="${livroId}"]`).forEach((button) => {
    button.disabled = loading;
    button.setAttribute("aria-busy", loading ? "true" : "false");
    button.textContent = loading ? "⏳ Reservando..." : "📖 Reservar Livro";
  });
}

async function reservar(livroId) {
  const idStr = String(livroId);

  if (reservasEmAndamento.has(idStr)) return;

  // Busca segura comparando ambos como String
  const livro = BOOKS.find(b => String(b.id) === idStr);
  if (!livro) {
    console.error("Livro não encontrado para o ID:", livroId);
    window.showAppMessage?.("Livro não encontrado.");
    return;
  }

  if (!usuarioAtual) {
    window.showAppMessage?.("Faça login para solicitar uma reserva.");
    return;
  }

  reservasEmAndamento.add(idStr);
  setReservaLoading(livro.id, true);

  try {
    await ReservaService.solicitarReserva({
      supabaseId: livro.supabaseId || livro.id
    });

    window.showAppMessage?.("Livro reservado com sucesso.");
    closeModal();
    await carregarLivros();
  } catch (error) {
    console.error(error);
    window.showAppMessage?.(error.message || "Erro ao reservar livro.");
  } finally {
    reservasEmAndamento.delete(idStr);
    setReservaLoading(livro.id, false);
  }
}
window.reservar = reservar;