import EmprestimoService from "../firebase/services/EmprestimoService.js";

window.PageGuard?.hold();

let emprestimos = [];
let grafico;

function dataParaDate(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === "function") return valor.toDate();
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarData(valor) {
  const data = dataParaDate(valor);
  return data ? new Intl.DateTimeFormat("pt-BR").format(data) : "—";
}

function estaAtrasado(emprestimo) {
  const prazo = dataParaDate(emprestimo.prazoEntrega);
  return emprestimo.status === "EMPRESTADO" && prazo && prazo < new Date();
}

function statusExibicao(emprestimo) {
  if (estaAtrasado(emprestimo)) return "Atrasado";
  return emprestimo.status === "DEVOLVIDO" ? "Devolvido" : "Em andamento";
}

// Atualizado para usar as classes de cores do DaisyUI
function classeStatus(status) {
  return {
    "Atrasado": "badge badge-error text-white",
    "Devolvido": "badge badge-success text-white",
    "Em andamento": "badge badge-info text-white"
  }[status] || "badge";
}

function criarCelula(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

function criarLinhaHistorico(emprestimo) {
  const tr = document.createElement("tr");
  const status = statusExibicao(emprestimo);
  
  tr.append(
    criarCelula(emprestimo.nomeUsuario || "Não informado"),
    criarCelula(emprestimo.tituloLivro || "Sem título"),
    criarCelula(formatarData(emprestimo.retiradoEm || emprestimo.criadoEm)),
    criarCelula(formatarData(emprestimo.devolvidoEm || emprestimo.prazoEntrega))
  );
  
  const statusTd = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = classeStatus(status);
  badge.textContent = status;
  statusTd.appendChild(badge);
  
  tr.appendChild(statusTd);
  return tr;
}

function preencherTabelas() {
  const historico = document.getElementById("tabelaHistorico");
  const atrasos = document.getElementById("tabelaAtrasos");
  
  // Preencher Tabela de Histórico
  historico.replaceChildren(...emprestimos.map(criarLinhaHistorico));

  // Preencher Tabela de Atrasos
  const pendentes = emprestimos.filter(estaAtrasado);
  atrasos.replaceChildren();
  
  if (!pendentes.length) {
    const linha = document.createElement("tr");
    const celula = criarCelula("Nenhum atraso registrado");
    celula.colSpan = 4;
    celula.className = "text-center text-base-content/50 py-4";
    linha.appendChild(celula);
    atrasos.appendChild(linha);
  } else {
    pendentes.forEach((emprestimo) => {
      const linha = document.createElement("tr");
      linha.append(
        criarCelula(emprestimo.nomeUsuario || "Não informado"),
        criarCelula(emprestimo.tituloLivro || "Sem título"),
        criarCelula(formatarData(emprestimo.prazoEntrega)),
        criarCelula("Atrasado")
      );
      
      // Aplicando cor vermelha direto na linha ou célula se desejar (opcional)
      linha.lastChild.className = "text-error font-semibold";
      atrasos.appendChild(linha);
    });
  }

  // Atualizar contadores das Badges (Tags) dos cards
  document.getElementById("tagHistorico").textContent = `${emprestimos.length} registros`;
  document.getElementById("tagAtrasos").textContent = `${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"}`;
}

function montarGrafico() {
  const contagem = emprestimos.reduce((acumulador, emprestimo) => {
    const titulo = emprestimo.tituloLivro || "Sem título";
    acumulador[titulo] = (acumulador[titulo] || 0) + 1;
    return acumulador;
  }, {});
  
  const ranking = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  if (grafico) grafico.destroy();
  
  grafico = new Chart(document.getElementById("graficoRanking"), {
    type: "bar",
    data: { 
      labels: ranking.map(([titulo]) => titulo), 
      datasets: [{ 
        label: "Empréstimos", 
        data: ranking.map(([, quantidade]) => quantidade), 
        backgroundColor: "rgba(37, 99, 235, 0.8)", // Azul similar ao DaisyUI primary
        borderRadius: 8, 
        borderSkipped: false 
      }] 
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      plugins: { legend: { display: false } }, 
      scales: { 
        y: { beginAtZero: true, ticks: { precision: 0 } }, 
        x: { grid: { display: false } } 
      } 
    }
  });
}

function exportarCsv() {
  const cabecalho = ["Aluno", "Livro", "Retirada", "Devolução/Prazo", "Status"];
  const linhas = emprestimos.map((item) => [
    item.nomeUsuario || "", 
    item.tituloLivro || "", 
    formatarData(item.retiradoEm || item.criadoEm), 
    formatarData(item.devolvidoEm || item.prazoEntrega), 
    statusExibicao(item)
  ]);
  
  const csv = [cabecalho, ...linhas].map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio-emprestimos.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function iniciar() {
  try {
    emprestimos = await EmprestimoService.listarTodos();
    preencherTabelas();
    montarGrafico();
  } catch (erro) {
    console.error("Erro ao carregar relatórios:", erro);
    window.showAppMessage?.("Não foi possível carregar os dados dos relatórios.");
  } finally {
    window.PageGuard?.ready();
  }
}

// Listeners
document.getElementById("btnPDF").addEventListener("click", () => window.print());
document.getElementById("btnExcel").addEventListener("click", exportarCsv);
document.addEventListener("DOMContentLoaded", iniciar);