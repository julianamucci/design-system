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

## Fontes de Referência — Leia ANTES de qualquer ação

1. `docs/shared/guidelines/01-acessibilidade.md` — critérios WCAG obrigatórios
2. `design-system-react/.storybook/test-runner.ts` — configuração axe-playwright
3. `design-system-react/src/components/ui/alert.stories.tsx` — referência de play functions (React)
4. Equivalentes em vue/svelte/basecoat para o mesmo componente
5. `docs/shared/guidelines/08-docs-pages-foundations.md` — checklist de docs pages

---

## Tipos de Teste

### 1. Testes Funcionais (play functions)

Cada story PODE ter uma `play` function que testa interações do componente via `@storybook/test`. Os testes rodam automaticamente no Storybook e são verificáveis na aba **Interactions**.

**Biblioteca de testes**: `storybook/test` (re-exporta vitest + testing-library)

```tsx
import { fn, userEvent, within, expect } from 'storybook/test';
```

### 2. Testes de Acessibilidade (axe-playwright)

Configurados em `.storybook/test-runner.ts`. O axe-playwright roda automaticamente em TODAS as stories via `postVisit`. Stories podem desabilitar via `parameters.a11y.disable: true`.

O parâmetro `a11y: { test: 'error' }` em `preview.ts` faz violations falharem o CI.

### 3. Testes Visuais (Chromatic)

Configurados via `chromatic.config.json`. Cada story é automaticamente capturada para visual regression. Não requer implementação manual — basta a story existir.

---

## Critérios de Teste por Tipo de Componente

### Botões e Ações

| Critério | Story | play function |
|----------|-------|---------------|
| Clique dispara callback | Playground | `userEvent.click` + `expect(onClick).toHaveBeenCalled()` |
| Disabled previne clique | Estados/Disabled | `userEvent.click({pointerEventsCheck:0})` + `expect(onClick).not.toHaveBeenCalled()` |
| Disabled tem atributo | Estados/Disabled | `expect(button).toBeDisabled()` |
| Focus via Tab | Playground | `button.focus()` + `expect(button).toHaveFocus()` |
| Enter aciona | Playground | `userEvent.keyboard('{Enter}')` + `expect(onClick)` |
| Space aciona | Playground | `userEvent.keyboard(' ')` + `expect(onClick)` |
| `aria-label` em icon-only | Tamanhos/IconOnly | `getByRole('button', {name: 'Label'})` |

### Inputs e Formulários

| Critério | Teste |
|----------|-------|
| Digitação atualiza valor | `userEvent.type` + `expect(input).toHaveValue()` |
| Label associada | `getByLabelText('Label')` |
| Required validation | `expect(input).toBeRequired()` |
| aria-invalid em erro | `expect(input).toHaveAttribute('aria-invalid', 'true')` |
| Error message linked | `expect(input).toHaveAccessibleDescription('mensagem')` |

### Dialogs e Overlays

| Critério | Teste |
|----------|-------|
| Abre ao trigger | `userEvent.click(trigger)` + `expect(dialog).toBeVisible()` |
| Fecha com Escape | `userEvent.keyboard('{Escape}')` + `expect(dialog).not.toBeVisible()` |
| Focus trap | Após abrir, Tab navega apenas dentro do dialog |
| Retorna foco ao fechar | `expect(trigger).toHaveFocus()` após fechar |
| `role="dialog"` ou `role="alertdialog"` | `getByRole('dialog')` |
| `aria-modal="true"` | `expect(dialog).toHaveAttribute('aria-modal', 'true')` |

### Seleção (Select, Toggle, Radio, Checkbox)

| Critério | Teste |
|----------|-------|
| Arrow keys navegam opções | `userEvent.keyboard('{ArrowDown}')` |
| Enter/Space seleciona | `userEvent.keyboard('{Enter}')` + verificar seleção |
| `aria-selected` ou `aria-checked` | `expect(option).toHaveAttribute('aria-selected', 'true')` |
| Valor atualizável via teclado | Sequência completa de interações |

---

## Implementação por Stack

### React

```tsx
export const MeuCenario: Story = {
  args: { /* ... */ },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');

    await step('Descrição do passo', async () => {
      await userEvent.click(element);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};
```

### Vue

```ts
export const MeuCenario: Story = {
  args: { /* ... */ },
  render: (args) => ({
    components: { Button },
    setup() { return { args }; },
    template: '<Button v-bind="args" @click="args.onClick">Botão</Button>',
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');
    // mesma API de testes
  },
};
```

### Svelte

```ts
// Usar ButtonStory wrapper para garantir labels
import ButtonStory from './ButtonStory.svelte';

export const MeuCenario: Story = {
  args: { label: 'Botão', /* ... */ },
  // component: ButtonStory no meta
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');
    // mesma API de testes
  },
};
```

### Basecoat (Vanilla TS)

```ts
export const MeuCenario: Story = {
  render: () => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `${VARIANTS['default']} h-9 px-4 py-2`;
    el.textContent = 'Botão';
    return el;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');
    // mesma API de testes
  },
};
```

---

## Seção "Testes" na Docs Page

A seção `testes` em `translations.json` deve ter **três sub-seções obrigatórias**: `functional`, `accessibility` e `visual`. A `AlertDocs` é a referência de implementação.

### Estrutura obrigatória no `translations.json`

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
    "item3": "Focus ring visível em todos os elementos interativos",
    "item4": "..."
  },
  "visual": {
    "title": "Regressão Visual",
    "description": "Estados que o Chromatic deve capturar. Mudança exige revisão.",
    "required": "✓ Obrigatório",
    "item1": { "story": "Default (variante default)", "priority": "high" },
    "item2": { "story": "...", "priority": "medium" }
  }
}
```

**Valores de `priority`**: `"high"` (badge laranja) ou `"medium"` (badge azul). Não localizar — a lógica compara a string `"high"` e usa `tNav("common.high")` para exibição.

### Mínimo de itens por componente

| Sub-seção | Mínimo | O que cobrir |
|-----------|--------|--------------|
| `functional` | 4 itens | Clique, teclado, estado disabled, caso de borda principal |
| `accessibility` | 4 itens | axe-core, contraste, focus ring, aria-label quando aplicável |
| `visual` | 4 itens | Default, todas as variantes, disabled, com ícone |

### Renderização nas docs pages

Cada stack itera sobre `item1`…`itemN` dinamicamente. Não hardcode os arrays — use o padrão da `AlertDocs` de referência. As chaves de UI (`storyState`, `themeLight`, `themeDark`) ficam em `src/i18n/ui.json` de cada stack.

---

## Processo de Auditoria

### 1. Inventariar stories existentes

Para o componente especificado, liste todas as stories em cada stack e verifique:

- [ ] Cada variante tem story dedicada
- [ ] Cada estado (disabled, loading, error) tem story dedicada
- [ ] Cada composição (com ícone, como link) tem story dedicada

### 2. Verificar play functions

- [ ] Story Playground tem testes completos (clique, disabled, focus, Enter, Space)
- [ ] Story Disabled testa `toBeDisabled()` e previne onClick
- [ ] Stories com `aria-label` verificam via `getByRole({name: ...})`

### 3. Verificar acessibilidade

- [ ] `parameters.a11y.test: 'error'` está no preview.ts (já configurado globalmente)
- [ ] Nenhuma story tem `a11y.disable: true` sem justificativa
- [ ] Icon-only buttons têm `aria-label`
- [ ] Componentes de formulário têm label associada

### 4. Verificar docs page

- [ ] Seção "Testes" existe com as 3 sub-seções: `functional`, `accessibility`, `visual`
- [ ] `functional`: ≥4 linhas cobrindo clique, teclado, disabled, caso de borda
- [ ] `accessibility`: ≥4 itens cobrindo axe-core, contraste, focus ring, aria
- [ ] `visual`: ≥4 itens com stories do Chromatic
- [ ] Prioridades usam `"high"` / `"medium"` (não localizado no JSON)
- [ ] Seção "Acessibilidade" documenta keyboard, ARIA, screen reader
- [ ] Seção "Acessibilidade" lista critérios WCAG atendidos

### 4b. Verificar tabelas Props e Tokens (ver `docs/shared/guidelines/08-docs-pages-foundations.md` §12 e §13)

**Props table:**
- [ ] 5 colunas: prop, type, default, required, description
- [ ] Interface TypeScript explícita (tipos literais — não `VariantProps<...>`)
- [ ] Todas as props do componente documentadas (variantes, sizes, disabled, onClick/onclick, type, className/class)
- [ ] Bloco de extensibilidade com nota sobre `className`/`class` e `asChild` (quando suportado)

**Tokens table:**
- [ ] 3 colunas: token, class, part (valores HSL ficam na documentação de temas — não na docs page do componente)
- [ ] Todos os tokens CSS usados pelo componente (ex: mínimo 6 para Alert: background, foreground, card, card-foreground, destructive, border)
- [ ] Bloco de customização com exemplo de override CSS via `tokens.customizationTitle`
- [ ] Wrapper: `space-y-6` com `style="margin:0"` na `<table>`

### 5. Auditar estrutura HTML das docs pages (nesting e espaçamento)

Verifique cada `*Docs.tsx` (e equivalentes Vue/Svelte/Basecoat) em busca de aninhamento desnecessário que acumula espaçamento:

**5.1 Padrão de tabela — buscar violações:**

```bash
# Tabelas dentro de ComponentDemo (errado — ComponentDemo é só para demos interativas de UI)
grep -n "ComponentDemo" design-system-*/src/components/docs/*Docs.* | grep -A2 "<table"

# Tabelas com dois wrappers (errado — um wrapper é suficiente)
# Padrão problemático: <ComponentDemo><div class="overflow-x-auto"><table>
grep -n "overflow-x-auto" design-system-*/src/components/docs/*Docs.* | grep -v "border rounded"
```

**Regra obrigatória (ver guideline 08, seção 3.2)**: toda tabela de documentação deve estar em **uma única div** com as classes exatas:
```
border rounded-xl overflow-x-auto p-4 shadow-sm
```

Casos que violam a regra:
- `<ComponentDemo>` envolvendo uma tabela → remover ComponentDemo, aplicar wrapper padrão
- `<div class="overflow-x-auto border ... overflow-hidden">` sem `p-4` → adicionar `p-4`, remover `overflow-hidden`
- Dois divs aninhados onde o outer tem padding e o inner tem overflow → fundir em um

**5.2 Padding de cards — buscar violações:**

```bash
# Cards com p-3 (mínimo é p-4)
grep -n "border.*rounded.*p-3\|p-3.*border.*rounded" design-system-*/src/components/docs/*Docs.*
```

Todo card de conteúdo (border + rounded + qualquer bg) deve ter `p-4` mínimo.

### 6. Arquitetura de Informação

Audite a docs page como um todo — semântica HTML, hierarquia visual, tipografia acessível, links e consistência.

**6.1 Semântica HTML**

```bash
# Verificar hierarquia de headings — h2 para seções, h3 para sub-seções, nunca pular níveis
grep -n "<h[1-6]\|<H[1-6]" design-system-react/src/components/docs/<slug>Docs.tsx
```

- [ ] `<h2>` para cada seção principal (deve corresponder às âncoras do `DocsNav`)
- [ ] `<h3>` apenas dentro de seções que tenham sub-divisões
- [ ] Nunca `<h1>` (o `DocsHeader` já renderiza o título principal)
- [ ] Nunca pular nível (ex: `<h2>` seguido de `<h4>`)
- [ ] Tabelas usam `<thead>` + `<th>` com `scope` quando aplicável
- [ ] Listas usam `<ul>`/`<ol>` semânticos (não divs simulando lista)
- [ ] Elementos clicáveis não-link usam `role="link"` + `tabindex="0"` + handler de teclado

**6.2 Tipografia e tamanhos mínimos**

```bash
# Buscar fontes menores que 12px (potencial violação de legibilidade)
grep -n "text-\[9px\]\|text-\[10px\]\|text-\[11px\]" design-system-*/src/components/docs/*Docs.*
```

Regras de tamanho mínimo para docs pages:

| Contexto | Tamanho mínimo | Classes permitidas |
|----------|---------------|-------------------|
| Corpo de texto, descrições, células de tabela | 12px | `text-xs` (12px) ou maior |
| Labels de badge/tag | 11px | `text-[11px]` (exceção permitida para badges compactos) |
| Código inline (`<code>`) | 11px | `text-[11px]` dentro de `<code>` apenas |
| Texto decorativo (ex: "axe" no ícone) | Sem mínimo | Texto que não carrega informação funcional |

Violações comuns:
- `text-[9px]` ou `text-[10px]` em corpo de texto ou células de tabela → substituir por `text-xs`
- `text-[10px]` em `font-mono` dentro de tabelas → substituir por `text-xs font-mono`
- Descrições de seção com `text-muted-foreground` abaixo de `text-xs` → corrigir

**6.3 Hierarquia visual e espaçamento**

- [ ] Seções principais separadas por espaçamento consistente (`space-y-8` ou `space-y-10` no container pai)
- [ ] Sub-seções com espaçamento menor que seções (`space-y-6` ou `mb-6`)
- [ ] Títulos de seção (`h2`) com estilo uniforme: `text-xl font-semibold mb-6`
- [ ] Títulos de sub-seção (`h3`) com estilo uniforme: `font-semibold text-sm mb-1`
- [ ] Descrições de seção: `text-xs text-muted-foreground mb-4`
- [ ] Padding de tabela: `p-3` mínimo em `<td>`, `p-4` em `<th>`

**6.4 Links e navegação**

```bash
# Links com href hardcoded (podem quebrar)
grep -n 'href="http\|href="/' design-system-*/src/components/docs/*Docs.*

# Links internos do Storybook (devem usar window.top pattern)
grep -n 'href=.*storybook\|href=.*iframe' design-system-*/src/components/docs/*Docs.*

# Âncoras do DocsNav que não têm section correspondente
# (comparar array de nav items com ids de <section>)
```

- [ ] Toda âncora no `DocsNav` tem um `<section id="...">` correspondente na página
- [ ] Links para outros componentes usam `window.top.location.href` (não `<a href>` direto)
- [ ] Links externos têm `target="_blank"` e `rel="noopener noreferrer"`
- [ ] Nenhum link aponta para URL inexistente ou placeholder

**6.5 Consistência cross-section**

- [ ] Todas as tabelas seguem o mesmo padrão visual (wrapper, cabeçalho, células)
- [ ] Badges de prioridade/status usam o mesmo estilo em todas as tabelas
- [ ] Ícones de seção: nenhum h2 deve ter emoji ou ícone decorativo (consistência com títulos limpos)
- [ ] Cards de conteúdo (border + rounded) mantêm padding uniforme (`p-4` mínimo)
- [ ] Código inline (`<code>`) tem estilo consistente em toda a página

### 7. Identificar gaps

Compare os critérios de teste da tabela acima com as play functions existentes. Liste cenários faltantes e proponha stories para cobri-los.

---

## Saída Esperada

1. **Matriz de cobertura** atualizada para cada stack
2. **Play functions** adicionadas/corrigidas nas stories
3. **Seção "Testes"** adicionada/atualizada no `translations.json`
4. **Relatório de arquitetura de informação**:
   - Semântica HTML: ✅/❌ (heading hierarchy, landmarks, tabelas semânticas)
   - Tipografia: ✅/❌ (fontes abaixo do mínimo listadas com arquivo:linha)
   - Links: ✅/❌ (links quebrados, âncoras órfãs)
   - Consistência visual: ✅/❌ (paddings, badges, ícones em títulos)
5. **Relatório de gaps**:
   - Cenários sem story: ❌
   - Stories sem play function: ⚠️
   - Critérios WCAG sem verificação: ❌
   - Stories com `a11y.disable`: ⚠️ (com justificativa)

---

## Commit de Rastreabilidade

Ao finalizar todas as alterações, execute:

```bash
git add -A
git commit -m "skill(quality): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
