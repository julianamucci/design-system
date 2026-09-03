# Overlay Components (Nortear — Vanilla TypeScript)

---

## Regras Globais de Overlay

### Tokens de fundo por tipo

**Nenhuma cor de fundo se escreve no call site.** Cada overlay tem folha, e é a
folha que lê o token. Aplicar a classe do painel é o que aplica a superfície.

| Tipo de overlay | Quem lê o token | Tokens |
|---|---|---|
| Painel de conteúdo (modal, lateral) | `.nds-dialog-content`, `.nds-alert-dialog-content`, `.nds-sheet-content` | superfície do painel + `-foreground` do par |
| Menu e overlay flutuante | `.nds-dropdown-menu-content`, `.nds-popover-content`, `.nds-tooltip-content` | `--popover` / `--popover-foreground` |
| Véu atrás do painel modal | `.nds-dialog-overlay`, `.nds-alert-dialog-overlay`, `.nds-sheet-overlay` | resolvido pela folha — **nunca** um valor no call site |

> **Pendência medida.** As três folhas de painel modal não concordam entre si
> hoje: `dialog.css` lê `--popover`, enquanto `alert-dialog.css` e `sheet.css`
> leem `--background`. Nenhuma lê `--card`, que é o que esta guideline pedia
> antes. Enquanto a divergência existir, a regra que vale é a estrutural — a
> classe do painel resolve a superfície, e ninguém pinta fundo por fora.

### Comportamento de teclado — implementar manualmente

Em Vanilla TS, os comportamentos de teclado são implementados explicitamente em cada factory:

- **Escape**: fecha o overlay ativo (event listener em `document`)
- **Focus trap**: dentro de Dialog/Sheet, Tab e Shift+Tab circulam apenas entre elementos focáveis do overlay
- **Restaurar foco**: ao fechar, devolver o foco ao elemento que abriu o overlay
- **Click fora**: backdrop fecha overlay; Tooltip não fecha por click

### Camadas — token, nunca número

Da mais baixa para a mais alta: `--z-dropdown` → `--z-sticky` → `--z-fixed` →
`--z-modal-backdrop` → `--z-modal` → `--z-popover` → `--z-tooltip` → `--z-toast`.
Cada folha lê o seu degrau; a ordem é a garantia de que o balão de um controle
dentro do modal aparece por cima dele, e de que o aviso temporário aparece por
cima de tudo. Empatar tudo num número só desfaz essa garantia. **Não existe
utilitária de camada** (`.nds-z-*`): quem precisa de um degrau usa o token.

---

## Dialog

**Propósito**: modal para formulários, edição ou confirmações que exigem atenção exclusiva do usuário.

**API e exemplos**: `src/components/ui/dialog.ts` + stories + `DialogDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
.nds-dialog-overlay (data-state)                  ← véu; a folha o cobre e o pinta
.nds-dialog-content (role="dialog", aria-modal, aria-labelledby, aria-describedby)
├── close button (canto superior, aria-label="Fechar dialog")
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
- O véu é `.nds-dialog-overlay`, e só isso. **Cor literal é proibida** — o próprio sistema exige token, e a folha `dialog.css` já resolve a cobertura, o desfoque e a camada. Escrever `preto a 80%` no call site tira o véu do tema: ele deixa de responder ao modo escuro e às marcas, e vira o único ponto da página imune à troca de tema
- Clique no véu fecha; Escape fecha; Tab/Shift+Tab faz focus trap
- Foco inicial: close button ou primeiro elemento focável
- Ao fechar: restaurar foco ao trigger original
- O painel é `.nds-dialog-content`: superfície, raio e respiro interno vêm da folha, não do call site
- **Posição e largura também são da folha.** Ela centraliza o painel e limita a largura; conta de centralização escrita à mão duplica o que a folha faz e sai de sincronia com a variante lateral. Quando a largura precisa mudar num caso pontual, o degrau é `.nds-max-w-lg` (ou o vizinho na escada `.nds-max-w-*`) — nunca uma medida solta
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
- O painel arrasta na direção de entrada e é dispensado quando o gesto passa de um quarto do seu tamanho, ou quando a soltura é rápida. Arrastar é **atalho**, nunca a única via: Escape, clique no fundo e o fechador do rodapé cobrem o mesmo objetivo sem trajeto de ponteiro (WCAG 2.5.7)
- O gesto só dispensa. Nada de redimensionar nem de parar em posição intermediária: capacidade que só o arraste alcança exige caminho alternativo próprio, e nenhum existe
- A alça é afordância do gesto, não o gancho dele: arrastar vale no painel inteiro, e por isso a alça não recebe foco nem nome
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
div wrapper
├── trigger (aria-haspopup, aria-expanded)
└── .nds-dropdown-menu-content (role="menu", data-side, data-align; hidden quando fechado)
    ├── .nds-dropdown-menu-item (role="menuitem")
    ├── .nds-dropdown-menu-separator (role="separator") — opcional
    └── .nds-dropdown-menu-item[data-variant="destructive"]
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
- A superfície é da folha: `.nds-dropdown-menu-content` lê `--popover` / `--popover-foreground`
- O realce do item — ponteiro em cima ou foco de teclado — é de `.nds-dropdown-menu-item`, que responde a `:hover`, `:focus` e `[data-highlighted]` lendo `--accent` / `--accent-foreground`. Os três precisam existir: só `:hover` deixa quem navega por teclado sem saber onde está
- Item destrutivo se marca por `data-variant="destructive"`, e a folha pinta com `--destructive` no estado normal e no realce. Não é classe de cor solta
- Click fora fecha; Escape fecha e devolve foco ao trigger
- Navegação por teclado: Setas ↑↓ entre itens, Enter executa
- Largura mínima e respiro interno dos itens vêm da folha; medida no call site desalinha um menu do outro

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
| `closeLabel` | `Fechar` | Nome acessível do botão de fechar |
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
- A rolagem da página fica travada enquanto o painel está aberto. `aria-modal="true"` diz ao leitor de tela que o resto da página está fora de alcance, e com a rolagem solta a promessa era falsa — o conteúdo atrás do painel rolava
- A trava é **contada**, em `src/lib/scroll-lock.ts`, e o Drawer usa a mesma. Guardar e devolver o valor cru de `overflow` dentro de cada fábrica parece certo e quebra com dois painéis: o segundo a abrir guarda `hidden` como "valor anterior" e o devolve ao fechar, e a partir daí a página nunca mais rola — sem erro e sem exceção. O valor original é lido uma vez, na primeira trava, e devolvido uma vez, quando a última solta
- Nome acessível do botão de fechar vem de `closeLabel`. Nada de string de interface cravada na fábrica — em página em inglês ou espanhol, texto fixo faria o leitor de tela anunciar em português

**Analytics**: emitir `sheet_open` / `sheet_close` com `{ component, side, reason }`.

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
- A superfície é de `.nds-tooltip-content`, que lê `--popover` / `--popover-foreground` e `--border`; o corpo do balão está na escada tipográfica do sistema (`.nds-text-caption`), não num tamanho escrito
- A posição é de `.nds-tooltip-positioner`, alimentado pelo cálculo compartilhado de `src/lib/floating.ts` — o mesmo do Popover e do menu. Deslocamento escrito à mão ignora a borda da janela e o balão sai da tela na primeira dobra
- A camada vem de `--z-tooltip`, lido pela folha
- A espera de abertura é POR CHAMADA (`delayDuration`, padrão 300ms) — nunca uma constante de módulo, que obrigaria a página inteira ao mesmo tempo
- Um conjunto de balões (barra de ícones, régua de ações) compartilha a espera por um provedor: dentro da janela de `skipDelayDuration` o balão seguinte abre na hora, porque quem já parou uma vez não precisa provar de novo
- Marcação dentro do balão — um atalho em `<kbd>`, uma palavra em `<strong>` — entra como ELEMENTO já montado, nunca como HTML em string (guideline 09)

**Acessibilidade**:
- `role="tooltip"` obrigatório
- `aria-describedby` no trigger (não `aria-labelledby` — tooltip descreve, não rotula)
- Visível em teclado (focus), não apenas hover
- Texto sempre visível para leitores de tela enquanto o trigger tem foco
