# CRM Multi-Sistema (Lisboa · Epic · Hope)

Uma **única URL** publicada em **https://crm.lisboacapital.com.br** para os três
sistemas — a troca entre eles é **interna** (tela inicial ou seletor na barra
lateral), sem domínios ou endereços separados. As **bases de dados são
totalmente separadas** por sistema: nenhum dado cruza de um para outro, cada
sistema tem seu próprio banco, usuários e sessão de login.

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

## Bases de dados

Sistema unificado: **um endereço, um backend, três bases isoladas**. Cada linha
de dado carrega o sistema a que pertence (`tenant`), e uma regra de acesso
restritiva no banco impede que alguém leia ou grave em um sistema que não
tenha liberado no perfil (`user_profiles.tenants`).

Todas as consultas do app passam pelo cliente do sistema ativo
(`src/lib/supabaseClients.ts`), que filtra e carimba automaticamente o
`tenant` — nenhuma tela precisa lembrar disso.

Epic e Hope nascem espelhando o Lisboa: mesmo funil, mesmas etapas e mesmas
etiquetas, sem clientes, parceiros ou oportunidades.

## Backups

O sistema de backup existente (`/backups`) roda **por sistema**: cada base
guarda o próprio histórico em `backup_history` e os arquivos no bucket
`backups` do respectivo projeto. Ao replicar o schema, o novo sistema já
nasce com a mesma estrutura de backup e restauração com checksum SHA-256.

## Perfis de acesso

Os papéis continuam sendo `master`, `interno` e `parceiro`, **por sistema**.
Ser master no Lisboa não dá nenhum acesso no Epic ou no Hope — é preciso ter
usuário criado no banco daquele sistema.
