
    // Simulação de dados do usuário e histórico
    const usuario = {
      nome: "Maria Oliveira",
      matricula: "20260045",
      turma: "2º Ano A",
      historico: [
        { livro: "Dom Casmurro", retirada: "10/05/2026", devolucao: "17/05/2026", status: "Atrasado" },
        { livro: "Capitães da Areia", retirada: "12/05/2026", devolucao: "19/05/2026", status: "Em andamento" },
        { livro: "O Pequeno Príncipe", retirada: "08/05/2026", devolucao: "15/05/2026", status: "Devolvido" }
      ],
      notificacoes: [
        "Livro 'Dom Casmurro' está atrasado!",
        "Prazo para 'Capitães da Areia' vence amanhã."
      ]
    };

    // Preencher histórico
    const historicoDiv = document.getElementById("historicoLeituras");
    usuario.historico.forEach(l => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<strong>${l.livro}</strong> Retirado em ${l.retirada} • Devolver até ${l.devolucao} • Status: ${l.status}`;
      historicoDiv.appendChild(div);
    });

    // Preencher notificações
    const notifDiv = document.getElementById("notificacoes");
    usuario.notificacoes.forEach(n => {
      const div = document.createElement("div");
      div.className = "notif";
      div.innerText = n;
      notifDiv.appendChild(div);
    });

    // Alterar senha (simulação)
    document.getElementById("btnAlterarSenha").addEventListener("click", () => {
      const novaSenha = document.getElementById("novaSenha").value;
      if(novaSenha.length < 4) { alert("Senha muito curta!"); return; }
      // Salvar localStorage (simulado)
      localStorage.setItem("senhaUsuario", novaSenha);
      alert("Senha alterada com sucesso!");
      document.getElementById("novaSenha").value = "";
    });
  