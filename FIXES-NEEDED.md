# Fixes Pendentes — Pipeline `new` code-block — 2026-07-30

Só o que **sobrou** depois dos 4 commits de correção desta execução
(`5ecbe53b`, `755c59fc`, `241ef9c5`, `55980259`). Cada item foi conferido na
fonte, não aceito do relato do agent.

---

## Críticos

Nenhum. Os dois ALTO da auditoria já foram corrigidos e verificados:
`docs_code_copy` contando clique em qualquer lugar do bloco (`755c59fc`, com
harness em `scripts/verify-docs-tracking.mjs`) e Vue/Svelte sem o fallback de
clipboard (`55980259`).

---

## Médios

- [ ] **Nenhuma seção da docs page tem story equivalente** — 4 stacks.
  Existe só o `Playground`. Faltam `code-block-variantes` (6 linguagens),
  `code-block-estados` (com/sem numeração, copiado, scroll nos 2 eixos,
  linguagem desconhecida) e `code-block-composicoes` (4 arranjos).
  Custo real: a paleta de sintaxe — a razão de o componente existir — nunca
  entra em regressão visual, e o axe-core só roda no Playground.
  12 arquivos. Skill: `/quality code-block` em fix-mode.

- [ ] **Play function não verifica ARIA nem teclado** — 4 stacks.
  `testes.accessibility` documenta 5 teclas e 4 atributos; a play cobre 0 e 0.
  Os primitivos **implementam** tudo certo (`role="status"`, `aria-live`,
  `aria-hidden` no gutter, `tabindex="0"`) — o buraco é de teste. Hoje a
  asserção alcança a região de status por classe (`.nds-sr-only`), então trocar
  o `role` passa verde.
  Também sem cobertura: retorno ao estado inicial em 2s e cancelamento do timer
  no unmount, ambos implementados nos 4.

- [ ] **`snippet_id` das Composições é o nome traduzido** — infra, 4 stacks.
  `DocsVariants` monta `${slug}:code:${item.name}` e as Composições passam
  `name` traduzido: o mesmo evento sai como "Com rótulo no header" / "With
  header label" / "Con etiqueta en la cabecera". Afeta todo componente que
  passa `name` traduzido, não só o code-block.
  Correção aditiva e retrocompatível: campo opcional `trackId` em
  `DocsVariantItem`, com fallback para `item.name`.

- [ ] **`DocsProps` não aceita `extensibilityCode`** em React, Vue e Svelte —
  só o Vanilla aceita (`DocsProps.ts:19`). Consequência imediata: os overrides
  `props.extensibilityCode` em `CodeBlockDocs.vue` e `.svelte` são **código
  morto**, nunca renderizado. O React contorna jogando no `DocsImport`.
  Vanilla é a referência: alinhar os outros 3 containers.

## Baixos

- [ ] **Do & Don't par 2 ainda diverge** — 3 literais diferentes. Vanilla
  `npm run build -- --mode production` sem título (coerente com a legenda "um
  comando de uma linha"), React/Svelte `demoBash` de 3 linhas, Vue
  `npm run storybook`. Vanilla é a referência.

- [ ] **Toggle "Ver código" nas 6 linguagens** — presente em React e Svelte,
  ausente em Vue e Vanilla. Aqui alinhar por cima (os 4 containers suportam).

- [ ] **Vue: `DocsVariants` sem `component-slug`** (`CodeBlockDocs.vue:637`) —
  o toggle perde o `data-track-id`.

- [ ] **`DocsTestes` só aceita `description` no container Vue** — as 3 chaves
  existem nos 3 locales; React, Svelte e Vanilla perdem 3 parágrafos.

- [ ] **Rótulos de nav de fontes diferentes** — Vue lê o `nav` do
  `translations.json` do componente, React/Vanilla leem `ui.json`, Svelte
  mistura. Efeito visível: `states` sai "Estados" (React/Vanilla) contra
  "Configurações" (Vue/Svelte) — e o heading da seção é "Configurações" nas 4,
  então React e Vanilla ficam com nav ≠ título.

- [ ] **Svelte: `docs.source.transform` não inclui `footer`** — mexer nesse
  control não muda o snippet. O Vanilla inclui.

- [ ] **`nds-w-full` nos blocos da Demonstração** — Svelte e Vanilla aplicam por
  bloco, React e Vue só no wrapper.

- [ ] **Warnings de compilação no primitivo Svelte** —
  `a11y_no_noninteractive_tabindex` (o `tabindex="0"` da região de scroll é
  intencional e documentado; falta `role="region"` + `aria-label` ou o ignore
  explícito) e `block_empty`. Poluem a saída de toda story da stack.

---

## Fora do escopo deste componente (achados de passagem)

- [ ] `ComponentDemo.tsx` (React) ainda tem classes utilitárias mortas:
  `flex items-center justify-center p-4 mt-2 bg-background`. O audit não pega
  porque `legacy_class_in_story` só varre stories.
- [ ] 3 dos 48 `translations.json` ainda têm emoji em título de seção
  (`alert`, e outros 2) — os outros 45 já estão limpos.
- [ ] `aiEntities` do code-block não menciona Vanilla, embora a stack publique a
  mesma docs page. `alert-dialog` e `checkbox` já mencionam.
- [ ] Breadcrumb com `item: '/components/display'` fixo ao lado de um `name`
  dinâmico, em 20+ docs pages.
