 // Simulação de usuários e logs
    const usuarios = [
      { nome:"Maria Oliveira", tipo:"Aluno" },
      { nome:"João Pereira", tipo:"Aluno" },
      { nome:"Ana Souza", tipo:"Bibliotecário" }
    ];

    const logs = [
      { hora:"19/05/2026 10:12", acao:"Maria Oliveira retirou 'Dom Casmurro'" },
      { hora:"19/05/2026 11:05", acao:"João Pereira devolveu 'Capitães da Areia'" },
      { hora:"19/05/2026 12:30", acao:"Ana Souza alterou regras de empréstimo" }
    ];

    // Preencher tabela de usuários
    const tbodyUsuarios = document.getElementById("tabelaUsuarios");
    usuarios.forEach(u=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${u.nome}</td><td>${u.tipo}</td><td><button class="btn" onclick="window.showAppMessage?.('Editar permissões de ${u.nome}')">Editar</button></td>`;
      tbodyUsuarios.appendChild(tr);
    });

    // Preencher log de atividades
    const tbodyLogs = document.getElementById("tabelaLogs");
    function renderLogs(){
      tbodyLogs.innerHTML = "";
      logs.forEach(l=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${l.hora}</td><td>${l.acao}</td>`;
        tbodyLogs.appendChild(tr);
      });
    }
    renderLogs();

    // Botões
    document.getElementById("btnSalvarRegras").addEventListener("click", ()=>{
      const dias = document.getElementById("diasEmprestimo").value;
      const max = document.getElementById("maxLivros").value;
      localStorage.setItem("regrasBiblioteca", JSON.stringify({diasEmprestimo:dias,maxLivros:max}));
      window.showAppMessage?.("Regras salvas com sucesso!");
      logs.push({hora:new Date().toLocaleString(), acao:`Regras alteradas: ${dias} dias, ${max} livros`});
      renderLogs();
    });

    document.getElementById("btnBackup").addEventListener("click", ()=>{
      window.showAppMessage?.("Backup realizado com sucesso!");
      logs.push({hora:new Date().toLocaleString(), acao:"Backup automático executado"});
      renderLogs();
    });