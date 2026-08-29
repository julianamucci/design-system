# Critérios de Teste por Tipo de Componente

Referência para `/quality` e dev-skills. **Leia apenas quando precisar dos critérios específicos da categoria** — para casos típicos, basta seguir a story Playground como template.

API uniforme: `import { fn, userEvent, within, expect } from 'storybook/test'`. Idêntica em React/Vue/Svelte/Vanilla.

---

## Botões e Ações

| Critério | play function |
|---|---|
| Clique dispara callback | `userEvent.click` + `expect(args.onClick).toHaveBeenCalled()` |
| Disabled previne clique | `userEvent.click(el, { pointerEventsCheck: 0 })` + `expect(args.onClick).not.toHaveBeenCalled()` |
| Disabled tem atributo | `expect(button).toBeDisabled()` |
| Focus via Tab | `button.focus()` + `expect(button).toHaveFocus()` |
| Enter aciona | `userEvent.keyboard('{Enter}')` + `expect(args.onClick)` |
| Space aciona | `userEvent.keyboard(' ')` + `expect(args.onClick)` |
| `aria-label` em icon-only | `canvas.getByRole('button', { name: 'Label' })` |

---

## Inputs e Formulários

| Critério | play function |
|---|---|
| Digitação atualiza valor | `userEvent.type(input, 'texto')` + `expect(input).toHaveValue('texto')` |
| Label associada | `canvas.getByLabelText('Label')` |
| Required validation | `expect(input).toBeRequired()` |
| aria-invalid em erro | `expect(input).toHaveAttribute('aria-invalid', 'true')` |
| Error message linked | `expect(input).toHaveAccessibleDescription('mensagem de erro')` |
| Placeholder visível | `expect(input).toHaveAttribute('placeholder', '...')` |

---

## Dialogs e Overlays (Dialog, AlertDialog, Drawer, Sheet)

| Critério | play function |
|---|---|
| Abre ao trigger | `userEvent.click(trigger)` + `body.findByRole('dialog')` (em portal) |
| role + aria-modal | `expect(dialog).toHaveAttribute('aria-modal', 'true')` |
| Title via aria-labelledby | `expect(dialog).toHaveAccessibleName('título')` |
| Fecha com ESC | `userEvent.keyboard('{Escape}')` + waitFor not.toBeInTheDocument |
| Focus trap | Tab navega apenas dentro do dialog após abrir |
| Retorna foco ao fechar | `expect(trigger).toHaveFocus()` após fechar |
| Click no overlay fecha | `userEvent.click(overlay)` (se dismissible) |

**Stories que abrem overlay**: feche antes do `postVisit` (axe panel detecta violations no portal aberto).

---

## Menus (DropdownMenu, ContextMenu, Menubar, NavigationMenu)

| Critério | play function |
|---|---|
| role no Root | `expect(root).toHaveAttribute('role', 'menu')` ou `'menubar'` ou `'navigation'` |
| aria-haspopup no Trigger | `expect(trigger).toHaveAttribute('aria-haspopup', 'menu')` |
| aria-expanded reflete estado | `expect(trigger).toHaveAttribute('aria-expanded', 'true')` ao abrir |
| Setas navegam itens | `userEvent.keyboard('{ArrowDown}')` + `expect(item2).toHaveFocus()` |
| ESC fecha + retorna foco | `userEvent.keyboard('{Escape}')` + `expect(trigger).toHaveFocus()` |
| MenuItem ativa | `userEvent.click(item)` + verifica callback ou navegação |
| CheckboxItem | `expect(item).toHaveAttribute('role', 'menuitemcheckbox')` + aria-checked |
| RadioItem | `expect(item).toHaveAttribute('role', 'menuitemradio')` + aria-checked |
| Typeahead | `userEvent.keyboard('p')` move foco para item começando com 'p' |
| **NavigationMenu** | aria-label obrigatório no Root + `aria-current="page"` em Link ativo |

---

## Seleção (Select, Toggle, RadioGroup, Checkbox, Switch)

| Critério | play function |
|---|---|
| Arrow keys navegam opções | `userEvent.keyboard('{ArrowDown}')` |
| Enter/Space seleciona | `userEvent.keyboard('{Enter}')` + verificar seleção |
| aria-selected / aria-checked | `expect(option).toHaveAttribute('aria-selected', 'true')` |
| Disabled (base-ui pattern) | `expect(el).toHaveAttribute('aria-disabled', 'true')` (NÃO `toBeDisabled()` — span com role) |
| Switch: aria-checked | `expect(switch).toHaveAttribute('aria-checked', 'true'/'false')` |

---

## Disclosure (Accordion, Collapsible, Drawer/Sheet enquanto disclosure)

| Critério | play function |
|---|---|
| Trigger expande Content | `userEvent.click(trigger)` + `expect(trigger).toHaveAttribute('aria-expanded', 'true')` |
| ESC fecha (se modal) | `userEvent.keyboard('{Escape}')` |
| Disabled trigger | `expect(trigger).toHaveAttribute('aria-disabled', 'true')` (base-ui usa aria-disabled, não disabled) |

---

## Display (Avatar, Badge, Card, Chart, Carousel, Table)

Componentes passivos: testes focam em **render correto** e **a11y attributes**, não interação.

| Critério | play function |
|---|---|
| ChartContainer com aria-label | `canvas.getByRole('img', { name: /título do gráfico/i })` |
| Avatar fallback | renderizar Avatar sem src → fallback visível |
| Badge texto correto | `expect(badge).toHaveTextContent('Label')` |
| Carousel slide ativo | aria-current="true" no slide ativo |

---

## Hover (HoverCard, Tooltip, Popover hover)

| Critério | play function |
|---|---|
| Foco abre Content (WCAG 1.4.13) | `trigger.focus()` + `body.findByRole('dialog')` |
| Hover abre Content | `userEvent.hover(trigger)` + waitFor com `findByRole` |
| ESC fecha (dismissable) | `userEvent.keyboard('{Escape}')` |
| Persistente em hover (hoverable) | mover cursor para Content → não fecha |

`openDelay` baixo (50-100ms) em stories de teste para evitar timeout.

---

## Stories sem interação (variantes/tamanhos passivos)

Mesmo sub-stories visuais precisam de play function (mesmo simples) para evitar violação `substory_no_play` no audit. Mínimo aceitável:

```ts
play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector('[data-slot="component"]');
  expect(root).toHaveAttribute('data-variant', 'destructive');
}
```

---

## Conversacional (Markdown, e o que vier depois)

A entrada vem de FORA do código — numa interface conversacional, de um modelo.
Isso muda o que se testa: o assunto não é "renderiza", é "renderiza sem virar
markup, e sem perder nada pelo caminho".

| Critério | play function |
|---|---|
| HTML não vira markup | `expect(root.querySelector('script')).toBeNull()` **e** o texto dele visível no `textContent` |
| Endereço de esquema recusado | `expect(canvas.queryByRole('link')).toBeNull()` **e** o texto do link permanece |
| Bloco fora da lista branca | some do papel (`queryByRole('table')` nulo) e sobra como texto |
| Sem região viva durante o streaming | `expect(root.querySelector('[aria-live]')).toBeNull()` + `aria-busy="true"` na raiz |
| Construção ainda aberta | com a cerca sem fechar, NÃO existe `.nds-code-block-root` |

Três armadilhas medidas ao escrever o Markdown, e que valem para o resto da
categoria:

1. **`toHaveTextContent` normaliza o espaço antes de comparar.** Para provar que
   a ênfase termina colada na pontuação, ou que o texto cru não ganhou recuo, a
   leitura tem de ser do `textContent` puro (`toContain`, `startsWith`).
2. **O snippet do painel Code carrega o documento**, e o documento tem quebras de
   linha que SIGNIFICAM. Todo construtor de snippet aqui precisa de teste
   unitário próprio: recuo de uma casa muda o que a pessoa copia, e nenhuma
   suíte de navegador alcança a saída do painel.
3. **Caixa de item de tarefa precisa de NOME.** `<input type="checkbox" disabled>`
   sem rótulo reprova no axe, e com razão: ela é anunciada sozinha, sem dizer o
   que está marcado.

---

## Estrutura `testes` em translations.json

```json
"testes": {
  "title": "Critérios de Teste",
  "functional": {
    "title": "Comportamento Funcional",
    "description": "O que deve acontecer em resposta a cada interação.",
    "item1": { "action": "...", "result": "...", "priority": "high" }
  },
  "accessibility": {
    "title": "Acessibilidade Verificável",
    "description": "Critérios que ferramentas automatizadas devem confirmar.",
    "item1": "Sem violações reportadas pelo axe-core no estado padrão"
  },
  "visual": {
    "title": "Regressão Visual",
    "description": "Estados que o Chromatic deve capturar.",
    "required": "Obrigatório",
    "item1": { "story": "Default", "priority": "high" }
  }
}
```

**`priority`**: `"high"` ou `"medium"` — não localizar.

| Sub-seção | Mínimo |
|---|---|
| `functional` | 4 itens (clique, teclado, disabled, caso de borda) |
| `accessibility` | 4 itens (axe-core, contraste, focus ring, aria) |
| `visual` | 4 itens (default, todas variantes, disabled, com ícone) |
