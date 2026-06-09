import {
  listarTodosEmprestimos,
  aprovarReserva
}
from "../firebase/services/emprestimosService.js";


import {
  listarReservasPendentes,
   excluirReserva
}
from "../firebase/services/reservasService.js";


// ========================================

const tbody =
  document.querySelector("tbody");

let EMPRESTIMOS = [];
let RESERVAS = [];
let filtroAtivo = "todos";


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

let reservaSelecionada = null;

// ========================================

async function carregar() {

  EMPRESTIMOS =
    await listarTodosEmprestimos();

  RESERVAS =
    await listarReservasPendentes();

  console.log("EMPRESTIMOS", EMPRESTIMOS);
  console.log("RESERVAS", RESERVAS);
  // CORREÇÃO 4: log para conferir reservas pendentes
  console.log(
    "RESERVAS PENDENTES:",
    RESERVAS.length
  );

  renderTabela(EMPRESTIMOS);

}

// ========================================

function renderTabela(lista) {

  tbody.innerHTML = "";

  const listaFiltrada = lista.filter(emp => {

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

    // CORREÇÃO 3: status baseado em emp.status, não no filtroAtivo
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

      if (filtroAtivo === "esperando") {

        renderTabela(RESERVAS);
        return;

      }

      renderTabela(EMPRESTIMOS);

    });

  });

// ========================================

document
  .getElementById("btnDevolucao") 
  ?.addEventListener("click", () => {

    window.location.href =
      "./devolucao.html";

  });

// ========================================

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

// CORREÇÃO 1: apenas UM listener no btnConfirmarModal
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

      // CORREÇÃO 2: forçar filtroAtivo antes de renderizar
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



carregar();