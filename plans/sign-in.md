# Plano — Sign-in (Autenticação)

> Spec de origem: `specs/sign-in.md`
> Status: aguardando aprovação
> Escopo: Front-End + Back-End
> Feature: `sign-in`

## 1. Resultado esperado

Uma pessoa com conta criada em `/auth/sign-up` consegue entrar em `/auth/sign-in` com e-mail e
senha, recebe uma sessão em cookie `HttpOnly` e passa a ver, no cabeçalho da plataforma, seu avatar
DiceBear, nome, sobrenome e e-mail. Sem sessão, o cabeçalho mostra o botão de login.

## 2. Estado atual relevante

- O sign-up já existe e grava em `public.accounts` (`id`, `first_name`, `last_name`, `email`,
  `password` com bcrypt, `salt`, `active`).
- A raiz `/` hoje é um `redirect("/auth/sign-up")` em `app/page.tsx`.
- O layout raiz já tem fontes, metadata e o `TRPCProvider`; não há layout de plataforma.
- O `AuthShell` de `app/auth/_components/auth-shell.tsx` já define a identidade visual `prova*`.
- `createTRPCContext()` ainda não carrega sessão.
- `bun run typecheck` e `bun run build` passam. `bun run lint` já falha antes desta feature por
  formatação de markdown em `specs/`, `docs/`, `Notes.md` e `.agents/`.

## 3. Decisões de arquitetura e contratos

### 3.1 Decisão de integração com a feature `home`

O requisito "criar uma home sem nada por enquanto" do spec de sign-in **não será executado aqui**.
A home real é a feature `home`, que cria `app/(platform)/page.tsx` e remove o redirect de
`app/page.tsx`. O sign-in entrega o layout base, o cabeçalho e a sessão; a home consome esse layout.

Isso evita que dois subagentes disputem `app/page.tsx` e `app/(platform)/layout.tsx` em paralelo.

### 3.2 Sessão

- Cookie: `prova_session`.
- Formato: `base64url(payload).base64url(hmacSha256(payload))`.
- Payload: `{ sub: accountId, iat: epochSeconds, exp: epochSeconds }`.
- Validade: 7 dias.
- Flags: `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `secure` apenas em produção.
- Segredo: `AUTH_SESSION_SECRET`; fallback documentado para `SUPABASE_SERVICE_ROLE_KEY` enquanto a
  variável não existir. Adicionar `AUTH_SESSION_SECRET=` ao `.env.example` com comentário.
- `getSession()` valida assinatura, expiração e busca a conta em `accounts` com `active = true`.
  Retorna `null` para cookie ausente, inválido, expirado ou conta inativa.
- Não criar tabela de sessões: o cookie assinado é suficiente para o escopo.

### 3.3 Contrato da API

`POST /api/v1/sign-in`

Request:

```json
{ "email": "pessoa@exemplo.com", "password": "senha-secreta" }
```

Respostas:

| Status | Corpo                                                                     | Quando                                            |
| ------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `200`  | `{ "account": { "id", "firstName", "lastName", "email" } }`               | Credenciais válidas; define o cookie              |
| `400`  | `{ "message": "Dados inválidos.", "issues": [{ "field", "message" }] }`   | JSON inválido ou schema inválido                  |
| `401`  | `{ "message": "Email ou senha inválidos." }`                              | E-mail inexistente, senha errada ou conta inativa |
| `500`  | `{ "message": "Não foi possível entrar. Tente novamente em instantes." }` | Falha inesperada                                  |

`POST /api/v1/sign-out` (relacionado, mínimo): `204`, apaga o cookie.

Regras:

- A mensagem de `401` é sempre genérica; nunca revelar se o e-mail existe.
- Normalizar o e-mail com `trim().toLowerCase()` antes de buscar.
- Comparar a senha com `bcrypt.compare` contra `accounts.password`.
- Quando o e-mail não existir, executar um `bcrypt.compare` contra um hash dummy para reduzir
  diferença de tempo entre "e-mail inexistente" e "senha errada".
- Não logar senha nem hash.

### 3.4 Serviços e tipos compartilhados

`server/accounts/repository.ts` ganha:

```ts
export type AuthenticatedAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export async function authenticateAccount(
  email: string,
  password: string,
): Promise<AuthenticatedAccount | null>;
```

`server/auth/session.ts` exporta:

```ts
export type SessionAccount = AuthenticatedAccount;

export async function createSession(accountId: string): Promise<void>;
export async function destroySession(): Promise<void>;
export const getSession: () => Promise<SessionAccount | null>;
```

`server/auth/router.ts` exporta `authRouter` com `signIn` e `signOut` reutilizando o mesmo serviço.
A rota REST é a fonte de verdade do contrato HTTP e define o cookie diretamente; a procedure tRPC
existe para clientes tipados. O orquestrador monta `authRouter` em `server/trpc/router.ts` na fase 0.

### 3.5 UI e navegação

- `/auth/sign-in`: página pública, fora do layout de plataforma, usando o `AuthShell` existente.
- Formulário com React Hook Form + Zod, validação no cliente, toggle de senha, estado de envio,
  alerta vermelho para erro de credenciais e link para `/auth/sign-up`.
- Sucesso: `router.push(next ?? "/")` + `router.refresh()`. `next` é opcional, vem de
  `useSearchParams`, precisa começar com `/` e não pode começar com `//` (evita open redirect).
  Sem `next`, o destino é `/`, conforme a spec.
- `/auth/sign-in` fica dentro de um `<Suspense>` por causa de `useSearchParams` com Cache Components.
- Layout base: `app/(platform)/layout.tsx` com `SiteHeader` e `SiteFooter`. A home e a página de
  produto ficam dentro desse grupo; as páginas `/auth/*` continuam fora.
- `SiteHeader` é um Server Component assíncrono; lê `getSession()` e é envolto em `<Suspense>` no
  layout, com `SiteHeaderSkeleton` como fallback.
- Sem sessão: links "Entrar" (`/auth/sign-in`) e "Criar conta" (`/auth/sign-up`).
- Com sessão: avatar DiceBear (`https://api.dicebear.com/9.x/notionists/svg?seed=<email>`), nome +
  sobrenome, e-mail (escondido no mobile) e botão "Sair".
- `SignOutButton` é Client Component: `POST /api/v1/sign-out`, depois `router.refresh()`.
- Atualizar o rodapé de `/auth/sign-up` para linkar para `/auth/sign-in` no lugar de
  "O login chega em breve".

## 4. Implementação

### 4.1 Back-end

1. Criar `features/sign-in/schema.ts` com `signInSchema` (e-mail válido, senha obrigatória, limite de
   72 bytes reaproveitando `MAX_PASSWORD_BYTES`/`passwordByteLength` do sign-up).
2. Estender `server/accounts/repository.ts` com `authenticateAccount`; não alterar `createAccount`.
3. Criar `server/auth/session.ts` com HMAC, cookie e `getSession`.
4. Criar `server/auth/router.ts` com `authRouter`.
5. Criar `app/api/v1/sign-in/route.ts` e `app/api/v1/sign-out/route.ts`.
6. Adicionar `AUTH_SESSION_SECRET=` ao `.env.example`.
7. O orquestrador monta `authRouter` em `server/trpc/router.ts` (arquivo compartilhado, não editado
   pelo subagente).

### 4.2 Front-end

1. Criar `app/auth/sign-in/page.tsx` com metadata e `AuthShell`.
2. Criar `app/auth/sign-in/sign-in-form.tsx` com validação, erro genérico, pending e `next`.
3. Criar `app/(platform)/layout.tsx`, `components/site-header.tsx`,
   `components/site-header-skeleton.tsx`, `components/sign-out-button.tsx` e
   `components/site-footer.tsx`.
4. Ajustar o link de login em `app/auth/sign-up/sign-up-form.tsx`.
5. Carregar a skill `frontend-design` antes de fechar a UI e manter os tokens `paper`, `paper-raised`,
   `ink`, `ink-soft`, `line`, `signal`, `signal-dark`, `destructive`.
6. Não alterar `app/globals.css`; a identidade existente cobre esta feature.

### 4.3 Arquivos

| Arquivo                               | Ação                                     |
| ------------------------------------- | ---------------------------------------- |
| `features/sign-in/schema.ts`          | criar                                    |
| `server/accounts/repository.ts`       | alterar (somente adicionar autenticação) |
| `server/auth/session.ts`              | criar                                    |
| `server/auth/router.ts`               | criar                                    |
| `app/api/v1/sign-in/route.ts`         | criar                                    |
| `app/api/v1/sign-out/route.ts`        | criar                                    |
| `app/auth/sign-in/page.tsx`           | criar                                    |
| `app/auth/sign-in/sign-in-form.tsx`   | criar                                    |
| `app/(platform)/layout.tsx`           | criar                                    |
| `components/site-header.tsx`          | criar                                    |
| `components/site-header-skeleton.tsx` | criar                                    |
| `components/sign-out-button.tsx`      | criar                                    |
| `components/site-footer.tsx`          | criar                                    |
| `app/auth/sign-up/sign-up-form.tsx`   | alterar (link para login)                |
| `.env.example`                        | alterar (segredo opcional)               |

**Não editar:** `app/page.tsx`, `app/(platform)/page.tsx`, `server/trpc/router.ts`,
`supabase/migrations/*`, `app/globals.css`, `next.config.ts`, arquivos de `home` ou `feedback`.

## 5. Edge cases

- JSON malformado, campos ausentes, e-mail inválido, senha vazia.
- E-mail com maiúsculas/espaços; senha com acentos; senha acima de 72 bytes.
- E-mail inexistente, senha errada e conta inativa devem retornar o mesmo `401`.
- Cookie ausente, adulterado, expirado ou com conta removida/inativa: tratar como visitante.
- `next` externo, `//evil.com`, `javascript:`: ignorar e ir para `/`.
- Falha do Supabase: `500` genérico, sem vazar detalhes.
- Header com nome/e-mail longos: truncar sem quebrar o layout.
- Mobile: avatar + primeiro nome; desktop: nome completo + e-mail.
- Duplo submit: botão desabilitado enquanto `isPending`.

## 6. Fora de escopo

- Criar conta, recuperar senha, enviar e-mail, verificar e-mail, OAuth, "lembrar de mim".
- Criar a home real (feature `home`).
- Página de produto, avaliações, perfil editável, administração de contas.
- Rate limiting e bloqueio por tentativas (recomendado para produção, mas não pedido).

## 7. Validação

1. `bun run typecheck`.
2. `bunx biome check app/auth app/(platform) components features/sign-in server/auth server/accounts lib`.
3. `bun run build` (após a fase 0 aplicar as migrations compartilhadas).
4. `curl`:
   - `POST /api/v1/sign-in` com JSON inválido -> `400`.
   - e-mail inexistente -> `401` com "Email ou senha inválidos.".
   - senha errada -> `401` com a mesma mensagem.
   - credenciais válidas -> `200`, `Set-Cookie: prova_session=...; HttpOnly`.
   - `POST /api/v1/sign-out` -> `204` e cookie removido.
5. Navegador:
   - `/auth/sign-in` sem sessão mostra formulário e link de cadastro.
   - erro de validação client-side aparece por campo.
   - erro `401` aparece em alerta vermelho com foco.
   - sucesso navega para `/` e o header mostra avatar/nome/e-mail.
   - recarregar mantém a sessão; sair volta ao estado visitante.
   - `/` sem sessão mostra "Entrar"; com sessão mostra o avatar.
   - responsivo em 320, 390, 768, 1024 e 1440 sem overflow horizontal.

## 8. Dependências e riscos

- Depende de `accounts` já existente; nenhuma migration nova.
- A home e a página de produto dependem de `getSession`, `SiteHeader` e do layout de plataforma.
- O orquestrador precisa montar `authRouter` e garantir que `app/(platform)/page.tsx` (home) exista.
- `useSearchParams` exige `<Suspense>` com Cache Components.
- O fallback de segredo para a service role key é aceitável em desenvolvimento; em produção,
  `AUTH_SESSION_SECRET` deve ser obrigatório.
- Sem rate limiting, o endpoint fica exposto a força bruta; registrar como pendência de produção.

## 9. Definition of Done

- `/auth/sign-in` funcional com validação client-side e erro genérico.
- `POST /api/v1/sign-in` retorna `200/400/401` conforme contrato e cria cookie de sessão.
- Header alterna entre visitante e autenticado com DiceBear, nome, sobrenome e e-mail.
- Layout base de plataforma aplicado à home e à página de produto.
- Logout funcional.
- `typecheck`, lint dos arquivos tocados e build passam.
- Nenhuma alteração fora dos arquivos listados.
