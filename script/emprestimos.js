import {
  listarTodosEmprestimos,
  aprovarReserva,
  marcarComoDevolvido
}
from "../firebase/services/emprestimosService.js";


import {
   listarReservasPendentes,
  excluirReserva
}
from "../firebase/services/reservasService.js";

import {
  obterUsuarioAtual,
  ocultarEmprestimos,
  ocultarReservas
}
from "../firebase/services/usuariosService.js";

 
// ========================================

const tbody =
  document.querySelector("tbody");

let EMPRESTIMOS = [];
let RESERVAS = [];
let filtroAtivo = "todos";

let EMPRESTIMOS_OCULTOS = [];
let RESERVAS_OCULTAS = [];

const btnExcluirGeral =
  document.getElementById(
    "btnExcluirGeral"
  ); 

const modal =
  document.getElementById("modalAprovacao");

const modalAluno =
  document.getElementById("modalAluno");

const modalLivro =
  document.getElementById("modalLivro");

const dataRetiradaInput =
  document.getElementById("dataRetirada");

const dataEntregaInput =
  document.getElementById("dataEntrega");

const btnCancelarModal =
  document.getElementById("btnCancelarModal");

const btnConfirmarModal =
  document.getElementById("btnConfirmarModal");

  const btnNegarModal =
  document.getElementById(
    "btnNegarModal"
  );

const modalDevolucao =
  document.getElementById(
    "modalDevolucao"
  );

const devolucaoAluno =
  document.getElementById(
    "devolucaoAluno"
  );

const devolucaoLivro =
  document.getElementById(
    "devolucaoLivro"
  );

const devolucaoPrazo =
  document.getElementById(
    "devolucaoPrazo"
  );

const btnCancelarDevolucao =
  document.getElementById(
    "btnCancelarDevolucao"
  );

const btnConfirmarDevolucao =
  document.getElementById(
    "btnConfirmarDevolucao"
  );

let reservaSelecionada = null;

let emprestimoSelecionado = null;

let modoDevolucao = false;

// ========================================

async function carregar() {

  EMPRESTIMOS =
    await listarTodosEmprestimos();

  RESERVAS =
    await listarReservasPendentes();

  const usuario =
    await obterUsuarioAtual();

  EMPRESTIMOS_OCULTOS =
    usuario?.emprestimosOcultos || [];

  RESERVAS_OCULTAS =
    usuario?.reservasOcultas || [];

  console.log("EMPRESTIMOS", EMPRESTIMOS);
  console.log("RESERVAS", RESERVAS);
  console.log(
    "RESERVAS PENDENTES:",
    RESERVAS.length
  );

  renderTabela(EMPRESTIMOS);

}

// ========================================

function renderTabela(lista) {

  tbody.innerHTML = "";

  const ocultos =
    filtroAtivo === "esperando"
      ? RESERVAS_OCULTAS
      : EMPRESTIMOS_OCULTOS;

  const listaVisivel =
    lista.filter(emp =>

      !ocultos.includes(emp.id)

      &&

      emp.status !== "devolvido"

    );

  const listaFiltrada = listaVisivel.filter(emp => {

    if (modoDevolucao) {

      return emp.status !== "devolvido";

    }

    if (
      filtroAtivo === "todos" ||
      filtroAtivo === "esperando"
    ) {
      return true;
    }

    if (!emp.prazoEntrega) {
      return false;
    }

    const hoje = new Date();

    const prazo =
      emp.prazoEntrega.toDate();

    if (filtroAtivo === "ativo") {
      return hoje <= prazo;
    }

    if (filtroAtivo === "atrasado") {
      return hoje > prazo;
    }

    return true;

  });

  if (!listaFiltrada.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:20px;">
          Nenhum registro encontrado.
        </td>
      </tr>
    `;

    return;
  }

  listaFiltrada.forEach(emp => {

    let status = "Em andamento";
    let statusClass = "active";

    if (emp.status === "pendente") {

      status = "Aguardando";
      statusClass = "active";

    } else {

      const hoje = new Date();

      const prazo =
        emp.prazoEntrega
          ? emp.prazoEntrega.toDate()
          : null;

      if (prazo && hoje > prazo) {

        status = "Atrasado";
        statusClass = "delayed";

      }

    }

    const tr =
  document.createElement("tr");

if (modoDevolucao) {

  tr.style.cursor = "pointer";

  tr.addEventListener("click", () => {

    abrirModalDevolucao(emp);

  });

}

if (filtroAtivo === "esperando") {

  tr.style.cursor = "pointer";

tr.addEventListener("click", () => {

  abrirAprovacao(emp);

});

}

    tr.innerHTML = `

      <td>${emp.nomeUsuario || emp.nome || "-"}</td>

      <td>${emp.turma || "-"}</td>

      <td>${emp.tituloLivro || "-"}</td>

      <td>
        ${
          emp.retiradoEm
            ? formatar(emp.retiradoEm)
            : "-"
        }
      </td>

      <td>
        ${
          emp.prazoEntrega
            ? formatar(emp.prazoEntrega)
            : "-"
        }
      </td>

      <td>

        <span class="status ${statusClass}">
          ${status}
        </span>

      </td>

    `;

    tbody.appendChild(tr);

  });

}

// ========================================

function formatar(timestamp) {

  if (!timestamp) return "-";

  return timestamp
    .toDate()
    .toLocaleDateString("pt-BR");

}

// ========================================

document
  .getElementById("searchInput")
  .addEventListener("input", (e) => {

    const texto =
      e.target.value.toLowerCase();

    let baseDados =
      filtroAtivo === "esperando"
        ? RESERVAS
        : EMPRESTIMOS;

    const filtrados =
      baseDados.filter(item =>

        item.nomeUsuario
          ?.toLowerCase()
          .includes(texto)

        ||

        item.nome
          ?.toLowerCase()
          .includes(texto)

        ||

        item.tituloLivro
          ?.toLowerCase()
          .includes(texto)

        ||

        item.turma
          ?.toLowerCase()
          .includes(texto)

      );

    renderTabela(filtrados);

  });

// ========================================

document
  .querySelectorAll("[data-filter]")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      document
        .querySelectorAll("[data-filter]")
        .forEach(b => {

          b.classList.remove("btn-primary");
          b.classList.remove("active");

        });

      btn.classList.add("btn-primary");
      btn.classList.add("active");

      filtroAtivo =
        btn.dataset.filter;

      const textosBotao = {
        todos:
          "🗑 Apagar Todos",
        ativo:
          "🗑 Apagar Empréstimos",
        atrasado:
          "🗑 Apagar Atrasados",
        esperando:
          "🗑 Apagar Reservas"
      };

      btnExcluirGeral.textContent =
        textosBotao[filtroAtivo] ||
        "🗑 Apagar";

if (
  filtroAtivo === "devolucao"
) {

  btnExcluirGeral.style.display =
    "none";

}
else {

  btnExcluirGeral.style.display =
    "inline-flex";

}

      if (filtroAtivo === "esperando") {

        modoDevolucao = false;

        renderTabela(RESERVAS);

        return;

      }

      if (filtroAtivo === "devolucao") {

        modoDevolucao = true;

        renderTabela(EMPRESTIMOS);

        return;

      }

      modoDevolucao = false;

      renderTabela(EMPRESTIMOS);

    });

  });

// ========================================
// APROVAR RESERVA
// ========================================

function abrirAprovacao(reserva) {

  reservaSelecionada =
    reserva;

  modalAluno.textContent =
    reserva.nomeUsuario;

  modalLivro.textContent =
    reserva.tituloLivro;

  const hoje =
    new Date()
      .toISOString()
      .split("T")[0];

  dataRetiradaInput.value =
    hoje;

  dataEntregaInput.value =
    "";

  modal.classList.add("show");

}

btnCancelarModal.addEventListener(
  "click",
  () => {

    modal.classList.remove("show");

  }
);

btnConfirmarModal.addEventListener(
  "click",
  async () => {

    if (!reservaSelecionada) {
      return;
    }

    if (
      !dataRetiradaInput.value ||
      !dataEntregaInput.value
    ) {

      alert(
        "Preencha as datas."
      );

      return;
    }

    try {

      await aprovarReserva({

        reservaId:
          reservaSelecionada.id,

        dataRetirada:
          new Date(
            dataRetiradaInput.value + "T00:00:00"
          ),

        dataEntrega:
          new Date(
            dataEntregaInput.value + "T00:00:00"
          )

      });

      alert(
        "Empréstimo aprovado."
      );

      modal.classList.remove(
        "show"
      );

      await carregar();

      filtroAtivo =
        "esperando";

      RESERVAS =
        await listarReservasPendentes();

      renderTabela(
        RESERVAS
      );

    }

    catch (error) {

      console.error(error);

      alert(
        "Erro ao aprovar empréstimo."
      );

    }

  }
);


btnNegarModal.addEventListener(
  "click",
  async () => {

    if (!reservaSelecionada) {
      return;
    }

    const confirmar =
      confirm(
        "Deseja realmente negar esta reserva?"
      );

    if (!confirmar) {
      return;
    }

    try {

      await excluirReserva(
        reservaSelecionada.id
      );

      modal.classList.remove(
        "show"
      );

      RESERVAS =
        await listarReservasPendentes();

      filtroAtivo = "esperando";

      renderTabela(
        RESERVAS
      );

      alert(
        "Reserva negada."
      );

    }

    catch (error) {

      console.error(error);

      alert(
        "Erro ao negar reserva."
      );

    }

  }
);


btnExcluirGeral.addEventListener(
  "click",
  async () => {

    const confirmar =
      confirm(
        `Deseja realmente ${btnExcluirGeral.textContent.toLowerCase()}?`
      );

    if (!confirmar) {
      return;
    }

    try {

      if (filtroAtivo === "esperando") {

        const ids =
          RESERVAS
            .filter(r => !RESERVAS_OCULTAS.includes(r.id))
            .map(r => r.id);

        await ocultarReservas(ids);

        RESERVAS_OCULTAS =
          [...RESERVAS_OCULTAS, ...ids];

        renderTabela(RESERVAS);

      }

      else {

        const ids =
          EMPRESTIMOS
            .filter(e => !EMPRESTIMOS_OCULTOS.includes(e.id))
            .map(e => e.id);

        await ocultarEmprestimos(ids);

        EMPRESTIMOS_OCULTOS =
          [...EMPRESTIMOS_OCULTOS, ...ids];

        renderTabela(EMPRESTIMOS);

      }

      alert(
        "Registros apagados com sucesso."
      );

    }

    catch (error) {

      console.error(error);

      alert(
        "Erro ao ocultar registros."
      );

    }

  }
);


// ========================================
// REGISTRAR DEVOLUÇÃO
// ========================================

function abrirModalDevolucao(
  emprestimo
) {

  emprestimoSelecionado =
    emprestimo;

  devolucaoAluno.textContent =
    emprestimo.nomeUsuario;

  devolucaoLivro.textContent =
    emprestimo.tituloLivro;

  devolucaoPrazo.textContent =
    formatar(
      emprestimo.prazoEntrega
    );

  modalDevolucao
    .classList
    .add("show");

}

btnCancelarDevolucao
  .addEventListener(
    "click",
    () => {

      modalDevolucao
        .classList
        .remove("show");

    }
  );

btnConfirmarDevolucao
  .addEventListener(
    "click",
    async () => {

      if (
        !emprestimoSelecionado
      ) {
        return;
      }

      try {

        await marcarComoDevolvido(
          emprestimoSelecionado.id
        );

        modalDevolucao
          .classList
          .remove("show");

        await carregar();

        filtroAtivo =
          "devolucao";

        modoDevolucao =
          true;

        renderTabela(
          EMPRESTIMOS
        );

        alert(
          "Livro devolvido com sucesso."
        );

      }

      catch (error) {

        console.error(error);

        alert(
          "Erro ao registrar devolução."
        );

      }

    }
  );

carregar();