# Sign-In (Autenticação)

## Escopo
Front-End, Back-End

## Contexto
Precisamos fazer a implementação do fluxo para permitir as pessoas acessarem a plataforma:
- Email
- Senha

## Requisitos funcionais
1. Precisamos adicionar validação no formulário na camada de cliente
   1. Caso o formulário esteja válido podemos enviar a requisição para a API
2. Caso recebemos algum erro de autenticação queremos mostrar uma mensagem genérica e não especifica sobre o email ou a senha, por exemplo: Email ou senha inválidos.
3. Ler o email e password na tabela `accounts`
4. A requisição deve ser um `POST` para `/api/v1/sign-in` e receber os dados como JSON no `body`
5. Caso tudo dê certo retornar `200` ou erros de acordo com a validação:
   1. Crie uma nova sessão do Next.js com cookies
   2. `400`: Má formatação de dados
   3. `401`: Falha de credenciais
6. Se a pessoa não está logada precisamos mostrar um botão de login no cabeçalho
7. Se a pessoa está logada podemos mostrar um avatar com nome + sobrenome e email
   1. Você pode utilizar Dicebar (https://www.dicebear.com/) para mockup de avatars

## Requisitos não funcionais
- UI/UX: Boa experiência de uso através de uma interface bonita, elegante, moderna
  - Utilize suas habilidades (skill) de front-end design
  - Você é um design expert com anos de experiência
  - Você é o melhor designer
- Performance: O processo login precisa ser rápido

## Você deve
- Criar um layout base para a plataforma
- Criar uma home sem nada por enquanto, apenas um titulo e esqueleto
- Criar um endpoint novo para autenticação
- Criar uma página nova para autenticação

## Você não deve
- Implementar qualquer outra funcionalidade que não esteja relacionada com sign-in.
- Não vamos realizar nenhum envio de email no momento, apenas processar a requisição, salvar no banco dados e tornar um sucesso.

## Tecnologias (Stack)
React.js, Next.js, React-Hook-Form, Shadcn, Tailwild, Supabase, TRCP, Bunjs.

## Critérios de aceitação
- Temos uma página para criar a nova conta em `/auth/sign-in`
- A página contém um formulário com validação
- A plataforma consegue se comunicar com a API para enviar os dados e receber uma resposta
- Estamos informando possíveis erros
  - Mostrar um alert em vermelho no formulário
- Navegar (`/`) para a home em caso de sucesso

## Resultado
Pessoas conseguem acessar suas contas.
