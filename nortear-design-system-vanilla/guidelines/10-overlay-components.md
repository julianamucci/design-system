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

## Drawer

**Propósito**: painel que entra por uma borda da tela, com alça visível quando entra de baixo. É a variante gestual do Sheet.

**API e exemplos**: `src/components/ui/drawer.ts` + stories + `DrawerDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**: painel e fundo são portalizados para o `document.body`; só o gatilho fica no lugar onde a fábrica foi chamada.

```
wrapper
└── trigger                                       (fornecido por quem compõe)

document.body
├── .nds-sheet-overlay                            [data-slot="drawer-overlay"]
└── .nds-drawer-content                           [data-slot="drawer-content"]
    │                                             role="dialog", data-vaul-drawer-direction
    ├── .nds-drawer-handle                        (aria-hidden)
    ├── .nds-drawer-header                        (só se houver título ou descrição)
    │   ├── .nds-sheet-title
    │   └── .nds-sheet-description
    ├── .nds-drawer-body
    └── .nds-drawer-footer                        (opcional)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `trigger` | — | Elemento que abre (obrigatório) |
| `content` | — | Corpo (obrigatório) |
| `direction` | `bottom` | `bottom`, `top`, `left`, `right`. Só em `bottom` a alça aparece |
| `title` | — | Vinculado por `aria-labelledby` |
| `description` | — | Vinculada por `aria-describedby` |
| `footer` | — | Rodapé com ações |
| `dismissible` | `true` | Em `false`, Escape e clique no fundo não fecham |
| `modal` | `true` | Em `false`, sem `aria-modal` e sem trava de rolagem |
| `onOpenChange` | — | Recebe o estado a cada abertura e fechamento |
| `onClose` | — | Recebe o motivo: `escape`, `overlay`, `close-button` ou `api` |
| `class` | — | Classe extra no painel |

A fábrica devolve `open()`, `close()`, `toggle()` e `isOpen()` além do `destroy()`.

**Regras**:
- A direção se chama `direction`, e a do Sheet se chama `side`. São componentes diferentes e a divergência é intencional: a gaveta se move num eixo, o Sheet encosta num lado
- `data-vaul-drawer-direction` vai no PAINEL, nunca no wrapper: toda regra de posição, borda e canto do CSS compartilhado lê `.nds-drawer-content[data-vaul-drawer-direction=…]`. Escrito no wrapper, não pinta nada
- Não há botão de fechar embutido. Quem compõe põe o seu no rodapé e marca com `data-slot="drawer-close"`, que a fábrica liga sozinha — é o equivalente desta stack ao componente `DrawerClose` das outras. Sem a marca, o "Cancelar" do rodapé é um botão inerte
- Com `dismissible: false`, esse fechador do rodapé passa a ser a ÚNICA saída. Não publique um painel assim sem ele
- Arrastar é afordância, não mecanismo: a alça não recebe foco nem nome
- Direção `bottom` é o caso típico em tela estreita

**Acessibilidade**:
- `role="dialog"`, `aria-labelledby` e `aria-describedby` conforme título e descrição existam
- `aria-modal="true"` só quando `modal`; em `modal: false` o resto da página segue utilizável, e é isso que o atributo tem de dizer
- Foco entra no primeiro focável do painel e volta ao gatilho ao fechar
- Tab e Shift+Tab circulam dentro do painel enquanto ele existe, inclusive em `modal: false`
- A alça é `aria-hidden`: não há gesto atrás dela, e anunciá-la só somaria ruído
- Escape não fecha quando `dismissible: false`, mas também não é engolido — o painel não pode virar armadilha de teclado (WCAG 2.1.2)

**Analytics**: emitir `drawer_open` / `drawer_close` com `{ component, direction, reason }` — `reason` é o valor de `onClose`, e é o motivo de ele existir.

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
| `items` | — | Itens por `type`: `item`, `separator`, `label`, `checkbox`, `radio` |
| `side` | `'bottom'` | Borda do gatilho por onde o menu sai |
| `align` | `'start'` | Encosto do menu no eixo perpendicular ao lado |
| `sideOffset` | `4` | Vão entre gatilho e menu, em px |
| `modal` | `true` | Bloqueia a interação com o resto da página: o clique de fora dispensa o menu sem chegar ao que está embaixo, e a página não rola |
| `open` | — | Estado controlado. Definido, a interação só ANUNCIA por `onOpenChange` e o menu se move em `setOpen()` |
| `defaultOpen` | `false` | Estado inicial no modo não-controlado |
| `onOpenChange` | — | Avisado a cada abertura e fechamento |
| `class` | — | Classes adicionais aplicadas ao painel |

O elemento devolvido aceita `open()`, `close()`, `toggle()`, `setOpen(boolean)` e `destroy()`. `side` e `align` também saem no markup do painel, como `data-side` e `data-align`.

A conta de posição é a mesma do Popover e do Tooltip, e mora num lugar só (`src/lib/floating.ts`). Duas cópias divergem: enquanto o menu tinha a sua, ele ficou anos sem `side` enquanto a story anunciava o controle.

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

## Sheet

**Propósito**: painel que encosta numa borda da tela, para conteúdo secundário sem tirar o contexto da página. Para a variante gestual, com alça, **Drawer**.

**API e exemplos**: `src/components/ui/sheet.ts` + stories + `SheetDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**: painel e fundo são portalizados para o `document.body`; só o gatilho fica no lugar onde a fábrica foi chamada.

```
wrapper
└── trigger                                       (aria-haspopup="dialog")

document.body
├── .nds-sheet-overlay
└── .nds-sheet-content                            role="dialog", aria-modal, data-side
    ├── .nds-sheet-header                         (só se houver título ou descrição)
    │   ├── .nds-sheet-title
    │   └── .nds-sheet-description
    ├── .nds-sheet-body
    ├── .nds-sheet-footer                         (opcional)
    └── .nds-sheet-close                          (último no DOM, no canto pelo CSS)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `trigger` | — | Elemento que abre (obrigatório) |
| `content` | — | Corpo (obrigatório) |
| `side` | `right` | `top`, `right`, `bottom`, `left` |
| `title` | — | Vinculado por `aria-labelledby` |
| `description` | — | Vinculada por `aria-describedby` |
| `footer` | — | Rodapé com ações |
| `onOpenChange` | — | Recebe o estado a cada abertura e fechamento |
| `onClose` | — | Recebe o motivo: `escape`, `overlay` ou `close-button` |
| `class` | — | Classe extra no painel |

**Regras**:
- Lado lateral para conteúdo em coluna; lado inferior para conteúdo curto em tela estreita
- Título e descrição não são obrigatórios pela fábrica, mas painel modal sem nome acessível reprova WCAG 4.1.2 — trate-os como obrigatórios em produto
- `class` existe para dimensão, não para recolorir: o fundo é o token de painel de conteúdo
- O botão de fechar é sempre desenhado, e é o último filho do painel no DOM; quem o põe no canto é o CSS. A ordem de leitura fica header, corpo, rodapé, fechar
- Um Sheet por vez, e nunca aninhado com Dialog

**Acessibilidade**:
- `role="dialog"` + `aria-modal="true"` sempre; `aria-labelledby` e `aria-describedby` conforme título e descrição existam
- Gatilho com `aria-haspopup="dialog"`
- Foco entra no primeiro focável e volta ao gatilho ao fechar; Tab e Shift+Tab circulam dentro do painel
- Escape e clique no fundo fecham

**Analytics**: emitir `sheet_open` / `sheet_close` com `{ component, side, reason }`.

**Dívida medida, para não ser redescoberta**:
- O nome acessível do botão de fechar é a string `Fechar`, cravada na fábrica. Não passa por `labels` nem por tradução, então em página em inglês ou espanhol o leitor de tela ouve português. É a única string de interface presa nesta stack de overlay
- O Sheet NÃO trava a rolagem do `body` enquanto aberto; o Drawer trava quando `modal`. São irmãos com comportamento diferente atrás do mesmo `aria-modal="true"`, e o atributo promete o que só um deles cumpre

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
- A espera de abertura é POR CHAMADA (`delayDuration`, padrão 300ms) — nunca uma constante de módulo, que obrigaria a página inteira ao mesmo tempo
- Um conjunto de balões (barra de ícones, régua de ações) compartilha a espera por um provedor: dentro da janela de `skipDelayDuration` o balão seguinte abre na hora, porque quem já parou uma vez não precisa provar de novo
- Marcação dentro do balão — um atalho em `<kbd>`, uma palavra em `<strong>` — entra como ELEMENTO já montado, nunca como HTML em string (guideline 09)

**Acessibilidade**:
- `role="tooltip"` obrigatório
- `aria-describedby` no trigger (não `aria-labelledby` — tooltip descreve, não rotula)
- Visível em teclado (focus), não apenas hover
- Texto sempre visível para leitores de tela enquanto o trigger tem foco
