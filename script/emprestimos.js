import {

  listarTodosEmprestimos

}

from "../firebase/services/emprestimosService.js";


// ========================================

const tbody =
  document.querySelector("tbody");


// ========================================

async function carregar() {

  const emprestimos =
    await listarTodosEmprestimos();

  tbody.innerHTML = "";

  emprestimos.forEach(emp => {

    let status =
      "Em andamento";

    let statusClass =
      "active";

    const hoje =
      new Date();

    const prazo =
      emp.prazoEntrega.toDate();

    if (hoje > prazo) {

      status =
        "Atrasado";

      statusClass =
        "delayed";
    }

    const tr =
      document.createElement("tr");

    tr.innerHTML = `

      <td>${emp.nomeUsuario}</td>

      <td>${emp.tituloLivro}</td>

      <td>${formatar(emp.retiradoEm)}</td>

      <td>${formatar(emp.prazoEntrega)}</td>

      <td>

        <span class="status ${statusClass}">

          ${status}

        </span>

      </td>
    `;

    tbody.appendChild(tr);
  });
}

carregar();


// ========================================

function formatar(timestamp) {

  return timestamp
    .toDate()
    .toLocaleDateString("pt-BR");
}


// ========================================

document
  .getElementById("btnDevolucao")
  .addEventListener("click", () => {

    window.location.href =
      "./devolucao.html";
  });