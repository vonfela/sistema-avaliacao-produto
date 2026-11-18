-- 0001_accounts.sql
-- Tabela de contas do sign-up (spec: specs/sign-up.md, requisito 3).
--
-- `salt` e derivado do proprio hash do bcrypt no momento da escrita
-- (bcrypt.getSalt), portanto nunca diverge da senha.

create table if not exists public.accounts (
  id text primary key,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  password text not null,
  salt text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint accounts_email_not_blank check (length(btrim(email)) > 3),
  constraint accounts_first_name_not_blank check (length(btrim(first_name)) > 0),
  constraint accounts_last_name_not_blank check (length(btrim(last_name)) > 0),
  constraint accounts_password_is_bcrypt check (password like '$2%')
);

comment on table public.accounts is 'Contas criadas pelo fluxo de sign-up.';
comment on column public.accounts.password is 'Hash bcrypt completo ($2b$custo$salt+hash).';
comment on column public.accounts.salt is 'Salt extraido do hash bcrypt para inspecao/auditoria.';

-- Mantem updated_at coerente sem depender da aplicacao.
create or replace function public.accounts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;

create trigger accounts_set_updated_at
before update on public.accounts
for each row
execute function public.accounts_set_updated_at();

-- RLS ligado e SEM policies: nenhuma chave publica/anon le ou escreve aqui.
-- Somente a service_role (que ignora RLS) acessa, e ela so existe no servidor.
alter table public.accounts enable row level security;
