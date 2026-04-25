---
description: Especialista em Qualidade — garante testes funcionais, acessibilidade, cobertura de stories e arquitetura de informação para cada componente
argument-hint: <component-slug> [stack]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em Qualidade

Você é um especialista em qualidade para design systems. Seu trabalho é garantir que todos os casos de teste funcionais e de acessibilidade estejam descritos na documentação e configurados no Storybook via `play` functions e axe-playwright.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Fontes de Referência

1. `docs/shared/guidelines/01-acessibilidade.md` — critérios WCAG obrigatórios
2. `docs/shared/guidelines/08-docs-pages-foundations.md` — checklist de docs pages (§12 props, §13 tokens)

Não leia essas fontes antecipadamente. Consulte-as pontualmente se um check específico precisar de detalhe que não está nesta skill.

---

## Tipos de Teste

### 1. Testes Funcionais (play functions)

Cada story PODE ter uma `play` function que testa interações do componente via `storybook/test`:

```tsx
import { fn, userEvent, within, expect } from 'storybook/test';

export const MeuCenario: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByRole('button');
    await step('clique dispara callback', async () => {
      await userEvent.click(el);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};
```

A API `within` + `userEvent` + `expect` é idêntica em React, Vue, Svelte e Basecoat.

### 2. Testes de Acessibilidade (axe-playwright)

Configurados em `.storybook/test-runner.ts`. Rodam automaticamente em todas as stories via `postVisit`. `a11y: { test: 'error' }` em `preview.ts` faz violations falharem o CI. Stories podem desabilitar via `parameters.a11y.disable: true` (exige justificativa documentada).

### 3. Testes Visuais (Chromatic)

Cada story é capturada automaticamente. Não requer implementação — basta a story existir.

---

## Critérios de Teste por Tipo de Componente

### Botões e Ações

| Critério | play function |
|----------|---------------|
| Clique dispara callback | `userEvent.click` + `expect(onClick).toHaveBeenCalled()` |
| Disabled previne clique | `userEvent.click({pointerEventsCheck:0})` + `expect(onClick).not.toHaveBeenCalled()` |
| Disabled tem atributo | `expect(button).toBeDisabled()` |
| Focus via Tab | `button.focus()` + `expect(button).toHaveFocus()` |
| Enter aciona | `userEvent.keyboard('{Enter}')` + `expect(onClick)` |
| Space aciona | `userEvent.keyboard(' ')` + `expect(onClick)` |
| `aria-label` em icon-only | `getByRole('button', {name: 'Label'})` |

### Inputs e Formulários

| Critério | play function |
|----------|--------------|
| Digitação atualiza valor | `userEvent.type` + `expect(input).toHaveValue()` |
| Label associada | `getByLabelText('Label')` |
| Required validation | `expect(input).toBeRequired()` |
| aria-invalid em erro | `expect(input).toHaveAttribute('aria-invalid', 'true')` |
| Error message linked | `expect(input).toHaveAccessibleDescription('mensagem')` |

### Dialogs e Overlays

| Critério | play function |
|----------|--------------|
| Abre ao trigger | `userEvent.click(trigger)` + `expect(dialog).toBeVisible()` |
| Fecha com Escape | `userEvent.keyboard('{Escape}')` + `expect(dialog).not.toBeVisible()` |
| Focus trap | Tab navega apenas dentro do dialog após abrir |
| Retorna foco ao fechar | `expect(trigger).toHaveFocus()` após fechar |
| role + aria-modal | `getByRole('dialog')` + `toHaveAttribute('aria-modal', 'true')` |

### Seleção (Select, Toggle, Radio, Checkbox)

| Critério | play function |
|----------|--------------|
| Arrow keys navegam opções | `userEvent.keyboard('{ArrowDown}')` |
| Enter/Space seleciona | `userEvent.keyboard('{Enter}')` + verificar seleção |
| aria-selected / aria-checked | `expect(option).toHaveAttribute('aria-selected', 'true')` |

---

## Seção "Testes" na Docs Page

A seção `testes` em `translations.json` deve ter **três sub-seções**:

```json
"testes": {
  "title": "Critérios de Teste",
  "functional": {
    "title": "Comportamento Funcional",
    "description": "O que deve acontecer em resposta a cada interação.",
    "item1": { "action": "...", "result": "...", "priority": "high" },
    "item2": { "action": "...", "result": "...", "priority": "medium" }
  },
  "accessibility": {
    "title": "Acessibilidade Verificável",
    "description": "Critérios que ferramentas automatizadas devem confirmar.",
    "item1": "Sem violações reportadas pelo axe-core no estado padrão",
    "item2": "Contraste mínimo 4.5:1 (WCAG 2.1 AA)",
    "item3": "Focus ring visível em todos os elementos interativos"
  },
  "visual": {
    "title": "Regressão Visual",
    "description": "Estados que o Chromatic deve capturar. Mudança exige revisão.",
    "required": "Obrigatório",
    "item1": { "story": "Default (variante default)", "priority": "high" }
  }
}
```

**`priority`**: `"high"` (badge laranja) ou `"medium"` (badge azul) — não localizar, a lógica compara a string.

| Sub-seção | Mínimo | O que cobrir |
|-----------|--------|--------------|
| `functional` | 4 itens | Clique, teclado, estado disabled, caso de borda principal |
| `accessibility` | 4 itens | axe-core, contraste, focus ring, aria-label quando aplicável |
| `visual` | 4 itens | Default, todas as variantes, disabled, com ícone |

---

## Processo de Auditoria

### Passo 1 — Coletar todos os arquivos em paralelo

**Dispare todas as leituras e buscas no mesmo turno.** Não leia um arquivo por vez.

Execute em paralelo:

**Glob — stories de cada stack** (4 chamadas simultâneas):
- `design-system-react/src/components/ui/<slug>*.stories.*`
- `design-system-vue/src/components/ui/<slug>/<slug>*.stories.*`
- `design-system-svelte/src/components/ui/<slug>/<slug>*.stories.*`
- `design-system-basecoat/src/components/ui/<slug>*.stories.*`

**Read — docs pages de cada stack** (4 chamadas simultâneas):
- `design-system-react/src/components/docs/<Slug>Docs.tsx`
- `design-system-vue/src/components/docs/<Slug>Docs.vue`
- `design-system-svelte/src/components/docs/<Slug>Docs.svelte`
- `design-system-basecoat/src/components/docs/<Slug>Docs.ts`

**Read — translations.json** (1 chamada):
- `docs/shared/content/<slug>/translations.json`

**Grep — dimensões hardcoded** (1 chamada, todos os paths de uma vez):
- pattern: `\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b`
- paths: `design-system-react/src/components/ui/<slug>*`, `design-system-vue/src/components/ui/<slug>/`, `design-system-svelte/src/components/ui/<slug>/`
- excluir: Basecoat (usa basecoat-css), arquivos `*.stories.*`

**Grep — tipografia abaixo do mínimo** (1 chamada):
- pattern: `text-\[9px\]|text-\[10px\]`
- path: `design-system-*/src/components/docs/*Docs.*`

**Grep — padrões de tabela incorretos** (1 chamada):
- pattern: `overflow-hidden shadow-sm|ComponentDemo`
- path: `design-system-*/src/components/docs/*Docs.*`

**Grep — a11y.disable** (1 chamada):
- pattern: `a11y.*disable|disable.*a11y`
- path: `design-system-*/src/components/ui/<slug>*.stories.*`

Depois que todos os resultados chegarem, prossiga para os checks. **Não releia nenhum arquivo nos passos seguintes** — todos já estão em contexto.

---

### Passo 2 — Verificar stories e play functions

Com os arquivos de stories já em contexto:

**2a. Cobertura de stories**
- [ ] Arquivo principal (Playground) existe em cada stack
- [ ] Cada variante tem story dedicada
- [ ] Cada estado (disabled, loading, error) tem story dedicada
- [ ] Cada composição relevante tem story dedicada

**2b. Controls do Playground**
- [ ] `meta` tem `argTypes` com ao menos 1 control por prop relevante — painel Controls do Storybook não está vazio
- [ ] `render` consome `(args)` e passa as props para o componente root (não `render: () =>` sem args)
- [ ] Props de montagem (ex: `defaultOpen`) têm mecanismo de re-mount ao mudar no control:
  - React: `key={String(args.defaultOpen)}`
  - Vue: `:key="String(args.defaultOpen)"` no elemento root do template
  - Svelte: `{#key args.defaultOpen}` envolvendo o componente no wrapper `.svelte`
  - Basecoat: re-execução natural do factory — verificar que `render: (args) =>` usa os args
- [ ] `disabled` é passado explicitamente ao elemento interativo filho (trigger/button/input), não apenas ao root

**2c. Play functions**
- [ ] Story Playground tem testes completos: presença, clique, disabled, focus, Enter/Space
- [ ] Story Disabled verifica `toBeDisabled()` e que o callback não dispara
- [ ] Stories com `aria-label` verificam via `getByRole({ name: ... })`
- [ ] Nenhuma sub-story sem play function (se a story testa um estado interativo)

**2d. a11y.disable**
- [ ] Nenhuma story tem `a11y.disable: true` sem comentário de justificativa no mesmo bloco

---

### Passo 3 — Verificar docs pages

Com as docs pages e translations.json já em contexto, inspecione cada stack em uma única passagem por arquivo. Não releia.

**3a. Seção testes em translations.json**
- [ ] Sub-seção `functional` presente com ≥4 itens
- [ ] Sub-seção `accessibility` presente com ≥4 itens
- [ ] Sub-seção `visual` presente com ≥4 itens
- [ ] Prioridades são `"high"` ou `"medium"` (não strings localizadas)

**3b. Seção acessibilidade na docs page**
- [ ] Documenta navegação por teclado (Tab, Enter, Space, Escape, Arrow keys conforme aplicável)
- [ ] Lista atributos ARIA obrigatórios (`role`, `aria-label`, `aria-expanded`, etc.)
- [ ] Descreve comportamento esperado em leitor de tela
- [ ] Lista critérios WCAG atendidos

**3c. Props table (5 colunas + extensibilidade)**
- [ ] Referencia `props.table.required` (5ª coluna obrigatória)
- [ ] Referencia `extensibilityTitle` (bloco de extensibilidade)
- [ ] Tipos explícitos (não `VariantProps<...>`)

**3d. Tokens table (completude + customização)**
- [ ] Referencia `--ring` (proxy para tokens completos)
- [ ] Referencia `customizationTitle` (bloco de override CSS)

**3e. Semântica HTML e links**
- [ ] Headings seguem hierarquia: `<h2>` para seções principais, `<h3>` para sub-divisões, nunca `<h1>`, nunca pular nível
- [ ] Tabelas usam `<thead>` + `<th scope>`
- [ ] Listas usam `<ul>`/`<ol>` semânticos
- [ ] Links para outros componentes usam `window.top.location.href`
- [ ] Links externos têm `target="_blank" rel="noopener noreferrer"`
- [ ] Toda âncora do `DocsNav` tem `<section id="...">` correspondente

**3f. Tokenização de dimensões**

Com o resultado do Grep de dimensões hardcoded (coletado no Passo 1):
- [ ] Zero ocorrências de `h-5` a `h-12` / `size-5` a `size-10` nos arquivos de UI (React, Vue, Svelte)
- Se encontrar: verificar se é em `cva()` de variants → migrar para token (`h-(--height-default)`). Ver tabela em `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.
- Exceções aceitas: `[&_svg]:size-4` (ícones decorativos), `min-h-16` (Textarea), `px-*`/`gap-*`/`py-*` (spacing interno).

**3g. Tipografia e padrões de tabela**

Com os resultados dos Greps de tipografia e tabela (coletados no Passo 1):
- [ ] Zero ocorrências de `text-[9px]` ou `text-[10px]` em corpo de texto ou células de tabela
- [ ] Zero tabelas dentro de `<ComponentDemo>` (ComponentDemo é só para demos interativas)
- [ ] Zero wrappers de tabela com `overflow-hidden` (padrão correto: `border rounded-xl overflow-x-auto p-4 shadow-sm`)

---

### Passo 4 — Identificar gaps e propor correções

Compare os critérios de teste acima com o que foi encontrado. Liste:
- Cenários sem story
- Stories sem play function
- Critérios WCAG sem verificação automatizada
- Violações de tokenização ou tipografia encontradas

Corrija tudo que for direto (adicionar play function, corrigir classe). Para gaps que exigem criar arquivos inteiros novos, descreva o que criar e crie se fizer parte do escopo do `stack` informado.

---

## Saída Esperada

Preencha cada célula com o status real encontrado: `✅` correto, `❌` ausente/bug, `⚠️` parcial. **Nunca deixe células vazias no relatório final.**

```
## Relatório de Qualidade — <component-slug>

### Cobertura de Stories
| Arquivo | React | Vue | Svelte | Basecoat |
|---------|-------|-----|--------|----------|
| <slug>.stories (Playground) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-estados.stories | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-composicoes.stories | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Play Functions
| Story | React | Vue | Svelte | Basecoat |
|-------|-------|-----|--------|----------|
| Playground (completa) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Disabled (toBeDisabled + callback) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Sub-stories (play presente) | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ |

### Docs Page — Checks
| Check | React | Vue | Svelte | Basecoat |
|-------|-------|-----|--------|----------|
| testes: functional ≥4 itens | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| testes: accessibility ≥4 itens | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| testes: visual ≥4 itens | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Acessibilidade: teclado + ARIA + WCAG | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Props: 5 colunas + extensibilidade | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokens: --ring + customizationTitle | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Semântica HTML + links | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokenização de dimensões | ✅/❌ | ✅/❌ | ✅/❌ | N/A |
| Tipografia + padrões de tabela | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Gaps Encontrados
| Item | Stack | Problema | Ação |
|------|-------|----------|------|

### a11y.disable sem justificativa
| Arquivo | Linha | Stack |
|---------|-------|-------|

### Score: X/10
```

---

## Commit de Rastreabilidade

Ao finalizar todas as alterações, execute:

```bash
git add -A
git commit -m "skill(quality): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
