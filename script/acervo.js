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
}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
  onAuthStateChanged
}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { db } from "../firebase/firestore.js";
import { auth } from "../firebase/auth.js";

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

onAuthStateChanged(auth, async(user) => {

  if (!user) {

    window.showAppMessage?.("Faça login.");

    window.location.href = "login.html";

    return;
  }

  usuarioAtual = user;

  try {

    await carregarLivros();

  }

  finally {

    window.PageGuard?.ready();

  }

});


// ========================================
// CARREGAR LIVROS
// ========================================

async function carregarLivros() {

  try {

    const snap = await getDocs(collection(db, "livros"));

    LIVROS = [];

    snap.forEach((docSnap) => {

      LIVROS.push({

        id: docSnap.id,
        ...docSnap.data()

      });

    });

    renderStats();

    renderGrid();

  }

  catch (error) {

    console.error(error);

    window.showAppMessage?.("Erro ao carregar livros.");

  }

}


// ========================================
// FILTROS
// ========================================

function livrosFiltrados() {

  return LIVROS.filter(l => {

    const textoOk =
      !filtroTexto ||

      l.titulo.toLowerCase().includes(filtroTexto.toLowerCase()) ||

      l.autor.toLowerCase().includes(filtroTexto.toLowerCase());

    const categOk =
      !filtroCateg ||

      l.categoria === filtroCateg;

    const statusOk =
      !filtroStatus ||

      l.status === filtroStatus;

    return textoOk && categOk && statusOk;

  });

}


// ========================================
// STATS
// ========================================

function renderStats() {

  document.getElementById('stat-total').textContent =
    LIVROS.length;

  document.getElementById('stat-disp').textContent =
    LIVROS.filter(l => l.status === 'disponivel').length;

  document.getElementById('stat-emp').textContent =
    LIVROS.filter(l => l.status === 'emprestado').length;

  document.getElementById('stat-res').textContent =
    LIVROS.filter(l => l.status === 'reservado').length;

}


// ========================================
// LABEL STATUS
// ========================================

function labelStatus(s) {

  return {

    disponivel: 'Disponível',
    emprestado: 'Emprestado',
    reservado: 'Reservado'

  } [s] || s;

}


// ========================================
// GRID
// ========================================

function renderGrid() {

  const grid = document.getElementById('books-grid');

  const todos = livrosFiltrados();

  const inicio =
    (paginaAtual - 1) * POR_PAGINA;

  const pagina =
    todos.slice(inicio, inicio + POR_PAGINA);

  grid.className =
    'books-grid' +
    (viewMode === 'list'
      ? ' list-view'
      : '');

  if (pagina.length === 0) {

    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">
          Nenhum livro encontrado
        </div>
      </div>
    `;

    return;
  }

  grid.innerHTML = pagina.map((l) => `

    <div class="book-card"
      onclick="openModal('${l.id}')">

      <div class="book-cover"
        style="background:${l.cor}">

        ${l.emoji}

      </div>

      <div class="book-info">

        <div class="book-category">
          ${l.categoria}
        </div>

        <div class="book-title">
          ${l.titulo}
        </div>

        <div class="book-author">
          ${l.autor}
        </div>

        <div class="book-footer">

          <span class="book-copies">
            ${l.disponiveis}/${l.exemplares}
          </span>

          <span class="status-badge ${l.status}">
            ${labelStatus(l.status)}
          </span>

        </div>

      </div>

    </div>

  `).join('');

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

  document
    .getElementById('btn-grid')
    .classList
    .toggle('active', mode === 'grid');

  document
    .getElementById('btn-list')
    .classList
    .toggle('active', mode === 'list');

  renderGrid();

}

window.setView = setView;


// ========================================
// STATUS FILTER
// ========================================

function setStatus(btn, status) {

  filtroStatus = status;

  paginaAtual = 1;

  document
    .querySelectorAll('.chip')
    .forEach(c =>
      c.classList.remove('active'));

  btn.classList.add('active');

  renderGrid();

}

window.setStatus = setStatus;


// ========================================
// SEARCH
// ========================================

document
  .getElementById('search-input')
  .addEventListener('input', (e) => {

    filtroTexto = e.target.value;

    renderGrid();

  });


// ========================================
// CATEGORIA
// ========================================

document
  .getElementById('filter-categoria')
  .addEventListener('change', (e) => {

    filtroCateg = e.target.value;

    renderGrid();

  });


// ========================================
// MODAL
// ========================================

function openModal(id) {

  const l =
    LIVROS.find(x => x.id === id);

  if (!l) return;

  document.getElementById('modal-body').innerHTML = `

    <div class="modal-book-header">

      <div class="modal-cover"
        style="background:${l.cor}">
        ${l.emoji}
      </div>

      <div>

        <h2>${l.titulo}</h2>

        <p>${l.autor}</p>

        <span class="status-badge ${l.status}">
          ${labelStatus(l.status)}
        </span>

      </div>

    </div>

    <br>

    <p>${l.descricao || ''}</p>

    <br>

    <button
      class="btn-reserve"
      data-reserve-id="${l.id}"
      onclick="reservarLivro('${l.id}')"
      ${reservasEmAndamento.has(l.id) ? 'disabled aria-busy="true"' : ''}>

      ${reservasEmAndamento.has(l.id) ? '⏳ Reservando...' : '📚 Reservar Livro'}

    </button>

  `;

  document
    .getElementById('modal-overlay')
    .classList
    .add('open');

}

window.openModal = openModal;


// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {

  document
    .getElementById('modal-overlay')
    .classList
    .remove('open');

}

window.closeModal = closeModal;


// ========================================
// OVERLAY
// ========================================

function closeModalOnOverlay(e) {

  if (
    e.target ===
    document.getElementById('modal-overlay')
  ) {

    closeModal();

  }

}

window.closeModalOnOverlay =
  closeModalOnOverlay;



function setReservaLivroLoading(livroId, loading) {

  document
    .querySelectorAll(`[data-reserve-id="${livroId}"]`)
    .forEach((button) => {

      button.disabled = loading;
      button.setAttribute("aria-busy", loading ? "true" : "false");
      button.textContent = loading ? "⏳ Reservando..." : "📚 Reservar Livro";

    });

}

// ========================================
// RESERVAR LIVRO
// ========================================

async function reservarLivro(livroId) {

  if (reservasEmAndamento.has(livroId)) {
    return;
  }

  reservasEmAndamento.add(livroId);
  setReservaLivroLoading(livroId, true);

  try {

    const livro =
      LIVROS.find(l => l.id === livroId);

    if (!livro) return;

    // usuário

    const qUser = query(
      collection(db, "usuarios"),
      where("uid", "==", usuarioAtual.uid)
    );

    const snapUser =
      await getDocs(qUser);

    if (snapUser.empty) {

      window.showAppMessage?.("Usuário não encontrado.");

      return;
    }

    const usuarioDoc =
      snapUser.docs[0];

    const usuario =
      usuarioDoc.data();

    // criar reserva

    await addDoc(
      collection(db, "reservas"),
      {

        usuarioId: usuarioAtual.uid,

        matricula: usuario.matricula,

        nome: usuario.nome,

        turma: usuario.turma,

        livroId: livroId,

        tituloLivro: livro.titulo,

        autorLivro: livro.autor,

        status: "esperando",

        dataReserva:
          new Date().toISOString(),

        criadoEm: serverTimestamp()

      }
    );

 
    // ========================================
// CRIAR MOVIMENTAÇÃO EM EMPRÉSTIMOS
// ========================================



// ========================================
// HISTÓRICO DO USUÁRIO
// ========================================

await updateDoc(
  doc(db, "usuarios", usuarioAtual.uid),
  {

    historico: arrayUnion({

      nome: livro.titulo,

      retirada: "-",

      devolucao: "-",

      status: "Reservado"

    })

  }
);

    // atualizar livro

    await updateDoc(
      doc(db, "livros", livroId),
      {

        status: "reservado",

        disponiveis: increment(-1)

      }
    );

    window.showAppMessage?.("Livro reservado.");

    closeModal();

    await carregarLivros();

  }
 
  catch (error) { 

    console.error(error);

    window.showAppMessage?.("Erro ao reservar.");

  }

  finally {

    reservasEmAndamento.delete(livroId);
    setReservaLivroLoading(livroId, false);

  }

  
}

window.reservarLivro = reservarLivro;
