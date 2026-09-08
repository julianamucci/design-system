# Overlay Components

---

## Regras Globais de Overlay

### Tokens de fundo por tipo de overlay

A superfície de um overlay é decidida pela folha do componente, e é ela que precisa estar na classe. Não existe utilitária para a superfície flutuante, e é de propósito: overlay pintado por fora também perde elevação, raio e animação de entrada — e quebra primeiro no modo escuro, onde a diferença entre as superfícies é o que separa um plano do outro.

| Componente | Folha que aplica | Token de fundo | Token de texto |
|---|---|---|---|
| Dialog | `.nds-dialog-content` | `--popover` | `--popover-foreground` |
| Sheet | `.nds-sheet-content` | `--background` | `--foreground` |
| Alert Dialog | `.nds-alert-dialog-content` | `--background` | `--foreground` |
| Drawer | `.nds-drawer-content` | `--background` | `--foreground` |
| Dropdown Menu, Context Menu, Menubar | `.nds-dropdown-menu-content` | `--popover` | `--popover-foreground` |
| Popover, Hover Card, Command | `.nds-popover-content`, `.nds-hover-card-content`, `.nds-command` | `--popover` | `--popover-foreground` |
| Tooltip | `.nds-tooltip-content` | `--primary` | `--primary-foreground` |
| Backdrop de qualquer modal | `.nds-dialog-overlay` | preto translúcido sobre `--z-modal-backdrop` | — |

> **Nunca sobrescrever a superfície de um overlay por fora.** O Tooltip é o exemplo de por que a regra existe: ele é o único que inverte o par de cores, e uma classe de fundo aplicada por cima o transformaria num retângulo sem contraste com o próprio texto.

### Padding consistente entre header, content e footer

Cabeçalho, corpo e rodapé de um painel se alinham porque o recuo é declarado uma vez, na folha do painel, e vem da escada `--spacing-*`: 16px no Dialog, 24px no Sheet. O rodapé rasga o recuo com margem negativa para chegar às bordas, o que só funciona porque os dois lados leem o mesmo degrau da escada. Acrescentar recuo por fora desfaz esse acerto e o rodapé passa a flutuar dentro do painel.

| Componente | Aplicação |
|------------|-----------|
| `DialogContent` | `p-[var(--overlay-padding)]` |
| `DrawerHeader` / `DrawerFooter` | `p-[var(--overlay-padding)]` |
| `SheetHeader` / `SheetFooter` | `p-[var(--overlay-padding)]` |
| `PopoverContent` | `p-[var(--overlay-padding-sm)]` |
| `HoverCardContent` | `p-[var(--overlay-padding-sm)]` |

### Comportamento de teclado — todos os overlays

| Tecla | Ação |
|-------|------|
| `Escape` | Fecha o overlay e retorna foco ao trigger |
| `Tab` / `Shift+Tab` | Navega entre elementos focáveis (focus trap ativo em Dialog, Sheet, Drawer) |
| `Enter` / `Space` | Ativa o item focado |
| `Arrow Down/Up` | Navega entre itens de menu (DropdownMenu, ContextMenu, Command) |

Todos esses comportamentos vêm do primitivo headless — `@base-ui/react` na maioria dos overlays, Vaul no `Drawer`. Não reimplementar.

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

## Padrão Responsivo — Dialog (desktop) + Drawer (mobile)

Para overlays que precisam funcionar em ambos os contextos, o padrão recomendado é renderizar `Dialog` em desktop e `Drawer` em mobile com o mesmo conteúdo.

**Regras**:
- Extrair o conteúdo para um componente separado — evita duplicação de JSX.
- `useMediaQuery` implementado com `addEventListener` para reagir a mudanças de viewport.
- Breakpoint padrão: `768px` (md) — alinhado com os breakpoints do projeto.
- Compartilhar `open` / `onOpenChange` entre Dialog e Drawer — estado único no caller.

---

## Regras transversais de Overlay Components

**Critério de decisão consolidado**:

| Situação | Componente |
|----------|------------|
| Formulário, criação, edição (modal) | Dialog |
| Confirmação de ação destrutiva | AlertDialog |
| Painel lateral em desktop | Sheet |
| Painel deslizante com gesture em mobile | Drawer |
| Lista de ações por clique explícito | DropdownMenu |
| Ações contextuais por right-click | ContextMenu + alternativa acessível |
| Conteúdo interativo contextual rico | Popover |
| Preview informativo ao hover | HoverCard |
| Texto explicativo curto | Tooltip |
| Busca rápida / command palette | Command |

**Tokens de fundo** (a tabela por componente está na regra global no início deste arquivo):
- Quem aplica a superfície é sempre a folha do componente; nenhum overlay é pintado por fora
- Menus e overlays flutuantes leem `--popover` / `--popover-foreground`; painéis modais leem `--popover` ou `--background` conforme o componente; o Tooltip inverte, lendo `--primary` / `--primary-foreground`

**Acessibilidade transversal** (ver `docs/shared/guidelines/01-acessibilidade.md`):
- Focus trap automático em Dialog, Sheet, Drawer — não reimplementar
- `Escape` fecha todos os overlays — comportamento nativo do primitivo headless (`@base-ui/react`, ou Vaul no Drawer)
- `DialogTitle` / `SheetTitle` / `DrawerTitle` obrigatórios — base para `aria-labelledby`
- `TooltipProvider` no root obrigatório para Tooltip funcionar
- ContextMenu sempre com alternativa acessível — right-click não é descobrível

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Payload |
|------------|--------|---------|
| Dialog, Sheet, Drawer | `dialog_open` | `label` (título) |
| Dialog, Sheet, Drawer | `dialog_close` | `label`, `trigger` |
| Dialog, Sheet, Drawer | `dialog_confirm` | `label` |
| DropdownMenu, ContextMenu | `menu_item_click` | `label`, `menu` |
| Tooltip | `tooltip_view` | `label` (apenas em funis críticos) |
| Command | — | Rastrear via `onSelect` de cada item |

**UX Writing transversal** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Títulos de overlay: frase nominal, ação no infinitivo — "Editar perfil", "Excluir conta"
- Descrições: frase completa, ponto final, explica consequência ou contexto
- Botão primário: repete o verbo do título
- Botão secundário: sempre "Cancelar"
- Tooltip: complementa sem repetir o label visível
