
    window.PageGuard?.hold();

    /* ========================= */
    /* DADOS (mock) — Acervo     */
    /* ========================= */

    const LIVROS = [
      { id: 1, titulo: 'Dom Casmurro', autor: 'Machado de Assis', categoria: 'Literatura', isbn: '9788535902775', ano: 1899, editora: 'Garnier', exemplares: 3, disponiveis: 2, status: 'disponivel', emoji: '📖', cor: '#E8EDFF', desc: 'Um dos maiores clássicos da literatura brasileira, que narra a história de Bentinho e Capitu em uma das tramas mais debatidas da língua portuguesa.' },
      { id: 2, titulo: 'O Cortiço', autor: 'Aluísio Azevedo', categoria: 'Literatura', isbn: '9788535903123', ano: 1890, editora: 'Garnier', exemplares: 2, disponiveis: 0, status: 'emprestado', emoji: '🏚️', cor: '#FEF9C3', desc: 'Obra naturalista que retrata a vida coletiva e as relações sociais em um cortiço carioca do século XIX.' },
      { id: 3, titulo: 'Iracema', autor: 'José de Alencar', categoria: 'Literatura', isbn: '9788535904014', ano: 1865, editora: 'Mecenas', exemplares: 4, disponiveis: 0, status: 'reservado', emoji: '🌿', cor: '#DCFCE7', desc: 'Romance indianista que narra o amor entre a indígena Iracema e o colonizador Martim, símbolo da formação do povo brasileiro.' },
      { id: 4, titulo: 'Origem das Espécies', autor: 'Charles Darwin', categoria: 'Ciências', isbn: '9788535905554', ano: 1859, editora: 'Hemus', exemplares: 2, disponiveis: 1, status: 'disponivel', emoji: '🔬', cor: '#F0FDF4', desc: 'A obra fundamental da biologia moderna que apresenta a teoria da evolução das espécies por seleção natural.' },
      { id: 5, titulo: 'Sapiens', autor: 'Yuval Noah Harari', categoria: 'História', isbn: '9788537812795', ano: 2011, editora: 'Companhia das Letras', exemplares: 3, disponiveis: 3, status: 'disponivel', emoji: '🦴', cor: '#FFF7ED', desc: 'Uma narrativa fascinante da história da humanidade, desde os primeiros humanos até a era moderna.' },
      { id: 6, titulo: 'A República', autor: 'Platão', categoria: 'Filosofia', isbn: '9788535902119', ano: -380, editora: 'Martin Claret', exemplares: 2, disponiveis: 0, status: 'emprestado', emoji: '🏛️', cor: '#F5F3FF', desc: 'Diálogo filosófico em que Sócrates debate sobre justiça, ordem política e o Estado ideal.' },
      { id: 7, titulo: 'Matemática Elementar', autor: 'Gelson Iezzi', categoria: 'Matemática', isbn: '9788535061002', ano: 2004, editora: 'Atual', exemplares: 8, disponiveis: 5, status: 'disponivel', emoji: '📐', cor: '#EFF6FF', desc: 'Coleção de referência para o ensino médio abrangendo álgebra, geometria, trigonometria e análise combinatória.' },
      { id: 8, titulo: 'O Pequeno Príncipe', autor: 'Antoine de Saint-Exupéry', categoria: 'Literatura', isbn: '9788532516313', ano: 1943, editora: 'Agir', exemplares: 5, disponiveis: 4, status: 'disponivel', emoji: '🌹', cor: '#FFF1F2', desc: 'Conto poético que narra a história de um pequeno príncipe que viaja pelo universo, refletindo sobre amizade e a essência das coisas.' }
    ];

    /* ========================= */
    /* ESTADO — Acervo           */
    /* ========================= */

    let filtroTexto  = '';
    let filtroCateg  = '';
    let filtroStatus = '';
    let viewMode     = 'grid';
    let paginaAtual  = 1;
    const POR_PAGINA = 8;

    /* ========================= */
    /* NAVEGAÇÃO ENTRE PÁGINAS   */
    /* ========================= */

    function navegarPara(paginaId) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(paginaId).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (paginaId === 'page-adicionar') renderCatalogo();
    }

    /* ========================= */
    /* RENDER — Acervo           */
    /* ========================= */

    function livrosFiltrados() {
      return LIVROS.filter(l => {
        const textoOk  = !filtroTexto  || l.titulo.toLowerCase().includes(filtroTexto.toLowerCase()) || l.autor.toLowerCase().includes(filtroTexto.toLowerCase());
        const categOk  = !filtroCateg  || l.categoria === filtroCateg;
        const statusOk = !filtroStatus || l.status === filtroStatus;
        return textoOk && categOk && statusOk;
      });
    }

    function renderStats() {
      document.getElementById('stat-total').textContent = LIVROS.length;
      document.getElementById('stat-disp').textContent  = LIVROS.filter(l => l.status === 'disponivel').length;
      document.getElementById('stat-emp').textContent   = LIVROS.filter(l => l.status === 'emprestado').length;
      document.getElementById('stat-res').textContent   = LIVROS.filter(l => l.status === 'reservado').length;
    }

    function labelStatus(s) {
      return { disponivel: 'Disponível', emprestado: 'Emprestado', reservado: 'Reservado' }[s] || s;
    }

    function renderGrid() {
      const grid   = document.getElementById('books-grid');
      const todos  = livrosFiltrados();
      const inicio = (paginaAtual - 1) * POR_PAGINA;
      const pagina = todos.slice(inicio, inicio + POR_PAGINA);

      grid.className = 'books-grid' + (viewMode === 'list' ? ' list-view' : '');

      if (pagina.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">Nenhum livro encontrado</div><p class="empty-state-desc">Tente ajustar os filtros ou o termo de busca.</p></div>`;
        renderPaginacao(0);
        return;
      }

      grid.innerHTML = pagina.map((l, i) => {
        if (viewMode === 'list') {
          return `
            <div class="book-card" style="animation-delay:${(i*0.05)+0.04}s" onclick="openModal(${l.id})">
              <div class="book-cover" style="background:${l.cor}">${l.emoji}<div class="book-cover-overlay"></div><span class="book-status-dot ${l.status}"></span></div>
              <div class="book-info">
                <div class="book-title-block">
                  <div class="book-category">${l.categoria}</div>
                  <div class="book-title">${l.titulo}</div>
                  <div class="book-author">${l.autor}</div>
                </div>
                <div class="book-footer">
                  <span class="book-copies"><strong>${l.disponiveis}</strong>/${l.exemplares} exempl.</span>
                  <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
                </div>
              </div>
            </div>`;
        }
        return `
          <div class="book-card" style="animation-delay:${(i*0.04)+0.04}s" onclick="openModal(${l.id})">
            <div class="book-cover" style="background:${l.cor}">${l.emoji}<div class="book-cover-overlay"></div><span class="book-status-dot ${l.status}"></span></div>
            <div class="book-info">
              <div class="book-category">${l.categoria}</div>
              <div class="book-title">${l.titulo}</div>
              <div class="book-author">${l.autor}</div>
              <div class="book-footer">
                <span class="book-copies"><strong>${l.disponiveis}</strong>/${l.exemplares} exempl.</span>
                <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
              </div>
            </div>
          </div>`;
      }).join('');

      renderPaginacao(todos.length);
    }

    function renderPaginacao(total) {
      const pag   = document.getElementById('pagination');
      const pages = Math.ceil(total / POR_PAGINA);
      if (pages <= 1) { pag.innerHTML = ''; return; }

      let html = `<button class="page-btn" onclick="goPage(${paginaAtual-1})" ${paginaAtual===1?'disabled':''}>‹</button>`;
      for (let i = 1; i <= pages; i++) {
        html += `<button class="page-btn ${i===paginaAtual?'active':''}" onclick="goPage(${i})">${i}</button>`;
      }
      html += `<button class="page-btn" onclick="goPage(${paginaAtual+1})" ${paginaAtual===pages?'disabled':''}>›</button>`;
      pag.innerHTML = html;
    }

    function goPage(n) { paginaAtual = n; renderGrid(); window.scrollTo({top:0,behavior:'smooth'}); }

    function setView(mode) {
      viewMode = mode;
      document.getElementById('btn-grid').classList.toggle('active', mode === 'grid');
      document.getElementById('btn-list').classList.toggle('active', mode === 'list');
      renderGrid();
    }

    function setStatus(btn, status) {
      filtroStatus = status;
      paginaAtual  = 1;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    }

    document.getElementById('search-input').addEventListener('input', e => {
      filtroTexto = e.target.value;
      paginaAtual = 1;
      renderGrid();
    });

    document.getElementById('filter-categoria').addEventListener('change', e => {
      filtroCateg = e.target.value;
      paginaAtual = 1;
      renderGrid();
    });

    /* ========================= */
    /* MODAL                     */
    /* ========================= */

    function openModal(id) {
      const l = LIVROS.find(x => x.id === id);
      if (!l) return;

      const podeReservar = l.status === 'disponivel';
      const btnLabel     = { disponivel: 'Reservar', emprestado: 'Fila de espera', reservado: 'Fila de espera' }[l.status];

      const capaUrl = `https://covers.openlibrary.org/b/isbn/${l.isbn}-M.jpg?default=false`;

      document.getElementById('modal-body').innerHTML = `
        <div class="modal-book-header">
          <div class="modal-cover" style="background:${l.cor}">
            <img src="${capaUrl}" alt="${l.titulo}" onerror="this.style.display='none'; this.parentElement.textContent='${l.emoji}'" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">
          </div>
          <div class="modal-book-meta">
            <div class="modal-category">${l.categoria}</div>
            <div class="modal-book-title">${l.titulo}</div>
            <div class="modal-book-author">${l.autor}</div>
            <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
          </div>
        </div>
        <div class="modal-info-grid">
          <div class="modal-info-item"><label>ISBN</label><span>${l.isbn}</span></div>
          <div class="modal-info-item"><label>Ano</label><span>${l.ano < 0 ? Math.abs(l.ano)+' a.C.' : l.ano}</span></div>
          <div class="modal-info-item"><label>Editora</label><span>${l.editora}</span></div>
          <div class="modal-info-item"><label>Exemplares</label><span>${l.disponiveis} disponíveis de ${l.exemplares}</span></div>
        </div>
        <div class="modal-desc-title">Sinopse</div>
        <p class="modal-desc">${l.desc}</p>
        <div class="modal-actions">
          <button class="btn-reserve">${btnLabel}</button>
          <button class="btn-outline" onclick="closeModal()">Fechar</button>
        </div>
      `;

      document.getElementById('modal-overlay').classList.add('open');
    }

    function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
    function closeModalOnOverlay(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    /* ========================= */
    /* ADICIONAR LIVRO           */
    /* ========================= */

    let livrosCadastrados = JSON.parse(localStorage.getItem('bib_livros')) || [];

    function salvarStorage() {
      localStorage.setItem('bib_livros', JSON.stringify(livrosCadastrados));
    }

    function renderCatalogo() {
      const grid = document.getElementById('catalogo-grid');
      if (!grid) return;

      if (livrosCadastrados.length === 0) {
        grid.innerHTML = `
          <div class="catalogo-empty">
            <div class="catalogo-empty-icon">📭</div>
            <div class="catalogo-empty-title">Nenhum livro cadastrado ainda</div>
            <p class="catalogo-empty-desc">Use o formulário acima para adicionar o primeiro título.</p>
          </div>`;
        return;
      }

      grid.innerHTML = livrosCadastrados.map((livro, i) => `
        <div class="livro-card" style="animation-delay:${(i*0.05)+0.04}s">
          <button class="livro-remove" onclick="removerLivro(${i})" title="Remover">✕</button>
          <img
            class="livro-capa"
            src="https://covers.openlibrary.org/b/isbn/${livro.isbn}-L.jpg?default=false"
            alt="${livro.titulo}"
            onerror="this.src='https://placehold.co/300x200/EEF2FF/1E3A8A?text=SEM+CAPA'"
          >
          <div class="livro-info">
            <div class="livro-titulo">${livro.titulo}</div>
            <div class="livro-autor">✍️ ${livro.autor}</div>
            <div class="livro-isbn">📖 ISBN: ${livro.isbn}</div>
          </div>
        </div>
      `).join('');
    }

    function adicionarLivro() {
      const titulo = document.getElementById('add-titulo').value.trim();
      const autor  = document.getElementById('add-autor').value.trim();
      const isbn   = document.getElementById('add-isbn').value.trim();

      if (!titulo || !autor || !isbn) {
        window.showAppMessage?.('Preencha todos os campos!');
        return;
      }

      livrosCadastrados.push({ titulo, autor, isbn });
      salvarStorage();
      renderCatalogo();

      document.getElementById('add-titulo').value = '';
      document.getElementById('add-autor').value  = '';
      document.getElementById('add-isbn').value   = '';
    }

    document.getElementById('add-isbn').addEventListener('keydown', e => {
      if (e.key === 'Enter') adicionarLivro();
    });

    function removerLivro(index) {
      if (confirm('Deseja realmente remover este livro?')) {
        livrosCadastrados.splice(index, 1);
        salvarStorage();
        renderCatalogo();
      }
    }

    /* ========================= */
    /* INIT                      */
    /* ========================= */

    renderStats();
    renderGrid();
    renderCatalogo();
    window.PageGuard?.ready();