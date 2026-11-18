# Plano — Feedback (Avaliações de produtos)

> Spec de origem: `specs/feedback.md`
> Status: aguardando aprovação
> Escopo: Front-End + Back-End + Banco de Dados
> Feature: `feedback`

## 1. Resultado esperado

A página pública `/products/[id]` mostra as informações do produto, a lista de avaliações e, para
pessoas autenticadas, o formulário de nota (1–5) + comentário. Visitantes veem um bloco pedindo
login. Se a mesma pessoa avaliar de novo o mesmo produto, a avaliação anterior é substituída.

## 2. Estado atual relevante

- Não existe página de detalhes de produto.
- Não existem tabela, endpoint, repositório ou componentes de feedback.
- O sign-in entrega `getSession()` e o layout de plataforma com header.
- A home entrega `Product`, `getProductById()` e os links para `/products/[id]`.
- `accounts` já existe e é a origem do autor da avaliação.
- O projeto tem `date-fns`, `lucide-react`, React Hook Form, Zod, tRPC e shadcn.

## 3. Decisões de arquitetura e contratos

### 3.1 Banco de dados

A tabela segue a spec e ganha `updated_at` e uma constraint de unicidade para o upsert por
`(product_id, created_by)`.

```sql
-- supabase/migrations/0003_products_feedbacks.sql
create table if not exists public.products_feedbacks (
  id text primary key,
  score int not null,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null references public.accounts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,

  constraint products_feedbacks_score_range check (score between 1 and 5),
  constraint products_feedbacks_comment_length check (
    length(btrim(comment)) between 3 and 1000
  ),
  constraint products_feedbacks_one_per_account unique (product_id, created_by)
);

create index if not exists products_feedbacks_product_updated_idx
  on public.products_feedbacks (product_id, updated_at desc);

create or replace function public.products_feedbacks_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_feedbacks_set_updated_at on public.products_feedbacks;

create trigger products_feedbacks_set_updated_at
before update on public.products_feedbacks
for each row
execute function public.products_feedbacks_set_updated_at();

alter table public.products_feedbacks enable row level security;
```

- `score` é `int` com validação 1–5.
- `created_at` é a primeira publicação; `updated_at` muda quando a avaliação é substituída. A UI
  ordena por `updated_at desc`.
- RLS ligado e sem policies: somente a service role no servidor acessa. A leitura pública passa
  pela API/página.
- A migration é criada e aplicada pelo orquestrador na fase 0. O subagente **não edita**
  `supabase/migrations/`.

### 3.2 Contrato da API

`GET /api/v1/products/[id]/feedbacks` (público)

- `200 { "items": ProductFeedback[] }`; array vazio se não houver avaliações.
- `404` se o produto não existir.
- `500` genérico em falha inesperada.

`POST /api/v1/products/[id]/feedbacks` (autenticado)

Request:

```json
{ "score": 4, "comment": "Boa compra, mas o filtro entope rápido." }
```

Respostas:

| Status | Corpo                                                             | Quando               |
| ------ | ----------------------------------------------------------------- | -------------------- |
| `200`  | `{ "feedback": ProductFeedback }`                                 | Criado ou atualizado |
| `400`  | `{ "message": "Dados inválidos.", "issues": [...] }`              | JSON/schema inválido |
| `401`  | `{ "message": "Você precisa entrar para avaliar este produto." }` | Sem sessão válida    |
| `404`  | `{ "message": "Produto não encontrado." }`                        | Produto inexistente  |
| `500`  | `{ "message": "Não foi possível salvar sua avaliação." }`         | Falha inesperada     |

Regras:

- `score`: inteiro de 1 a 5.
- `comment`: texto `trim`, 3 a 1000 caracteres.
- O autor vem exclusivamente da sessão; nunca aceitar `createdBy` no body.
- Upsert por `(product_id, created_by)`: atualizar `score`, `comment`, `updated_at`; manter `id` e
  `created_at`.
- Não expor e-mail do autor na listagem pública; mostrar primeiro nome + inicial do sobrenome.

### 3.3 Tipos

`features/feedbacks/schema.ts`:

```ts
export type FeedbackAuthor = {
  firstName: string;
  lastName: string;
};

export type ProductFeedback = {
  id: string;
  score: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  productId: string;
  author: FeedbackAuthor | null;
};

export const feedbackInputSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
});
```

`server/feedbacks/repository.ts` exporta:

```ts
export async function listFeedbacks(productId: string): Promise<ProductFeedback[]>;

export async function upsertFeedback(input: {
  productId: string;
  createdBy: string;
  score: number;
  comment: string;
}): Promise<ProductFeedback>;
```

### 3.4 tRPC

`server/feedbacks/router.ts` exporta `feedbacksRouter`:

- `list`: `publicProcedure.input(z.object({ productId: z.string().min(1) })).query(...)`.
- `upsert`: `publicProcedure.input(feedbackInputSchema.extend({ productId: ... })).mutation(...)`;
  lê `getSession()` e lança `UNAUTHORIZED` se não houver sessão; valida o produto via
  `getProductById`; chama `upsertFeedback`.

O orquestrador monta `feedbacksRouter` em `server/trpc/router.ts` na fase 0. O subagente não edita
esse arquivo.

### 3.5 Página de detalhes

- Rota: `app/(platform)/products/[id]/page.tsx`.
- `params` é `Promise<{ id: string }>` no Next 16. Com Cache Components, acessar `params` deve
  acontecer dentro de `<Suspense>`; a página renderiza um fallback e resolve o conteúdo em um
  componente assíncrono.
- `generateMetadata` pode buscar o produto para title/description; se atrapalhar o build, usar
  metadata estática "Detalhes do produto".
- Se o produto não existir: `notFound()`.
- Conteúdo:
  - breadcrumb "Catálogo / Produto";
  - imagem grande com fallback;
  - título, descrição, link externo "Ver na loja";
  - nota média + quantidade de avaliações;
  - lista de avaliações (autor, estrelas, data relativa com `date-fns`/`pt-BR`, comentário);
  - coluna lateral: formulário (autenticado) ou bloco de login (visitante).
- Visitante: bloco com `LockKeyhole`, copy "Entre para avaliar este produto" e botões para
  `/auth/sign-in?next=/products/[id]` e `/auth/sign-up`.
- Autenticado: `FeedbackForm` com estrelas 1–5, textarea e contador de caracteres. Se já existir
  avaliação da pessoa, pré-preencher e trocar o CTA para "Atualizar avaliação", com aviso de que a
  anterior será substituída.
- Após sucesso: mensagem inline, `router.refresh()` e reset do formulário com os novos valores.

### 3.6 UI

- Reutilizar a identidade `prova*` e os tokens existentes.
- Criar `StarRating` (somente leitura) e `StarRatingInput` (radio group acessível com `fieldset` e
  `legend`) em `features/feedbacks/components/`.
- Criar `components/ui/textarea.tsx` no padrão shadcn, se necessário; caso contrário, usar
  `<textarea>` com classes dos tokens.
- Carregar a skill `frontend-design` antes de fechar a UI.
- Não alterar `app/globals.css`, `app/layout.tsx`, `app/(platform)/layout.tsx`, `next.config.ts` nem
  o header.

## 4. Implementação

### 4.1 Back-end

1. Criar `features/feedbacks/schema.ts`.
2. Criar `server/feedbacks/repository.ts`:
   - `listFeedbacks` com join em `accounts(first_name, last_name)`;
   - `upsertFeedback` com busca por `(product_id, created_by)`, update ou insert com `nanoid()`;
   - tratar violação de unicidade (`23505`) com retry de update.
3. Criar `server/feedbacks/router.ts`.
4. Criar `app/api/v1/products/[id]/feedbacks/route.ts` com `GET` e `POST`.
5. Aplicar a migration `0003_products_feedbacks.sql` (fase 0, orquestrador).

### 4.2 Front-end

1. Criar `app/(platform)/products/[id]/page.tsx` e, se necessário, `loading.tsx`.
2. Criar `features/feedbacks/components/product-detail.tsx` (Server Component assíncrono) ou
   equivalente.
3. Criar `features/feedbacks/components/feedback-list.tsx`, `feedback-item.tsx`,
   `star-rating.tsx`.
4. Criar `features/feedbacks/components/feedback-form.tsx` (Client Component).
5. Criar `features/feedbacks/components/sign-in-required.tsx`.
6. Criar `features/feedbacks/components/product-hero.tsx` e `product-image.tsx` com fallback.
7. Criar `features/feedbacks/components/product-detail-skeleton.tsx`.

### 4.3 Arquivos

| Arquivo                                           | Ação                           |
| ------------------------------------------------- | ------------------------------ |
| `supabase/migrations/0003_products_feedbacks.sql` | criar na fase 0 (orquestrador) |
| `features/feedbacks/schema.ts`                    | criar                          |
| `server/feedbacks/repository.ts`                  | criar                          |
| `server/feedbacks/router.ts`                      | criar                          |
| `app/api/v1/products/[id]/feedbacks/route.ts`     | criar                          |
| `app/(platform)/products/[id]/page.tsx`           | criar                          |
| `app/(platform)/products/[id]/loading.tsx`        | criar (opcional)               |
| `features/feedbacks/components/*`                 | criar                          |
| `components/ui/textarea.tsx`                      | criar (se necessário)          |

**Não editar:** `server/trpc/router.ts`, `app/globals.css`, `app/layout.tsx`,
`app/(platform)/layout.tsx`, `components/site-header.tsx`, `app/page.tsx`,
`app/(platform)/page.tsx`, `server/products/*`, `features/products/*`,
`supabase/migrations/0002*`, arquivos de `sign-in`.

## 5. Edge cases

- Visitante: lista avaliações, mas não vê o formulário; vê o bloco de login.
- Sessão expirada/adulterada: tratada como visitante; POST retorna `401`.
- Produto inexistente: `404` na API e `notFound()` na página.
- Usuário avalia duas vezes: a segunda chamada atualiza a mesma linha; a listagem mostra uma única
  avaliação por pessoa/produto.
- Corrida entre duas submissões do mesmo usuário: unique constraint + retry de update.
- Nota fora de 1–5, comentário curto/longo, espaços em branco: `400` com mensagem clara.
- Comentário com HTML/script: React escapa; não usar `dangerouslySetInnerHTML`.
- Conta removida: FK `on delete cascade` remove as avaliações; sessão deixa de valer.
- Muitas avaliações: listar todas nesta entrega; paginação de avaliações fica para depois.
- Produto sem avaliações: estado vazio com convite para avaliar (se autenticado).
- Uma avaliação: média igual à nota; formatação com uma casa decimal.
- Nome do autor longo: truncar; nunca quebrar o layout.
- Mobile: formulário abaixo da lista, sem sticky; desktop: coluna lateral sticky.
- Data inválida/legada: fallback para texto sem data.

## 6. Fora de escopo

- Criar/editar/deletar produtos.
- Deletar avaliação, curtir, denunciar, moderação, resposta do vendedor.
- Paginação de avaliações, filtros por nota, ordenação configurável.
- Upload de imagem, e-mail transacional, notificações.
- Perfil público do autor.

## 7. Validação

1. `bun run typecheck`.
2. `bunx biome check app/(platform)/products features/feedbacks server/feedbacks app/api/v1/products`.
3. `bun run build` (com as migrations aplicadas).
4. `curl`:
   - `GET /api/v1/products/[id]/feedbacks` sem avaliações -> `200 { "items": [] }`.
   - `GET` de produto inexistente -> `404`.
   - `POST` sem cookie -> `401`.
   - `POST` com score 0/6, comentário vazio/curto -> `400`.
   - `POST` autenticado válido -> `200` com feedback.
   - Repetir o `POST` com outra nota/comentário -> `200` e a listagem continua com um item, com os
     novos dados e `updatedAt` maior.
5. Navegador:
   - visitante vê produto, avaliações e bloco de login; não vê formulário.
   - login pelo bloco leva de volta a `/products/[id]` (via `next`).
   - autenticado vê formulário; publica avaliação; lista e média atualizam.
   - segunda avaliação pré-preenche e atualiza a existente.
   - produto sem avaliações mostra estado vazio.
   - responsivo em 320, 390, 768, 1024 e 1440, sem overflow horizontal.
6. Verificar que a home continua listando e linkando para `/products/[id]`.

## 8. Dependências e riscos

- Depende de `getSession()` (sign-in) e de `Product`/`getProductById()` (home). Contratos definidos
  nos planos respectivos; não alterar assinaturas.
- Depende das migrations `0002` (products) e `0003` (feedbacks), aplicadas na fase 0.
- Depende do layout/header do sign-in; a página funciona sem header, mas a experiência final usa.
- `use cache` não é usado na listagem de feedbacks para refletir o upsert imediatamente.
- O join com `accounts` depende da FK `created_by`; se o embed do Supabase retornar array, normalizar
  para objeto no mapper.
- A página é dinâmica (cookies/params); com Cache Components, manter o acesso a `params`/cookies
  dentro de `<Suspense>`.
- Sem moderação, qualquer pessoa autenticada pode publicar texto público; registrar como pendência
  de produto/segurança.

## 9. Definition of Done

- `/products/[id]` pública com produto, avaliações e formulário/bloco de login.
- `POST /api/v1/products/[id]/feedbacks` autenticado, com upsert por usuário/produto.
- Tabela `products_feedbacks` criada por migration e aplicada.
- Média, lista e formulário atualizam após publicar/atualizar.
- `typecheck`, lint dos arquivos tocados e build passam.
- Nenhuma alteração fora dos arquivos listados.
