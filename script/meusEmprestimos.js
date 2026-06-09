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

// ========================================
let RESERVAS = [];

let EMPRESTIMOS = [];

let filtroAtivo = "todos";

let termoBusca = "";

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

renderizarLista();
  // ========================================
  // DADOS DO USUÁRIO
  // ========================================

  const usuarioRef = doc(db, "usuarios", user.uid);
  const usuarioSnap = await getDoc(usuarioRef);
  const usuario = usuarioSnap.data();

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

// ========================================
});

function formatar(timestamp) {
  if (!timestamp) return "-";
  return timestamp.toDate().toLocaleDateString("pt-BR"); 
}

function renderizarLista() {

  console.log(EMPRESTIMOS);

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

else {

  origem = EMPRESTIMOS.filter(item =>
    item.status === filtroAtivo
  );

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

              ${item.status}

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

          ${item.status}

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