---
name: document-component
description: Documenta um componente Shadcn/UI seguindo o template padronizado de 15 seções em 4 blocos. Usar sempre que o usuário pedir para documentar, criar a documentação de, ou escrever a doc de um componente — mesmo que não cite explicitamente o template ou as 15 seções. Também usar para atualizar ou corrigir documentação existente de um componente.
---

# Skill: Document Component

Cria a página de documentação de um componente Shadcn/UI seguindo o template de 15 seções em 4 blocos definido em `12-documentacao-componentes.md`.

## Antes de escrever

1. Ler `references/template.md` — contém o template completo de 15 seções com todas as regras de estrutura, formatação e ComponentDocsNav
2. Ler o arquivo de guideline do componente em questão (04–10) para obter: propósito, API, variantes, regras, acessibilidade, analytics e UX writing
3. Ler `19-tom-de-voz.md` para UX writing da seção 4 (Quando Usar / Do & Don't) e seção 14 (Notas e Dicas)
4. Ler `21-analytics.md` para a seção 15 (Eventos de Analytics)

## Processo de geração

### Bloco 1 — Visão Geral (seções 1–5)
- **Seção 1 (Header)**: nome do componente, descrição em 1 frase, badges de categoria/status
- **Seção 2 (Demonstração)**: exemplo funcional mais representativo — não o mais simples, o mais útil
- **Seção 3 (Anatomia)**: diagrama de subcomponentes em árvore ASCII + descrição de cada parte
- **Seção 4 (Quando Usar)**: critério de decisão vs componentes similares (tabela), Do & Don't com exemplos reais
- **Seção 5 (Do & Don't)**: 3–5 pares, exemplos concretos de código ou UI

### Bloco 2 — Referência Técnica (seções 6–11)
- **Seção 6 (Importação)**: import statement exato do Shadcn
- **Seção 7 (Exemplos)**: todos os casos de uso documentados no guideline do componente
- **Seção 8 (Variantes)**: grid visual de todas as variantes nativas (apenas props reais)
- **Seção 9 (Estados)**: default, hover, focus, disabled, error — com tokens corretos
- **Seção 10 (Propriedades)**: tabela completa com nome, tipo, padrão, descrição
- **Seção 11 (Design Tokens)**: tokens CSS relevantes de `16-padroes-design-sistema.md`

### Bloco 3 — Contexto (seções 12–14)
- **Seção 12 (Acessibilidade)**: ARIA automático (o que o Radix aplica), o que o dev deve adicionar, navegação por teclado
- **Seção 13 (Relacionados)**: componentes que trabalham junto ou são alternativas — com critério de decisão
- **Seção 14 (Notas e Dicas)**: CheckCircle2 (text-primary) para dicas, XCircle (text-destructive) para avisos

### Bloco 4 — Qualidade (seção 15)
- **Seção 15 (Critérios de Teste)**: funcional, acessibilidade, analytics — baseado em `21-analytics.md`

## Regras críticas

- Nunca documentar props que não existem na API do Shadcn (ex: `size` em Avatar, `warning` em Alert)
- `FormLabel` dentro de `FormField` não precisa de `htmlFor` — associação é automática
- Variantes customizadas (warning, success) são sempre via `className` com tokens do projeto
- ComponentDocsNav: sticky, com IntersectionObserver, `aria-current="location"` no item ativo
- Arquivo gerado em: `/components/docs/[NomeComponente]Docs.tsx`

## Output

Arquivo `.tsx` completo e funcional, com:
- Import do ComponentDocsNav
- Todas as 15 seções na ordem correta
- IDs de anchor em cada seção (`id="demonstracao"`, `id="anatomia"`, etc.)
- Exemplos de código reais e funcionais (não pseudocódigo)
