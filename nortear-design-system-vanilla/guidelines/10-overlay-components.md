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

## Componentes desta categoria

O que cada um É, com a estrutura, os tokens, as decisões fixadas e a medição de
cada uma, mora em `docs/shared/prd/` — um arquivo por componente, cross-stack,
com os nomes de peça de TODAS as stacks na seção "Peças, por stack".

| componente | PRD |
|---|---|
| AlertDialog | [alert-dialog.md](../../docs/shared/prd/alert-dialog.md) |
| Command | [command.md](../../docs/shared/prd/command.md) |
| ContextMenu | [dropdown-menu.md](../../docs/shared/prd/dropdown-menu.md) — não tem folha própria, ver decisão D9 |
| Dialog | [dialog.md](../../docs/shared/prd/dialog.md) |
| Drawer | [drawer.md](../../docs/shared/prd/drawer.md) |
| DropdownMenu | [dropdown-menu.md](../../docs/shared/prd/dropdown-menu.md) |
| HoverCard | [hover-card.md](../../docs/shared/prd/hover-card.md) |
| Popover | [popover.md](../../docs/shared/prd/popover.md) |
| Sheet | [sheet.md](../../docs/shared/prd/sheet.md) |
| Tooltip | [tooltip.md](../../docs/shared/prd/tooltip.md) |

**Por que saíram daqui.** As cinco cópias desta guideline cobriam a mesma
categoria com profundidades diferentes — de 6 a 13 seções —, e o vanilla, que é
a referência de contrato da casa, documentava 6 dos 10. Não era especialização
por stack: era cobertura desigual do mesmo assunto, em cinco lugares que
envelheciam separados. O que era mesmo específico de stack — os nomes de peça —
foi para o PRD, extraído dos exports e dos seletores, não transcrito daqui.

O que continua nesta guideline é o que o PRD não tem casa para guardar: regra que
vale para a CATEGORIA inteira, atravessando os componentes.
