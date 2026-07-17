import LivroService from "../firebase/services/LivroService.js";
import SupabaseLivroService from "../firebase/services/SupabaseLivroService.js";

window.PageGuard?.hold();

let livroLocalizado = null;

window.onload = () => {
  window.PageGuard?.ready();
};

/* ============================================== */
/* FLUXO PRINCIPAL: ADICIONAR / VERIFICAR LIVRO   */
/* ============================================== */
window.adicionarLivro = async () => {
  const titulo = document.getElementById('add-titulo')?.value.trim();
  const isbn = document.getElementById('add-isbn')?.value.trim();

  if (!titulo && !isbn) {
    window.showAppMessage?.('Por favor, informe ao menos o Título ou o ISBN para prosseguir!');
    return;
  }

  try {
    window.showAppMessage?.('Consultando banco de dados global...');
    let resultado = null;

    // 1. Tentar buscar por ISBN (prioridade por ser chave única)
    if (isbn) {
      try {
        resultado = await SupabaseLivroService.buscarPorISBN(isbn);
      } catch (e) {
        resultado = null;
      }
    }

    // 2. Se não achou por ISBN e temos título, tentar por título aproximado
    if (!resultado && titulo) {
      try {
        const resultadosTitulo = await SupabaseLivroService.buscarPorTitulo(titulo);
        if (resultadosTitulo && resultadosTitulo.length > 0) {
          // Pega o primeiro resultado exato ou mais próximo relevante
          resultado = resultadosTitulo[0];
        }
      } catch (e) {
        resultado = null;
      }
    }

    if (resultado) {
      // CASO 1: Livro encontrado no Supabase -> Abrir modal de quantidades direto
      livroLocalizado = resultado;
      abrirModalQuantidade(resultado);
    } else {
      // CASO 2: Livro não localizado -> Abrir modal de criação no Supabase + Quantidades
      abrirModalCriarNoSupabase(titulo, isbn);
    }

  } catch (error) {
    console.error("Erro no fluxo de verificação:", error);
    window.showAppMessage?.('Erro ao processar a verificação do livro.');
  }
};

/* ============================================== */
/* MODAL 1: LIVRO ENCONTRADO (QUANTIDADE)         */
/* ============================================== */
function abrirModalQuantidade(livro) {
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  modalTitle.textContent = "Adicionar Exemplares ao Acervo";

  const autorDisplay = Array.isArray(livro.autores) ? livro.autores.join(', ') : (livro.autores || 'Autor desconhecido');
  const capaUrl = livro.capa || `https://covers.openlibrary.org/b/isbn/${livro.isbn}-L.jpg?default=false`;
  const cor = livro.cor || '#E8EDFF';
  const emoji = livro.emoji || '📖';

  modalBody.innerHTML = `
    <div style="display: flex; gap: 16px; margin-bottom: 20px; align-items: center;">
      <div style="background: ${cor}; width: 70px; height: 100px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 24px; position: relative; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <img src="${capaUrl}" alt="${livro.titulo}" onerror="this.style.display='none'; this.parentElement.textContent='${emoji}'" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div>
        <h4 style="margin: 0 0 4px 0; color: #111; font-size: 16px;">${livro.titulo}</h4>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">✍️ ${autorDisplay}</p>
        <span style="font-size: 12px; background: #E0E7FF; color: #1E3A8A; padding: 2px 6px; border-radius: 4px; font-weight: bold;">ISBN: ${livro.isbn || '-'}</span>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
      <label for="modal-qtde" style="font-weight: 500; font-size: 14px; color: #333;">Quantidade de Exemplares:</label>
      <input type="number" id="modal-qtde" value="1" min="1" style="padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; outline: none; width: 100%;" />
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button onclick="closeModal()" style="padding: 10px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-weight: 500;">Cancelar</button>
      <button onclick="confirmarAdicionarExemplares()" style="padding: 10px 20px; background: #1E3A8A; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Confirmar e Adicionar</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

window.confirmarAdicionarExemplares = async () => {
  const qtdeInput = document.getElementById('modal-qtde');
  const quantidade = parseInt(qtdeInput?.value, 10);

  if (isNaN(quantidade) || quantidade <= 0) {
    window.showAppMessage?.('Por favor, informe uma quantidade válida!');
    return;
  }

  try {
    window.showAppMessage?.('Adicionando exemplares ao acervo local...');

    await LivroService.adicionarAoAcervo({
      supabaseId: livroLocalizado.id,
      quantidade: quantidade
    });

    window.showAppMessage?.('Exemplares adicionados com sucesso ao acervo!');
    closeModal();
    limparInputsPrincipais();
  } catch (error) {
    console.error(error);
    window.showAppMessage?.(`Erro ao adicionar: ${error.message}`);
  }
};

/* ============================================== */
/* MODAL 2: CRIAR NO SUPABASE + QUANTIDADES       */
/* ============================================== */
function abrirModalCriarNoSupabase(titulo, isbn) {
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  modalTitle.textContent = "Cadastrar Novo Livro no Sistema";

  modalBody.innerHTML = `
    <p style="color: #ef4444; font-size: 13px; font-weight: 500; margin-bottom: 15px; line-height: 1.4;">
      ⚠️ Este livro não foi localizado no banco global. Preencha os campos abaixo para registrá-lo globalmente e adicioná-lo ao acervo local.
    </p>

    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 12px; font-weight: bold; color: #555;">Título do Livro *</label>
        <input type="text" id="new-titulo" value="${titulo || ''}" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" required />
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 12px; font-weight: bold; color: #555;">Autor(es) * (Separados por vírgula)</label>
        <input type="text" id="new-autores" placeholder="Ex: Antoine de Saint-Exupéry" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" required />
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 12px; font-weight: bold; color: #555;">ISBN *</label>
        <input type="text" id="new-isbn" value="${isbn || ''}" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" required />
      </div>

      <div style="display: flex; gap: 10px;">
        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
          <label style="font-size: 12px; font-weight: bold; color: #555;">Categoria</label>
          <select id="new-categoria" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
            <option value="Literatura">Literatura</option>
            <option value="Ciências">Ciências</option>
            <option value="História">História</option>
            <option value="Matemática">Matemática</option>
            <option value="Filosofia">Filosofia</option>
            <option value="Artes">Artes</option>
          </select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; width: 120px;">
          <label style="font-size: 12px; font-weight: bold; color: #555;">Quant. Inicial *</label>
          <input type="number" id="new-qtde" value="1" min="1" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" required />
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 12px; font-weight: bold; color: #555;">Sinopse / Descrição</label>
        <textarea id="new-desc" placeholder="Breve descrição da obra..." rows="3" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical;"></textarea>
      </div>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button onclick="closeModal()" style="padding: 10px 16px; border: 1px solid #ddd; background: white; border-radius: 8px; cursor: pointer; font-weight: 500;">Cancelar</button>
      <button onclick="confirmarSalvarECadastrar()" style="padding: 10px 20px; background: #10B981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Salvar e Adicionar</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

window.confirmarSalvarECadastrar = async () => {
  const titulo = document.getElementById('new-titulo')?.value.trim();
  const autoresInput = document.getElementById('new-autores')?.value.trim();
  const isbn = document.getElementById('new-isbn')?.value.trim();
  const categoria = document.getElementById('new-categoria')?.value;
  const quantidade = parseInt(document.getElementById('new-qtde')?.value, 10);
  const desc = document.getElementById('new-desc')?.value.trim();

  if (!titulo || !autoresInput || !isbn || isNaN(quantidade) || quantidade <= 0) {
    window.showAppMessage?.('Por favor, preencha todos os campos obrigatórios (*)!');
    return;
  }

  // Converter a string de autores separados por vírgula em um array estruturado
  const autoresArray = autoresInput.split(',').map(a => a.trim()).filter(a => a !== '');

  // Cores estéticas aleatórias para o background padrão de capa
  const coresCapa = ['#E8EDFF', '#FEE2E2', '#FEF3C7', '#D1FAE5', '#E0F2FE', '#F3E8FF'];
  const corAleatoria = coresCapa[Math.floor(Math.random() * coresCapa.length)];

  const novoLivroSupabase = {
    titulo: titulo,
    autores: autoresArray,
    isbn: isbn,
    categoria: categoria,
    desc: desc || "Nenhuma sinopse cadastrada para este exemplar.",
    cor: corAleatoria,
    emoji: "📖",
    capa: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`
  };

  try {
    window.showAppMessage?.('Criando livro no catálogo do Supabase...');
    
    // 1. Registrar o livro no banco de dados global do Supabase
    const livroCriado = await SupabaseLivroService.criarLivro(novoLivroSupabase);

    window.showAppMessage?.('Livro cadastrado globalmente! Vinculando acervo local...');

    // 2. Adicionar os exemplares físicos vinculados ao ID do novo registro do Supabase
    await LivroService.adicionarAoAcervo({
      supabaseId: livroCriado.id,
      quantidade: quantidade
    });

    window.showAppMessage?.('Livro adicionado com sucesso!');
    closeModal();
    limparInputsPrincipais();

  } catch (error) {
    console.error("Erro no cadastro e associação do livro:", error);
    window.showAppMessage?.(`Erro ao salvar os exemplares no acervo: ${error.message}`);
  }
};

/* ============================================== */
/* AUXILIARES DE INTERFAZ                         */
/* ============================================== */
function limparInputsPrincipais() {
  const t = document.getElementById('add-titulo');
  const i = document.getElementById('add-isbn');
  if (t) t.value = '';
  if (i) i.value = '';
  livroLocalizado = null;
}

window.closeModal = () => {
  document.getElementById('modal-overlay').classList.remove('open');
};

window.closeModalOnOverlay = (e) => {
  if (e.target === document.getElementById('modal-overlay')) {
    closeModal();
  }
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});