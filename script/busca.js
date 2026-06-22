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
// ESTADO
// ========================================

let BOOKS = [];

let usuarioAtual = null;


// ========================================
// AUTH
// ========================================

onAuthStateChanged(auth, async(user) => {

  if (!user) {

    alert("Faça login.");

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

    const snap =
      await getDocs(collection(db, "livros"));

    BOOKS = [];

    snap.forEach((docSnap) => {

      const dados = docSnap.data();

      BOOKS.push({

        id: docSnap.id,

        title: dados.titulo,
        author: dados.autor,
        category: dados.categoria,
        year: dados.ano,
        isbn: dados.isbn,

        status: dados.status,

        copies: dados.disponiveis,

        emoji: dados.emoji || "📚"

      });

    });

    renderBooks(BOOKS);

  }

  catch (error) {

    console.error(error);

    alert("Erro ao carregar livros.");

  }

}


// ========================================
// STATUS
// ========================================

function statusInfo(status, copies) {

  if (status === 'disponivel') {

    return {

      cls: 'avail-yes',

      label: `Disponível (${copies} ex.)`,

      pill: 'pill-green'

    };

  }

  if (status === 'emprestado') {

    return {

      cls: 'avail-no',

      label: 'Emprestado',

      pill: 'pill-coral'

    };

  }

  return {

    cls: 'avail-few',

    label: 'Reservado',

    pill: 'pill-amber'

  };

}


// ========================================
// RENDER
// ========================================

function renderBooks(list) {

  const container =
    document.getElementById('bookList');

  document.getElementById('resultsCount').innerHTML = `
    Exibindo <strong>${list.length}</strong> livros
  `;

  if (list.length === 0) {

    container.innerHTML = `
      <div style="padding:40px;text-align:center;">
        Nenhum livro encontrado.
      </div>
    `;

    return;
  }

  container.innerHTML = list.map((b) => {

    const s = statusInfo(b.status, b.copies);

    return `

      <div class="book-card">

        <div class="book-cover">
          ${b.emoji}
        </div>

        <div class="book-info">

          <div class="book-title">
            ${b.title}
          </div>

          <div class="book-author">
            ${b.author}
          </div>

          <div class="book-meta">

            <span class="pill pill-muted">
              ${b.category}
            </span>

            <span class="pill pill-muted">
              ISBN: ${b.isbn}
            </span>

          </div>

        </div>

        <div class="book-actions">

          <div class="availability ${s.cls}">
            ${s.label}
          </div>

          ${b.status === 'disponivel'

            ?

            `<button
              class="btn btn-primary btn-sm"
              onclick="reservar('${b.id}')">

              📅 Reservar

            </button>`

            :

            `<span class="pill pill-amber">
              Indisponível
            </span>`
          }

        </div>

      </div>

    `;

  }).join('');

}


// ========================================
// FILTRO
// ========================================

function filterBooks() {

  const q =
    document
      .getElementById('searchInput')
      .value
      .toLowerCase();

  let list = BOOKS.filter(b =>

    b.title.toLowerCase().includes(q) ||

    b.author.toLowerCase().includes(q) ||

    b.isbn.includes(q) ||

    b.category.toLowerCase().includes(q)

  );

  renderBooks(list);

}

window.filterBooks = filterBooks;


// ========================================
// SORT
// ========================================

function sortBooks(val) {

  let list = [...BOOKS];

  if (val === 'titulo') {

    list.sort((a, b) =>
      a.title.localeCompare(b.title));

  }

  if (val === 'autor') {

    list.sort((a, b) =>
      a.author.localeCompare(b.author));

  }

  if (val === 'recente') {

    list.sort((a, b) =>
      b.year - a.year);

  }

  renderBooks(list);

}

window.sortBooks = sortBooks;


// ========================================
// LIMPAR
// ========================================

function clearFilters() {

  document.getElementById('searchInput').value = '';

  renderBooks(BOOKS);

}

window.clearFilters = clearFilters;


// ========================================
// RESERVA
// ========================================

async function reservar(livroId) {

  try {

    const livro =
      BOOKS.find(b => b.id === livroId);

    if (!livro) return;

    // usuário

    const qUser = query(
      collection(db, "usuarios"),
      where("uid", "==", usuarioAtual.uid)
    );

    const userSnap =
      await getDocs(qUser);

    if (userSnap.empty) {

      alert("Usuário não encontrado.");

      return;
    }

    const usuario =
      userSnap.docs[0].data();

    // reserva

    await addDoc(
      collection(db, "reservas"),
      {

        usuarioId: usuarioAtual.uid,

        matricula: usuario.matricula,

        nome: usuario.nome,

        turma: usuario.turma,

        livroId: livroId,

        tituloLivro: livro.title,

        autorLivro: livro.author,

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

      nome: livro.title,

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

    alert("Livro reservado com sucesso.");

    await carregarLivros();

  }

  catch (error) {

    console.error(error);

    alert("Erro ao reservar livro.");

  }

}
 
window.reservar = reservar;


// ========================================
// DETALHES
// ========================================

function verDetalhes(titulo) {

  alert(`Livro: ${titulo}`);

}

window.verDetalhes = verDetalhes;
