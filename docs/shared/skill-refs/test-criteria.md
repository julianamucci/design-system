# Critérios de Teste por Tipo de Componente

Referência para `/quality` e dev-skills. **Leia apenas quando precisar dos critérios específicos da categoria** — para casos típicos, basta seguir a story Playground como template.

API uniforme: `import { fn, userEvent, within, expect } from 'storybook/test'`. Idêntica em React/Vue/Svelte/Basecoat.

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
