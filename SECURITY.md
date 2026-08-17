# Política de Segurança

## Escopo

Este projeto é uma aplicação web de biblioteca escolar que utiliza Firebase Authentication, Cloud Firestore e Supabase.

## Controles aplicados

- Firestore utiliza autorização por identidade e perfil.
- Cadastro público só pode criar perfil `aluno`.
- O cliente não pode elevar o próprio perfil para `professor`.
- Registros de reservas e empréstimos são vinculados ao `uid` autenticado.
- Alunos não podem alterar o proprietário de seus registros.
- Alunos só podem alterar os campos estritamente necessários em reservas, empréstimos e notificações.
- Coleções não declaradas nas regras são negadas por padrão.
- Exclusão de usuários, reservas e empréstimos é bloqueada pelas regras.
- Logs só podem ser lidos/criados por professores e não podem ser alterados ou apagados pelo cliente.
- CodeQL é executado em `main` e `pre-main` e semanalmente.
- Dependabot verifica dependências npm semanalmente.

## Segredos

Nunca faça commit de senha, PAT, chave privada, service account, service-role key ou outro segredo privilegiado.

A configuração pública do Firebase Web e a chave publishable/anon do Supabase não são, por si só, equivalentes a uma credencial administrativa. A segurança depende das regras do Firestore, das políticas RLS do Supabase e das configurações dos respectivos consoles.

Se um segredo real for exposto, considere-o comprometido: revogue/rotacione a credencial primeiro e só depois remova o arquivo ou valor do código.

## Testes obrigatórios antes de produção

1. Aluno tentando criar perfil `professor`.
2. Aluno tentando ler documento de outro usuário.
3. Aluno tentando alterar `usuarioId` de uma reserva/empréstimo.
4. Aluno tentando alterar `professorId`, datas, título ou outros campos protegidos.
5. Aluno tentando aprovar, recusar ou alterar uma reserva já processada.
6. Aluno tentando escrever em `acervo` e `logs`.
7. Usuário autenticado tentando acessar uma coleção não declarada.
8. Usuário tentando marcar como lida uma notificação de outra pessoa.
9. Verificação das políticas RLS do Supabase.
10. Execução do fluxo completo descrito em `TESTES_INTEGRADOS.md`.

## Vulnerabilidades

Não publique credenciais, dados pessoais ou instruções de exploração em Issues. Para vulnerabilidades sensíveis, utilize um canal privado do mantenedor.
