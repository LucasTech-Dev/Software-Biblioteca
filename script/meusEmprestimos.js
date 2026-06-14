import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth } 
from "../firebase/auth.js";

import { db } 
from "../firebase/firestore.js";

import { listarEmprestimosUsuario } 
from "../firebase/services/emprestimosService.js";

import {
  listarReservasUsuario
}
from "../firebase/services/reservasService.js";

import {
  obterUsuario
}
from "../firebase/services/usuariosService.js";

// ========================================
let RESERVAS = [];

let EMPRESTIMOS = [];

let filtroAtivo = "todos";

let termoBusca = "";

// CORREÇÃO 5: ocultos do aluno
let EMPRESTIMOS_OCULTOS = [];
let RESERVAS_OCULTAS = [];

const loanList =
  document.getElementById("loan-list");
// ========================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

  window.location.href = "login.html";

  return;

}

EMPRESTIMOS =
  await listarEmprestimosUsuario(user.uid);

RESERVAS =
  await listarReservasUsuario(user.uid);

  // ========================================
  // DADOS DO USUÁRIO
  // ========================================

  const usuarioRef = doc(db, "usuarios", user.uid);
  const usuarioSnap = await getDoc(usuarioRef);
  const usuario = usuarioSnap.data();

  // CORREÇÃO 5: carregar listas de ocultos do aluno
  EMPRESTIMOS_OCULTOS =
    usuario?.emprestimosOcultos || [];

  RESERVAS_OCULTAS =
    usuario?.reservasOcultas || [];

  document.getElementById("nomeUsuario").innerText = usuario.nome;
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
  // ========================================

renderizarLista();

// ========================================
});

function formatar(timestamp) {
  if (!timestamp) return "-";
  return timestamp.toDate().toLocaleDateString("pt-BR"); 
}


function obterStatus(item) {

  if (item.status === "esperando") {
    return "Reserva";
  }

  if (!item.prazoEntrega) {
    return item.status;
  }

  const hoje = new Date();

  if (hoje > item.prazoEntrega.toDate()) {
    return "atrasado";
  }

  return "ativo";

}


function renderizarLista() {

  console.log(EMPRESTIMOS);

  const lista =
    document.getElementById("loan-list");

  // CORREÇÃO 5: filtrar ocultos antes de montar a origem
  const emprestimosVisiveis =
    EMPRESTIMOS.filter(item =>
      !EMPRESTIMOS_OCULTOS.includes(item.id)
    );

  const reservasVisiveis =
    RESERVAS.filter(item =>
      !RESERVAS_OCULTAS.includes(item.id)
    );

let origem = [];

if (filtroAtivo === "todos") {

  origem = [
    ...reservasVisiveis,
    ...emprestimosVisiveis
  ];

}

else if (filtroAtivo === "reserva") {

  origem = reservasVisiveis;

}

else if (filtroAtivo === "ativo") {

  origem = emprestimosVisiveis.filter(item => {

    if (!item.prazoEntrega) {
      return false;
    }

    const hoje = new Date();

    return hoje <= item.prazoEntrega.toDate();

  });

}

else if (filtroAtivo === "atrasado") {

  origem = emprestimosVisiveis.filter(item => {

    if (!item.prazoEntrega) {
      return false;
    }

    const hoje = new Date();

    return hoje > item.prazoEntrega.toDate();

  });

}

const itens =
  origem.filter(item => {

    const passaBusca =

      termoBusca === ""

      ||

      item.tituloLivro
        ?.toLowerCase()
        .includes(termoBusca);

    return passaBusca;

  });

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

  lista.innerHTML = itens.map(item => `

    <div class="loan-item">

      <div class="book-icon book-blue">
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

            Tipo

            <strong>

              ${obterStatus(item)}

            </strong>

          </div>

          <div class="date-block">

            Criado em

            <strong>

              ${formatar(item.criadoEm)}

            </strong>

          </div>

        </div>

      </div>

      <div class="loan-right">

        <span class="badge badge-active">

          ${obterStatus(item)}

        </span>

      </div>

    </div>

  `).join("");

}
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

  document
  .getElementById("searchInput")
  .addEventListener("input", e => {

    termoBusca =
      e.target.value
      .toLowerCase()
      .trim();

    renderizarLista();

  });