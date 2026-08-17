# Biblioteca Escolar

Sistema web para gestão de acervo, reservas e empréstimos escolares, com autenticação e autorização por perfil.

## Stack

- HTML5, CSS e JavaScript ES Modules
- Firebase Authentication
- Cloud Firestore
- Supabase para catálogo de livros
- Tailwind CSS + daisyUI

## Arquitetura

```text
pages/       → telas da aplicação
script/      → comportamento das telas e navegação
style/       → estilos e Tailwind
firebase/    → autenticação, Firestore e services
firestore.rules → autorização no backend
```

A aplicação usa services para separar regras de negócio da interface. O navegador é tratado como ambiente não confiável: autorização e propriedade dos dados são validadas nas regras do Firestore.

## Segurança

A camada de autorização inclui:

- cadastro público limitado a `aluno`;
- controle de acesso por `uid` autenticado;
- proteção contra alteração de `usuarioId`;
- restrição de campos que o aluno pode alterar;
- operações administrativas limitadas ao perfil `professor`;
- bloqueio de exclusões sensíveis;
- regra final de negação para coleções não declaradas;
- CodeQL e auditoria de dependências automatizados.

Consulte [`SECURITY.md`](SECURITY.md) para o modelo de ameaça e os testes de segurança recomendados.

## Publicação

1. Publique `firestore.rules` e `firestore.indexes.json` no projeto Firebase.
2. Configure as políticas RLS do Supabase para permitir somente as operações necessárias.
3. Hospede a aplicação exclusivamente em HTTPS.
4. Execute [`TESTES_INTEGRADOS.md`](TESTES_INTEGRADOS.md) com contas de aluno e professor antes da liberação.

As configurações Web do Firebase e a chave publishable/anon do Supabase podem aparecer no cliente. Isso não substitui as regras de autorização nem deve ser confundido com credenciais administrativas.

## Status

Projeto em evolução. Alterações de segurança são desenvolvidas em `pre-main` antes de serem promovidas para `main`.
