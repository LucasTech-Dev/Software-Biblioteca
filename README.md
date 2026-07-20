# Biblioteca Escolar — v1.0

Aplicação web estática para gestão de acervo, reservas e empréstimos escolares.

## Estrutura

- `pages/`: telas da aplicação; a raiz contém somente o redirecionador `index.html`.
- `script/`: scripts de interface e proteção de navegação.
- `style/`: estilos por tela.
- `firebase/`: inicialização e services de Firebase/Firestore e catálogo Supabase.
- `firestore.rules` e `firestore.indexes.json`: configuração a publicar no Firebase.

## Publicação

1. Publique `firestore.rules` e `firestore.indexes.json` no projeto Firebase.
2. Hospede a raiz do repositório em um servidor estático (HTTPS).
3. Execute o roteiro em [TESTES_INTEGRADOS.md](TESTES_INTEGRADOS.md) usando contas de aluno e professor antes da liberação.

As chaves de configuração do Firebase e a chave `publishable` do Supabase são identificadores públicos de clientes web. A segurança dos dados depende das regras do Firestore, das políticas RLS do Supabase e das restrições de domínio configuradas nos respectivos consoles.
