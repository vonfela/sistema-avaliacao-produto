# Orquestração — sign-in, home e feedback

> Status: aguardando aprovação dos três planos
> Planos: [`sign-in.md`](./sign-in.md), [`home.md`](./home.md), [`feedback.md`](./feedback.md)

## 1. Estratégia

O projeto não é um repositório git. Para rodar três subagentes em paralelo sem corromper trabalho
existente, a execução será dividida em fases com **ownership de arquivos** e **contratos congelados**.

```text
Fase 0  Fundação compartilhada (orquestrador)
   ↓
Fase 1  sign-in  |  home  |  feedback  (3 subagentes em paralelo)
   ↓
Fase 2  Integração, correções e verificação
   ↓
Fase 3  E2E com dados reais, screenshots e entrega
```

## 2. Fase 0 — fundação compartilhada

Executada pelo orquestrador antes de abrir os subagentes:

1. **Snapshot de segurança** do projeto (sem `node_modules`, `.next` e `.env.local`) em diretório
   temporário. Como não há git, é o rollback disponível.
2. **Migrations compartilhadas**: criar `supabase/migrations/0002_products.sql` e
   `0003_products_feedbacks.sql` exatamente como nos planos e aplicar no Supabase, na ordem.
   As credenciais já documentadas em `docs/ARCHITECTURE.md` serão usadas por um script one-off fora
   do repositório; nenhuma senha será adicionada ao código.
3. **Composição do router**: criar stubs de `server/auth/router.ts`, `server/products/router.ts` e
   `server/feedbacks/router.ts` e montar os três em `server/trpc/router.ts`. Os subagentes substituem
   apenas o próprio router; ninguém edita a composição.
4. **Contratos mínimos** para o paralelismo:
   - `server/auth/session.ts` com a assinatura final de `getSession` (stub retornando `null`);
   - `features/products/schema.ts` com o tipo `Product`;
   - `server/products/repository.ts` com `getProductById` (stub retornando `null`).
     Os donos substituem os stubs com a implementação real.
5. **Baseline**: `bun run typecheck` e `bun run build` antes das mudanças. O lint global já falha por
   markdown pré-existente; a verificação de código será escopada.
6. Confirmar que `products` e `products_feedbacks` existem no Supabase e que `accounts` continua
   intacta.

## 3. Fase 1 — subagentes em paralelo

Cada subagente recebe:

- o plano da própria feature;
- o `AGENTS.md` e a instrução de ler `node_modules/next/dist/docs/` antes de codar (Next 16);
- a skill `frontend-design` para as features de UI;
- a matriz de ownership abaixo;
- a instrução de não tocar em arquivos compartilhados;
- a instrução de reportar arquivos alterados, comandos executados e pendências.

### 3.1 Matriz de ownership

| Área                                             | `sign-in`      | `home` | `feedback`       |
| ------------------------------------------------ | -------------- | ------ | ---------------- |
| `app/auth/sign-in/*`                             | dono           | —      | —                |
| `app/auth/sign-up/sign-up-form.tsx`              | dono (só link) | —      | —                |
| `app/api/v1/sign-in/*`, `sign-out/*`             | dono           | —      | —                |
| `server/auth/*`, `server/accounts/repository.ts` | dono           | —      | —                |
| `app/(platform)/layout.tsx`, `components/site-*` | dono           | —      | —                |
| `app/(platform)/page.tsx`, `app/page.tsx`        | —              | dono   | —                |
| `app/api/v1/products/route.ts`                   | —              | dono   | —                |
| `features/products/*`, `server/products/*`       | —              | dono   | consome contrato |
| `next.config.ts` (imagens)                       | —              | dono   | —                |
| `app/(platform)/products/[id]/*`                 | —              | —      | dono             |
| `app/api/v1/products/[id]/feedbacks/*`           | —              | —      | dono             |
| `features/feedbacks/*`, `server/feedbacks/*`     | —              | —      | dono             |
| `supabase/migrations/*`                          | —              | —      | — (fase 0)       |
| `server/trpc/router.ts`                          | —              | —      | — (fase 0)       |
| `app/globals.css`, `app/layout.tsx`              | —              | —      | — (congelados)   |

### 3.2 Regras de convivência

- Nenhum subagente roda `git`, cria worktree ou altera `package.json`.
- Nenhum subagente edita arquivos de outra feature, mesmo para "ajustar um import".
- `bun run typecheck` pode acusar imports de features irmãs ainda não concluídas; isso é esperado.
  Cada subagente valida os próprios arquivos com `bunx biome check <paths>` e não introduz erros
  novos nos seus arquivos.
- O build completo é responsabilidade do orquestrador na fase 2.
- Se um subagente precisar de uma mudança fora do seu escopo, reporta ao orquestrador em vez de
  editar.

## 4. Fase 2 — integração

1. Revisar o diff de cada subagente contra o snapshot; identificar toques fora do ownership.
2. Resolver conflitos de contrato (nomes de tipo, assinaturas, imports) no orquestrador.
3. Rodar:
   - `bun run typecheck`;
   - `bunx biome check app components features lib server next.config.ts`;
   - `bun run build`.
4. Corrigir falhas de integração. Se uma feature falhou, retomar a sessão do subagente com
   `sessionID` ou reexecutar apenas ela.
5. Conferir que as migrations aplicadas correspondem aos arquivos versionados.

## 5. Fase 3 — E2E e aceite

### 5.1 Dados de teste

1. Criar uma conta via `POST /api/v1/sign-up` com e-mail único.
2. Inserir de 13 a 25 produtos via `POST /api/v1/products`, com imagens HTTPS reais e descrições
   variadas (uma nula, uma longa, uma URL quebrada de propósito).
3. Fazer login via `POST /api/v1/sign-in`, guardando o cookie.

### 5.2 Roteiro manual/headless

| Fluxo               | Verificação                                                                      |
| ------------------- | -------------------------------------------------------------------------------- |
| Home pública        | `/` lista produtos sem sessão; infinite scroll carrega páginas; fim do catálogo  |
| Card                | imagem, título, descrição; título navega para `/products/[id]`                   |
| Imagem              | `/_next/image` responde AVIF/WebP; fallback para URL quebrada                    |
| Sign-in             | `/auth/sign-in` valida, erro genérico, sucesso vai para `/`, header com DiceBear |
| Sessão              | recarregar mantém; logout limpa; header volta ao estado visitante                |
| Produto público     | `/products/[id]` mostra produto + avaliações + bloco de login                    |
| Produto autenticado | formulário aparece; publica avaliação; lista/média atualizam                     |
| Upsert              | segunda avaliação substitui a primeira; continua um item por pessoa/produto      |
| API                 | `GET/POST` com `200/201/400/401/404` conforme contratos                          |
| Responsivo          | 320, 390, 768, 1024, 1440 sem overflow horizontal                                |
| Regressão           | `/auth/sign-up`, `/auth/sign-up/success` e `/inicio` continuam funcionando       |

### 5.3 Critérios de aceite consolidados

- [ ] `/` lista todos os produtos, público, paginado com infinite scroll.
- [ ] `GET /api/v1/products` e `POST /api/v1/products` funcionam.
- [ ] Tabela `products` criada por migration.
- [ ] `/auth/sign-in` funciona com validação, erro genérico e sessão em cookie.
- [ ] Header alterna visitante/autenticado com avatar, nome, sobrenome e e-mail.
- [ ] `/products/[id]` mostra produto, avaliações e formulário/bloco de login.
- [ ] Avaliação autenticada é criada e sobrescrita por usuário/produto.
- [ ] Tabela `products_feedbacks` criada por migration.
- [ ] `typecheck`, lint dos arquivos tocados e build passam.
- [ ] Nenhuma funcionalidade fora dos três escopos foi implementada.

## 6. Riscos e mitigação

| Risco                                                     | Mitigação                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| Conflito de arquivos em paralelo                          | Ownership + contratos congelados na fase 0                                |
| Sem git para rollback                                     | Snapshot em diretório temporário antes da fase 1                          |
| Build falha por tabela ausente                            | Migrations aplicadas na fase 0                                            |
| `useSearchParams`/`params`/`cookies` com Cache Components | `<Suspense>` e leitura assíncrona, conforme docs do Next 16               |
| `revalidateTag` com assinatura antiga                     | Usar `revalidateTag("products", { expire: 0 })`                           |
| `remotePatterns` amplo                                    | Aceito para cadastro manual; restringir em produção                       |
| `POST /api/v1/products` aberto                            | Documentar e proteger antes de produção                                   |
| Subagente sai do escopo                                   | Revisão de diff contra snapshot e correção no orquestrador                |
| Lint global falha por markdown pré-existente              | Validar apenas código; não reformatar specs/docs do usuário sem aprovação |

## 7. Entrega

- Três planos aprovados.
- Três subagentes executados em paralelo.
- Integração e correções feitas pelo orquestrador.
- Evidências de E2E (respostas de API, screenshots, resultado dos comandos).
- Resumo final com o que foi entregue, pendências e riscos de produção.
