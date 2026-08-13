# CRM Multi-Sistema (Lisboa · Epic · Hope)

Um único front-end publicado em **https://crm.lisboacapital.com.br**, com
**bases de dados totalmente separadas** por sistema. Nenhum dado cruza de um
sistema para outro: cada sistema tem seu próprio projeto de banco, seus
próprios usuários e sua própria sessão de login.

## Como funciona

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Definição dos sistemas | `src/tenants/config.ts` | nome, domínio, cores, logo, URL/chave do banco |
| Clientes de banco | `src/lib/supabaseClients.ts` | um cliente por sistema, com `storageKey` próprio |
| Cliente ativo | `src/lib/supabase-active.ts` | proxy que sempre aponta para o banco do sistema ativo |
| Contexto React | `src/lib/tenant-context.tsx` | `useTenant()` / `useSupabase()`, troca de sistema, branding |
| Tela de escolha | `src/routes/index.tsx` | cards dos 3 sistemas |
| Login por sistema | `src/routes/login.tsx?system=epic` | login isolado por sistema |
| Troca rápida | `src/components/tenant/TenantSwitcher.tsx` | trocar sem perder a sessão dos outros |

Todo o código do CRM importa `@/lib/supabase-active`, então é impossível uma
tela ler o banco de outro sistema por engano.

## Ativar um novo sistema (Epic ou Hope)

1. **Criar o banco**: crie um novo projeto Supabase para o sistema.
2. **Replicar o schema**: rode `scripts/replicate-schema.sql` no SQL Editor do
   novo projeto. Ele contém todas as tabelas, políticas de acesso (RLS),
   funções e triggers do sistema Lisboa.
3. **Criar o usuário master** do novo sistema em Auth → Users (confirmar
   e-mail) e conferir que o perfil criado ficou com `tipo_usuario = 'master'`.
4. **Informar as chaves** no ambiente do projeto:

   ```
   VITE_EPIC_SUPABASE_URL=...
   VITE_EPIC_SUPABASE_ANON_KEY=...
   VITE_HOPE_SUPABASE_URL=...
   VITE_HOPE_SUPABASE_ANON_KEY=...
   ```

   Enquanto essas variáveis não existirem, o sistema aparece como
   **“Em breve”** na tela de escolha e não pode ser aberto.
5. **Ajustar a marca** em `src/tenants/config.ts` (cores, razão social, CNPJ).

## Backups

O sistema de backup existente (`/backups`) roda **por sistema**: cada base
guarda o próprio histórico em `backup_history` e os arquivos no bucket
`backups` do respectivo projeto. Ao replicar o schema, o novo sistema já
nasce com a mesma estrutura de backup e restauração com checksum SHA-256.

## Perfis de acesso

Os papéis continuam sendo `master`, `interno` e `parceiro`, **por sistema**.
Ser master no Lisboa não dá nenhum acesso no Epic ou no Hope — é preciso ter
usuário criado no banco daquele sistema.
