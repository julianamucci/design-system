# Fixes Pendentes — Pipeline new chart — 2026-04-24

---

# Fixes Pendentes — Pipeline new collapsible — 2026-04-24

## Baixos

- [x] **Basecoat — keyboard items incompleto** — `design-system-basecoat/src/components/docs/CollapsibleDocs.ts:468`
  Array `keyboardItems` tem 3 entradas (Tab, Enter, Space), falta a 4ª (`noArrow`). Adicionado `{ key: '—', description: t('accessibility.keyboard.noArrow') }`.
  — fix: `f66c20f`

- [x] **Svelte — story Controlado ausente** — `design-system-svelte/src/components/ui/collapsible/collapsible-estados.stories.ts`
  Adicionado `CollapsibleControladoStory.svelte` + story `Controlado` com play function (botão externo, aria-expanded).
  — fix: `f66c20f`

**Total collapsible: 2 violations** (0 críticos, 0 médios, 2 baixos) — ✅ todos resolvidos

---

## Críticos

*(nenhum)*

## Médios

- [ ] **Vue: token `--secondary` ausente na tabela de tokens** — `design-system-vue/src/components/docs/ChartDocs.vue:~312`
  `tokenRows` tem 11 linhas; React tem 12. Adicionar `{ token: '--secondary', value: 'hsl(var(--secondary))', description: tContent('tokens.table.secondary') }`.
  — skill: `/cross-stack chart`

- [ ] **Vue + Svelte: variante `pie` ausente** — Vue `ChartDocs.vue:~269–273`, Svelte `ChartDocs.svelte:~466–469`
  Spec define Pie como variante documentada em React/Vue/Svelte. Ambas as stacks mostram apenas bar/line/area. Adicionar item pie ao `variantItems` array em cada stack.
  — skill: `/cross-stack chart`

- [ ] **Svelte: tabela de props `legendTitle` ausente** — `design-system-svelte/src/components/docs/ChartDocs.svelte:~544`
  `DocsProps` recebe apenas 2 tabelas (container + tooltip); React e Vue têm 3 (container + tooltip + legend). Adicionar a terceira tabela mesmo que Svelte não tenha `ChartLegendContent` — documentar que a legenda é integrada ao `ChartTooltip` na stack Svelte.
  — skill: `/cross-stack chart`

- [ ] **React: `chart-estados` sem play functions** — `design-system-react/src/components/ui/chart-estados.stories.tsx:~53,71,89`
  Vue tem play functions em todos os estados (verificam `data-slot="chart"`, empty state message, legend labels). React não tem nenhuma. Adicionar play functions em `Vazio`, `UmaSerie`, `MultiplasSeries` para paridade com Vue.
  — skill: `/quality chart`

## Baixos

- [ ] **Basecoat: prop `colors` usa descrição de `indicator`** — `design-system-basecoat/src/components/docs/ChartDocs.ts:~454`
  `description: stripHtml(t('props.table.indicator'))` deveria ser `description: stripHtml(t('props.table.colors'))` ou `description: stripHtml(t('props.table.config'))`. A chave `props.table.colors` existe no translations.json.
  — skill: `/cross-stack chart`

- [ ] **Svelte: `DocsImport` sem `secondaryCode`** — `design-system-svelte/src/components/docs/ChartDocs.svelte:~454–459`
  React e Vue passam um bloco `secondaryCode` adicional com exemplo de uso. Svelte omite o prop. Adicionar `secondaryCode` com snippet de exemplo Svelte.
  — skill: `/cross-stack chart`

- [ ] **Svelte: variante "Multi" usa chave `variants.items.bar`** — `design-system-svelte/src/components/docs/ChartDocs.svelte:~468`
  `description: stripHtml($tStore('variants.items.bar'))` — reutiliza descrição de `bar`. Substituir por `variants.items.multiSeries` ou `variants.items.line` conforme o que melhor descreve o caso.
  — skill: `/cross-stack chart`

- [ ] **SEO descriptions excedem 155 chars** — `docs/shared/content/chart/translations.json`
  pt-BR: 162 chars (+7), en: 158 chars (+3), es: 164 chars (+9). Trimmar cada description para ≤155 chars.
  — skill: `/seo-geo chart`

---

**Total de violations abertas: 8** (0 críticos, 4 médios, 4 baixos)

Aplicar: **[1] críticos** / **[2] críticos+médios** / **[3] todos** / **[4] nenhum**
