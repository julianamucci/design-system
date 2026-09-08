# Overlay Components (Nortear — Angular)

---

## Regras Globais de Overlay

### O padrão de composição deste stack

Todo overlay segue a mesma forma, e ela é diferente das outras quatro stacks:

```
<orquestrador>                          (dono do estado; nds-* ou diretiva no host)
├── gatilho                             ← FICA na página
└── ng-template[…Content]               ← o painel, portalizado ao abrir
```

O painel vive num **`<ng-template>`**, não num elemento escrito na página. Isso não é preferência: o painel é instanciado dentro de um portal no corpo do documento e destruído ao fechar. Um elemento escrito pelo consumidor teria de ser teleportado para lá e devolvido no fechamento; um template é criado e destruído junto com o portal, sem nó órfão.

Duas consequências que valem para todos:

- **Em teste, o painel não está no canvas.** Procure no corpo do documento, e espere a animação assentar antes de afirmar — o painel entra com fade e zoom, e ler o primeiro frame produz uma falsa violação de contraste com razão perto de 1.0
- **Não há input de classe no painel** em vários deles: quem escreve não é dono daquele elemento. Classe extra no painel seria API nova, e enquanto não houver caso concreto o painel tem uma classe só, a do design system

### Tokens de fundo por tipo

| Tipo de overlay | Tokens | Componentes |
|---|---|---|
| Painel de conteúdo | `--card` / `--card-foreground` | Dialog, Alert Dialog, Sheet, Drawer |
| Menu e overlay flutuante | `--popover` / `--popover-foreground` | Dropdown Menu, Context Menu, Menubar, Popover, Hover Card, Tooltip, Select, Command |

### Comportamento de teclado

Vem do primitivo headless — **não reimplemente**:

- **Escape** fecha o overlay do topo da pilha
- **Foco circula** dentro de overlay modal, e volta ao gatilho ao fechar
- **Clique fora** fecha, exceto onde o perfil do componente desliga isso (Alert Dialog)
- Tooltip não fecha por clique; fecha por saída do ponteiro ou perda de foco

### Camadas

A ordem vem dos tokens `--z-dropdown`, `--z-modal-backdrop`, `--z-modal`, `--z-popover`, `--z-tooltip`, `--z-toast`. Não escrever número: a escada existe para que dois overlays nunca empatem.

### Uma âncora de foco que o axe acusa

O primitivo cerca o conteúdo portalizado com duas âncoras de foco de 1 pixel, escondidas do leitor e focáveis — é o que devolve o foco ao limite certo quando o Tab entra ou sai do portal. O axe lê `aria-hidden` mais focável como armadilha de foco, que é o **contrário** do que essas âncoras fazem.

Tirar o atributo escondido calaria o axe e faria o leitor anunciar dois elementos vazios em todo menu; tirar o tab stop desmontaria o mecanismo. A regra é desligada **só** nas stories que terminam com um overlay aberto, o que mantém as outras valendo. A correção é da biblioteca.

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
