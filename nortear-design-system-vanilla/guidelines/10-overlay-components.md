# Overlay Components (Nortear — Vanilla TypeScript)

---

## Regras Globais de Overlay

### Tokens de fundo por tipo

| Tipo de overlay | Token correto | Uso |
|---|---|---|
| Painel de conteúdo (modal, lateral) | `bg-card text-card-foreground` | Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `bg-popover text-popover-foreground` | Dropdown, Popover, Tooltip |

### Comportamento de teclado — implementar manualmente

Em Vanilla TS, os comportamentos de teclado são implementados explicitamente em cada factory:

- **Escape**: fecha o overlay ativo (event listener em `document`)
- **Focus trap**: dentro de Dialog/Sheet, Tab e Shift+Tab circulam apenas entre elementos focáveis do overlay
- **Restaurar foco**: ao fechar, devolver o foco ao elemento que abriu o overlay
- **Click fora**: backdrop fecha overlay; Tooltip não fecha por click

### Z-index padrão

| Camada | Z-index |
|---|---|
| Dropdown / Popover / Tooltip | `50` |
| Backdrop de Dialog/Sheet | `50` |
| Dialog/Sheet painel | `50` |
| Toast | `50` (acima de overlays não-modais) |

---

## Dialog

**Propósito**: modal para formulários, edição ou confirmações que exigem atenção exclusiva do usuário.

**API e exemplos**: `src/components/ui/dialog.ts` + stories + `DialogDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
backdrop (fixed inset-0, bg-black/80)
dialog (role="dialog", aria-modal, aria-labelledby, aria-describedby)
├── close button (absolute top-right, aria-label="Fechar dialog")
├── h2 title (id referenciado por aria-labelledby)
├── p description (id referenciado por aria-describedby)
├── content
└── footer (opcional)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `title` | — | Título (obrigatório) |
| `description` | — | Descrição (obrigatório, vinculada via `aria-describedby`) |
| `content` | — | Corpo |
| `footer` | — | Rodapé com ações |
| `onClose` | — | Callback ao fechar |

**Regras**:
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby` (todos obrigatórios)
- Backdrop opaco em `bg-black/80`; click fecha
- Escape fecha; Tab/Shift+Tab faz focus trap
- Foco inicial: close button ou primeiro elemento focável
- Ao fechar: restaurar foco ao trigger original
- Painel: `bg-card text-card-foreground`, `rounded-lg`, padding em `--spacing-6`
- Largura máxima `max-w-lg`; centralizado via `translate-x-[-50%] translate-y-[-50%]`
- Não aninhar Dialogs — usar fluxo sequencial

**Acessibilidade**:
- `aria-modal="true"` obrigatório
- Close button com `aria-label` descritivo
- Foco preso dentro do dialog enquanto aberto
- Conteúdo fora do dialog inerte (idealmente via `inert` ou aria-hidden no resto da página)

**Analytics**: emitir `dialog_open` / `dialog_close` com `{ component, trigger? }`.

---

## Dropdown Menu

**Propósito**: menu contextual de ações disparado por um trigger (botão, ícone). Para seleção de valor único de uma lista, usar Select.

**API e exemplos**: `src/components/ui/dropdown-menu.ts` + stories + `DropdownMenuDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div wrapper (relative inline-block)
├── trigger (aria-haspopup, aria-expanded)
└── menu (role="menu", absolute, bg-popover, hidden quando fechado)
    ├── button (role="menuitem")
    ├── hr (role="separator") — opcional
    └── button (role="menuitem", destructive opcional)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `trigger` | — | Elemento que abre o menu |
| `items` | — | Array `{ label, onClick, destructive? }` ou `'separator'` |

**Regras**:
- Trigger com `aria-haspopup="true"` + `aria-expanded` atualizado
- Menu com `role="menu"`; itens com `role="menuitem"`
- Separadores com `role="separator"` e `aria-hidden="true"`
- Tokens: `bg-popover text-popover-foreground`; hover `bg-accent text-accent-foreground`
- Itens destrutivos: `text-destructive` no estado normal e hover
- Click fora fecha; Escape fecha e devolve foco ao trigger
- Navegação por teclado: Setas ↑↓ entre itens, Enter executa
- Largura mínima `min-w-[8rem]`; padding dos itens em `--spacing-2 × --spacing-1.5`

**Acessibilidade**:
- `role="menu"` + `role="menuitem"` obrigatórios
- `aria-expanded` no trigger
- Foco gerenciado: ao abrir, foco vai ao primeiro item; ao fechar, volta ao trigger

**Analytics**: emitir `menu_item_click` com `{ menu, item }`.

---

## Tooltip

**Propósito**: descrição curta de um elemento focável, exibida no hover/focus. Para conteúdo interativo, usar Popover.

**API e exemplos**: `src/components/ui/tooltip.ts` + stories + `TooltipDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div wrapper (relative inline-block)
├── trigger (aria-describedby aponta ao tooltip)
└── tooltip (role="tooltip", id único, hidden quando inativo)
```

**Regras**:
- `role="tooltip"` com ID único; trigger usa `aria-describedby` apontando ao ID
- Aparece em hover **e** focus; desaparece em mouseleave **e** blur
- Não pode conter conteúdo interativo (botões, links) — usar Popover nesses casos
- Texto curto (máx ~50 chars); para conteúdo longo, usar Popover
- Tokens: `bg-popover text-popover-foreground`, `border-border`, `text-xs`
- Posição padrão: acima do trigger (`bottom-full mb-2`)
- Z-index `50`

**Acessibilidade**:
- `role="tooltip"` obrigatório
- `aria-describedby` no trigger (não `aria-labelledby` — tooltip descreve, não rotula)
- Visível em teclado (focus), não apenas hover
- Texto sempre visível para leitores de tela enquanto o trigger tem foco
