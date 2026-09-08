# Overlay Components

---

## Regras Globais de Overlay

### Tokens de fundo por tipo de overlay

Não existe utilitária de cor de superfície: quem lê o token é a folha de cada overlay. A tabela diz qual token vale e qual seletor o aplica.

| Tipo de overlay | Tokens | Quem aplica |
|-----------------|--------|-------------|
| Painel de conteúdo (modal, lateral) | `--card` / `--card-foreground` | `.nds-dialog-content` · `.nds-sheet-content` · `.nds-drawer-content` |
| Menu e overlay flutuante | `--popover` / `--popover-foreground` | `.nds-dropdown-menu-content` (também é o painel do ContextMenu) · `.nds-popover-content` · `.nds-hover-card-content` · `.nds-command` · `.nds-tooltip-content` |
| Fundo escurecido atrás do modal | opacidade sobre preto, definida na folha | `.nds-dialog-overlay` |

> Pintar a superfície por fora quebra a coerência do tema, e o modo escuro é onde isso aparece primeiro. A cor entra pela classe do componente — nunca por uma classe de fundo avulsa, nem por um valor cravado no estilo.

### Padding consistente entre header, content e footer

O respiro interno de cada painel é da folha do próprio overlay, e sai da escada de espaçamento do tema (`--spacing-*`) — não de uma classe de padding aplicada por fora, que sairia do passo quando a densidade mudasse.

Esta seção já prescreveu um par de tokens de overlay (`--overlay-padding` e `--overlay-padding-sm`) como obrigatórios, com valores fixos e origem no `globals.css`. **Nenhum dos dois existe** — não há uma única declaração deles no repositório, e nunca houve seletor que os lesse. A regra que sobra é a de fato: alinhamento entre cabeçalho, corpo e rodapé se obtém deixando o respiro na folha, e conferindo que o corpo não reintroduza recuo próprio.

### Comportamento de teclado — todos os overlays

| Tecla | Ação |
|-------|------|
| `Escape` | Fecha o overlay e retorna foco ao trigger |
| `Tab` / `Shift+Tab` | Navega entre elementos focáveis (focus trap em Dialog, Sheet, Drawer) |
| `Enter` / `Space` | Ativa o item focado |
| `Arrow Down/Up` | Navega entre itens de menu (DropdownMenu, ContextMenu, Command) |

Comportamentos gerenciados automaticamente pelo Reka UI ou Vaul — não reimplementar.

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

Para overlays que precisam funcionar em ambos os contextos, renderizar `Dialog` em desktop e `Drawer` em mobile com o mesmo conteúdo.

**Regras**:
- Extrair o conteúdo para um componente separado — evita duplicação
- Detecção de viewport via `useMediaQuery` (composable customizado) com listener `addEventListener("change", …)` para reagir a mudanças
- Breakpoint padrão: `768px` (md) — alinhado com os breakpoints responsivos do projeto
- Ambas as variantes recebem o mesmo `open` / `onOpenChange` — o estado do overlay é compartilhado

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

**Tokens de fundo** (ver regra global no início deste arquivo):
- Painéis (Dialog, Sheet, Drawer): `--card` / `--card-foreground`, lidos pela folha de cada painel
- Menus e overlays flutuantes (DropdownMenu, ContextMenu, Popover, HoverCard, Command, Tooltip): `--popover` / `--popover-foreground`, lidos pela folha de cada painel — não sobrescrever por fora

**Acessibilidade transversal** (ver `../../docs/shared/guidelines/01-acessibilidade.md`):
- Focus trap automático em Dialog, Sheet, Drawer — não reimplementar
- `Escape` fecha todos os overlays — comportamento nativo do Reka/Vaul
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
