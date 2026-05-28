/* ============================================================
   relatorio.js — Biblioteca Escolar
   ============================================================ */

// ------------------------------------------------------------------
// DADOS SIMULADOS
// ------------------------------------------------------------------
const livrosRanking = {
  labels: [
    "Dom Casmurro",
    "O Pequeno Príncipe",
    "Capitães da Areia",
    "Harry Potter",
    "A Menina que Roubava Livros"
  ],
  counts: [25, 18, 15, 12, 8]
};

const historico = [
  {
    aluno: "Maria Oliveira",
    livro: "Dom Casmurro",
    retirada: "10/05/2026",
    devolucao: "17/05/2026",
    status: "Atrasado"
  },
  {
    aluno: "João Pereira",
    livro: "Capitães da Areia",
    retirada: "12/05/2026",
    devolucao: "19/05/2026",
    status: "Em andamento"
  },
  {
    aluno: "Ana Souza",
    livro: "O Pequeno Príncipe",
    retirada: "08/05/2026",
    devolucao: "15/05/2026",
    status: "Devolvido"
  },
  {
    aluno: "Lucas Mendes",
    livro: "Harry Potter",
    retirada: "05/05/2026",
    devolucao: "12/05/2026",
    status: "Devolvido"
  },
  {
    aluno: "Beatriz Lima",
    livro: "A Menina que Roubava Livros",
    retirada: "15/05/2026",
    devolucao: "22/05/2026",
    status: "Atrasado"
  }
];

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

/** Retorna a classe CSS do badge de acordo com o status */
function badgeClass(status) {
  const map = {
    "Atrasado":     "badge badge-atrasado",
    "Em andamento": "badge badge-andamento",
    "Devolvido":    "badge badge-devolvido"
  };
  return map[status] || "badge";
}

/** Anima um número do zero até o valor final */
function animarNumero(el, final, duracaoMs = 800) {
  const inicio = performance.now();
  function atualizar(agora) {
    const progresso = Math.min((agora - inicio) / duracaoMs, 1);
    // easing suave
    const ease = 1 - Math.pow(1 - progresso, 3);
    el.textContent = Math.round(ease * final);
    if (progresso < 1) requestAnimationFrame(atualizar);
  }
  requestAnimationFrame(atualizar);
}

// ------------------------------------------------------------------
// KPIs
// ------------------------------------------------------------------
function popularKPIs() {
  const total     = historico.length;
  const atrasados = historico.filter(l => l.status === "Atrasado").length;
  const devolvidos= historico.filter(l => l.status === "Devolvido").length;
  const andamento = historico.filter(l => l.status === "Em andamento").length;

  animarNumero(document.getElementById("kpiTotal"),     total);
  animarNumero(document.getElementById("kpiAtrasos"),   atrasados);
  animarNumero(document.getElementById("kpiDevolvidos"),devolvidos);
  animarNumero(document.getElementById("kpiAndamento"), andamento);
}

// ------------------------------------------------------------------
// TABELA — HISTÓRICO
// ------------------------------------------------------------------
function popularHistorico() {
  const tbody = document.getElementById("tabelaHistorico");

  historico.forEach(l => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.aluno}</td>
      <td>${l.livro}</td>
      <td>${l.retirada}</td>
      <td>${l.devolucao}</td>
      <td><span class="${badgeClass(l.status)}">${l.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("tagHistorico").textContent =
    `${historico.length} registros`;
}

// ------------------------------------------------------------------
// TABELA — ATRASOS
// ------------------------------------------------------------------
function popularAtrasos() {
  const tbody   = document.getElementById("tabelaAtrasos");
  const atrasos = historico.filter(l => l.status === "Atrasado");

  if (atrasos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color: var(--ink-muted); padding:24px;">
          Nenhum atraso registrado 🎉
        </td>
      </tr>`;
  } else {
    atrasos.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.aluno}</td>
        <td>${l.livro}</td>
        <td>${l.devolucao}</td>
        <td><span class="${badgeClass(l.status)}">${l.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById("tagAtrasos").textContent =
    `${atrasos.length} pendente${atrasos.length !== 1 ? "s" : ""}`;
}

// ------------------------------------------------------------------
// GRÁFICO DE RANKING
// ------------------------------------------------------------------
function iniciarGrafico() {
  const ctx = document.getElementById("graficoRanking").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: livrosRanking.labels,
      datasets: [{
        label: "Empréstimos",
        data: livrosRanking.counts,
        backgroundColor: [
          "rgba(30,58,138,.85)",
          "rgba(30,58,138,.70)",
          "rgba(30,58,138,.55)",
          "rgba(199,169,79,.85)",
          "rgba(199,169,79,.65)"
        ],
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0A0F1C",
          titleFont: { family: "'Playfair Display', serif", size: 13 },
          bodyFont:  { family: "'DM Sans', sans-serif",    size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} empréstimos`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'DM Sans', sans-serif", size: 12 },
            color: "#334155",
            maxRotation: 25
          }
        },
        y: {
          grid: { color: "#E2E8F0" },
          ticks: {
            font: { family: "'DM Sans', sans-serif", size: 12 },
            color: "#94A3B8",
            stepSize: 5
          },
          beginAtZero: true
        }
      }
    }
  });
}

// ------------------------------------------------------------------
// EXPORTAÇÕES
// ------------------------------------------------------------------
document.getElementById("btnPDF").addEventListener("click", () => {
  alert("📄 Funcionalidade de exportar PDF será integrada em breve!");
});

document.getElementById("btnExcel").addEventListener("click", () => {
  alert("📊 Funcionalidade de exportar Excel será integrada em breve!");
});

// ------------------------------------------------------------------
// INIT
// ------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  popularKPIs();
  popularHistorico();
  popularAtrasos();
  iniciarGrafico();
});