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
   `npx vitest run <arquivos>` nas demais).
5. Conferir no Storybook local (variantes, dark mode, densidades).

## Fases

- [x] **Fase 0 — Infra**: CSS movido pra `docs/shared/styles/nds/`, `index.css`
  gerado, vanilla rewired e validada, import adicionado ao React.
- [x] **Fase 0.5 — Libs**: `@base-ui/react` 1.6.0 validado (mesmo resultado de
  testes que 1.4.1). `reka-ui` → 2.10.1 e `bits-ui` → 2.18.1 ao iniciar as fases 2 e 3.
- [x] **Piloto**: `button` React (24/24 testes verdes).
- [x] **Fase 1 — React UI** (~46 componentes, 11 lotes por categoria):
  form → feedback → display → layout → navigation → disclosure → overlay → tables.
  Todos os primitivos ui/ do React estão em classes .nds-*.
- [x] **Fase 2 — Vue UI** (9 lotes espelhando a Fase 1; reka-ui 2.10.1 já estava no lock).
  Pendência registrada: helpers fora das 7 categorias (button-group, combobox,
  empty, field, form-helpers, input-group, item, kbd, native-select,
  number-field, range-calendar, stepper no Vue; input-group no React) —
  migrar num sub-lote próprio antes da Fase 5.
- [x] **Fase 3 — Svelte UI** (9 lotes; bits-ui 2.18.1 já estava no lock).
  Helpers pendentes do Svelte (input-group e afins) entram no mesmo sub-lote
  registrado na Fase 2.
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
  (baselines por stack no runner vitest — nunca piorar; Nortear = 100%).

## Armadilhas conhecidas

- `tailwind-merge` no `cn()` do React/Vue/Svelte ignora classes `.nds-*`
  (passa direto) — inofensivo durante a migração, remover na Fase 5.
- Stories usam Tailwind em fixtures (`className="w-72"` etc.) — Fase 4, não
  bloqueiam a migração do componente.
- `docs/shared/guidelines/12-tokenizacao-dimensoes.md` e o audit de dimensões
  assumem Tailwind — atualizar na Fase 5 (não antes, pra não quebrar o CI dos
  componentes ainda não migrados).
