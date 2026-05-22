 
    // IR PARA DEVOLUÇÃO

    document
      .getElementById("btnDevolucao")
      .addEventListener("click", () => {

        window.location.href = "./devolucao.html";

      });

    // PEGAR DEVOLUÇÃO DO LOCALSTORAGE

    const dadosSalvos =
      localStorage.getItem("ultimaDevolucao");

    if (dadosSalvos) {

      const dados = JSON.parse(dadosSalvos);

      const tbody = document.querySelector("tbody");

      const tr = document.createElement("tr");

      let statusClass = "returned";

      if (dados.status === "Atrasado") statusClass = "delayed";
      if (dados.status === "Em andamento") statusClass = "active";

      tr.innerHTML = `
        <td>${dados.aluno}</td>
        <td>${dados.livro}</td>
        <td>${dados.retirada}</td>
        <td>${dados.devolucao}</td>
        <td><span class="status ${statusClass}">${dados.status}</span></td>
      `;

      tbody.prepend(tr);

      localStorage.removeItem("ultimaDevolucao");

    }