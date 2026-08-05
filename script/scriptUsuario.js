import { db } from '../firebase/firestore.js';
// 1. CORREÇÃO DA VERSÃO DO FIREBASE PARA 12.13.0
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Importações default (sem chaves)
import UsuarioService from '../firebase/services/UsuarioService.js';
import EmprestimoService from '../firebase/services/EmprestimoService.js';

// Cache local dos alunos para abertura instantânea do modal
let listaAlunosCache = [];

/**
 * Controla a visibilidade da tela de carregamento (Spinner)
 */
function toggleLoading(exibir) {
  const loadingEl = document.getElementById('loadingScreen');
  if (!loadingEl) return;
  if (exibir) {
    loadingEl.classList.remove('hidden');
    loadingEl.classList.add('flex');
  } else {
    loadingEl.classList.add('hidden');
    loadingEl.classList.remove('flex');
  }
}

/**
 * Busca todos os alunos e seus respectivos empréstimos utilizando os Services do projeto
 */
export async function carregarDadosAlunos() {
  toggleLoading(true);
  const grid = document.getElementById('gridAlunos');
  if (!grid) return;
  grid.innerHTML = '';

  try {
    let todosUsuarios = [];
    let todosEmprestimos = [];

    // 1. Obter Usuários (via UsuarioService)
    try {
      if (UsuarioService && typeof UsuarioService.listarTodos === 'function') {
        todosUsuarios = await UsuarioService.listarTodos();
      } else if (UsuarioService && typeof UsuarioService.buscarTodos === 'function') {
        todosUsuarios = await UsuarioService.buscarTodos();
      } else if (UsuarioService && typeof UsuarioService.obterTodos === 'function') {
        todosUsuarios = await UsuarioService.obterTodos();
      } else {
        const snap = await getDocs(collection(db, 'usuarios'));
        snap.forEach(doc => todosUsuarios.push({ id: doc.id, ...doc.data() }));
      }
    } catch (errUser) {
      console.warn("Buscando usuários via consulta direta ao Firestore...", errUser);
      const snap = await getDocs(collection(db, 'usuarios'));
      snap.forEach(doc => todosUsuarios.push({ id: doc.id, ...doc.data() }));
    }

    // 2. Obter Empréstimos
    try {
      if (EmprestimoService && typeof EmprestimoService.listarTodos === 'function') {
        todosEmprestimos = await EmprestimoService.listarTodos();
      } else if (EmprestimoService && typeof EmprestimoService.listarEmprestimosProfessor === 'function') {
        todosEmprestimos = await EmprestimoService.listarEmprestimosProfessor();
      } else {
        const snap = await getDocs(collection(db, 'emprestimos'));
        snap.forEach(doc => todosEmprestimos.push({ id: doc.id, ...doc.data() }));
      }
    } catch (errEmp) {
      console.warn("Buscando empréstimos via consulta direta ao Firestore...", errEmp);
      const snap = await getDocs(collection(db, 'emprestimos'));
      snap.forEach(doc => todosEmprestimos.push({ id: doc.id, ...doc.data() }));
    }

    listaAlunosCache = [];

    // 3. Filtrar apenas alunos e cruzar com seus empréstimos
    todosUsuarios.forEach(user => {
      const isAluno = user.tipo === 'aluno' || user.nivel === 'aluno' || (!user.tipo && !user.nivel);

      if (isAluno) {
        const uid = user.id || user.uid;
        const nome = user.nome || user.displayName || user.email || 'Aluno sem nome';
        const moedas = user.moedas !== undefined ? user.moedas : (user.pontos !== undefined ? user.pontos : 0);

        // Empréstimos vinculados a este aluno
        const empDoAluno = todosEmprestimos.filter(e => 
          e.usuarioId === uid || e.idUsuario === uid || e.alunoId === uid || e.uid === uid
        );

        const ativos = empDoAluno
          .filter(e => e.status === 'EMPRESTADO' || e.status === 'ATRASADO' || e.status === 'ativo' || (!e.devolvidoEm && e.status !== 'DEVOLVIDO'))
          .map(e => e.tituloLivro || e.livroTitulo || e.livro || 'Livro sem título');

        const devolvidos = empDoAluno
          .filter(e => e.status === 'DEVOLVIDO' || e.devolvidoEm != null)
          .map(e => e.tituloLivro || e.livroTitulo || e.livro || 'Livro sem título');

        listaAlunosCache.push({
          id: uid,
          nome,
          moedas,
          emprestados: ativos,
          devolvidos: devolvidos
        });
      }
    });

    // 4. Renderizar os cards na tela (ADAPTADO COM AS CORES DO PROJETO)
    if (listaAlunosCache.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <i class="fa-solid fa-users-slash text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 font-medium">Nenhum aluno encontrado no sistema.</p>
        </div>
      `;
    } else {
      listaAlunosCache.forEach((aluno, index) => {
        const inicial = aluno.nome.charAt(0).toUpperCase();
        
        const cardHTML = `
          <div onclick="window.abrirModalAlunoIndex(${index})" 
               class="card bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-biblio-border group">
            <div class="card-body p-6">
              <div class="flex items-center gap-4">
                <div class="avatar placeholder">
                  <div class="bg-biblio-light text-biblio-dark rounded-full w-14 h-14 border border-biblio-border font-bold flex items-center justify-center transition-transform group-hover:scale-110">
                    <span class="text-xl font-display">${inicial}</span>
                  </div>
                </div>
                <div>
                  <h2 class="text-lg text-biblio-dark font-display font-bold leading-tight">${aluno.nome}</h2>
                  <span class="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-1 mt-2">
                    <i class="fa-solid fa-coins text-amber-500"></i> ${aluno.moedas} Moedas
                  </span>
                </div>
              </div>
              
              <div class="divider my-3 before:bg-gray-100 after:bg-gray-100"></div>
              
              <div class="text-sm font-medium text-gray-500 flex justify-between px-1">
                <span class="flex flex-col items-center">Ativos <strong class="text-biblio-dark text-lg">${aluno.emprestados.length}</strong></span>
                <span class="flex flex-col items-center">Devolvidos <strong class="text-emerald-600 text-lg">${aluno.devolvidos.length}</strong></span>
              </div>
            </div>
          </div>
        `;
        grid.innerHTML += cardHTML;
      });
    }

  } catch (error) {
    console.error("Erro ao carregar dados dos alunos:", error);
    grid.innerHTML = `
      <div class="col-span-full text-center py-8 bg-red-50 text-red-600 rounded-xl border border-red-200">
        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
        <p class="font-medium">Erro ao carregar dados dos alunos. Verifique o console do navegador.</p>
      </div>
    `;
  } finally {
    toggleLoading(false);
  }
}

/**
 * Preenche e abre o modal do aluno selecionado
 */
window.abrirModalAlunoIndex = function(index) {
  const aluno = listaAlunosCache[index];
  if (!aluno) return;

  document.getElementById('modalNomeAluno').innerText = aluno.nome;
  document.getElementById('modalMoedas').querySelector('span').innerText = aluno.moedas;

  // Renderizar Livros Emprestados
  const listaEmp = document.getElementById('listaEmprestados');
  listaEmp.innerHTML = aluno.emprestados.length > 0 
    ? aluno.emprestados.map(l => `<li class="py-3 px-2 text-gray-700 font-medium"><i class="fa-solid fa-book-open text-biblio-dark mr-2"></i> ${l}</li>`).join('')
    : `<li class="py-4 text-center text-sm text-gray-400 italic">Nenhum livro pendente no momento.</li>`;

  // Renderizar Livros Devolvidos
  const listaDev = document.getElementById('listaDevolvidos');
  listaDev.innerHTML = aluno.devolvidos.length > 0
    ? aluno.devolvidos.map(l => `<li class="py-3 px-2 text-gray-700 font-medium"><i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${l}</li>`).join('')
    : `<li class="py-4 text-center text-sm text-gray-400 italic">Nenhuma devolução registrada no histórico.</li>`;

  document.getElementById('modal_aluno').showModal();
};

window.atualizarDados = carregarDadosAlunos;

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosAlunos();
});