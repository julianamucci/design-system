# Overlay Components

---

## Regras Globais de Overlay

### Tokens de fundo por tipo

A cor de superfície não tem classe utilitária: quem a aplica é a folha do
componente, lendo o token. A regra é qual PAR de tokens vale para cada tipo.

| Tipo de overlay | Tokens | Componentes |
|-----------------|--------|-------------|
| Painel de conteúdo (modal, lateral) | `--card` / `--card-foreground` | Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `--popover` / `--popover-foreground` | DropdownMenu, Popover, Tooltip, Command |

O véu atrás do painel modal é da folha `.nds-dialog-overlay` — não se escreve
uma cor semitransparente no template.

### Comportamento de teclado

| Tecla | Ação |
|-------|------|
| `Escape` | Fecha o overlay e retorna foco ao trigger |
| `Tab` / `Shift+Tab` | Navega entre elementos focáveis (focus trap em Dialog, Sheet, Drawer) |
| `Enter` / `Space` | Ativa o item focado |
| `Arrow Down/Up` | Navega entre itens de menu |

Todos esses comportamentos são gerenciados automaticamente pelo **Bits UI** — não reimplementar.

### Triggers com `asChild` / builder pattern

Bits UI usa um padrão de builder para passar props de acessibilidade ao trigger customizado: o trigger declara `asChild let:builder` e o elemento alvo (`Button`, `a`, etc.) recebe `builders={[builder]}`. Consultar `src/components/ui/<componente>/` para os exemplos canônicos.

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
