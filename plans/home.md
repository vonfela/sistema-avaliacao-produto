# Plano — Home (Listagem de produtos)

> Spec de origem: `specs/home.md`
> Status: aguardando aprovação
> Escopo: Front-End + Back-End + Banco de Dados
> Feature: `home`

## 1. Resultado esperado

A rota `/` passa a ser um catálogo público de produtos, sem autenticação, com infinite scroll. Cada
card mostra imagem, título e descrição curta; o título leva para `/products/[id]`. Também existem
`GET /api/v1/products` (paginado) e `POST /api/v1/products` (inserção manual).

## 2. Estado atual relevante

- `/` ainda é um redirect para `/auth/sign-up` (`app/page.tsx`).
- Não existe tabela `products`; o banco tem apenas `accounts` (migration `0001_accounts.sql`).
- O projeto usa Supabase com service role no servidor (`lib/supabase/admin.ts`), tRPC e TanStack Query.
- O `TRPCProvider` já está no layout raiz; `staleTime` padrão de 30s.
- A identidade visual `prova*` já existe em `app/globals.css` (`paper`, `ink`, `signal`, etc.).
- `next.config.ts` ainda não configura `images.remotePatterns`.
- O sign-in entrega `app/(platform)/layout.tsx` e o header; esta feature não deve criá-los.
- A página de detalhes `/products/[id]` é da feature `feedback`; aqui só criamos o link.

## 3. Decisões de arquitetura e contratos

### 3.1 Banco de dados

A tabela `products` segue a spec, com **uma coluna adicional**: `image_url`. A spec pede que o POST
manual aceite "imagem", mas não lista a coluna; sem ela não é possível renderizar o card.

```sql
-- supabase/migrations/0002_products.sql
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  image_url text not null,
  external_link text not null,
  score boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_name_length check (length(btrim(name)) between 2 and 120),
  constraint products_description_length check (
    description is null or length(description) <= 600
  ),
  constraint products_image_url_is_http check (image_url ~ '^https?://'),
  constraint products_external_link_is_http check (external_link ~ '^https?://')
);

create index if not exists products_created_at_id_idx
  on public.products (created_at desc, id desc);

create or replace function public.products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.products_set_updated_at();

alter table public.products enable row level security;
```

- `score boolean` é armazenado conforme a spec, mas **não é a nota do produto**. A nota exibida vem
  das avaliações (`products_feedbacks`, feature `feedback`).
- RLS ligado e sem policies: leitura/escrita só pela service role no servidor. A leitura pública
  acontece via API, nunca direto do browser.
- A migration é criada e aplicada pelo orquestrador na fase 0, antes dos subagentes, para que os três
  fluxos possam rodar em paralelo. O subagente da home **não edita** `supabase/migrations/`.

### 3.2 Contrato da API

`GET /api/v1/products?page=1&limit=12`

- `page`: inteiro >= 1, default `1`.
- `limit`: inteiro entre 1 e 24, default `12`.
- `200`:

```json
{
  "items": [
    {
      "id": "abc123",
      "name": "Cafeteira elétrica",
      "description": "Café filtrado em 5 minutos.",
      "imageUrl": "https://...",
      "externalLink": "https://...",
      "score": false,
      "createdAt": "2026-10-29T12:00:00.000Z",
      "updatedAt": "2026-10-29T12:00:00.000Z"
    }
  ],
  "nextPage": 2
}
```

- Catálogo vazio: `200 { "items": [], "nextPage": null }` (atende "200 ou array vazio").
- Query inválida: `400 { "message": "Parâmetros inválidos.", "issues": [...] }`.
- Erro inesperado: `500 { "message": "Não foi possível carregar os produtos." }`.
- O envelope `{ items, nextPage }` é necessário para o infinite scroll; um array puro não informa se
  existe próxima página.

`POST /api/v1/products`

```json
{
  "name": "Cafeteira elétrica",
  "description": "Café filtrado em 5 minutos.",
  "imageUrl": "https://images.exemplo.com/cafeteira.jpg",
  "externalLink": "https://loja.exemplo.com/cafeteira"
}
```

- `201` com o `Product` criado.
- `400` com issues de validação.
- `id` gerado com `nanoid()` na camada de API; `score` default `false`; timestamps gerados no
  repositório/banco.
- O endpoint de escrita fica sem autenticação, conforme a spec ("inserção manual"). Registrar como
  risco: antes de produção, proteger com token/admin ou desabilitar.

### 3.3 Tipos e schemas compartilhados

`features/products/schema.ts`:

```ts
export type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  externalLink: string;
  score: boolean;
  createdAt: string;
  updatedAt: string;
};

export const listProductsInputSchema = z.object({
  cursor: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(24).default(12),
});

export const createProductInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional(),
  imageUrl: z.url().startsWith("http"),
  externalLink: z.url().startsWith("http"),
});
```

`server/products/repository.ts` exporta:

```ts
export async function listProducts(input: {
  page: number;
  limit: number;
}): Promise<{ items: Product[]; nextPage: number | null }>;

export async function createProduct(input: CreateProductInput): Promise<Product>;

export async function getProductById(id: string): Promise<Product | null>;
```

`getProductById` é o contrato consumido pela página de detalhes da feature `feedback`. Não mudar a
assinatura sem alinhar com o orquestrador.

### 3.4 tRPC

`server/products/router.ts` exporta `productsRouter`:

- `list`: `publicProcedure.input(listProductsInputSchema).query(...)`; `cursor` é a página (default 1).
- `create`: `publicProcedure.input(createProductInputSchema).mutation(...)`; após criar, chama
  `revalidateTag("products", { expire: 0 })`.

O orquestrador monta `productsRouter` em `server/trpc/router.ts` na fase 0. O subagente não edita
esse arquivo.

### 3.5 Cache e performance

- `listProducts` usa `"use cache"` + `cacheLife("minutes")` + `cacheTag("products")`.
- `products.create` invalida com `revalidateTag("products", { expire: 0 })` para o próximo request
  já enxergar o produto.
- `getProductById` fica sem cache para a página de detalhes refletir alterações.
- A primeira página é renderizada no servidor e passada como `initialData` ao infinite scroll; o
  cliente não refaz a busca da página 1 no primeiro paint.
- Imagens com `next/image`, `sizes` corretos, `quality={80}`, formatos AVIF/WebP e lazy loading
  (exceto os primeiros cards). Adicionar `images.remotePatterns` em `next.config.ts`.
- Como as URLs de imagem vêm de cadastro manual, o `remotePatterns` será amplo
  (`https`, `hostname: "**"`). Isso permite qualquer host HTTPS; documentar o risco e recomendar
  restringir a CDNs conhecidas em produção.
- `GET /api/v1/products` pode responder com `Cache-Control: public, s-maxage=60,
  stale-while-revalidate=300`; o cache de dados do `use cache` continua sendo a fonte principal.

## 4. Implementação

### 4.1 Back-end

1. Criar `features/products/schema.ts` com tipos, schemas e mapper de linha do Supabase.
2. Criar `server/products/repository.ts` com `listProducts`, `createProduct`, `getProductById`.
3. Criar `server/products/router.ts`.
4. Criar `app/api/v1/products/route.ts` com `GET` e `POST`.
5. Aplicar a migration `0002_products.sql` (fase 0, orquestrador).
6. Configurar `next.config.ts` com `images.remotePatterns` e formatos.

### 4.2 Front-end

1. Criar `app/(platform)/page.tsx` (home real) e **remover** `app/page.tsx` (redirect antigo).
2. Criar `features/products/components/home-hero.tsx` com título editorial, texto curto e CTA
   discreto; sem busca/filtros (fora de escopo).
3. Criar `features/products/components/product-feed.tsx` (Client Component) com
   `trpc.products.list.useInfiniteQuery`, `initialData`, `IntersectionObserver` e deduplicação por
   `id`.
4. Criar `features/products/components/product-card.tsx` (Client Component) com link no título para
   `/products/[id]`, imagem com fallback e descrição em `line-clamp-2`.
5. Criar `features/products/components/product-image.tsx` com fallback para imagem quebrada
   (gradiente + inicial do produto), sem layout shift.
6. Criar `features/products/components/product-grid-skeleton.tsx` e estado vazio elegante.
7. Usar apenas tokens existentes (`paper`, `paper-raised`, `ink`, `ink-soft`, `line`, `signal`,
   `signal-dark`, `destructive`) e `font-display` para títulos.
8. Carregar a skill `frontend-design` antes de fechar a UI.
9. Não alterar `app/globals.css`, `app/layout.tsx`, `app/(platform)/layout.tsx` nem o header.

### 4.3 Arquivos

| Arquivo                                                  | Ação                           |
| -------------------------------------------------------- | ------------------------------ |
| `supabase/migrations/0002_products.sql`                  | criar na fase 0 (orquestrador) |
| `features/products/schema.ts`                            | criar                          |
| `server/products/repository.ts`                          | criar                          |
| `server/products/router.ts`                              | criar                          |
| `app/api/v1/products/route.ts`                           | criar                          |
| `app/(platform)/page.tsx`                                | criar                          |
| `app/page.tsx`                                           | remover                        |
| `next.config.ts`                                         | alterar (imagens)              |
| `features/products/components/home-hero.tsx`             | criar                          |
| `features/products/components/product-feed.tsx`          | criar                          |
| `features/products/components/product-card.tsx`          | criar                          |
| `features/products/components/product-image.tsx`         | criar                          |
| `features/products/components/product-grid-skeleton.tsx` | criar                          |

**Não editar:** `server/trpc/router.ts`, `app/globals.css`, `app/layout.tsx`,
`app/(platform)/layout.tsx`, `components/site-header.tsx`, `app/auth/*`, `supabase/migrations/0003*`,
arquivos de `feedback`.

## 5. Edge cases

- Catálogo vazio: estado vazio com copy clara, sem quebrar o infinite scroll.
- Uma página exata de produtos: usar `limit + 1` na query para saber se há próxima página e não
  exibir um "carregar mais" eterno.
- Descrição nula/vazia: card mostra fallback curto ("Sem descrição.").
- Nome muito longo: truncar com `line-clamp`/`truncate` sem estourar o card.
- Imagem quebrada, host lento ou URL inválida: fallback visual; nunca mostrar ícone de imagem
  quebrada.
- Imagem externa sem CORS: `next/image` busca no servidor, então não depende de CORS do browser.
- Produto inserido entre páginas: offset pode repetir um item; deduplicar por `id` no cliente.
- Erro na página 2+: manter os itens já carregados e mostrar "Tentar novamente" inline.
- `page`/`limit` inválidos ou gigantes: `400` ou clamp; não permitir `limit > 24`.
- Banco fora do ar: `500` genérico; a home mostra estado de erro com retry.
- Sem autenticação: a home e a API de leitura funcionam para visitantes.
- Build sem tabela: a fase 0 aplica a migration antes do build; se a tabela não existir, o build
  deve falhar de forma explícita (não esconder erro de schema).

## 6. Fora de escopo

- Página de detalhes do produto (feature `feedback`).
- Editar/deletar produtos, upload de imagem, moderação, categorias, busca, filtros e ordenação.
- Autenticação no POST de produtos.
- Avaliações/nota média na home (a home mostra apenas o card; a nota detalhada é da feature
  `feedback`).
- Paginação por cursor; usamos offset (`page`) por simplicidade e estabilidade suficiente.

## 7. Validação

1. `bun run typecheck`.
2. `bunx biome check app/(platform) app/api/v1/products features/products server/products next.config.ts`.
3. `bun run build` (com a migration já aplicada).
4. `curl`:
   - `GET /api/v1/products` sem produtos -> `200 { "items": [], "nextPage": null }`.
   - `POST /api/v1/products` inválido -> `400`.
   - `POST /api/v1/products` válido -> `201` com `id` nanoid.
   - `GET /api/v1/products?page=1&limit=2` -> 2 itens e `nextPage: 2` quando houver mais.
   - `GET /api/v1/products?page=2&limit=2` -> itens diferentes.
   - `GET /api/v1/products?limit=999` -> `400`.
5. Navegador:
   - `/` lista produtos sem login.
   - card mostra imagem, título e descrição; título navega para `/products/[id]`.
   - com 0, 1, 13 e 25 produtos, o infinite scroll carrega as páginas corretas e para no fim.
   - skeleton aparece no primeiro carregamento e ao buscar próxima página.
   - imagem quebrada cai no fallback.
   - responsivo em 320, 390, 768, 1024 e 1440, sem overflow horizontal.
   - imagem servida por `/_next/image` com `Content-Type` AVIF/WebP.
6. Conferir que `/auth/sign-in` e `/auth/sign-up` continuam funcionando (header/layout do sign-in).

## 8. Dependências e riscos

- Depende da fase 0: migration `0002` aplicada, `productsRouter` montado e `next.config.ts` livre.
- Depende do sign-in apenas para o header/layout; a home funciona sem sessão.
- A feature `feedback` depende de `Product` e `getProductById`; manter o contrato.
- `remotePatterns` amplo pode permitir que a otimização de imagem busque hosts arbitrários. É um
  risco aceito para cadastro manual; restringir em produção.
- `POST /api/v1/products` aberto é um risco de abuso; proteger antes de produção.
- `use cache` + `revalidateTag` exige a assinatura de dois argumentos no Next 16
  (`revalidateTag("products", { expire: 0 })`).

## 9. Definition of Done

- `/` lista produtos públicos com infinite scroll, imagem, título e descrição.
- Título do produto navega para `/products/[id]`.
- `GET /api/v1/products` paginado e `POST /api/v1/products` manuais funcionando.
- Tabela `products` criada por migration e aplicada no Supabase.
- Imagens otimizadas com `next/image` e fallback.
- `typecheck`, lint dos arquivos tocados e build passam.
- Nenhuma alteração fora dos arquivos listados.
