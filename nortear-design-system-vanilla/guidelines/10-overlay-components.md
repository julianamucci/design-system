# Overlay — a mecânica desta stack (Vanilla TS)

**As regras da categoria estão em [`18-overlay.md`](../../docs/shared/guidelines/18-overlay.md)**,
uma vez só para as cinco stacks: superfície, véu, camadas, teclado, modalidade,
título, corpo rolável, formulário, analytics e a tabela de quem cobra cada
invariante. O que cada componente É está no PRD dele, em `docs/shared/prd/`.

Este arquivo guarda só o que é **desta stack** e não tem equivalente nas
outras quatro. Até 2026-09-10 ele era uma das cinco cópias da regra de
categoria — que discordavam entre si e ficaram para trás juntas — e o portão
`guideline_de_stack_repete_categoria` impede que a cópia volte.

---
## Teclado e foco — implementados em cada fábrica

As outras quatro stacks recebem teclado e foco do primitivo headless. Aqui não
há primitivo: cada fábrica implementa, e é por isso que o vanilla é a
referência — o que está no código é o que o design system de fato define.

Conferido nas fábricas em 2026-09-10:

| comportamento | como | onde |
|---|---|---|
| `Escape` fecha | ouvinte de `keydown` no `document`, enquanto o painel está aberto | as oito fábricas de overlay |
| foco preso | `Tab` e `Shift+Tab` circulam entre os focáveis do painel | Dialog, AlertDialog, Sheet, Drawer — e Popover com `modal: true` |
| foco devolvido | ao fechar, o foco volta ao elemento que abriu | Dialog, AlertDialog, Sheet, Drawer, Popover, DropdownMenu |
| clique fora | o véu fecha | Dialog, Sheet, Drawer (`dismissible`); **não** o AlertDialog |

**O ouvinte do `document` sai junto com o painel.** As oito fábricas o removem
ao fechar — se ficasse, o próximo `Escape` em qualquer lugar da página chamaria
o fechamento de um painel que não existe mais.

**Fechar informa o motivo** no Dialog, no Sheet e no Drawer: o callback
`onClose` recebe o `reason` no vocabulário do design system — ver
`18-overlay.md` §Analytics. As outras cinco fábricas não passam motivo pelo
callback.
