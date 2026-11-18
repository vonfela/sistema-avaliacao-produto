# Resumo por IA

> Rascunho escrito pelo agente a partir do pedido em chat. Revise antes de aprovar o plano.

## Escopo
Back-End, Banco de Dados, Front-End, IA (agente)

## Contexto
Produtos com várias avaliações exigem leitura de todos os comentários para entender a opinião geral.
Precisamos de um resumo gerado por IA, por produto, a partir de todos os comentários, exibido na
página de detalhes entre as informações do produto e a lista de avaliações.

## Requisitos Funcionais
1. Criar um agente com Mastra usando o modelo `openai/gpt-4o-mini`.
2. O agente recebe todos os comentários (nota + comentário) de um produto e devolve um resumo geral.
3. O resumo é salvo no banco, um por produto (nova tabela `products_ai_summaries`).
4. O resumo é atualizado quando as avaliações do produto mudam (nova, substituída).
5. A página `/products/[id]` exibe o resumo entre o bloco do produto e as avaliações, destacado
   visualmente como conteúdo gerado por IA.
6. Produto sem avaliações não exibe o bloco.

## Requisitos não funcionais
- Performance: a página nunca espera a IA; a geração roda depois da resposta.
- Custo: só chama o modelo quando as avaliações mudaram desde o último resumo.
- Resiliência: se a IA falhar ou a chave não estiver configurada, a página continua funcionando.
- Segurança: a chave da OpenAI fica apenas no servidor; comentários são tratados como dados,
  não como instruções para o agente.
- UI/UX: bloco elegante, com selo "Resumo por IA" e aviso de que pode conter imprecisões.

## Você deve
- Usar Mastra (`@mastra/core`) para definir o agente.
- Salvar o resumo no Supabase e reaproveitá-lo enquanto as avaliações não mudarem.

## Você não deve
- Chamar a IA a cada visualização da página.
- Enviar nome ou id das pessoas avaliadoras para a OpenAI.
- Alterar o fluxo de criação de avaliações ou de produtos.

## Tecnologias (stack)
Next.js, React, Mastra, OpenAI gpt-4o-mini, Supabase, Tailwind, shadcn, Bun.

## Critérios de aceitação
- Produto com avaliações mostra o bloco "Resumo por IA" entre produto e avaliações.
- Após uma nova avaliação, o resumo é regenerado e aparece atualizado em seguida.
- Produto sem avaliações não mostra o bloco.
- Sem `OPENAI_API_KEY`, a página carrega normalmente, sem o bloco e sem erro.

## Resultado
Visitantes entendem a opinião geral sobre um produto sem ler todas as avaliações.
