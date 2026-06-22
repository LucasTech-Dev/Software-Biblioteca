import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} 
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth } 
from "../firebase/auth.js";

import { db } 
from "../firebase/firestore.js";

import { ocultarEmprestimosAluno }
from "../firebase/services/emprestimosService.js";

import { ocultarReservasAluno }
from "../firebase/services/reservasService.js";

window.PageGuard?.hold();

// ========================================

let RESERVAS = [];

let EMPRESTIMOS = [];

let filtroAtivo = "todos";

let termoBusca = "";

const loanList =
  document.getElementById("loan-list");

const btnApagar =
  document.getElementById("btnApagar");

let perfilCarregado = false;
let emprestimosCarregados = false;
let reservasCarregadas = false;
let paginaLiberada = false;

function liberarPaginaQuandoPronta() {

  if (
    paginaLiberada ||
    !perfilCarregado ||
    !emprestimosCarregados ||
    !reservasCarregadas
  ) {
    return;
  }

  paginaLiberada = true;

  window.PageGuard?.ready();

}

// ========================================
// TEXTOS DO BOTÃO POR FILTRO
// ========================================

const textosBotao = {
  todos:      "🗑 Apagar Todos",
  reserva:    "🗑 Apagar Reservas",
  ativo:      "🗑 Apagar Retiradas",
  atrasado:   "🗑 Apagar Atrasados",
  devolvido:  "🗑 Apagar Devolvidos"
};

// ========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = "login.html";

    return;

  }

  // ========================================
  // DADOS DO USUÁRIO
  // ========================================

  try {

    const usuarioRef =
      doc(db, "usuarios", user.uid);

    const usuarioSnap =
      await getDoc(usuarioRef);

    const usuario =
      usuarioSnap.data();

    document.getElementById("nomeUsuario").innerText =
      usuario.nome;

    document.getElementById("dadosUsuario").innerText =
      `${usuario.turma} · Matrícula ${usuario.matricula}`;

  // ========================================
  // AVATAR
  // ========================================

    const iniciais = usuario.nome
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("");

    document.getElementById("avatarUsuario").innerText =
      iniciais.toUpperCase();

    perfilCarregado = true;

  // ========================================
  // LISTENER — EMPRÉSTIMOS
  // ========================================

    const qEmprestimos = query(
      collection(db, "emprestimos"),
      where("usuarioId", "==", user.uid)
    );

    onSnapshot(qEmprestimos, snapshot => {

      EMPRESTIMOS = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item =>
          item.visivelAluno !== false
        );

      emprestimosCarregados = true;

      renderizarLista();

      liberarPaginaQuandoPronta();

    }, error => {

      console.error(error);

      alert("Erro ao carregar empréstimos.");

      emprestimosCarregados = true;

      liberarPaginaQuandoPronta();

    });

  // ========================================
  // LISTENER — RESERVAS
  // ========================================

    const qReservas = query(
      collection(db, "reservas"),
      where("usuarioId", "==", user.uid)
    );

    onSnapshot(qReservas, snapshot => {

      RESERVAS = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item =>
          item.visivelAluno !== false
        );

      reservasCarregadas = true;

      renderizarLista();

      liberarPaginaQuandoPronta();

    }, error => {

      console.error(error);

      alert("Erro ao carregar reservas.");

      reservasCarregadas = true;

      liberarPaginaQuandoPronta();

    });

  // ========================================
  // BOTÃO APAGAR — lógica de clique
  // ========================================

    liberarPaginaQuandoPronta();

  }

  catch (error) {

    console.error(error);

    alert("Erro ao carregar seus empréstimos.");

    window.PageGuard?.ready();

  }

  btnApagar.addEventListener("click", async () => {

    const confirmar = confirm(
      `Deseja realmente ${btnApagar.textContent.toLowerCase()}?`
    );

    if (!confirmar) {
      return;
    }

    try {

      if (filtroAtivo === "reserva") {

        const ids = RESERVAS.map(r => r.id);

        await ocultarReservasAluno(ids);

      }

      else if (filtroAtivo === "todos") {

        const idsReservas =
          RESERVAS.map(r => r.id);

        const idsEmprestimos =
          EMPRESTIMOS.map(e => e.id);

        await ocultarReservasAluno(idsReservas);

        await ocultarEmprestimosAluno(idsEmprestimos);

      }

      else {

        // filtros: ativo, atrasado, devolvido
        // apaga somente os itens visíveis no filtro atual
        const ids = obterItensDoFiltro().map(e => e.id);

        await ocultarEmprestimosAluno(ids);

      }

      alert("Registros apagados da sua visualização.");

    }

    catch (error) {

      console.error(error);

      alert("Erro ao apagar registros.");

    }

  });

});

// ========================================

function formatar(timestamp) {

  if (!timestamp) return "-";

  return timestamp
    .toDate()
    .toLocaleDateString("pt-BR");

}

// ========================================

function obterStatus(item) {

  if (item.status === "esperando") {
    return "Em análise";
  }

  if (item.status === "devolvido") {
    return "Devolvido";
  }

  if (item.status === "ativo") {

    if (
      item.prazoEntrega &&
      new Date() > item.prazoEntrega.toDate()
    ) {
      return "Atrasado";
    }

    return "Ativo";

  }

  return item.status;

}

// ========================================
// Retorna os itens do filtro atual
// (usado pelo botão apagar)
// ========================================

function obterItensDoFiltro() {

  if (filtroAtivo === "todos") {

    return [
      ...RESERVAS,
      ...EMPRESTIMOS
    ];

  }

  if (filtroAtivo === "reserva") {

    return RESERVAS;

  }

  if (filtroAtivo === "ativo") {

    return EMPRESTIMOS.filter(item =>
      item.status === "ativo"
    );

  }

  if (filtroAtivo === "atrasado") {

    return EMPRESTIMOS.filter(item => {

      if (item.status !== "ativo") {
        return false;
      }

      if (!item.prazoEntrega) {
        return false;
      }

      return new Date() > item.prazoEntrega.toDate();

    });

  }

  if (filtroAtivo === "devolvido") {

    return EMPRESTIMOS.filter(item =>
      item.status === "devolvido"
    );

  }

  return [];

}

// ========================================

function atualizarBotaoApagar() {

  btnApagar.textContent =
    textosBotao[filtroAtivo] || "🗑 Apagar";

  // esconde o botão se a lista estiver vazia
  const itens = obterItensDoFiltro();

  btnApagar.style.display =
    itens.length > 0
      ? "inline-flex"
      : "none";

}

// ========================================

function renderizarLista() {

  const lista =
    document.getElementById("loan-list");

  let origem = [];

  if (filtroAtivo === "todos") {

    origem = [
      ...RESERVAS,
      ...EMPRESTIMOS
    ];

  }

  else if (filtroAtivo === "reserva") {

    origem = RESERVAS;

  }

  else if (filtroAtivo === "ativo") {

    origem = EMPRESTIMOS.filter(item =>
      item.status === "ativo"
    );

  }

  else if (filtroAtivo === "atrasado") {

    origem = EMPRESTIMOS.filter(item => {

      if (item.status !== "ativo") {
        return false;
      }

      if (!item.prazoEntrega) {
        return false;
      }

      return new Date() > item.prazoEntrega.toDate();

    });

  }

  else if (filtroAtivo === "devolvido") {

    origem = EMPRESTIMOS.filter(item =>
      item.status === "devolvido"
    );

  }

  const itens = origem.filter(item => {

    return termoBusca === ""
      || item.tituloLivro
          ?.toLowerCase()
          .includes(termoBusca);

  });

  // atualiza o botão sempre que a lista re-renderiza
  atualizarBotaoApagar();

  if (!itens.length) {

    lista.innerHTML = `

      <div class="empty">

        <span class="empty-icon">
          📚
        </span>

        Nenhum item encontrado.

      </div>

    `;

    return;
  }

  lista.innerHTML = itens.map(item => {

    const statusTexto =
      obterStatus(item);

    const badgeClass =
      item.status === "devolvido"
        ? "badge-returned"
        : item.status === "esperando"
          ? "badge-pending"
          : statusTexto === "Atrasado"
            ? "badge-delayed"
            : "badge-active";

    const bookClass =
      item.status === "devolvido"
        ? "book-green"
        : item.status === "esperando"
          ? "book-amber"
          : statusTexto === "Atrasado"
            ? "book-red"
            : "book-blue";

    return `

    <div class="loan-item">

      <div class="book-icon ${bookClass}">
        📖
      </div>

      <div class="loan-info">

        <div class="loan-title">
          ${item.tituloLivro}
        </div>

        <div class="loan-author">
          ${item.autorLivro || "Autor não informado"}
        </div>

        <div class="loan-dates">

          <div class="date-block">
            Status
            <strong>
              ${statusTexto}
            </strong>
          </div>

          <div class="date-block">
            Criado em
            <strong>
              ${formatar(item.criadoEm)}
            </strong>
          </div>

          ${item.prazoEntrega ? `
          <div class="date-block">
            Devolução
            <strong>
              ${formatar(item.prazoEntrega)}
            </strong>
          </div>
          ` : ""}

        </div>

      </div>

      <div class="loan-right">

        <span class="badge ${badgeClass}">
          ${statusTexto}
        </span>

      </div>

    </div>

  `;

  }).join("");

}

// ========================================
// FILTROS
// ========================================

document
  .querySelectorAll(".chip")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      document
        .querySelectorAll(".chip")
        .forEach(c =>
          c.classList.remove("active")
        );

      btn.classList.add("active");

      filtroAtivo =
        btn.dataset.filter;

      renderizarLista();

    });

  });

// ========================================
// BUSCA
// ========================================

document
  .getElementById("searchInput")
  .addEventListener("input", e => {

    termoBusca =
      e.target.value
        .toLowerCase()
        .trim();

    renderizarLista();

  });
