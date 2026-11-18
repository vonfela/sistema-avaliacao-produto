# Feedback

## Escopo
Front-End, Back-End, Banco de Dados

## Contexto
Precisamos fazer a impementação do fluxo permitindo as pessoas logadas (autenticadas) adicionar novas avaliações aos produtos

## Requisitos funcionais
1. Caso a pessoa não esteja logada precisamos mostrar um bloco exigindo a autenticação
2. Caso ela esteja logada podemos mostrar o formulário e permitir novas avaliações
   1. Cada avaliação deve conter uma nota de 1-5 + comentário
3. Nova tabela `products_feedbacks`
   1. `id`: nanoid
   2. `score`: int
   3. `comment`: text
   4. `created_at`: timestamp
   5. `created_by` nanoid
   6. `product_id`: nanoid
4. A pagina de detalhes do produto deve listar todos os comentários existentes para o produto e depois renderizar o form para adicionar novos
5. caso o mesmo usuário faça um novo feedback/comentário com um feedback ja existente, o novo deve sobrescrever/substituir o anterior/antigo.

## Requisitos não funcionais
- UI/UX: Boa experiência de uso através de uma interface bonita, elegante, moderna
- Performance: O processo deve ser rápido

## Você deve
- Criar um endpoint novo para adicionar comentários
- Criar uma nova pagina de detalhes `/products/id`

## Você não deve
- Implementar qualquer outra funcionalidade que não esteja relacionada com feedback.


## Tecnologias (Stack)
React.js, Next.js, React-Hook-Form, Shadcn, Tailwild, Supabase, TRCP, Bunjs.

## Critérios de aceitação
- Pagina de detalhes do produto mostrando as informações do produto + avaliações + formulário para nova avaliação

## Resultado
Pessoas conseguem ver os produtos de forma publica, sem autenticação mas não conseguem adicionar novos comentários
