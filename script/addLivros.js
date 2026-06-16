let livrosCadastrados = [];

try {
  livrosCadastrados = JSON.parse(localStorage.getItem('bib_livros')) || [];
} catch (e) {
  livrosCadastrados = [];
}

function salvarStorage() {
  try {
    localStorage.setItem('bib_livros', JSON.stringify(livrosCadastrados));
  } catch (e) {
    console.warn('Nao foi possivel salvar no localStorage:', e);
  }
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
    <div class="livro-card" style="animation-delay:${(i * 0.05) + 0.04}s">
      <button class="livro-remove" onclick="removerLivro(${i})" title="Remover">✕</button>
      <img
        class="livro-capa"
        src="https://covers.openlibrary.org/b/isbn/${livro.isbn}-L.jpg?default=false"
        alt="${livro.titulo}"
        onerror="this.src='https://placehold.co/300x200/EEF2FF/1E3A8A?text=SEM+CAPA'"
      >
      <div class="livro-info">
        <div class="livro-titulo">${livro.titulo}</div>
        <div class="livro-autor">Autor: ${livro.autor}</div>
        <div class="livro-isbn">ISBN: ${livro.isbn}</div>
      </div>
    </div>
  `).join('');
}

function adicionarLivro() {
  const titulo = document.getElementById('add-titulo').value.trim();
  const autor = document.getElementById('add-autor').value.trim();
  const isbn = document.getElementById('add-isbn').value.trim();

  if (!titulo || !autor || !isbn) {
    alert('Preencha todos os campos!');
    return;
  }

  livrosCadastrados.push({ titulo, autor, isbn });
  salvarStorage();
  renderCatalogo();

  document.getElementById('add-titulo').value = '';
  document.getElementById('add-autor').value = '';
  document.getElementById('add-isbn').value = '';
  document.getElementById('add-titulo').focus();
}

function removerLivro(index) {
  if (confirm('Deseja realmente remover este livro?')) {
    livrosCadastrados.splice(index, 1);
    salvarStorage();
    renderCatalogo();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  renderCatalogo();

  document.getElementById('add-isbn').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') adicionarLivro();
  });
});
