# Política de Segurança

## Escopo

Este projeto é uma aplicação web de biblioteca escolar que utiliza Firebase Authentication, Cloud Firestore e Supabase.

## Regras de segurança

- Nenhuma senha, token privado, chave de serviço ou credencial administrativa deve ser commitada.
- A configuração pública do Firebase Web e a chave publishable do Supabase não substituem as regras de autorização do backend.
- As permissões de dados devem ser aplicadas no Firestore/Supabase, nunca apenas no JavaScript do navegador.
- Contas de professor devem ser provisionadas por um fluxo administrativo confiável; o cadastro público cria apenas perfis de aluno.
- Dados pertencentes a outro usuário não podem ser lidos ou modificados alterando apenas o `usuarioId` enviado pelo cliente.
- Mudanças nas regras do Firestore devem ser acompanhadas de testes integrados antes da publicação.

## Vulnerabilidades

Se encontrar uma vulnerabilidade, abra uma Issue sem incluir credenciais, dados pessoais ou detalhes que permitam exploração contra uma instalação real. Para uma vulnerabilidade sensível, prefira um canal privado do mantenedor.

## Verificações recomendadas

Mantenha habilitados, quando disponíveis para o repositório, Secret Scanning/Push Protection, Dependabot e Code Scanning. Esses recursos ajudam a detectar credenciais expostas, dependências vulneráveis e padrões de código inseguro.
