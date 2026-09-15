# PRD — Sheet

> **Estado descrito**: 2026-09-15, conferido linha a linha contra o código das
> cinco stacks. **Revisão serial fechada em** 2026-09-06.
>
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.
>
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

**O empréstimo é do Drawer PARA CÁ, não daqui para lá**: as três peças —
`.nds-sheet-overlay`, `.nds-sheet-title` e `.nds-sheet-description` — são
declaradas em `sheet.css`, e é o `drawer.css` que as consome, dizendo isso no
próprio docblock (`drawer.css:16`, "O que NÃO se mudou de lugar, de propósito").
Editar qualquer uma delas alcança os dois componentes. `drawer.css` não declara
as três regras; o Drawer escreve as classes nas cinco (`drawer.tsx:198`,
`DrawerOverlay.vue:17`, `drawer-overlay.svelte:15`, `drawer.ts:287` do vanilla,
`drawer.ts:517` do angular) — quem quiser mudar o véu do Sheet mexe aqui.

**E o Drawer não é o único consumidor**: o Sidebar em modo móvel também veste
esta folha, e mais que três peças. Conferido em 2026-09-15 — react
(`sidebar.tsx`), vue (`Sidebar.vue`), svelte (`sidebar.svelte`) e angular
(`sidebar.ts`) compõem as peças do Sheet, e o vanilla monta as classes à mão
(`sidebar.ts:228-251`: `.nds-sheet-overlay`, `.nds-sheet-content` com
`.nds-sidebar-mobile`, `.nds-sheet-header` em `.nds-sr-only`, `.nds-sheet-title`). É por isso que a
largura do painel é custom property e o default mora em `:root` (D2): o
`.nds-sidebar-mobile` é exatamente o override do mesmo elemento que a medição de
lá usa como alvo.

## 2. Contrato de comportamento

Cada linha é verificável. A coluna do portão diz quem reprova se ela deixar de
valer — e `—` é dívida declarada, não ausência de risco. A chave de conteúdo que
DOCUMENTA a regra vem entre parênteses; ela não reprova nada.

| # | o contrato | portão |
|---|---|---|
| C1 | `role="dialog"` com `aria-modal="true"` nas cinco (`accessibility.items.item1`) | primeiro passo do `Playground` + `States/Open`, nas cinco. `Variants/Right` só afirma `aria-modal` no vanilla (inconsistência 9) |
| C2 | O foco fica PRESO no painel enquanto aberto (`item4`) | passos "Tab mantém o foco preso" e "Shift+Tab dá a volta" do `Playground`, nas cinco |
| C3 | `Escape` fecha e devolve o foco ao gatilho (`item5`) | passo de Escape do `Playground`, nas cinco |
| C4 | Clique no véu fecha (`item6`) | passo do véu do `Playground`, nas cinco — em react e angular só quando o control `modal` está ligado |
| C5 | A rolagem da página trava enquanto aberto (`item7`) | só `States/Controlled` do vanilla ("a página atrás não rola"). **—** nas outras quatro (pendência no fim da §7) |
| C6 | O painel é nomeado por título e descrito pela descrição, os dois obrigatórios (`item2` e `item3`) | primeiro passo do `Playground` (`toHaveAccessibleName` + `toHaveAccessibleDescription`), nas cinco |
| C7 | O corpo rolável entra na ordem de tabulação com `role="group"` e `aria-label` juntos (`item8`) | `States/LongScrollBody` afirma só `tabindex="0"`, nas cinco. **—** para `role`/`aria-label`: nenhuma story das cinco nomeia o corpo (pendência no fim da §7) |
| C8 | O lado é do PAINEL, não um modo global do conjunto (`notes.item3`) | `data-side` + `borderWaitForEncostar` (`docs/shared/testing/sheet-geometry.ts`) nas quatro `Variants` de lado, nas cinco |
| C9 | O título aceita qualquer nível sem romper `aria-labelledby` (`testes.accessibility.item6`) | `Variants/HeadingH3`, nas cinco, com as mesmas cinco asserções |

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
sheet-overlay                 o véu — declarado aqui, consumido pelo Drawer e
                              pelo Sidebar móvel (§1)
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
| fio + elevação | 1px preto a 5% + xl | fio **literal**, sem token; `--elevation-xl` — ver D4 |
| largura (esquerda e direita) | 75%, teto 384px | `--sheet-width` / `--sheet-max-width` — ver D2 |
| gap do cabeçalho | 6px | `--spacing-1-5` |
| margem do cabeçalho e do rodapé | 16px | `--spacing-4` — ver D6 |
| gap do rodapé | 8px | `--spacing-2` |
| título | 18px, semi-bold, entrelinha 1, tracking -0.025em | `--text-control-xl` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| botão de fechar (forma do vanilla) | canto a 16px, raio `--radius-xs`, padding `--spacing-1`, opacidade 0.7 | `--spacing-4` no canto |
| botão de fechar (forma composta) | só posicionamento: canto a 12px | `--spacing-3` — `.nds-sheet-close-position` |
| anel de foco do fechar | halo 2px + anel 5px | `--background` e `--ring` — ver D5 |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**Sem raio**: o painel encosta na borda da tela.

**O único literal é o fio de 1px** (`sheet.css:109`), que a D4 marca como ponto
a revisitar; a elevação lê `--elevation-xl`. **O canto do botão de fechar tem dois
valores, um por forma** (§4): 16px no vanilla (`sheet.css:236-237`) e 12px na
composta (`sheet.css:339-343`). No Dialog a composta é a 8px
(`dialog.css:287-291`), então o par de números não é o mesmo nas duas folhas
irmãs.

**Animação — duas camadas na mesma folha.** A entrada por `@keyframes`
(`sheet.css:264-287`) vale para toda montagem; a SAÍDA só existe por transição
sobre `[data-starting-style]`/`[data-ending-style]` (`sheet.css:295-331`), e só
anima onde a lib escreve esses atributos — ver a inconsistência 5 da §7.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, rolagem travada |
| Focused | Tab dentro | anel de duas camadas no elemento focado (D5) |
| Transitioning | entrada e saída | deslizamento a partir da borda do `side` |
| longScrollBody | o conteúdo passa da altura do painel | o corpo rola por dentro (`flex: 1 1 auto` + `min-height: 0`, D3) e o rodapé fica parado; o corpo entra na ordem de tabulação com `role="group"` e nome (C7) |

**`longScrollBody` está publicado** em `states.longScrollBody` do conteúdo
compartilhado, e as cinco docs pages o listam. É o único estado que muda o
CONTRATO de acessibilidade em vez do visual — a condição que obriga o trio
`tabindex="0"` + `role="group"` + `aria-label` (C7).

**Atributo de estado não é contrato aqui.** O conteúdo compartilhado não promete
`data-state` (D8), e as cinco divergem no que escrevem — inconsistência 4 da §7.

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `side` | `top \| right \| bottom \| left` | `right` |
| `showCloseButton` | boolean | `true` |
| `closeLabel` | string | `'Fechar'` |
| `className` | string | — |

**`closeLabel` existe nas cinco com o mesmo default** — `sheet.tsx:66`,
`SheetContent.vue:39`, `sheet-content.svelte:34`, `sheet.ts:159` do angular,
`sheet.ts:260` do vanilla — e as cinco docs pages leem a chave compartilhada
`props.table.closeLabel`. É o nome acessível do X do canto: `.nds-sr-only` dentro
do botão nas quatro com lib, `aria-label` no `<button>` do vanilla
(`sheet.ts:388`).

**`modal` NÃO está na tabela, e existe em três das cinco** — react
(`sheet.tsx:26-31`, aceita também `'trap-focus'`), vue (raiz da reka, lido em
`SheetContent.vue:71-72`) e angular (`sheet.ts:194`). Svelte e vanilla são sempre
modais. Inconsistência 6 da §7.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla | fábrica com `onClose(reason)` nas MESMAS quatro palavras do Dialog (`escape`, `overlay`, `close-button`, `api` — conferido em `sheet.ts`), mais `open()`/`close()`/`isOpen()` públicos, `trigger` OPCIONAL e fechamento por `data-slot="sheet-close"` — `PATCHES.md#vanilla-sheet-onclose-reason` e `#vanilla-overlay-close-api` |
| angular | `sheetCloseReason(RdxDialogOpenChangeReason)` exportado de `ui/sheet.ts:99-115`; a classe extra do painel é `panelClass` (`sheet.ts:162`), porque o painel nasce no portal e quem consome não tem elemento onde escrever `class` |
| vue | `sheetCloseReason(gesture)` + `createSheetCloseWatch(note)` de `ui/sheet/sheet.close-reason.ts` — a reka-ui não publica motivo, então o gesto é OBSERVADO; os gestos têm os nomes dos emits da reka (`escape-key-down`, `pointer-down-outside`, `focus-outside`, `close-press`, `confirm`) e o clique em controle de fechar é pego por DELEGAÇÃO na captura do painel (`:114-117`), como no vanilla |
| svelte | `sheetCloseReason(signal)` + `createSheetCloseWatch()` de `ui/sheet/close-reason.ts`, e `SheetContent` ganhou `onClosePress` — a bits-ui também não publica motivo; os sinais têm os nomes de motivo das libs que publicam (`escape-key`, `outside-press`, `focus-out`, `close-press`, `confirm`) e NÃO há delegação: cada `SheetClose` do rodapé precisa espalhar `closeWatch.closeTrigger` (`:82`) |
| react | não declara tipo próprio: o Sheet é o mesmo `dialog_close` do Dialog e usa o `dialogCloseReason` de `ui/dialog-close-reason.ts` (com `markConfirmation()`), ao lado dos irmãos `drawer-`, `menu-` e `popover-close-reason.ts` |
| todas | **onde a opção de lado mora varia por stack**; a tabela de props de cada página mostra a forma dela. O lado em si é sempre do painel (C8) |
| nome das props na docs page | `onOpenChange`/`className` (react), `onUpdate:open`/`class` (vue), `onOpenChange`/`class` (svelte), `openChange`/`modal`/`panelClass` (angular), opções da fábrica com `trigger`, `title`, `titleLevel`, `content`, `footer`, `bodyLabel`, `onClose`, `class` (vanilla) — conferido nas cinco `SheetDocs.*` em 2026-09-15 |
| nome do corpo rolável | quatro stacks recebem `aria-label` na peça do corpo e emitem `role="group"` **só quando ele vem** (no angular é `input` com apelido `aria-label`, para o markup ficar idêntico); no vanilla é a opção `bodyLabel` da fábrica, com a mesma regra. Sem nome, nenhum papel — ver C7 e §8. Medido nas cinco em 2026-09-12 |

**Por que cada stack tem uma peça diferente aqui, e isso não é divergência para
alinhar:** o motivo do fechamento é conhecimento da LIB, e três das cinco não o
publicam. Onde ele chega pronto (base-ui, radix-ng) basta traduzir; onde não
chega (reka-ui, bits-ui) é preciso observar o gesto antes de o painel fechar. O
que o contrato exige é o resultado — as mesmas quatro palavras, derivadas ao lado
do primitivo e nunca inventadas na página que consome. Até 2026-09-11 o vanilla,
que é a referência, tinha três palavras e a docs page dele fabricava a quarta por
fora, fingindo um clique no véu: o contrato remendado no consumidor.

A linha do vanilla nomeia as quatro palavras em vez de dizer "espelha o Dialog":
afirmação por semelhança não reprova, e foi assim que o tipo viveu com três
palavras de 2026-07-27 a 2026-09-11 (histórico na §9).
`sheet.ts:79` declara `'escape' | 'overlay' | 'close-button' | 'api'`. Portão:
`reason_da_familia_divergente`.

**Abrir por código.** As quatro stacks com lib abrem pelo estado
(`open`/`defaultOpen`); o vanilla tem verbos — `open()`, `close()` e `isOpen()`
(`sheet.ts:106-113`) — e `trigger` opcional (`sheet.ts:129`). Até 2026-09-12 só
havia `close()`, e quem comandava o painel de fora montava um gatilho escondido
(`.nds-sr-only`, `tabindex="-1"`, `aria-hidden`) clicado por código; a
`States/Controlled` do vanilla hoje afirma que ele não existe. **`toggle()` do `DrawerElement` fica fora, de propósito**:
zero consumidores medidos, e os dois candidatos reais — o Ctrl+K das duas
paletas de comando — exigem por escrito "só ABRE" (§9 do PRD do command). Num
painel modal o controle que abriu fica atrás do véu e inerte, então quem
chamaria `toggle()` é sempre um atalho de teclado, e fechar modal por teclado já
tem caminho e já tem palavra: Escape, que informa `escape`. Um `toggle()`
fecharia o mesmo gesto como `api` e partiria a série do GA4 em duas.

A guarda de reentrância mora no `open()` (`sheet.ts:333`): um segundo `open()`
não monta outro painel nem trava a rolagem duas vezes. Portão: passo
"`open()` com o painel aberto não empilha um segundo" da `States/Controlled` do
vanilla.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Sheet`, `SheetBody`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetTitle`, `SheetTrigger` |
| vue | `Sheet`, `SheetBody`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetTitle`, `SheetTrigger`, e do mesmo índice `createSheetCloseWatch`, `sheetCloseReason`, `SHEET_CLOSE_SLOT` e os tipos `SheetCloseGesture`/`SheetCloseReason`/`SheetCloseWatch` (`index.ts:10-17`). `SheetOverlay.vue` existe e não é exportado |
| svelte | `Sheet`, `SheetBody`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`, e do mesmo índice `createSheetCloseWatch`, `sheetCloseReason` e os tipos `SheetCloseReason`/`SheetCloseSignal`/`SheetCloseWatch` |
| vanilla | `createSheet` (devolve `SheetElement = DestroyableElement & { open(), close(), isOpen() }`), e os tipos `SheetSide`, `SheetCloseReason`, `SheetElement`, `SheetOptions` |
| angular | `button[ndsSheetClose]`, `button[ndsSheetTrigger]`, `div[ndsSheetBody]`, `div[ndsSheetFooter]`, `div[ndsSheetHeader]`, `h1[ndsSheetTitle]` … `h6[ndsSheetTitle]` (os seis), `nds-sheet`, `ng-template[ndsSheetContent]`, `p[ndsSheetDescription]`; e `NDS_SHEET`, `sheetCloseReason`, tipos `SheetSide`/`SheetCloseReason` |

react declara `SheetPortal` e `SheetOverlay` em `sheet.tsx:44-59` e não os exporta.

O snippet de extensibilidade do angular usa `<app-filters-form>` como placeholder
do componente de quem consome — nunca o prefixo `nds-`, que o tornaria
indistinguível de peça. Portão: `tag_angular_inexistente`.


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

**No svelte, `level` sozinho não troca a tag.** O título da bits-ui renderiza
`<div role="heading">` e o `level` (padrão `2`, `dialog-title.svelte:14`) só
alimenta o `aria-level`. Quem entrega o cabeçalho de verdade é o snippet `child`
(`SheetStory.svelte:179-184`), e os dois andam juntos: sem `level`, um `h3`
escrito pelo `child` sairia com `aria-level="2"`.

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

### Inconsistências entre stacks, medidas em 2026-09-15

Medido arquivo a arquivo nas cinco stacks (primitivo, stories, `*.source.ts` e
testes, docs page, `analytics.ts`). `node scripts/audit.mjs sheet --json` devolve
zero achados nesta data — nenhuma das divergências abaixo tem portão que a veja.
O que já está registrado como forma de API na tabela de divergências acima não se
repete aqui, salvo quando tem consequência de comportamento.

**Primitivo e comportamento**

1. **Um painel por vez.** vanilla fecha o painel anterior ao abrir outro, relatando
   `api` (`sheet.ts:231-237`, `:342`), e tem story própria para isso
   (`sheet-states.stories.ts:426`, `SecondPanelClosesFirst`). react, vue, svelte e
   angular não têm essa guarda: as libs empilham diálogos. Maioria (4): empilhar;
   a referência recolhe. Decisão da dona — ver o relatório da revisão.
2. **`data-slot="sheet"` no DOM.** Só existe em vanilla (wrapper,
   `sheet.ts:283`) e angular (host, `sheet.ts:199`). react passa o atributo à raiz
   da base-ui (`sheet.tsx:31`) e vue à `DialogRoot` (`Sheet.vue:14`), que não
   renderizam elemento; svelte não o escreve (`sheet.svelte:7`). Maioria (3): sem
   nó. Divergência de API de framework (raiz sem elemento) — registrar, não alinhar;
   nenhuma story fora do vanilla lê o atributo.
3. **Cabeçalho e corpo condicionais.** vanilla só monta cabeçalho com `title` ou
   `description` e só escreve `aria-labelledby`/`aria-describedby` quando cada um
   existe (`sheet.ts:354-355`, `:393`); o corpo é SEMPRE montado, com `tabindex="0"`
   (`sheet.ts:418-427`). Nas quatro com lib o `SheetBody` é opcional e a lib liga os
   ids pelas peças compostas. Divergência de API (fábrica × composição) —
   registrar; consequência: no vanilla todo painel tem uma parada de teclado no
   corpo, mesmo curto.
4. **Atributo de estado.** angular escreve `data-state` no véu e no painel
   (`sheet.ts:210`, `:218`) além do par da lib; vue (reka) e svelte (bits,
   `dialog.svelte.js:90`) escrevem `data-state` nativo; react (base-ui) escreve
   `data-open`/`data-closed`; vanilla não escreve nenhum. Maioria (3):
   `data-state`. Não é contrato (D8, §6) e só a story do angular o afirma
   (`sheet.stories.ts:164`, `sheet-states.stories.ts:151`, `:373`).
5. **Animação de saída.** A transição de saída depende de
   `[data-ending-style]` (`sheet.css:295-331`): base-ui (react), radix-ng
   (angular) e bits-ui (svelte, `dialog.svelte.d.ts:141-142`) o escrevem; reka-ui
   (vue) não tem o atributo em `dist/`, e vanilla remove o nó na hora
   (`sheet.ts:461-466`). Maioria (3): anima a saída; a referência não anima.
   Decisão da dona.
6. **`modal`.** Prop em react (`sheet.tsx:26-31`, com `'trap-focus'`), vue
   (`SheetContent.vue:71-72`) e angular (`sheet.ts:194`); ausente em svelte
   (sempre modal, `sheet-content.svelte:12-13`) e vanilla. Só a docs page do
   angular a lista (`SheetDocs.ts:1154`); react e vue a expõem no Playground
   (`sheet.stories.tsx:71`, `sheet.stories.ts:67`) e não na tabela. Divergência de
   API — registrar; a falta na tabela compartilhada (§7) é o que alinhar.
7. **Observação do motivo sem lib que o publique.** vue delega o clique em
   `[data-slot="sheet-close"]` na captura do painel
   (`sheet.close-reason.ts:114-117`), como o vanilla (`sheet.ts:371-374`); svelte
   não delega — cada `SheetClose` precisa espalhar `closeWatch.closeTrigger`
   (`close-reason.ts:82`), e um que não espalhe fecha relatando `api`. Os nomes do
   gesto também diferem (`escape-key-down`… no vue, `escape-key`… no svelte).
   Maioria com delegação: vanilla e vue; react e angular recebem o motivo da lib.
   A forma da função é API; a ausência de delegação no svelte é comportamento.
8. **Aviso de painel sem título.** Só angular avisa em modo dev
   (`sheet.ts:269-285`). Registrar.

**Stories — conjunto e asserções**

9. **`Variants/Right`.** vanilla afirma `aria-modal` e NÃO afirma nome acessível
   em nenhuma das quatro direções (`sheet-variants.stories.ts:96-190`); react, vue,
   svelte e angular afirmam `toHaveAccessibleName()` nas quatro e nunca
   `aria-modal`. Maioria (4) no nome; a referência no `aria-modal`. Alinhar pela
   união: as duas asserções nas cinco.
10. **Motivo do fechamento no `Playground`.** vanilla (`sheet.stories.ts:268-331`:
    escape, overlay, X, Cancelar, primária `api`, `close()` idempotente), vue
    (`sheet.stories.ts:287-340`: escape, overlay, X, Cancelar; `api` fica na
    `States/Controlled`, `:413-426`) e svelte (`sheet.stories.ts:240-305`: os cinco
    caminhos) afirmam a palavra; **react e angular não afirmam motivo em story
    nenhuma** (`sheet.stories.tsx:277-315`, `sheet.stories.ts:223-258`). angular
    também não tem teste unitário de `sheetCloseReason` (vue e svelte têm
    `*close-reason.test.ts`, react `dialog-close-reason.test.ts`). Maioria (3):
    afirma. Pendência abaixo.
11. **Passos condicionados a control.** react e angular só executam o passo do
    véu com `args.modal` e o do X com `args.showCloseButton`
    (`sheet.stories.tsx:286`, `:298`; `sheet.stories.ts:232`, `:242`); vue,
    svelte e vanilla sempre executam. Maioria (3): incondicional.
12. **Trava de rolagem (C5).** Só `States/Controlled` do vanilla afirma
    (`sheet-states.stories.ts:393-398`), junto com reentrância e `isOpen()`.
    Nenhuma das outras quatro afirma a trava. Pendência abaixo.
13. **Corpo nomeado (C7).** Nenhuma story das cinco passa nome ao corpo nem afirma
    `role="group"`/`aria-label`; `LongScrollBody` afirma só `tabindex`. Só a docs
    page do vanilla documenta a opção (`bodyLabel`, `SheetDocs.ts:1015`). Pendência
    abaixo.
14. **`States/Controlled` do svelte não é controlado.** O botão "Abrir pelo estado
    externo" é o `SheetTrigger` do andaime (`sheet-states.stories.ts:197-238` +
    `SheetStory.svelte:165-169`) e o fecho é por Escape; nas outras quatro há
    botão fora do painel e sem gatilho interno. Maioria (4). Pendência abaixo.
15. **`States/Open` e `WithCloseButtonHidden`.** angular não afirma a descrição
    acessível em `Open` (`sheet-states.stories.ts:149-157`; as outras quatro
    afirmam). Só vanilla afirma a ausência da classe do X
    (`sheet-states.stories.ts:270`); angular procura `/fechar/i` sem âncoras
    (`:305`), as outras `/^Fechar$/i`. Maioria (4) na descrição.
16. **Exemplos das stories de estado divergem.** `LongScrollBody`: 24 parágrafos
    em vanilla, react e angular; 14 parágrafos no svelte (`SheetStory.svelte:240`);
    12 pares rótulo+campo sem gatilho no vue (`sheet-states.stories.ts:203-229`).
    `WithCloseButtonHidden`: "Aceitar atualização" no vue (`:276`) e "Convidar
    para o time" no svelte (`:165`) contra os rótulos da Demonstração nas outras
    três. angular acrescenta a asserção de `panelClass` (`:229-247`). Maioria (3):
    o exemplo do vanilla.
17. **`Compositions/AdvancedFilters` do vue não tem `<form>`** — campos soltos e a
    primária como botão comum (`sheet-compositions.stories.ts:89-106`), e o
    snippet repete (`sheet.source.ts:358-393`); as outras quatro religam a primária
    por `form="<id>"` e afirmam isso (D9). A docs page do vue tem o `<form>`.
    Maioria (4). Pendência abaixo.
18. **A primária das composições do vanilla fecha como `close-button`.**
    `makeFooter(…, true, formId)` marca Cancelar E a primária com
    `data-slot="sheet-close"` (`sheet.fixtures.ts:117-120`, usado em
    `sheet-compositions.stories.ts:107`, `:252`); no `Playground` a primária fecha
    por `close()` e relata `api`. Nas outras quatro a primária das composições não
    fecha. Contradiz a própria referência.
19. **Asserções das composições.** `SecondaryNavigation`: vanilla abre por clique
    e confere o texto dos cinco links na ordem; as outras abrem na montagem e
    contam 5; svelte e angular afirmam ausência de rodapé, react e vue não.
    `BottomPanel`: angular afirma 3 no corpo e 1 no rodapé; react só o corpo;
    svelte só o rodapé; vanilla os dois pelo texto; vue nenhum dos dois
    (`sheet-compositions.stories.ts:276-283`). Alinhar pela união, com o vanilla.
20. **Ritmo do formulário.** angular usa `nds-grid` com `data-spacing="md"` nas
    composições de formulário (`sheet-compositions.stories.ts:77`, `:213`) e vue
    `nds-grid` no `LongScrollBody`; as outras usam `nds-stack` `sm` + `xs`, que é o
    do vanilla e o da própria docs page do angular (`SheetDocs.ts:241`). Maioria (4).
21. **Regra de acessibilidade silenciada só no vue.** As três stories de
    variantes, estados e composições do vue ligam `FOCUS_RULE_GUARDA`
    (`sheet-variants.stories.ts:52`, `sheet-states.stories.ts:46`,
    `sheet-compositions.stories.ts:36`); nenhuma outra stack precisa. Maioria (4):
    sem configuração.
22. **Texto velho no meta das composições do vanilla.** "A factory não expõe um
    botão de fechar componível — […] os botões do rodapé saem pelo overlay"
    (`sheet-compositions.stories.ts:46-49`) — falso desde a delegação por
    `data-slot`.
23. **Quatro stacks citam "PRD D10" para a regra do `form`**, que neste
    documento é a D9 (a D10 é do `dialog.md`); o vue não cita número nenhum: vanilla
    (`sheet-compositions.stories.ts:88`, `sheet.fixtures.ts:96`,
    `SheetDocs.ts:552`), react (`sheet-compositions.stories.tsx:132`), svelte
    (`sheet-compositions.stories.ts:76`, `SheetStory.svelte:138`), angular
    (`sheet-compositions.stories.ts:91`, `:118`).

**Docs page**

24. **A ação primária da Demonstração fecha só no vanilla.** vanilla dispara
    `dialog_confirm` e chama `sheet.close()` (`SheetDocs.ts:183-190`) — o fecho
    sai `api`; react (`SheetDocs.tsx:166-176`), vue (`SheetDocs.vue:636`), svelte
    (`SheetDocs.svelte:489`) e angular (`SheetDocs.ts:743`) só disparam o evento e
    o painel fica aberto. No próprio vanilla a prévia de perfil também não fecha
    (`SheetDocs.ts:834-841`). Maioria (4): não fecha; a referência fecha.
    Decisão da dona.
25. **`componentSlug` passado aos containers.** `DocsCompositions` recebe nas
    cinco; `DocsVariants` só em react (`SheetDocs.tsx:567`) e angular
    (`SheetDocs.ts:778`); `DocsRelated`/`DocsNotes` só em react (`:1102`, `:1112`)
    e angular (`:820`, `:825`); `DocsImport` só em angular (`:772`). Maioria (3):
    sem a prop. Conferir se o container de cada stack a exige antes de alinhar.

**Construtores de snippet**

26. **Cobertura e nomes.** react 15 construtores / 25 testes, vue 16 / 23,
    angular 14 / 24, vanilla 4 funções parametrizadas / 26, svelte 7 / 12 — svelte
    não tem construtor por lado nem por estado (o snippet sai dos args). Os nomes
    divergem de idioma: vue `sheetSideDireitoSource`, `sheetEditPerfilSource`;
    svelte `perfilSheetEditSource`, `sheetNavegacaoSecundariaSource`,
    `sheetTermosWithScrollSource`; react e angular em inglês. Divergência de forma —
    registrar; o nome em português é o que alinhar (maioria em inglês).

> **PENDÊNCIA · 2026-09-15** — C5 (trava de rolagem) só tem portão no vanilla.
> **Fecha quando**: react, vue, svelte e angular têm um passo de story que afirma a página travada com o painel aberto e solta depois do fecho.

> **PENDÊNCIA · 2026-09-15** — C7 (corpo com `role="group"` + `aria-label`) não tem portão em nenhuma stack.
> **Fecha quando**: `States/LongScrollBody` das cinco nomeia o corpo e afirma `role="group"` e o nome acessível.

> **PENDÊNCIA · 2026-09-15** — react e angular não afirmam o motivo do fechamento em story, e angular não tem teste de `sheetCloseReason` (inconsistência 10).
> **Fecha quando**: o `Playground` das duas afirma `escape`, `overlay`, `close-button` e `api`, e existe teste unitário do mapeador no angular.

> **PENDÊNCIA · 2026-09-15** — `Compositions/AdvancedFilters` do vue e o snippet dela não têm `<form>` religado (inconsistência 17).
> **Fecha quando**: a story e `sheetFiltersAvancadosSource` do vue têm `<form id>` e primária `type="submit" form="<id>"`, com asserção.

> **PENDÊNCIA · 2026-09-15** — `States/Controlled` do svelte abre pelo gatilho interno (inconsistência 14).
> **Fecha quando**: a story do svelte abre por estado externo, sem `SheetTrigger`, como nas outras quatro.

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
nesta tabela. `dialog_open` e `dialog_close` são os do Dialog de propósito: as
duas peças respondem à mesma pergunta de produto, e separar as séries esconderia
isso.

**O terceiro evento NÃO é compartilhado com o Dialog.** Conferido nas cinco em
2026-09-15: o Sheet dispara
`dialog_confirm` (`{ component: "sheet", trigger_id, action, location }`) e o
Dialog dispara `dialog_action` (`{ component: "dialog", action_label, location }`)
— nenhuma `SheetDocs.*` manda `dialog_action`, nenhuma `DialogDocs.*` manda
`dialog_confirm`, e os dois eventos estão tipados nas cinco `analytics.ts`. São
dois nomes e dois formatos para a mesma pergunta ("a ação primária do rodapé foi
executada"), em componentes que compartilham os outros dois eventos de propósito;
o `dialog_confirm` leva `trigger_id` e o `dialog_action` não. Unificar é decisão
da dona — registrado aqui e na §9 do [`dialog.md`](dialog.md), não consertado por
conta própria.

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
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 57 chaves `nav` saíram do conteúdo em 2026-09-12.** As páginas do vue e do
svelte liam o conteúdo, com a mesma deriva de escrita em inglês e espanhol.

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas — e desde a mesma
data o TÍTULO da seção é a mesma frase, derivada do mesmo lugar. A linha abaixo
registra por quê. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

**As 45 chaves de título de seção saíram do conteúdo em 2026-09-12**, e
**15 delas diziam palavra diferente da do item de menu que salta para a
seção** — "Quando e Como Usar" contra "Quando Usar", "Design Tokens" contra
"Tokens", "Componentes Relacionados" contra "Relacionados". O `h2` agora
nasce do id que a própria seção declara, então divergir deixou de ser possível
em vez de passar a ser proibido. Portões: `titulo_de_secao_no_conteudo`,
`titulo_de_secao_pedido_ao_conteudo` e `titulo_passado_ao_container` — o
terceiro existe porque no Angular um `[title]` esquecido **não** reprova no
`ngc` (é atributo global do HTML) e viraria tooltip silencioso no cabeçalho.


