-- 0003_products_feedbacks.sql
-- Avaliacoes de produtos (spec: specs/feedback.md, requisito 3).
--
-- `updated_at` e a constraint unica (product_id, created_by) implementam a
-- regra de sobrescrita: cada pessoa tem no maximo uma avaliacao por produto.

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

comment on table public.products_feedbacks is 'Avaliacoes (nota + comentario) por produto e conta.';
comment on column public.products_feedbacks.created_at is 'Primeira publicacao da avaliacao.';
comment on column public.products_feedbacks.updated_at is 'Ultima substituicao da avaliacao.';

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

-- RLS ligado e SEM policies: somente a service_role acessa.
alter table public.products_feedbacks enable row level security;
