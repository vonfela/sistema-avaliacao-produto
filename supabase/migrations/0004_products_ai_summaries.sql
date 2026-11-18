-- 0004_products_ai_summaries.sql
-- Resumo por IA das avaliacoes de cada produto (spec: specs/ai-summary.md).
--
-- `feedback_count` + `feedbacks_updated_at` formam a "assinatura" das avaliacoes
-- resumidas: se mudarem, o resumo esta desatualizado e e regenerado.

create table if not exists public.products_ai_summaries (
  product_id text primary key references public.products(id) on delete cascade,
  summary text not null,
  feedback_count int not null,
  feedbacks_updated_at timestamptz not null,
  model text not null,
  generated_at timestamptz not null default now(),

  constraint products_ai_summaries_summary_length check (
    length(btrim(summary)) between 1 and 2000
  ),
  constraint products_ai_summaries_feedback_count check (feedback_count > 0)
);

comment on table public.products_ai_summaries is 'Resumo gerado por IA (Mastra) a partir das avaliacoes do produto.';
comment on column public.products_ai_summaries.feedbacks_updated_at is 'Maior updated_at entre as avaliacoes resumidas.';

-- RLS ligado e SEM policies: somente a service_role acessa.
alter table public.products_ai_summaries enable row level security;
