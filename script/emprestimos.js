import {

  listarTodosEmprestimos

}

from "../firebase/services/emprestimosService.js";


// ========================================

const tbody =
  document.querySelector("tbody");

  let EMPRESTIMOS = [];



// ========================================

function renderTabela(lista) {

  tbody.innerHTML = "";

  lista.forEach(emp => {

    let status =
      "Em andamento";

    let statusClass =
      "active";

    const hoje =
      new Date();

    const prazo =
      emp.prazoEntrega
        ? emp.prazoEntrega.toDate()
        : null;

    if (prazo && hoje > prazo) {

      status =
        "Atrasado";

      statusClass =
        "delayed";
    }

    const tr =
      document.createElement("tr");

    tr.innerHTML = `

      <td>${emp.nomeUsuario || "-"}</td>

      <td>${emp.turma || "-"}</td>

      <td>${emp.tituloLivro || "-"}</td>

      <td>
        ${emp.retiradoEm
          ? formatar(emp.retiradoEm)
          : "-"}
      </td>

      <td>
        ${emp.prazoEntrega
          ? formatar(emp.prazoEntrega)
          : "-"}
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

// async function carregar() {

//  EMPRESTIMOS =
//   await listarTodosEmprestimos();

//   tbody.innerHTML = "";

//   EMPRESTIMOS.forEach(emp => {

//     let status =
//       "Em andamento";

//     let statusClass =
//       "active";

//     const hoje =
//       new Date();

//     const prazo =
//       emp.prazoEntrega.toDate();

//     if (hoje > prazo) {

//       status =
//         "Atrasado";

//       statusClass =
//         "delayed";
//     }

//     const tr =
//       document.createElement("tr");

//     tr.innerHTML = `

    

//   <td>${emp.nomeUsuario}</td>

//   <td>${emp.turma || "-"}</td>

//   <td>${emp.tituloLivro}</td>

//   <td>${formatar(emp.retiradoEm)}</td>

//   <td>${formatar(emp.prazoEntrega)}</td>

//   <td>

//     <span class="status ${statusClass}">
//       ${status}
//     </span>

//   </td>
// `;

//     tbody.appendChild(tr);
//   });
// }

async function carregar() {

  EMPRESTIMOS =
    await listarTodosEmprestimos();

  renderTabela(EMPRESTIMOS);

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
  .getElementById("searchInput")
  .addEventListener("input", (e) => {

    const texto =
      e.target.value.toLowerCase();

    const filtrados =
      EMPRESTIMOS.filter(emp =>

        emp.nomeUsuario
          ?.toLowerCase()
          .includes(texto)

        ||

        emp.tituloLivro
          ?.toLowerCase()
          .includes(texto)

        ||

        emp.turma
          ?.toLowerCase()
          .includes(texto)

      );

    renderTabela(filtrados);

  });



document
  .getElementById("btnDevolucao")
  .addEventListener("click", () => {

    window.location.href =
      "./devolucao.html";
  });