import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { db } from "../firebase/firestore.js";
import { auth } from "../firebase/auth.js";

// IMPORTAÇÃO CORRIGIDA (Importa o LivroService, não o SupabaseLivroService)
import LivroService from "../firebase/services/LivroService.js";
import ReservaService from "../firebase/services/ReservaService.js";
window.PageGuard?.hold();

// ========================================
// REDIRECT
// ========================================

function addnovolivro() {
  window.location.href = "addLivros.html";
}
window.addnovolivro = addnovolivro;

// ========================================
// ESTADO
// ========================================

let LIVROS = [];
let usuarioAtual = null;

let filtroTexto = '';
let filtroCateg = '';
let filtroStatus = '';

let viewMode = 'grid';
let paginaAtual = 1;
const POR_PAGINA = 8;
const reservasEmAndamento = new Set();

// ========================================
// AUTH
// ========================================

onAuthStateChanged(auth, async (user) => {
  usuarioAtual = user;

  try {
    await carregarLivros();
  } finally {
    window.PageGuard?.ready();
  }
});

carregarLivros().catch((error) => {
  console.error("Erro inicial ao carregar livros:", error);
});

// ========================================
// CARREGAR LIVROS (REFATORADO)
// ========================================

async function carregarLivros() {
  try {
    // Agora a leitura passa 100% pelo LivroService
    LIVROS = await LivroService.listarAcervo();
    renderStats();
    renderGrid();
  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao carregar livros.");
  }
}

// ========================================
// FILTROS (REFATORADO)
// ========================================

function livrosFiltrados() {
  return LIVROS.filter(l => {
    // Adaptação para o novo formato de autores (Array)
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

// ========================================
// STATS
// ========================================

function renderStats() {
  document.getElementById('stat-total').textContent = LIVROS.length;
  document.getElementById('stat-disp').textContent = LIVROS.filter(l => l.status === 'disponivel').length;
  document.getElementById('stat-emp').textContent = LIVROS.filter(l => l.status === 'emprestado').length;
  document.getElementById('stat-res').textContent = LIVROS.filter(l => l.status === 'reservado').length;
}

// ========================================
// LABEL STATUS
// ========================================

function labelStatus(s) {
  return {
    disponivel: 'Disponível',
    emprestado: 'Emprestado',
    reservado: 'Reservado'
  }[s] || s;
}

// ========================================
// GRID (REFATORADO)
// ========================================

function renderGrid() {
  const grid = document.getElementById('books-grid');
  const todos = livrosFiltrados();
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const pagina = todos.slice(inicio, inicio + POR_PAGINA);

  grid.className = 'books-grid' + (viewMode === 'list' ? ' list-view' : '');

  if (pagina.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">Nenhum livro encontrado</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = pagina.map((l) => {
    const autorDisplay = Array.isArray(l.autores) ? l.autores[0] : (l.autores || 'Autor desconhecido');
    
    return `
    <div class="book-card" onclick="openModal('${l.id}')">
      <div class="book-cover" style="background:${l.cor || '#E8EDFF'}">
        ${l.emoji || '📖'}
      </div>
      <div class="book-info">
        <div class="book-category">${l.categoria || 'Geral'}</div>
        <div class="book-title">${l.titulo}</div>
        <div class="book-author">${autorDisplay}</div>
        <div class="book-footer">
          <span class="book-copies">
            ${l.quantidadeDisponivel}/${l.quantidadeTotal}
          </span>
          <span class="status-badge ${l.status}">
            ${labelStatus(l.status)}
          </span>
        </div>
      </div>
    </div>
  `}).join('');
}
window.renderGrid = renderGrid;

// ========================================
// PAGINAÇÃO
// ========================================

function goPage(n) {
  paginaAtual = n;
  renderGrid();
}
window.goPage = goPage;

// ========================================
// VIEW
// ========================================

function setView(mode) {
  viewMode = mode;
  document.getElementById('btn-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('btn-list').classList.toggle('active', mode === 'list');
  renderGrid();
}
window.setView = setView;

// ========================================
// STATUS FILTER
// ========================================

function setStatus(btn, status) {
  filtroStatus = status;
  paginaAtual = 1;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}
window.setStatus = setStatus;

// ========================================
// SEARCH
// ========================================

document.getElementById('search-input')?.addEventListener('input', (e) => {
  filtroTexto = e.target.value;
  renderGrid();
});

// ========================================
// CATEGORIA
// ========================================

document.getElementById('filter-categoria')?.addEventListener('change', (e) => {
  filtroCateg = e.target.value;
  renderGrid();
});

// ========================================
// MODAL (REFATORADO)
// ========================================

function openModal(id) {
  const l = LIVROS.find(x => x.id === id);
  if (!l) return;

  const autorDisplay = Array.isArray(l.autores) ? l.autores.join(', ') : (l.autores || 'Autor desconhecido');

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-book-header">
      <div class="modal-cover" style="background:${l.cor || '#E8EDFF'}">
        ${l.emoji || '📖'}
      </div>
      <div>
        <h2>${l.titulo}</h2>
        <p>${autorDisplay}</p>
        <span class="status-badge ${l.status}">
          ${labelStatus(l.status)}
        </span>
      </div>
    </div>
    <br>
    <p>${l.desc || l.descricao || 'Nenhuma descrição disponível.'}</p>
    <br>
    <button
      class="btn-reserve"
      data-reserve-id="${l.id}"
      onclick="reservarLivro('${l.id}')"
      ${reservasEmAndamento.has(l.id) ? 'disabled aria-busy="true"' : ''}>
      ${reservasEmAndamento.has(l.id) ? '⏳ Reservando...' : '📚 Reservar Livro'}
    </button>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}
window.openModal = openModal;

// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
window.closeModal = closeModal;

// ========================================
// OVERLAY
// ========================================

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) {
    closeModal();
  }
}
window.closeModalOnOverlay = closeModalOnOverlay;

function setReservaLivroLoading(livroId, loading) {
  document.querySelectorAll(`[data-reserve-id="${livroId}"]`).forEach((button) => {
    button.disabled = loading;
    button.setAttribute("aria-busy", loading ? "true" : "false");
    button.textContent = loading ? "⏳ Reservando..." : "📚 Reservar Livro";
  });
}

// ========================================
// RESERVAR LIVRO (MANTIDO INTACTO)
// ========================================

async function reservarLivro(livroId) {
  if (reservasEmAndamento.has(livroId)) {
    return;
  }

  reservasEmAndamento.add(livroId);
  setReservaLivroLoading(livroId, true);

  try {
    const livro = LIVROS.find(l => l.id === livroId);
    if (!livro) return;

    await ReservaService.criarReserva({
      usuario: {
        uid: usuarioAtual.uid,
        nome: usuarioAtual.displayName || usuarioAtual.email || "Usuário",
        matricula: "",
        turma: ""
      },
      livro,
      firestoreId: livro.firestoreId || null
    });

    window.showAppMessage?.("Livro reservado.");
    closeModal();
    await carregarLivros();

  } catch (error) {
    console.error(error);
    window.showAppMessage?.("Erro ao reservar.");
  } finally {
    reservasEmAndamento.delete(livroId);
    setReservaLivroLoading(livroId, false);
  }
}

window.reservarLivro = reservarLivro;