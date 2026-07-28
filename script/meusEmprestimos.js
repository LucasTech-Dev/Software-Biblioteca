import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "../firebase/auth.js";
import { db } from "../firebase/firestore.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import UsuarioService from "../firebase/services/UsuarioService.js";
import ResumoService from "../firebase/services/ResumoService.js";

// Estado global da página
let RESERVAS = [];
let EMPRESTIMOS = [];
let MAPA_RESUMOS = new Map(); // Guarda resumos por emprestimoId
let filtroAtivo = "todos";
let termoBusca = "";
let alunoAtual = null;
let itemSelecionadoParaResumo = null;

// ========================================
// INICIALIZAÇÃO E AUTENTICAÇÃO
// ========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    alunoAtual = user;
    window.PageGuard?.hold();

    try {
        await preencherPerfilUsuario(user);
        await carregarDadosAluno(user.uid);
        
        configurarFiltros();
        configurarBusca();
        configurarBotaoApagar();
        configurarModalResumo();
    } catch (error) {
        console.error("Erro ao inicializar página:", error);
    } finally {
        window.PageGuard?.ready();
    }
});

// ========================================
// FUNÇÕES AUXILIARES DE TRATAMENTO DE DATAS
// ========================================
function formatarData(valor) {
    if (!valor) return null;
    try {
        let dateObj = null;

        if (typeof valor === "object" && typeof valor.toDate === "function") {
            dateObj = valor.toDate();
        } else if (typeof valor === "object" && valor.seconds) {
            dateObj = new Date(valor.seconds * 1000);
        } else if (typeof valor === "string" || typeof valor === "number") {
            if (typeof valor === "string" && valor.includes("-") && valor.length === 10) {
                const [ano, mes, dia] = valor.split("-");
                return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
            }
            dateObj = new Date(valor);
        }

        if (dateObj && !isNaN(dateObj.getTime())) {
            const dia = String(dateObj.getDate()).padStart(2, '0');
            const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
            const ano = dateObj.getFullYear();
            return `${dia}/${mes}/${ano}`;
        }
    } catch (e) {
        console.warn("Erro ao formatar data:", e);
    }
    return String(valor);
}

function obterDataRetirada(item) {
    const val = item.retiradoEm || item.dataRetirada || item.dataEmprestimo || item.dataSolicitacao || item.dataInicio || item.data_emprestimo;
    return formatarData(val) || "-";
}

function obterDataEntrega(item) {
    const val = item.prazoEntrega || item.dataEntrega || item.dataDevolucao || item.dataDevolucaoPrevista || item.dataPrevista || item.dataVencimento || item.devolvidoEm || item.data_devolucao || item.data_prevista;
    return formatarData(val) || "-";
}

function verificarSeEstaAtrasado(item) {
    const status = (item.status || "").toUpperCase();
    if (status === "ATRASADO" || status === "ATRASO") return true;

    if (status === "EMPRESTADO" || status === "ATIVO") {
        const valDevolucao = item.prazoEntrega || item.dataEntrega || item.dataDevolucao || item.dataDevolucaoPrevista || item.dataPrevista || item.dataVencimento || item.data_devolucao || item.data_prevista;
        if (!valDevolucao) return false;

        let dateDev = null;
        if (typeof valDevolucao === "object" && typeof valDevolucao.toDate === "function") {
            dateDev = valDevolucao.toDate();
        } else if (typeof valDevolucao === "object" && valDevolucao.seconds) {
            dateDev = new Date(valDevolucao.seconds * 1000);
        } else if (typeof valDevolucao === "string") {
            if (valDevolucao.includes("-") && valDevolucao.length === 10) {
                const [ano, mes, dia] = valDevolucao.split("-").map(Number);
                dateDev = new Date(ano, mes - 1, dia, 23, 59, 59);
            } else {
                dateDev = new Date(valDevolucao);
            }
        }

        if (dateDev && !isNaN(dateDev.getTime())) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            return dateDev < hoje;
        }
    }
    return false;
}

// ========================================
// PERFIL DO USUÁRIO
// ========================================
async function preencherPerfilUsuario(user) {
    let nomeExibicao = user.displayName || user.email?.split("@")[0] || "Aluno";
    let subInfo = user.email || "Biblioteca Escolar";

    try {
        const usuario = await UsuarioService.obterUsuario(user.uid);
        if (usuario) {
            if (usuario.nome || usuario.nomeUsuario) {
                nomeExibicao = usuario.nome || usuario.nomeUsuario;
            }
            if (usuario.turma || usuario.serie) {
                subInfo = `Turma: ${usuario.turma || usuario.serie}`;
            }
        }
    } catch (e) {
        console.warn("Erro ao buscar dados do perfil:", e);
    }

    const elNome = document.getElementById("nomeUsuario");
    if (elNome) elNome.textContent = nomeExibicao;

    const elDados = document.getElementById("dadosUsuario");
    if (elDados) elDados.textContent = subInfo;

    const elAvatar = document.getElementById("avatarUsuario");
    if (elAvatar) {
        const iniciais = nomeExibicao
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(n => n[0].toUpperCase())
            .join("") || "AL";
        elAvatar.textContent = iniciais;
    }
}

// ========================================
// CARREGAMENTO DOS DADOS (FIRESTORE)
// ========================================
async function carregarDadosAluno(uid) {
    try {
        // Reservas e Empréstimos
        let snapReservas = await getDocs(query(collection(db, "reservas"), where("usuarioId", "==", uid)));
        if (snapReservas.empty) {
            snapReservas = await getDocs(query(collection(db, "reservas"), where("alunoId", "==", uid)));
        }

        let snapEmprestimos = await getDocs(query(collection(db, "emprestimos"), where("usuarioId", "==", uid)));
        if (snapEmprestimos.empty) {
            snapEmprestimos = await getDocs(query(collection(db, "emprestimos"), where("alunoId", "==", uid)));
        }

        RESERVAS = snapReservas.docs
            .map(doc => ({ id: doc.id, tipoItem: "reserva", ...doc.data() }))
            .filter(r => r.visivelAluno !== false);

        EMPRESTIMOS = snapEmprestimos.docs
            .map(doc => ({ id: doc.id, tipoItem: "emprestimo", ...doc.data() }))
            .filter(e => e.visivelAluno !== false);

        // Busca os resumos já enviados pelo aluno
        const listaResumos = await ResumoService.obterResumosPorAluno(uid);
        MAPA_RESUMOS.clear();
        listaResumos.forEach(resumo => {
            if (resumo.emprestimoId) {
                MAPA_RESUMOS.set(resumo.emprestimoId, resumo);
            }
        });

        renderizarLista();
    } catch (error) {
        console.error("Erro ao carregar empréstimos/reservas:", error);
        renderizarLista();
    }
}

// ========================================
// FILTROS E RENDERIZAÇÃO DE CARDS
// ========================================
function obterItensFiltrados() {
    const f = (filtroAtivo || "todos").toLowerCase();

    const mapItens = new Map();
    [...RESERVAS, ...EMPRESTIMOS].forEach(item => {
        mapItens.set(item.id, item);
    });
    const todosItens = Array.from(mapItens.values());

    let lista = [];

    if (f.includes("analise") || f.includes("análise") || f.includes("reserva")) {
        lista = todosItens.filter(item => {
            const st = (item.status || "").toUpperCase();
            return st === "PENDENTE" || st === "EM_ANALISE" || st === "EM ANALISE" || st === "SOLICITADO" || st === "RESERVADO";
        });
    } else if (f.includes("retirada") || f.includes("ativo")) {
        lista = todosItens.filter(item => {
            const st = (item.status || "").toUpperCase();
            const atrasado = verificarSeEstaAtrasado(item);
            return (st === "EMPRESTADO" || st === "ATIVO") && !atrasado;
        });
    } else if (f.includes("devolvido") || f.includes("conclu")) {
        lista = todosItens.filter(item => {
            const st = (item.status || "").toUpperCase();
            return st === "DEVOLVIDO" || st === "CONCLUIDO" || st === "CONCLUÍDO";
        });
    } else if (f.includes("atrasad")) {
        lista = todosItens.filter(item => verificarSeEstaAtrasado(item));
    } else {
        lista = todosItens;
    }

    if (termoBusca) {
        lista = lista.filter(item => {
            const titulo = (item.titulo || item.tituloLivro || item.livroTitulo || item.nomeLivro || (item.livro && item.livro.titulo) || "").toLowerCase();
            return titulo.includes(termoBusca);
        });
    }

    return lista;
}

function atualizarTextoBotaoApagar() {
    const btnApagar = document.getElementById("btnApagar");
    const chipAtivo = document.querySelector(".filters .chip.active");
    
    if (btnApagar && chipAtivo) {
        const nomeFiltro = chipAtivo.textContent.trim();
        btnApagar.innerHTML = `🗑️ Apagar ${nomeFiltro}`;
    }
}

function renderizarLista() {
    const container = document.getElementById("loan-list");
    const btnApagar = document.getElementById("btnApagar");

    if (!container) return;

    container.innerHTML = "";
    const itens = obterItensFiltrados();

    atualizarTextoBotaoApagar();

    if (btnApagar) {
        btnApagar.style.display = itens.length > 0 ? "inline-flex" : "none";
    }

    if (itens.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 32px; color: #666; width: 100%;">
                <p style="font-size: 15px; margin: 0;">Nenhum registro encontrado nesta categoria.</p>
            </div>
        `;
        return;
    }

    itens.forEach(item => {
        const card = document.createElement("div");
        card.className = "loan-card";

        const titulo = item.titulo || item.tituloLivro || item.livroTitulo || item.nomeLivro || (item.livro && item.livro.titulo) || "Livro sem título";
        
        const estaAtrasado = verificarSeEstaAtrasado(item);
        let status = (item.status || "PENDENTE").toUpperCase();
        if (estaAtrasado && status !== "DEVOLVIDO" && status !== "CONCLUIDO") {
            status = "ATRASADO";
        }

        const dataRetirada = obterDataRetirada(item);
        const dataDevolucao = obterDataEntrega(item);
        const tipoLabel = item.tipoItem === "reserva" ? "Reserva" : "Empréstimo";

        // Lógica visual do Resumo
        const podeResumir = status === "DEVOLVIDO" || status === "CONCLUIDO" || status === "EMPRESTADO" || status === "ATIVO";
        const resumoExistente = MAPA_RESUMOS.get(item.id);

        let blocoResumoHTML = "";

        if (resumoExistente) {
            if (resumoExistente.status === "aprovado") {
                blocoResumoHTML = `
                    <div style="margin-top: 12px; padding: 6px 12px; background: #D1FAE5; color: #065F46; border-radius: 6px; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;">
                        🎉 Resumo Aprovado! (+1 Moeda)
                    </div>`;
            } else {
                blocoResumoHTML = `
                    <div style="margin-top: 12px; padding: 6px 12px; background: #FEF3C7; color: #92400E; border-radius: 6px; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;">
                        ⏳ Resumo em Análise
                    </div>`;
            }
        } else if (podeResumir) {
            blocoResumoHTML = `
                <button class="btn-resumo" data-id="${item.id}" style="margin-top: 10px; padding: 6px 12px; background: #3B82F6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                    ✍️ Enviar Resumo
                </button>`;
        }

        card.innerHTML = `
            <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #3B82F6; background: #EFF6FF; padding: 2px 8px; border-radius: 4px;">
                            ${tipoLabel}
                        </span>
                        <h3 style="margin: 8px 0 4px 0; font-size: 17px; color: #1E293B;">${titulo}</h3>
                    </div>
                    <span class="status-tag status-${status.toLowerCase()}" style="padding: 4px 10px; border-radius: 20px; font-size: 12px;">
                        ${status}
                    </span>
                </div>
                <div style="display: flex; gap: 16px; font-size: 13px; color: #475569; margin-top: 10px; border-top: 1px solid #F1F5F9; padding-top: 8px;">
                    <div><strong>Retirada:</strong> ${dataRetirada}</div>
                    <div><strong>Entrega:</strong> ${dataDevolucao}</div>
                </div>
                ${blocoResumoHTML}
            </div>
        `;

        container.appendChild(card);
    });

    container.querySelectorAll(".btn-resumo").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const item = itens.find(i => i.id === id);
            if (item) {
                abrirModalResumo(item);
            }
        });
    });
}

// ========================================
// AÇÃO DO BOTÃO APAGAR
// ========================================
function configurarBotaoApagar() {
    const btnApagar = document.getElementById("btnApagar");
    if (!btnApagar) return;

    btnApagar.addEventListener("click", async () => {
        const itensVisiveis = obterItensFiltrados();

        if (itensVisiveis.length === 0) {
            alert("Não há registros visíveis para apagar nesta aba.");
            return;
        }

        const chipAtivo = document.querySelector(".filters .chip.active");
        const nomeFiltro = chipAtivo ? chipAtivo.textContent.trim() : "categoria";

        const confirmacao = window.confirm(`Deseja ocultar os ${itensVisiveis.length} registros da aba "${nomeFiltro}"?`);
        if (!confirmacao) return;

        try {
            const user = auth.currentUser;
            const idsReservas = itensVisiveis.filter(i => i.tipoItem === "reserva").map(r => r.id);
            const idsEmprestimos = itensVisiveis.filter(i => i.tipoItem === "emprestimo").map(e => e.id);

            const promessas = [];
            if (idsReservas.length > 0) promessas.push(UsuarioService.ocultarReservas(user.uid, idsReservas));
            if (idsEmprestimos.length > 0) promessas.push(UsuarioService.ocultarEmprestimos(user.uid, idsEmprestimos));

            await Promise.all(promessas);

            RESERVAS = RESERVAS.filter(r => !idsReservas.includes(r.id));
            EMPRESTIMOS = EMPRESTIMOS.filter(e => !idsEmprestimos.includes(e.id));

            renderizarLista();
            alert("Registros ocultados com sucesso!");
        } catch (error) {
            console.error("Erro ao apagar histórico:", error);
            alert("Ocorreu um erro ao tentar apagar os registros.");
        }
    });
}

// ========================================
// MODAL DE RESUMO
// ========================================
function abrirModalResumo(item) {
    itemSelecionadoParaResumo = item;
    const modal = document.getElementById("modalResumoAluno");
    const elTitulo = document.getElementById("resumoLivroTitulo");
    const txtResumo = document.getElementById("txtResumoAluno");

    const titulo = item.titulo || item.tituloLivro || item.livroTitulo || item.nomeLivro || "Livro";
    if (elTitulo) elTitulo.textContent = titulo;
    if (txtResumo) txtResumo.value = "";

    if (modal) {
        modal.style.display = "flex";
        modal.classList.add("active", "show", "open");
    }
}

function fecharModalResumo() {
    const modal = document.getElementById("modalResumoAluno");
    if (modal) {
        modal.style.display = "none";
        modal.classList.remove("active", "show", "open");
    }
    itemSelecionadoParaResumo = null;
}

function configurarModalResumo() {
    const modal = document.getElementById("modalResumoAluno");
    const btnCancelar = document.getElementById("btnCancelarResumo");
    const btnEnviar = document.getElementById("btnEnviarResumo");

    if (btnCancelar) {
        btnCancelar.onclick = fecharModalResumo;
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) fecharModalResumo();
        });
    }

    if (btnEnviar) {
        btnEnviar.onclick = async () => {
            const txtResumo = document.getElementById("txtResumoAluno");
            const resumoTexto = txtResumo?.value.trim();

            if (!resumoTexto) {
                alert("Escreva o seu resumo antes de enviar.");
                return;
            }

            if (!itemSelecionadoParaResumo || !alunoAtual) {
                alert("Não foi possível identificar o livro ou usuário.");
                return;
            }

            try {
                btnEnviar.disabled = true;
                btnEnviar.textContent = "Enviando...";

                const tituloLivro = itemSelecionadoParaResumo.titulo || itemSelecionadoParaResumo.tituloLivro || itemSelecionadoParaResumo.livroTitulo || "Livro";

                await ResumoService.enviarResumo({
                    emprestimoId: itemSelecionadoParaResumo.id,
                    alunoId: alunoAtual.uid,
                    alunoNome: alunoAtual.displayName || "Aluno",
                    tituloLivro: tituloLivro,
                    resumo: resumoTexto
                });

                // Atualiza localmente para refletir imediatamente como "Em Análise"
                MAPA_RESUMOS.set(itemSelecionadoParaResumo.id, {
                    emprestimoId: itemSelecionadoParaResumo.id,
                    status: "aguardando"
                });

                alert("Resumo enviado com sucesso! 🎉");
                fecharModalResumo();
                renderizarLista();
            } catch (err) {
                console.error("Erro ao enviar resumo:", err);
                alert(err.message || "Erro ao enviar o resumo. Tente novamente.");
            } finally {
                btnEnviar.disabled = false;
                btnEnviar.textContent = "Enviar Resumo";
            }
        };
    }
}

// ========================================
// EVENTOS DE BUSCA E FILTROS
// ========================================
function configurarFiltros() {
    const chips = document.querySelectorAll(".filters .chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            filtroAtivo = chip.dataset.filter || chip.textContent.trim().toLowerCase();
            renderizarLista();
        });
    });
}

function configurarBusca() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            termoBusca = e.target.value.toLowerCase().trim();
            renderizarLista();
        });
    }
}


// ========================================
// NAVEGAÇÃO E ATUALIZAÇÃO DA PÁGINA
// ========================================

// 1. Botão de Voltar
const btnVoltar = document.getElementById("btnVoltar");
if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
        // Redireciona para a página inicial do aluno. 
        // OBS: Confirme se o nome do arquivo da sua tela inicial é esse mesmo.
        window.location.href = "../pages/indexTelaAluno.html"; 
    });
}

// 2. Botão de Atualizar
const btnAtualizar = document.getElementById("btnAtualizar");
if (btnAtualizar) {
    btnAtualizar.addEventListener("click", () => {
        // Recarrega a página atual completamente
        window.location.reload();
    });
}