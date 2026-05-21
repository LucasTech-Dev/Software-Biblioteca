
      function addnovolivro() {
  window.location.href = "addLivros.html";
}


    /* ========================= */
    /* DADOS (mock) */
    /* ========================= */

   

    /* ========================= */
    /* ESTADO */
    /* ========================= */

     


    let filtroTexto   = '';
    let filtroCateg   = '';
    let filtroStatus  = '';
    let viewMode      = 'grid';
    let paginaAtual   = 1;
    const POR_PAGINA  = 8;

    /* ========================= */
    /* RENDER */
    /* ========================= */

    function livrosFiltrados() {
      return LIVROS.filter(l => {
        const textoOk = !filtroTexto ||
          l.titulo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
          l.autor.toLowerCase().includes(filtroTexto.toLowerCase());
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
      const grid    = document.getElementById('books-grid');
      const todos   = livrosFiltrados();
      const inicio  = (paginaAtual - 1) * POR_PAGINA;
      const pagina  = todos.slice(inicio, inicio + POR_PAGINA);

      grid.className = 'books-grid' + (viewMode === 'list' ? ' list-view' : '');

      if (pagina.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-title">Nenhum livro encontrado</div>
            <p class="empty-state-desc">Tente ajustar os filtros ou o termo de busca.</p>
          </div>`;
        renderPaginacao(0);
        return;
      }

      grid.innerHTML = pagina.map((l, i) => {
        if (viewMode === 'list') {
          return `
            <div class="book-card" style="animation-delay:${(i * 0.05) + 0.04}s"
                 onclick="openModal(${l.id})">
              <div class="book-cover" style="background:${l.cor}">
                ${l.emoji}
                <div class="book-cover-overlay"></div>
                <span class="book-status-dot ${l.status}"></span>
              </div>
              <div class="book-info">
                <div class="book-title-block">
                  <div class="book-category">${l.categoria}</div>
                  <div class="book-title">${l.titulo}</div>
                  <div class="book-author">${l.autor}</div>
                </div>
                <div class="book-footer">
                  <span class="book-copies">
                    <strong>${l.disponiveis}</strong>/${l.exemplares} exempl.
                  </span>
                  <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
                </div>
              </div>
            </div>`;
        }

        return `
          <div class="book-card" style="animation-delay:${(i * 0.04) + 0.04}s"
               onclick="openModal(${l.id})">
            <div class="book-cover" style="background:${l.cor}">
              ${l.emoji}
              <div class="book-cover-overlay"></div>
              <span class="book-status-dot ${l.status}"></span>
            </div>
            <div class="book-info">
              <div class="book-category">${l.categoria}</div>
              <div class="book-title">${l.titulo}</div>
              <div class="book-author">${l.autor}</div>
              <div class="book-footer">
                <span class="book-copies">
                  <strong>${l.disponiveis}</strong>/${l.exemplares} exempl.
                </span>
                <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
              </div>
            </div>
          </div>`;
      }).join('');

      renderPaginacao(todos.length);
    }

    function renderPaginacao(total) {
      const pag  = document.getElementById('pagination');
      const pages = Math.ceil(total / POR_PAGINA);

      if (pages <= 1) { pag.innerHTML = ''; return; }

      let html = `
        <button class="page-btn" onclick="goPage(${paginaAtual - 1})"
          ${paginaAtual === 1 ? 'disabled' : ''}>‹</button>`;

      for (let i = 1; i <= pages; i++) {
        html += `
          <button class="page-btn ${i === paginaAtual ? 'active' : ''}"
            onclick="goPage(${i})">${i}</button>`;
      }

      html += `
        <button class="page-btn" onclick="goPage(${paginaAtual + 1})"
          ${paginaAtual === pages ? 'disabled' : ''}>›</button>`;

      pag.innerHTML = html;
    }

    /* ========================= */
    /* AÇÕES */
    /* ========================= */

    function goPage(n) {
      paginaAtual = n;
      renderGrid();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
    /* MODAL */
    /* ========================= */

    function openModal(id) {
      const l = LIVROS.find(x => x.id === id);
      if (!l) return;

      document.getElementById('modal-title').textContent = 'Detalhes do livro';

      const podeReservar = l.status === 'disponivel';
      const btnLabel     = { disponivel: 'Reservar', emprestado: 'Fila de espera', reservado: 'Fila de espera' }[l.status];

      document.getElementById('modal-body').innerHTML = `
        <div class="modal-book-header">
          <div class="modal-cover" style="background:${l.cor}">${l.emoji}</div>
          <div class="modal-book-meta">
            <div class="modal-category">${l.categoria}</div>
            <div class="modal-book-title">${l.titulo}</div>
            <div class="modal-book-author">${l.autor}</div>
            <span class="status-badge ${l.status}">${labelStatus(l.status)}</span>
          </div>
        </div>

        <div class="modal-info-grid">
          <div class="modal-info-item">
            <label>ISBN</label>
            <span>${l.isbn}</span>
          </div>
          <div class="modal-info-item">
            <label>Ano</label>
            <span>${l.ano < 0 ? Math.abs(l.ano) + ' a.C.' : l.ano}</span>
          </div>
          <div class="modal-info-item">
            <label>Editora</label>
            <span>${l.editora}</span>
          </div>
          <div class="modal-info-item">
            <label>Exemplares</label>
            <span>${l.disponiveis} disponíveis de ${l.exemplares}</span>
          </div>
        </div>

        <div class="modal-desc-title">Sinopse</div>
        <p class="modal-desc">${l.desc}</p>

        <div class="modal-actions">
          <button class="btn-reserve" ${podeReservar ? '' : ''}>${btnLabel}</button>
          <button class="btn-outline" onclick="closeModal()">Fechar</button>
        </div>
      `;

      document.getElementById('modal-overlay').classList.add('open');
    }

    function closeModal() {
      document.getElementById('modal-overlay').classList.remove('open');
    }

    function closeModalOnOverlay(e) {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    /* ========================= */
    /* INIT */
    /* ========================= */

    renderStats();
    renderGrid();

  
       
