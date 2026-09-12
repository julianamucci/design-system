# PRD — Sheet

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Painel **modal** que entra por uma das quatro bordas da tela, com véu atrás.

É diálogo, não painel decorativo: toma o foco, prende a navegação por teclado
enquanto está aberto e trava a rolagem da página.

| vizinho | diferença que decide |
|---|---|
| Dialog | nasce no centro e não encosta na borda; tem raio nos quatro cantos |
| Drawer | é componente PRÓPRIO, com folha própria — arrastável, com alça, cantos arredondados do lado de dentro |
| Popover | não é modal, fica ao lado da página em vez de interrompê-la |

Do Drawer o Sheet empresta três peças, e só três: o véu, o título e a descrição.
Editar qualquer uma delas alcança os dois componentes.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | `role="dialog"` com `aria-modal="true"` nas cinco | `accessibility.items.item1` |
| C2 | O foco fica PRESO no painel enquanto aberto | `accessibility.items.item4` |
| C3 | `Escape` fecha e devolve o foco ao gatilho | `accessibility.items.item5` |
| C4 | Clique no véu fecha | `accessibility.items.item6` |
| C5 | A rolagem da página trava enquanto aberto | `accessibility.items.item7` |
| C6 | O painel é nomeado por título e descrito pela descrição, os dois obrigatórios | `accessibility.items.item2` e `item3` |
| C7 | O corpo rolável entra na ordem de tabulação com `role="group"` e `aria-label` juntos | `accessibility.items.item8` |
| C8 | O lado é do PAINEL, não um modo global do conjunto | `notes.item3` |

## 3. Decisões fixadas

### D1 · O lado muda o desenho, e por isso é eixo de verdade

**Estado**: à esquerda e à direita o painel tem altura cheia e largura limitada;
em cima e embaixo ocupa a largura toda e a altura sai do conteúdo. A borda de 1px
troca de lado junto — fica sempre virada para dentro da tela.
**Contraste**: no Popover e no HoverCard o `side` só decide onde o painel nasce,
e os quatro lados desenham a mesma caixa. Aqui não.

### D2 · A largura é custom property, com os defaults em `:root`

**Estado**: `--sheet-width: 75%` e `--sheet-max-width: 24rem` (384px), declarados
em `:root` no topo da folha; as regras de lado leem os dois sem fallback.
**Medição, com quatro alvos** — o painel sem override, o `.nds-sidebar-mobile`
(que declara `--sheet-width` NO MESMO elemento do painel), uma classe de
consumidor no painel, e um wrapper ANCESTRAL:

| onde declarar | padrão | sidebar-mobile | classe | ancestral |
|---|---|---|---|---|
| só no fallback do `var()` | 384px | 288px | 540px | 500px |
| no `[data-side]` da peça (0,2,0) | 384px | 384px ✗ | 384px ✗ | 384px ✗ |
| na classe base (0,1,0) | 384px | 288px | 540px | 384px ✗ |
| **em `:root`** | 384px | 288px | 540px | 500px |

Declarar no seletor da própria peça APAGA os três overrides. Em `:root` o default
chega por herança, e herança perde para qualquer declaração — que é a única
coluna idêntica à de hoje.
**E por que custom property, não utilitária**: estas regras são (0,2,0) e
qualquer utilitária de largura é (0,1,0). A doc prometia customização por classe
em quatro stacks, e ela não funcionava em nenhuma.

### D3 · O corpo é `flex: 1 1 auto`, nunca o atalho `flex: 1`

**Medição**: o atalho zera a BASE. Nos lados esquerdo e direito isso é invisível,
porque o painel tem `height: 100%`. Em cima e embaixo o painel é `height: auto`:
o corpo não contribui nada para a altura, desaba para zero e passa a rolar dentro
de uma caixa sem altura.
**Par obrigatório**: `min-height: 0`, que desliga o mínimo automático do item flex
para ele poder encolher quando houver teto.
**Mesmo defeito já medido no Drawer**, e pela mesma razão.

### D4 · O fio de 1px é literal, e a sombra é `Elevacao/xl`

**Estado**: `box-shadow: 0 0 0 1px hsl(0 0% 0% / 0.05), var(--elevation-xl)`. Era `lg` até 2026-09-10, quando a dona fixou a regra da categoria: card `sm` · flutuante interativo `md` · flutuante passivo `lg` · modal e drawer `xl`. O
fio é preto a 5% cravado na folha, sem token por trás.
**Para revisitar**: tokenizar o fio muda os cinco painéis da família de uma vez.

### D5 · O anel de foco do botão de fechar tem DUAS camadas

**Corrigido na documentação em** 2026-09-06 (`7811a95c1`).
**Estado**: `0 0 0 2px hsl(--background)` e depois `0 0 0 5px hsl(--ring)`, as duas
em opacidade cheia. O halo interno é o que separa o anel do que está atrás.
**Medição**: a página descrevia "anel de 2px a 50% de opacidade" — contradizendo a
folha que ela documenta. Desenhar um anel translúcido único perde justamente a
camada que faz o trabalho.

### D6 · O cabeçalho e o rodapé usam MARGEM, e ela soma com o gap do painel

**Estado**: cabeçalho com `margin-bottom: --spacing-4`, rodapé com
`margin-top: --spacing-4`, e o painel com `gap: --spacing-4`.
**Consequência**: entre cabeçalho e corpo há **32px**, não 16. Quem mexer num dos
dois valores precisa saber que o outro está somando.

### D7 · Alinhamento e empilhamento mudam a 40rem

**Estado**: abaixo de 40rem o cabeçalho centraliza e o rodapé empilha em
`column-reverse` — a ação principal fica em cima. Acima, cabeçalho à esquerda e
botões lado a lado à direita.
**Nota para o Drawer**: lá o ponto de corte do cabeçalho é **48rem**, não 40. Dois
pontos de corte na mesma família; não copie um no outro.

### D8 · Três afirmações da página eram falsas justamente no vanilla

**Corrigidas em** 2026-09-06 (`7811a95c1`), e ficam registradas porque a revisão
serial as encontrou depois de o componente ser dado por pronto:

- `notes.item2` dizia "Sheet usa Dialog" — não usa;
- `states.closed` e `states.open` afirmavam `data-state`, que a fábrica do vanilla
  **não escreve uma vez sequer**;
- `states.focused` descrevia o anel errado (ver D5).

O que elas têm em comum: eram verdadeiras na stack de lib e falsas na referência.

### D9 · Aqui o `<form>` NÃO envolve o rodapé — religa-se por `form="<id>"`

**Estado**: o `<form>` envolve os campos; a ação primária vive no rodapé, fora
dele, e se religa com `form="<id>"`. O descartar leva `type="button"`.

**Por que difere do Dialog** (`dialog.md`, D10, e a regra de categoria em
`docs/shared/guidelines/02-alinhamento-botoes.md`): lá o rodapé pode entrar
dentro do `<form>`. Aqui não — o rodapé é **irmão do corpo rolável por
construção do primitivo**, e aninhá-lo o tiraria da área que rola. A norma
continua valendo; muda o mecanismo, e o HTML já oferece o certo.

**O que isto custou antes de ser escrito**: cinco pontos entregavam
`type="submit"` sem religamento nenhum — vanilla (filtros e perfil), svelte
(dois), e as composições de filtro do react e do angular, que uma passagem
anterior deixou para trás ao consertar só a de perfil. Botão inerte: não envia
pelo clique nem pelo Enter num campo, e nada na tela denuncia.

**A pista que existia e não foi seguida**: o docblock do rodapé do react
ADMITIA a inércia — "aqui ele fica inerte porque o rodapé é irmão do corpo" —
sem tirar a conclusão. Comentário que descreve o defeito sem o chamar de defeito
é pior que comentário nenhum: ele dá a quem lê a sensação de que aquilo foi
considerado.

**E religar exige a guarda**: com `form="<id>"` a submissão passa a funcionar de
verdade, então falta `preventDefault` navega a página. O angular era a única
stack sem ela, e o defeito só apareceu quando o religamento o destravou.

## 4. Anatomia

```
sheet-overlay                 o véu — compartilhado com o Drawer
sheet-content [data-side]     role="dialog" · aria-modal="true"
├── sheet-header              coluna; margem inferior própria (D6)
│   ├── sheet-title           obrigatório — nomeia o painel
│   └── sheet-description     obrigatória — descreve o painel
├── sheet-body                cresce e rola (D3)
├── sheet-footer              margem superior própria (D6)
└── sheet-close               absoluto, canto superior direito
```

**Duas formas do botão de fechar, e as duas são o desenho**: o Vanilla monta o
`<button class="nds-sheet-close">`; as quatro stacks com lib compõem o botão do
design system e usam só o posicionamento (`.nds-sheet-close-position`), com o
rótulo em `.nds-sr-only`. A folha traz as duas regras por isso.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/sheet.css`.

| propriedade | valor | token |
|---|---|---|
| véu | 80% de opacidade | `--overlay` |
| superfície do painel | — | `--background` — três dos quatro painéis modais leem isto; ver `dialog.md` D1 |
| texto | — | `--foreground` |
| padding do painel | 24px | `--spacing-6` |
| gap do painel | 16px | `--spacing-4` |
| borda (só do lado de dentro) | 1px | `--border` |
| largura (esquerda e direita) | 75%, teto 384px | `--sheet-width` / `--sheet-max-width` — ver D2 |
| gap do cabeçalho | 6px | `--spacing-1-5` |
| margem do cabeçalho e do rodapé | 16px | `--spacing-4` — ver D6 |
| gap do rodapé | 8px | `--spacing-2` |
| título | 18px, semi-bold, entrelinha 1, tracking -0.025em | `--text-control-xl` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| botão de fechar | canto a 16px, raio `--radius-xs`, padding `--spacing-1` | — |
| anel de foco do fechar | halo 2px + anel 5px | `--background` e `--ring` — ver D5 |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**Sem raio**: o painel encosta na borda da tela.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, rolagem travada |
| Focused | Tab dentro | anel de duas camadas no elemento focado (D5) |
| Transitioning | entrada e saída | deslizamento a partir da borda do `side` |

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `side` | `top \| right \| bottom \| left` | `right` |
| `showCloseButton` | boolean | `true` |
| `className` | string | — |

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla | fábrica com `onClose(reason)` espelhando o Dialog, mais `open()`/`close()`/`isOpen()` públicos, `trigger` OPCIONAL e fechamento por `data-slot="sheet-close"` — `PATCHES.md#vanilla-sheet-onclose-reason` e `#vanilla-overlay-close-api` |
| angular | `sheetCloseReason(RdxDialogOpenChangeReason)` exportado de `ui/sheet.ts` |
| vue | `sheetCloseReason(gesture)` + `createSheetCloseWatch()` de `ui/sheet/sheet.close-reason.ts` — a reka-ui não publica motivo, então o gesto é OBSERVADO |
| svelte | `sheetCloseReason(signal)` + `createSheetCloseWatch()` de `ui/sheet/close-reason.ts`, e `SheetContent` ganhou `onClosePress` — a bits-ui também não publica motivo |
| react | não declara tipo próprio: o Sheet é o mesmo `dialog_close` do Dialog e usa o `dialogCloseReason` de `ui/dialog-close-reason.ts`, ao lado dos irmãos `ui/menu-close-reason.ts` e `ui/popover-close-reason.ts` |
| todas | **onde a opção de lado mora varia por stack**; a tabela de props de cada página mostra a forma dela. O lado em si é sempre do painel (C8) |

**Por que cada stack tem uma peça diferente aqui, e isso não é divergência para
alinhar:** o motivo do fechamento é conhecimento da LIB, e três das cinco não o
publicam. Onde ele chega pronto (base-ui, radix-ng) basta traduzir; onde não
chega (reka-ui, bits-ui) é preciso observar o gesto antes de o painel fechar. O
que o contrato exige é o resultado — as mesmas quatro palavras, derivadas ao lado
do primitivo e nunca inventadas na página que consome. Até 2026-09-11 o vanilla,
que é a referência, tinha três palavras e a docs page dele fabricava a quarta por
fora, fingindo um clique no véu: o contrato remendado no consumidor.

**Abrir por código, e o gatilho escondido que ele aposentou (2026-09-12).** As
quatro stacks com lib abrem pelo estado (`open`/`defaultOpen` da prop
controlada); o vanilla não tem estado externo, tem verbos — e até esta data
tinha só `close()`. Sem `open()`, e com `trigger` obrigatório, quem comandava o
painel de fora precisava montar um GATILHO ESCONDIDO: um `<button>` com
`.nds-sr-only`, `tabindex="-1"` e `aria-hidden="true"`, clicado por código só
para a fábrica ter um alvo. Essa forma estava na story `Controlled`, no snippet
que o painel Code publica e na `Controlled` do Dialog — um botão que existe para
não ser visto, ensinado como padrão da casa.

`SheetElement` e `DialogElement` passam a ter `open()` e `isOpen()`, e `trigger`
passa a ser opcional. **`toggle()` do `DrawerElement` fica fora, de propósito**:
zero consumidores medidos, e os dois candidatos reais — o Ctrl+K das duas
paletas de comando — exigem por escrito "só ABRE" (§9 do PRD do command). Num
painel modal o controle que abriu fica atrás do véu e inerte, então quem
chamaria `toggle()` é sempre um atalho de teclado, e fechar modal por teclado já
tem caminho e já tem palavra: Escape, que informa `escape`. Um `toggle()`
fecharia o mesmo gesto como `api` e partiria a série do GA4 em duas.

Junto entrou a guarda de reentrância no `open()` do Sheet (o Dialog já a tinha):
sem ela um segundo `open()` montava outro painel, deixava o primeiro órfão no
`body` e travava a rolagem duas vezes. O que a substituía era um `let isOpen` em
cada consumidor — a guarda no lugar errado, e num lugar em que nenhum portão a
via.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Sheet`, `SheetBody`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetTitle`, `SheetTrigger` |
| vue | `Sheet`, `SheetBody`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetTitle`, `SheetTrigger` |
| svelte | `Sheet`, `SheetBody`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`, e do mesmo índice `createSheetCloseWatch`, `sheetCloseReason` e os tipos `SheetCloseReason`/`SheetCloseSignal`/`SheetCloseWatch` |
| vanilla | `createSheet` (devolve `SheetElement = DestroyableElement & { open(), close(), isOpen() }`) |
| angular | `button[ndsSheetClose]`, `button[ndsSheetTrigger]`, `div[ndsSheetBody]`, `div[ndsSheetFooter]`, `div[ndsSheetHeader]`, `h1[ndsSheetTitle]` … `h6[ndsSheetTitle]` (os seis), `nds-sheet`, `ng-template[ndsSheetContent]`, `p[ndsSheetDescription]` |

O índice do svelte também reexporta as formas curtas — `Body`, `Close`, `Content`, `Description`, `Footer`, `Header`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável nas cinco, cada uma de um
jeito** — medido na fonte de cada lib, não na documentação delas:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `render` (`BaseUIComponentProps<'h2'>`) | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | snippet `child` + prop `level` | `div` com `aria-level="2"` |
| angular | seletor por elemento, nos SEIS níveis | o que quem escreve usar |
| vanilla | opção `titleLevel` da fábrica | `2` |

As cinco aceitam qualquer nível desde 2026-09-08, e chegaram lá por caminhos
diferentes. O Angular oferecia só `h2` e `h3` e ganhou os seis por decisão da
dona; o vanilla não oferecia nenhum — `createElement('h2')` cravado — e ganhou
`titleLevel`.

**O nome da opção é relativo ao ESCOPO da fábrica, e isso NÃO é divergência** —
já foi relatado como tal três vezes. Fábrica que monta só o título usa `level`
(`createPopoverTitle`, `createCardTitle`); fábrica que monta o componente
inteiro usa `titleLevel` (`createDialog`, `createSheet`, `createDrawer`,
`createAlertDialog`), porque `createCardTitle({ titleLevel })` leria "title
title level". A regra vale fora do vanilla: no Svelte o wrapper de story usa
`titleLevel` e o snippet emite `level`, que é a prop do bits.

**O DEFAULT, esse era divergência, e fechou em 2026-09-09**: o
`createPopoverTitle` defaultava `h4` e passou a `2`, alinhando com estas quatro
fábricas e com o que as outras stacks anunciavam. O `createCardTitle` não tem
default de nível — sem `level` ele monta `div`, igual a react, vue e svelte no
card. Citar as duas como precedente de FORMA, que era o que esta linha fazia,
dizia menos do que parecia: o precedente é do nome, nunca do valor.

**A linha do svelte estava ERRADA até 2026-09-09, e foi a story que a corrigiu**:
`level` sozinho não troca a tag. O título daquela lib renderiza
`<div role="heading">` e o `level` só alimenta o `aria-level` — e como o mesmo
componente serve os quatro painéis, não há atalho por slug. Quem entrega o
cabeçalho de verdade é o snippet `child`, que é a delegação de elemento daquela
lib, irmã do `render`, do `as` e do `asChild`. Os dois andam juntos: sem
`level`, um `h3` escrito pelo `child` sairia com `aria-level="2"`, e a tag
brigaria com o ARIA. A afirmação antiga — "as cinco aceitam qualquer nível pelo
mecanismo da própria lib" — era verdadeira só no sentido do ARIA, e ninguém
tinha medido porque nenhuma superfície exercitava a capacidade.

**Por que isso importa**: `heading-order` do axe reprova salto de nível, e o
painel não sabe de que profundidade da página foi aberto — um diálogo disparado
de dentro de uma seção já em `h3` precisa sair em `h4`.

**A story existe desde 2026-09-09**: `HeadingH3`, no arquivo de variantes das
cinco stacks, com o painel aberto na montagem e o título pedido em `h3`. Ela
afirma as duas metades, e a segunda é a que dá valor à primeira — o elemento
renderizado é o pedido (`tagName`), e o `aria-labelledby` do painel continua
resolvendo NELE, com o nome acessível saindo do seu texto. Os dois defeitos que
ela existe para pegar foram plantados e reprovaram nas cinco: trocar a tag
mantendo o vínculo, e manter a tag rompendo o vínculo.

## 8. Acessibilidade

**Atributos**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` para o
título e `aria-describedby` para a descrição — os dois obrigatórios.

**Teclado**: Tab circula dentro do painel; Escape fecha e devolve o foco.

**O corpo rolável precisa dos três juntos**: `tabindex="0"`, `role="group"` e
`aria-label`. Caixa que rola é parada de teclado (WCAG 2.1.1), parada de teclado
precisa de papel, e nome em elemento sem papel é atributo proibido — o leitor de
tela o descarta. É `group` e não `region` porque marco aninhado num diálogo já
nomeado só engorda a lista de marcos.

**Movimento reduzido**: o painel para sob `prefers-reduced-motion`, e quem o
para é a camada de TOKEN — a folha declara duração só por `var(--duration-*)`, e
`docs/shared/tokens/motion.css` zera a escada inteira sob a preferência. O
mecanismo, incluindo por que o bloco `@media` da própria folha não é o que
segura, está por extenso em `hover-card.md` §8.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | o painel abre | `{ component: "sheet", trigger_id, location }` |
| `dialog_close` | o painel fecha | `{ component: "sheet", trigger_id, location, reason }` |
| `dialog_confirm` | a ação primária do rodapé é executada | `{ component: "sheet", trigger_id, action, location }` |

**`trigger_id` carrega o `side`** — valor estável (`"right"`, `"left"`…), nunca
texto traduzido: nas demonstrações cada gatilho abre um lado, e o lado é o id
dele. Até 2026-09-10 o campo era `label`, e o Dialog, na mesma família, mandava
`trigger_id`; a dona unificou em `trigger_id` (`18-overlay.md` §Analytics). Os
valores não mudaram. O `dialog_confirm` já era disparado pelas cinco e faltava
nesta tabela. O evento é o do Dialog de propósito: as duas peças respondem à mesma
pergunta de produto, e separar as séries esconderia isso.

**`reason` é obrigatório, no vocabulário da família** — `escape`, `overlay`,
`close-button`, `api` —, com o registro da decisão de 2026-09-10 na §9 do
[`dialog.md`](dialog.md), que é o dono deste evento. O vanilla chamava a
confirmação que fecha o painel de `action` até essa data; hoje é `api`.

**E o motivo sai de ONDE o painel fecha, nunca da página que o consome.** Cada
stack o deriva ao lado do primitivo — tradução onde a lib publica o motivo,
observação do gesto onde ela não publica —, e a docs page só repassa a palavra.
Corrigido em 2026-09-11 nas três stacks que faltavam; a tabela de divergências
da §7 diz qual é a peça de cada uma.

**Histórico, porque este é o eixo por onde a inconsistência entrou duas vezes:**

| data | o que era | o que segura hoje |
|---|---|---|
| 2026-07-27 | `SheetCloseReason` nasce com TRÊS palavras, e o PATCHES pede "manter paridade com `DialogCloseReason`" numa linha de texto | `reason_da_familia_divergente` — Dialog, Sheet e AlertDialog alimentam o mesmo `dialog_close` e têm de dizer as mesmas palavras, com exceção declarada e premissa conferida contra o PRD |
| 2026-09-11 | o Dialog ganhou `api`, o Sheet não, e a docs page do vanilla fabricava a palavra fingindo um clique no véu | `reason_entre_stacks_divergente` — o mesmo tipo, nas stacks que o declaram, com o mesmo vocabulário |
| 2026-09-12 | desmontar o painel emitia `dialog_close` com `api`: troca de idioma da docs page virava fechamento que ninguém fez, indistinguível de quem confirmou | `desmonte_emite_fechamento` — o callback de limpeza não pode alcançar `onClose`, e o portão resolve um salto de chamada porque nenhum desses callbacks contém a palavra |

## 10. Reconstruir do zero

Ordem: folha (com os defaults em `:root`) → primitivo → cabeçalho e rodapé →
stories → docs page.

- **Comece pelos defaults em `:root`** (D2). Declarar no seletor da peça é o
  defeito que apaga a customização, e ele não aparece até alguém tentar.
- **O corpo é `flex: 1 1 auto` com `min-height: 0`** (D3) — o atalho quebra só em
  cima e embaixo.
- **As duas formas do botão de fechar** convivem: a folha tem regra para as duas.
- **Cabeçalho e rodapé são sub-componentes** por causa do ponto de corte de 40rem
  (D7), que frame de Figma não expressa e prop nenhuma controla.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, larguras, lados, anel de foco | `docs/shared/styles/nds/sheet.css` |
| texto, props, critérios de teste | `docs/shared/content/sheet/translations.json` |
| divergências intencionais sobre libs | `PATCHES.md` |
| desenho e anotações | Figma, página `Sheet` (conjunto `695:166`) |
| portões determinísticos | `node scripts/audit.mjs sheet --json` |
