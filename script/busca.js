 const BOOKS = [
      { title: 'Dom Casmurro', author: 'Machado de Assis', category: 'Literatura Brasileira', year: 1899, isbn: '978-85-359-0277-5', status: 'disponivel', copies: 3, emoji: '📖' },
      { title: 'O Cortiço', author: 'Aluísio Azevedo', category: 'Literatura Brasileira', year: 1890, isbn: '978-85-359-0112-9', status: 'emprestado', copies: 0, emoji: '📕' },
      { title: 'Vidas Secas', author: 'Graciliano Ramos', category: 'Literatura Brasileira', year: 1938, isbn: '978-85-359-0088-7', status: 'disponivel', copies: 2, emoji: '📗' },
      { title: 'O Guarani', author: 'José de Alencar', category: 'Literatura Brasileira', year: 1857, isbn: '978-85-359-0099-3', status: 'disponivel', copies: 1, emoji: '📘' },
      { title: 'Iracema', author: 'José de Alencar', category: 'Literatura Brasileira', year: 1865, isbn: '978-85-359-0044-3', status: 'reservado', copies: 0, emoji: '📙' },
      { title: 'Dune', author: 'Frank Herbert', category: 'Ficção Científica', year: 1965, isbn: '978-0-441-01794-5', status: 'disponivel', copies: 2, emoji: '🚀' },
      { title: 'Fundação', author: 'Isaac Asimov', category: 'Ficção Científica', year: 1951, isbn: '978-0-553-29335-7', status: 'emprestado', copies: 0, emoji: '🌌' },
      { title: '1984', author: 'George Orwell', category: 'Ficção Científica', year: 1949, isbn: '978-0-452-28423-4', status: 'disponivel', copies: 4, emoji: '👁️' },
      { title: 'Brasil: Uma Biografia', author: 'Lilia Schwarcz', category: 'História', year: 2015, isbn: '978-85-359-2766-2', status: 'disponivel', copies: 2, emoji: '🏛️' },
      { title: 'A Revolução dos Bichos', author: 'George Orwell', category: 'Literatura', year: 1945, isbn: '978-0-451-52634-2', status: 'disponivel', copies: 3, emoji: '🐷' },
      { title: 'Cosmos', author: 'Carl Sagan', category: 'Ciências', year: 1980, isbn: '978-0-345-33135-9', status: 'disponivel', copies: 1, emoji: '🔭' },
      { title: 'Breve História do Tempo', author: 'Stephen Hawking', category: 'Ciências', year: 1988, isbn: '978-0-553-38016-3', status: 'emprestado', copies: 0, emoji: '⏳' },
    ];

    function statusInfo(status, copies) {
      if (status === 'disponivel') return { cls: 'avail-yes', label: `Disponível (${copies} ex.)`, pill: 'pill-green' };
      if (status === 'emprestado') return { cls: 'avail-no',  label: 'Emprestado',                 pill: 'pill-coral'  };
      return                              { cls: 'avail-few', label: 'Reservado',                  pill: 'pill-amber'  };
    }

    function renderBooks(list) {
      const container = document.getElementById('bookList');
      document.getElementById('resultsCount').innerHTML = `Exibindo <strong>${list.length}</strong> livros`;

      if (list.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:48px 0; color:var(--ink-muted);">
            <div style="font-size:48px; margin-bottom:12px;">📭</div>
            <div style="font-family:var(--font-display); font-size:18px; color:var(--ink);">Nenhum livro encontrado</div>
            <div style="font-size:13px; margin-top:6px;">Tente outros termos ou limpe os filtros</div>
          </div>`;
        return;
      }

      container.innerHTML = list.map((b, i) => {
        const s = statusInfo(b.status, b.copies);
        const canReserve = b.status !== 'reservado';
        return `
          <div class="book-card" style="animation-delay:${i * 0.05}s">
            <div class="book-cover">${b.emoji}</div>
            <div class="book-info">
              <div class="book-title">${b.title}</div>
              <div class="book-author">${b.author} · ${b.year}</div>
              <div class="book-meta">
                <span class="pill pill-muted">${b.category}</span>
                <span class="pill pill-muted">ISBN: ${b.isbn}</span>
              </div>
            </div>
            <div class="book-actions">
              <div class="availability ${s.cls}">
                <span class="availability-dot"></span>
                <span class="availability-text">${s.label}</span>
              </div>
              ${b.status === 'disponivel'
                ? `<button class="btn btn-primary btn-sm" onclick="reservar('${b.title}')">📅 Reservar</button>`
                : b.status === 'emprestado'
                ? `<button class="btn btn-secondary btn-sm" onclick="filaEspera('${b.title}')">⏳ Fila de espera</button>`
                : `<span class="pill pill-amber">Já reservado</span>`}
              <button class="btn btn-secondary btn-sm" onclick="verDetalhes('${b.title}')">Ver detalhes</button>
            </div>
          </div>`;
      }).join('');
    }

    function filterBooks() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      let list = BOOKS.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        b.category.toLowerCase().includes(q)
      );
      renderBooks(list);
    }

    function sortBooks(val) {
      let list = [...BOOKS];
      if (val === 'titulo')  list.sort((a,b) => a.title.localeCompare(b.title));
      if (val === 'autor')   list.sort((a,b) => a.author.localeCompare(b.author));
      if (val === 'recente') list.sort((a,b) => b.year - a.year);
      renderBooks(list);
    }

    function clearFilters() {
      document.getElementById('searchInput').value = '';
      document.querySelectorAll('.filter-option input').forEach(i => i.checked = false);
      renderBooks(BOOKS);
    }

    function reservar(titulo)    { alert(`Reserva solicitada para: "${titulo}"\nVocê será notificado quando o livro estiver disponível.`); }
    function filaEspera(titulo)  { alert(`Você entrou na fila de espera para: "${titulo}"`); }
    function verDetalhes(titulo) { alert(`Detalhes do livro: "${titulo}"\n(Integrar com modal ou página de detalhe)`); }
    function toggleView(mode)    { /* Implementar toggle grade/lista */ }

    // Render inicial
    renderBooks(BOOKS);