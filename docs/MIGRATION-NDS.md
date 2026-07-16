# Migração Tailwind → `.nds-*` (React, Vue, Svelte)

Objetivo: remover o Tailwind das 3 stacks framework, adotando o CSS standalone
`.nds-*` que a stack vanilla já usa — **mantendo** as bibliotecas headless
(`@base-ui/react`, `reka-ui`, `bits-ui`) e a API pública dos componentes.

## Arquitetura (decidida e implementada)

- **Fonte única de CSS**: `docs/shared/styles/nds/` (60 arquivos + `index.css`
  com ordem de cascade preservada). As 4 stacks importam
  `@shared/styles/nds/index.css` no `globals.css`.
- **Coexistência**: durante a migração, Tailwind e `.nds-*` convivem sem
  conflito (todos os seletores nds são escopados). O Tailwind só é removido
  de uma stack quando o último componente/docs dela for convertido.
- **`cva` permanece**: a troca é só das strings de classe —
  `cva("nds-button", { variants: { variant: { default: "nds-button-default", … } } })`.
  API de variantes e call sites intactos.
- **Regras vanilla prevalecem** quando divergem do Tailwind atual:
  - Sem `height`/`min-height` fixos em primitivos com texto (WCAG 1.4.4);
    altura = padding-block + line-height. Icon-only quadrado pode ter dimensão fixa.
  - Grid 8 estrito nos espaçamentos (múltiplos/divisores de 8 via `--spacing-*`).
  - Estados via pseudo-classes/atributos ARIA no CSS, não utilitários.
- **Gaps de superfície** (variantes/tamanhos/estados que uma stack tem e o CSS
  vanilla não): estender o arquivo em `docs/shared/styles/nds/` — nunca criar
  CSS por stack. Diferenças de atributo de estado entre libs (base-ui usa
  `data-open`/`aria-*`; reka/bits usam `data-state`) entram no MESMO arquivo
  com seletores adicionais.

## Receita por componente (validada no piloto `button` React)

1. Ler o `<slug>.css` em `docs/shared/styles/nds/` e o componente da stack.
2. Gap analysis: variantes/tamanhos/estados do `cva` que faltam no CSS → estender o CSS compartilhado.
3. Trocar as strings do `cva` pelas classes `.nds-*` (base + uma classe por variante/tamanho).
4. Rodar os testes do componente (`npx vitest run src/components/ui/<slug>*.stories.tsx` no React;
   test-storybook filtrado nas demais).
5. Conferir no Storybook local (variantes, dark mode, densidades).

## Fases

- [x] **Fase 0 — Infra**: CSS movido pra `docs/shared/styles/nds/`, `index.css`
  gerado, vanilla rewired e validada, import adicionado ao React.
- [x] **Fase 0.5 — Libs**: `@base-ui/react` 1.6.0 validado (mesmo resultado de
  testes que 1.4.1). `reka-ui` → 2.10.1 e `bits-ui` → 2.18.1 ao iniciar as fases 2 e 3.
- [x] **Piloto**: `button` React (24/24 testes verdes).
- [ ] **Fase 1 — React UI** (~50 componentes, em lotes por categoria):
  form → feedback → display → layout → navigation → disclosure → overlay → tables.
- [ ] **Fase 2 — Vue UI** (bump reka-ui primeiro; reaproveita 100% dos CSS já estendidos na Fase 1).
- [ ] **Fase 3 — Svelte UI** (bump bits-ui primeiro; idem).
- [ ] **Fase 4 — Docs pages + stories** das 3 stacks: substituir utilitários
  Tailwind pelas classes de docs da vanilla (`nds-stack`, `nds-cluster`,
  `nds-max-w-prose`, `docs-*`…). Os arquivos vanilla em
  `src/components/docs/` são a referência 1:1 de mapeamento.
- [ ] **Fase 5 — Remoção**: tirar `@import "tailwindcss"`, `tailwind-merge`,
  `tw-animate-css` e configs de cada stack; simplificar `cn()` para `clsx` puro
  (como na vanilla); atualizar guidelines (04-10, 11-consistencia, 12-tokenizacao)
  e o `scripts/audit.mjs` (regras de dimensão hardcoded mudam de alvo).

## Validação por lote

- Testes do componente verdes na stack.
- `npm run build-storybook` da stack verde.
- Chromatic: diffs visuais esperados — revisar e aceitar em lote por categoria.
- Ao final de cada fase: suíte completa da stack ≥ baseline atual
  (React 87 fails vitest / Vue 67 / Svelte 113 test-storybook — nunca piorar).

## Armadilhas conhecidas

- `tailwind-merge` no `cn()` do React/Vue/Svelte ignora classes `.nds-*`
  (passa direto) — inofensivo durante a migração, remover na Fase 5.
- Stories usam Tailwind em fixtures (`className="w-72"` etc.) — Fase 4, não
  bloqueiam a migração do componente.
- `docs/shared/guidelines/12-tokenizacao-dimensoes.md` e o audit de dimensões
  assumem Tailwind — atualizar na Fase 5 (não antes, pra não quebrar o CI dos
  componentes ainda não migrados).
