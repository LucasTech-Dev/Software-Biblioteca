# 📚 Sistema de Gestão de Biblioteca Escolar

> **Versão:** 1.0 (Branch `pre-main`)  
> **Arquitetura:** Serverless / Jamstack  
> **Tecnologias:** HTML5, CSS3 Moderno, JavaScript ES6+, Firebase (Auth & Firestore), Supabase  

---

## 📋 Sumário

- [1. Sobre o Projeto](#1-sobre-o-projeto)
- [2. Arquitetura Lógica e Fluxo de Dados](#2-arquitetura-lógica-e-fluxo-de-dados)
  - [2.1. Diagrama de Arquitetura](#21-diagrama-de-arquitetura)
  - [2.2. Fluxo de Dados](#22-fluxo-de-dados)
  - [2.3. Componentes Lógicos](#23-componentes-lógicos)
- [3. Dicionário Completo de Arquivos](#3-dicionário-completo-de-arquivos)
  - [Módulo 1: Arquivos da Raiz e Configuração](#módulo-1-arquivos-da-raiz-e-configuração)
  - [Módulo 2: Backend e Serviços (`firebase/`)](#módulo-2-backend-e-serviços-firebase)
  - [Módulo 3: Interfaces da Aplicação (`pages/`)](#módulo-3-interfaces-da-aplicação-pages)
  - [Módulo 4: Controladores e Lógica (`script/`)](#módulo-4-controladores-e-lógica-script)
  - [Módulo 5: Estilização e Temas (`style/`)](#módulo-5-estilização-e-temas-style)
- [4. Segurança e Permissões](#4-segurança-e-permissões)
- [5. Como Executar o Projeto](#5-como-executar-o-projeto)

---

## 1. Sobre o Projeto

O **Sistema de Gestão de Biblioteca Escolar** é uma plataforma web estática e serverless desenvolvida para automatizar a gestão do acervo, reservas, empréstimos, devoluções e relatórios pedagógicos de bibliotecas escolares.

O sistema divide-se em duas experiências principais:
* **Portal do Aluno:** Permite consulta ao acervo, solicitações de reserva, acompanhamento de prazos e histórico de leituras.
* **Painel do Professor / Administrador:** Oferece gestão de novos exemplares, aprovação/recusa de reservas, registro de devoluções, auditoria e emissão de relatórios com gráficos e rankings.

---

## 2. Arquitetura Lógica e Fluxo de Dados

### 2.1. Diagrama de Arquitetura

```text
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           CAMADA DE INTERFACE                           │
  │                  (Páginas HTML5 + Estilos CSS3 em pages/)               │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      CAMADA DE CONTROLE E REGRAS                        │
  │               (Controladores em script/ e pageGuard.js)                 │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     CAMADA DE SERVIÇOS E NEGÓCIO                        │
  │                (firebase/services/* - ES6 Modules)                      │
  └───────────────────┬─────────────────────────────────┬───────────────────┘
                      │                                 │
                      ▼                                 ▼
  ┌───────────────────────────────┐     ┌──────────────────────────────────┐
  │      FIREBASE FIRESTORE       │     │         SUPABASE DATABASE        │
  │ (Usuários, Empréstimos,       │     │  (Catálogo Global de Livros e    │
  │  Reservas, Estoque e Logs)    │     │   Metadados do Acervo Geral)     │
  └───────────────────────────────┘     └──────────────────────────────────┘


  Aqui está a documentação totalmente estruturada e formatada em sintaxe **Markdown**, pronta para ser copiada e colada diretamente no seu arquivo **`README.md`** do GitHub.

---

```markdown
# 📚 Sistema de Gestão de Biblioteca Escolar

> **Versão:** 1.0 (Branch `pre-main`)  
> **Arquitetura:** Serverless / Jamstack  
> **Tecnologias:** HTML5, CSS3 Moderno, JavaScript ES6+, Firebase (Auth & Firestore), Supabase  

---

## 📋 Sumário

- [1. Sobre o Projeto](#1-sobre-o-projeto)
- [2. Arquitetura Lógica e Fluxo de Dados](#2-arquitetura-lógica-e-fluxo-de-dados)
  - [2.1. Diagrama de Arquitetura](#21-diagrama-de-arquitetura)
  - [2.2. Fluxo de Dados](#22-fluxo-de-dados)
  - [2.3. Componentes Lógicos](#23-componentes-lógicos)
- [3. Dicionário Completo de Arquivos](#3-dicionário-completo-de-arquivos)
  - [Módulo 1: Arquivos da Raiz e Configuração](#módulo-1-arquivos-da-raiz-e-configuração)
  - [Módulo 2: Backend e Serviços (`firebase/`)](#módulo-2-backend-e-serviços-firebase)
  - [Módulo 3: Interfaces da Aplicação (`pages/`)](#módulo-3-interfaces-da-aplicação-pages)
  - [Módulo 4: Controladores e Lógica (`script/`)](#módulo-4-controladores-e-lógica-script)
  - [Módulo 5: Estilização e Temas (`style/`)](#módulo-5-estilização-e-temas-style)
- [4. Segurança e Permissões](#4-segurança-e-permissões)
- [5. Como Executar o Projeto](#5-como-executar-o-projeto)

---

## 1. Sobre o Projeto

O **Sistema de Gestão de Biblioteca Escolar** é uma plataforma web estática e serverless desenvolvida para automatizar a gestão do acervo, reservas, empréstimos, devoluções e relatórios pedagógicos de bibliotecas escolares.

O sistema divide-se em duas experiências principais:
* **Portal do Aluno:** Permite consulta ao acervo, solicitações de reserva, acompanhamento de prazos e histórico de leituras.
* **Painel do Professor / Administrador:** Oferece gestão de novos exemplares, aprovação/recusa de reservas, registro de devoluções, auditoria e emissão de relatórios com gráficos e rankings.

---

## 2. Arquitetura Lógica e Fluxo de Dados

### 2.1. Diagrama de Arquitetura

```text
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           CAMADA DE INTERFACE                           │
  │                  (Páginas HTML5 + Estilos CSS3 em pages/)               │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      CAMADA DE CONTROLE E REGRAS                        │
  │               (Controladores em script/ e pageGuard.js)                 │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     CAMADA DE SERVIÇOS E NEGÓCIO                        │
  │                (firebase/services/* - ES6 Modules)                      │
  └───────────────────┬─────────────────────────────────┬───────────────────┘
                      │                                 │
                      ▼                                 ▼
  ┌───────────────────────────────┐     ┌──────────────────────────────────┐
  │      FIREBASE FIRESTORE       │     │         SUPABASE DATABASE        │
  │ (Usuários, Empréstimos,       │     │  (Catálogo Global de Livros e    │
  │  Reservas, Estoque e Logs)    │     │   Metadados do Acervo Geral)     │
  └───────────────────────────────┘     └──────────────────────────────────┘

```

### 2.2. Fluxo de Dados

1. **Origem dos Dados:**
* **Usuários:** Dados fornecidos via formulários de login, cadastro, perfil e alteração de senha.
* **Professores / Administradores:** Inserção de novos livros no acervo, aprovação de reservas, registro de devoluções e configuração de prazos.
* **APIs Externas:** Capas dinâmicas consumidas via Open Library API (`https://covers.openlibrary.org`) com fallback local.


2. **Transformação dos Dados:**
* **Mapeamento e Consolidação:** O `LivroMapper.js` unifica as informações imutáveis do catálogo no Supabase (título, autor, ISBN, capa) com os dados dinâmicos do estoque no Firestore (quantidade disponível, reservada e status).
* **Normalização de Datas:** O `EmprestimoService.js` padroniza datas (`_normalizarData`) garantindo precisão nos cálculos de prazos e atrasos.


3. **Armazenamento:**
* **Supabase (PostgreSQL):** Mantém o catálogo global de metadados dos livros.
* **Firebase Firestore:** Armazena as coleções dinâmicas de `usuarios`, `acervo`, `reservas`, `emprestimos`, `notificacoes` e `logs`.
* **Armazenamento Local (Session/Local Storage):** Guarda tokens de sessão e preferências do usuário.


4. **Fluxo entre Sistemas:**
* O cliente web consome diretamente os SDKs do Firebase (v12) e Supabase via módulos ES6 (`import`/`export`), descartando a necessidade de um servidor backend próprio.


5. **Consumo:**
* Visualização interativa no Portal do Aluno e Painel do Professor, além de exportações de relatórios em CSV e impressão no painel administrativo.



---

## 3. Dicionário Completo de Arquivos

O projeto é composto por **58 arquivos** organizados e estruturados da seguinte forma:

### Módulo 1: Arquivos da Raiz e Configuração (6 arquivos)

| Arquivo | Descrição |
| --- | --- |
| `README.md` | Documentação principal do projeto contendo guias de arquitetura, arquivos e instalação. |
| `firestore.indexes.json` | Definição de índices compostos para acelerar consultas de ordenação no Firestore. |
| `firestore.rules` | Regras de segurança e controle de acesso baseado em papéis (RBAC - Aluno vs Professor). |
| `index.html` | Ponto de entrada raiz da aplicação; redireciona automaticamente para a tela de login. |
| `SEGURANCA_FIRESTORE.md` | Guia e checklist de auditoria das regras de segurança aplicadas no banco de dados. |
| `TESTES_INTEGRADOS.md` | Roteiro completo de testes de ponta a ponta para validação dos fluxos do sistema. |

---

### Módulo 2: Backend e Serviços (`firebase/` - 14 arquivos)

#### Configurações de Conexão

| Arquivo | Descrição |
| --- | --- |
| `firebase/auth.js` | Inicializa e exporta a instância do Firebase Authentication. |
| `firebase/config.js` | Armazena as credenciais e chaves públicas de configuração do projeto Firebase. |
| `firebase/firestore.js` | Inicializa e exporta a instância do banco NoSQL Cloud Firestore. |
| `firebase/supabase.js` | Configura e exporta a conexão com o cliente Supabase. |

#### Serviços e Regras de Negócio (`firebase/services/`)

| Arquivo | Descrição |
| --- | --- |
| `firebase/services/EmprestimoService.js` | Lógica de empréstimos, renovações, prazos de devolução e cálculo de atrasos. |
| `firebase/services/FirestoreAcervoService.js` | Gerencia o estoque e quantidade de exemplares físicos na coleção `acervo` do Firestore. |
| `firebase/services/LivroMapper.js` | Classe utilitária que funde os dados do Supabase com o estoque do Firestore. |
| `firebase/services/LivroService.js` | Serviço unificado que intermedisa as chamadas entre Supabase e Firestore. |
| `firebase/services/logServices.js` | Registra auditorias e eventos operacionais na coleção `logs`. |
| `firebase/services/NotificacaoService.js` | Gerencia o envio, leitura e atualização de notificações para os usuários. |
| `firebase/services/ReservaService.js` | Controla o fluxo de reservas (criação, aprovação e cancelamento). |
| `firebase/services/SupabaseLivroService.js` | Realiza pesquisas de títulos, autores, ISBN e inclusão de novos livros no Supabase. |
| `firebase/services/UsuarioService.js` | Reexporta os serviços de usuário para garantir compatibilidade entre versões. |
| `firebase/services/usuariosService.js` | Gerencia perfis de usuários, permissões, troca de senhas e dados cadastrais. |

---

### Módulo 3: Interfaces da Aplicação (`pages/` - 13 arquivos)

| Arquivo | Descrição |
| --- | --- |
| `pages/acervo.html` | Catálogo visual de livros disponíveis para os alunos consultarem e reservarem. |
| `pages/addLivros.html` | Formulário para o bibliotecário cadastrar novos títulos e unidades de exemplares. |
| `pages/administracao.html` | Painel administrativo para gestão de usuários, logs do sistema e regras da biblioteca. |
| `pages/busca.html` | Tela de busca detalhada com filtros dinâmicos por categoria, autor e título. |
| `pages/cadastro.html` | Formulário de registro de novas contas de Alunos e Professores. |
| `pages/devolucao.html` | Painel operacional do professor para registrar a devolução de exemplares. |
| `pages/emprestimos.html` | Tela de acompanhamento e controle geral de empréstimos da biblioteca. |
| `pages/indexTelaAluno.html` | Dashboard principal e área de boas-vindas do aluno logado. |
| `pages/login.html` | Interface de autenticação com suporte a troca de perfil e visibilidade de senha. |
| `pages/meusEmprestimos.html` | Painel pessoal do aluno para visualizar seus prazos, livros em posse e histórico. |
| `pages/relatorio.html` | Central de inteligência com estatísticas, gráficos, rankings e relatórios de atraso. |
| `pages/telaProfessor.html` | Dashboard do professor para aprovação ou rejeição de reservas pendentes. |
| `pages/usuario.html` | Tela de perfil do usuário para alteração de dados pessoais e senha. |

---

### Módulo 4: Controladores e Lógica (`script/` - 14 arquivos)

| Arquivo | Descrição |
| --- | --- |
| `script/acervo.js` | Controla a renderização da grade de livros e envia solicitações de reserva. |
| `script/addLivros.js` | Processa o envio do formulário de adição de livros integrando Supabase e Firestore. |
| `script/administracao.js` | Lógica de gerenciamento de permissões de usuários e listagem de logs. |
| `script/busca.js` | Executa a filtragem em tempo real e atualização dinâmica dos resultados na tela. |
| `script/cadastro.js` | Trata as validações do formulário de cadastro e cria o usuário no Firebase Auth. |
| `script/devolucao.js` | Manipula o processo de busca e confirmação de devolução de livros. |
| `script/emprestimos.js` | Alimenta e controla as tabelas e status dos empréstimos ativos. |
| `script/login.js` | Gerencia a autenticação, controle dos botões de perfil e visibilidade de senha. |
| `script/meusEmprestimos.js` | Gerencia os filtros e exibe o histórico de livros do aluno logado. |
| `script/pageGuard.js` | Proteção de rotas no cliente: impede acesso de usuários não autenticados ou sem permissão. |
| `script/relatorio.js` | Calcula métricas, constrói gráficos e gera relatórios exportáveis. |
| `script/telaAluno.js` | Controla o fluxo de navegação e componentes do painel do aluno. |
| `script/telaProfessor.js` | Lógica para aprovação/recusa de reservas pela equipe da biblioteca. |
| `script/usuario.js` | Controla a atualização do perfil, histórico pessoal e troca de senha do usuário. |

---

### Módulo 5: Estilização e Temas (`style/` - 11 arquivos)

| Arquivo | Descrição |
| --- | --- |
| `style/addLivros.css` | Estilos visuais para o formulário de cadastro de livros. |
| `style/busca.css` | Estilização da barra de pesquisa, campos de filtro e resultados. |
| `style/cadastro.css` | Design responsivo para a página de criação de conta. |
| `style/devolucao.css` | Estilização da área de confirmação de devoluções. |
| `style/emprestimos.css` | Layout de cartões, badges de status e tabelas de empréstimos. |
| `style/login.css` | Layout dividido em dois painéis para a tela de login. |
| `style/meusEmprestimos.css` | Design para chips de filtro e cards de empréstimo do aluno. |
| `style/relatorio.css` | Estilos para quadros de métricas, tabelas e gráficos de relatórios. |
| `style/telaAluno.css` | Layout em grid para o painel de acesso do aluno. |
| `style/telaProfessor.css` | Estilização do painel de controle e aprovação do professor. |
| `style/usuario.css` | Estilização das abas de edição de perfil e histórico de leitura. |

---

## 4. Segurança e Permissões

A segurança da aplicação é garantida por dois pilares:

1. **Guardião de Rotas Client-Side (`pageGuard.js`):** Intercepta o carregamento do DOM antes da renderização e valida se o usuário está autenticado e se o seu perfil (`aluno` ou `professor`) possui permissão para acessar a página solicitada.
2. **Regras do Firestore (`firestore.rules`):** Garantia de segurança no banco de dados. Impede que alunos editem acervos, aprovem empréstimos ou leiam dados de outros usuários.

---

## 5. Como Executar o Projeto

Como o projeto é totalmente estático e serverless, não há necessidade de compilação ou ambiente Node.js para execução local.

1. **Clonar o Repositório:**
```bash
git clone [https://github.com/lucastech-dev/software-biblioteca.git](https://github.com/lucastech-dev/software-biblioteca.git)
cd software-biblioteca

```


2. **Executar Localmente:**
* Abra o arquivo `index.html` diretamente em seu navegador web, ou
* Utilize uma extensão de servidor local como o **Live Server** no VS Code.


3. **Deploy:**
* O projeto está pronto para hospedagem em serviços de páginas estáticas como **GitHub Pages**, **Cloudflare Pages** ou **Vercel**.



```

```