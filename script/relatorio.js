 
  
    // Dados simulados
    const livrosRanking = {
      labels: ["Dom Casmurro", "O Pequeno Príncipe", "Capitães da Areia", "Harry Potter", "A Menina que Roubava Livros"],
      counts: [25, 18, 15, 12, 8]
    };

    const historico = [
      { aluno:"Maria Oliveira", livro:"Dom Casmurro", retirada:"10/05/2026", devolucao:"17/05/2026", status:"Atrasado" },
      { aluno:"João Pereira", livro:"Capitães da Areia", retirada:"12/05/2026", devolucao:"19/05/2026", status:"Em andamento" },
      { aluno:"Ana Souza", livro:"O Pequeno Príncipe", retirada:"08/05/2026", devolucao:"15/05/2026", status:"Devolvido" }
    ];

    // Preencher histórico de empréstimos
    const tbodyHistorico = document.getElementById("tabelaHistorico");
    historico.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${l.aluno}</td><td>${l.livro}</td><td>${l.retirada}</td><td>${l.devolucao}</td><td>${l.status}</td>`;
      tbodyHistorico.appendChild(tr);
    });

    // Preencher relatório de atrasos
    const tbodyAtrasos = document.getElementById("tabelaAtrasos");
    historico.filter(l=>l.status==="Atrasado").forEach(l=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${l.aluno}</td><td>${l.livro}</td><td>${l.devolucao}</td><td>${l.status}</td>`;
      tbodyAtrasos.appendChild(tr);
    });

    // Gráfico ranking
    const ctx = document.getElementById('graficoRanking').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: livrosRanking.labels,
        datasets: [{
          label: 'Número de Empréstimos',
          data: livrosRanking.counts,
          backgroundColor: '#2563EB'
        }]
      },
      options: { responsive:true, plugins:{ legend:{ display:false } } }
    });

    // Exportações (simuladas)
    document.getElementById("btnPDF").addEventListener("click",()=>{ alert("Exportar PDF!"); });
    document.getElementById("btnExcel").addEventListener("click",()=>{ alert("Exportar Excel!"); });

  