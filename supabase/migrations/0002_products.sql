-- 0002_products.sql
-- Catalogo publico de produtos (spec: specs/home.md, requisito 2).
--
-- `image_url` e uma coluna adicional em relacao ao texto da spec: o POST manual
-- precisa aceitar imagem e o card da home precisa renderiza-la.

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

comment on table public.products is 'Catalogo publico de produtos exibido na home.';
comment on column public.products.score is 'Flag booleana da spec; a nota real vem de products_feedbacks.';

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

-- RLS ligado e SEM policies: somente a service_role (que ignora RLS) acessa.
-- A leitura publica acontece pelas rotas/Server Components do Next.
alter table public.products enable row level security;
