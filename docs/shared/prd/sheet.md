# PRD — Sheet

> **Estado descrito**: 2026-09-15, conferido linha a linha contra o código das
> cinco stacks. **Revisão serial fechada em** 2026-09-06.
>
> **Revisado contra o código em 2026-09-15**, e **corrigido na passagem de `fix`
> de 2026-09-16**, que fechou as cinco pendências e a maior parte da §7. A §7
> mantém a numeração original e diz, item a item, o que ficou.
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


> **2026-09-20 — o VÉU NÃO ANIMA MAIS, por decisão da dona, nos quatro componentes que o têm.** O que anima é o PAINEL, que é quem entra; o véu aparece com ele. Saíram as regras de animação de véu de `sheet.css`, `dialog.css` e `alert-dialog.css`, e com elas os keyframes `nds-sheet-fade-in`, `nds-dialog-fade-in` e `nds-dialog-fade-out`, que ficaram órfãos.
>
> **Nasceu de um defeito, e a simplificação é o conserto**: o véu do Drawer em react, vue e svelte desvanecia 0,5s sob `prefers-reduced-motion`, porque a folha que a `vaul` injeta declara a duração dele um degrau de especificidade acima do nosso guarda (medido; ver a D17 de [`drawer.md`](drawer.md)). Véu que não anima não tem guarda a perder — a decisão apaga a categoria do problema em vez de vencer a disputa de cascata.
>
> **Eram DOIS caminhos, e o segundo sobreviveu ao commit que tirou o primeiro**: a `animation` com o keyframe, e a `transition: opacity` com `[data-starting-style]`. A segunda não era inerte — base-ui, bits-ui e radix-ng emitem o atributo —, então nessas três o véu continuou desvanecendo por transição até ser removida também. Duas agentes a acharam de forma independente no mesmo dia, as duas medindo o DRAWER (onde ela É inerte, porque a `vaul` não emite o atributo) e as duas com o cuidado de dizer que não haviam medido o Sheet.
>
> §5, §6, §7 #5 e §8 abaixo estão ATUALIZADOS para esta decisão — e o §8 registra o `!important` que existiu por algumas horas entre os dois passos e saiu. Ver a D18 de [`drawer.md`](drawer.md).

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

**Animação — o painel entra, e não sai animado.** A entrada por `@keyframes`
vale para toda montagem, e a transição de `[data-starting-style]` cobre quem usa
o atributo. **A SAÍDA do painel foi removida em 2026-09-16, por decisão da dona**:
ela pendurava em `[data-ending-style]`, atributo de LIB que não chega às cinco —
base-ui, radix-ng e bits-ui o escrevem; a `reka-ui` instalada não o tem em
`dist/`; o vanilla remove o nó na hora. No máximo três das cinco animavam, e a
referência não era uma delas.

**O VÉU não anima, em sentido nenhum, desde 2026-09-20** — decisão da dona, nos
quatro componentes que o têm. Até essa data este parágrafo dizia o contrário:
que ele ficava animado de propósito, porque `.nds-sheet-overlay` é declarado
nesta folha e consumido pelo `drawer.css` e pelo Sidebar móvel (§1), e mexer nele
"consertaria um componente e mexeria em três". **O argumento estava certo e a
decisão o inverteu**: alcançar os três passou a ser o objetivo, não o custo.

Saíram as duas declarações, porque eram DOIS caminhos independentes: a
`animation: nds-sheet-fade-in` (com o keyframe, que ficou órfão) e a
`transition: opacity` com `[data-starting-style]`. A segunda sobreviveu algumas
horas à primeira, e **não era inerte** — base-ui, bits-ui e radix-ng emitem o
atributo, então nessas três o véu continuava desvanecendo, agora por transição.

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
| angular | `sheetCloseReason(string \| undefined)` mora em `ui/sheet-close-reason.ts` e é reexportado por `ui/sheet.ts` — **mudou de arquivo em 2026-09-16**, e o motivo é de teste: caso unitário em node não importa módulo com `@Component`, e sem separar não havia como cobrar o mapeador. A assinatura passou a ser a dos irmãos. A classe extra do painel é `panelClass` (`sheet.ts:162`), porque o painel nasce no portal e quem consome não tem elemento onde escrever `class` |
| vue | `sheetCloseReason(gesture)` + `createSheetCloseWatch(note)` de `ui/sheet/sheet.close-reason.ts` — a reka-ui não publica motivo, então o gesto é OBSERVADO; os gestos têm os nomes dos emits da reka (`escape-key-down`, `pointer-down-outside`, `focus-outside`, `close-press`, `confirm`) e o clique em controle de fechar é pego por DELEGAÇÃO na captura do painel (`:114-117`), como no vanilla |
| svelte | `sheetCloseReason(signal)` + `createSheetCloseWatch()` de `ui/sheet/close-reason.ts` — a bits-ui também não publica motivo; os sinais têm os nomes de motivo das libs que publicam (`escape-key`, `outside-press`, `focus-out`, `close-press`, `confirm`). **Passou a DELEGAR em 2026-09-16**, por ouvinte de captura no painel com predicado puro (`sheet-content.svelte` + `isSheetCloseTrigger`): o `closeTrigger` que cada `SheetClose` precisava espalhar deixou de existir, e com ele os 12 pontos à mão que a docs page mantinha — esquecer um fazia aquele fecho sair `api` |
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

### Inconsistências entre stacks — medidas em 2026-09-15, corrigidas em 2026-09-16

A numeração de 1 a 26 é a da medição original e **fica**, porque o texto acima e
as pendências apontam para ela por número. Cada item passou a dizer o estado de
hoje. `node scripts/audit.mjs sheet --json` devolvia zero achados **antes e
depois** — nenhuma destas divergências tem portão que a veja, e é por isso que a
passagem existiu.

**O que sobra**: os itens 2, 3, 6, 7 e 26, que são forma de API ou mecânica de
lib e ficam registrados; o resto fechou.

**As quatro decisões da dona desta rodada**: um painel por vez (item 1), saída do
painel sem animação (item 5), primária da Demonstração fechando (item 24), e a
aposentadoria do `dialog_action` em favor do `dialog_confirm` (§9).

**E o que só o NAVEGADOR viu**, depois de tudo compilar e o auditor fechar limpo:
a guarda de painel único do vue nascia dentro do `<script setup>`, que roda uma
vez por INSTÂNCIA — cada painel com o próprio registro vazio, cada um "único"
sozinho, e nada recolhia. O `build` ficava verde; nenhum type-check distingue
escopo de instância de escopo de módulo. No svelte, a mesma story reprovava por
outro motivo: a espera afirmava "exatamente um painel" numa hora em que isso já
era verdade — o primeiro ainda estava lá —, e a asserção media DOM velho.

**Primitivo e comportamento**

1. **FECHADO · um painel por vez, nas cinco.** A referência recolhia e as quatro
   com lib empilhavam, porque as libs empilham diálogos — e dois modais ao mesmo
   tempo deixam um inalcançável atrás do véu, com duas armadilhas de foco. Por
   decisão da dona as quatro passaram a recolher o painel aberto antes de abrir
   outro, relatando `api`, cada uma com o registro no escopo que a stack permite
   (módulo no react, no vue e no svelte; serviço no angular). A story
   `SecondPanelClosesFirst` existe nas cinco e afirma o motivo. **Como o segundo
   painel é aberto diverge, e é aceitável**: o vanilla clica um gatilho do canvas,
   react e angular clicam um botão DENTRO do primeiro painel, vue e svelte viram
   estado por código — com um modal aberto o `body` fica `pointer-events: none` e
   o clique sintético é recusado. Só a referência prova que um controle de fora
   continua alcançável.
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
5. **FECHADO · o painel não anima mais a saída.** A transição dependia de
   `[data-ending-style]`, que base-ui, radix-ng e bits-ui escrevem e a `reka-ui`
   instalada não tem em `dist/`; o vanilla remove o nó na hora. Três das cinco
   animavam, a referência não. Por decisão da dona a regra saiu de `sheet.css`,
   com o motivo escrito no lugar dela — na época **só nas regras do
   `.nds-sheet-content`**, porque o véu ficava animado por ser consumido pelo
   `drawer.css` e pelo Sidebar móvel. Em 2026-09-20 a dona estendeu ao véu, e
   **ele não anima mais em sentido nenhum** (§5).
6. **`modal`.** Prop em react (`sheet.tsx:26-31`, com `'trap-focus'`), vue
   (`SheetContent.vue:71-72`) e angular (`sheet.ts:194`); ausente em svelte
   (sempre modal, `sheet-content.svelte:12-13`) e vanilla. Só a docs page do
   angular a lista (`SheetDocs.ts:1154`); react e vue a expõem no Playground
   (`sheet.stories.tsx:71`, `sheet.stories.ts:67`) e não na tabela. Divergência de
   API — registrar; a falta na tabela compartilhada (§7) é o que alinhar.
7. **Observação do motivo sem lib que o publique — a delegação virou UNÂNIME.**
   vue e vanilla já delegavam o clique em `[data-slot="sheet-close"]` na captura
   do painel; **o svelte passou a delegar em 2026-09-16**, e com isso o
   `closeTrigger` que cada `SheetClose` precisava espalhar deixou de existir —
   esquecer um ponto fazia aquele fecho sair `api`, e a docs page mantinha 12
   pontos à mão. react e angular recebem o motivo da lib. O que sobra de
   divergência é o NOME do gesto (`escape-key-down`… no vue, `escape-key`… no
   svelte), que é forma de API e fica registrado.
8. **Aviso de painel sem título.** Só angular avisa em modo dev
   (`sheet.ts:269-285`). Registrar.

**Stories — conjunto e asserções**

9. **FECHADO · as quatro direções afirmam `aria-modal` E o nome esperado, nas
   cinco.** A referência afirmava só `aria-modal`; as outras quatro chamavam
   `toHaveAccessibleName()` **sem argumento**, que passa com qualquer nome — e
   era a família de asserção sem dentes mais numerosa desta passagem. No react o
   nome vem de `t()` pela mesma store de locale do render, e não de literal
   pt-BR: a negociação pode resolver `en` no navegador headless.
10. **FECHADO · as cinco afirmam o motivo do fechamento no `Playground`**, e o
    angular ganhou o teste unitário do mapeador que era a única stack a não ter
    (ver a pendência correspondente).
11. **FECHADO · os passos do véu e do X são incondicionais nas cinco.** react e
    angular só os executavam com `args.modal`/`args.showCloseButton` ligados —
    control desligado, passo que não roda, e a story fechava verde sem medir.
12. **FECHADO · a trava de rolagem (C5) é afirmada nas cinco**, cada uma pela
    mecânica da sua lib (ver a pendência, que traz as cinco formas).
13. **FECHADO · o corpo é nomeado e o trio é afirmado nas cinco** (ver a
    pendência). O rótulo é `'Termos de uso'` nas cinco, **literal, sem chave no
    conteúdo compartilhado** — as cinco concordam, e isso fica registrado aqui
    como o ponto por onde uma divergência voltaria a entrar.
14. **FECHADO · a `States/Controlled` do svelte abre por estado**, sem
    `SheetTrigger`, como nas outras quatro.
15. **FECHADO · `States/Open` e `WithCloseButtonHidden` alinhadas.** O angular
    passou a afirmar a descrição acessível e trocou `/fechar/i` por `/^Fechar$/i`
    — regex sem âncora casa "Fechar filtros" e qualquer outro rótulo que contenha
    a palavra.
16. **FECHADO · os exemplos das stories de estado são os da referência.**
    `LongScrollBody` com 24 parágrafos e os cinco rótulos do vanilla nas cinco —
    o svelte trocava quatro deles e o **angular trocava o ASSUNTO**, rotulando um
    painel de termos como "Abrir filtros"/"Filtros avançados"/"Aplicar filtros".
    `WithCloseButtonHidden` com os dois botões do rodapé: react e angular tinham
    só Cancelar, e cravavam `toHaveLength(1)` — asserção com dentes provando o
    exemplo errado, que é pior que asserção nenhuma.
17. **FECHADO · o `<form>` religado existe na story E no snippet das cinco** (ver
    a pendência, que também registra o mesmo defeito achado nos snippets
    publicados das docs pages).
18. **FECHADO · a primária das composições do vanilla deixou de ser peça de
    fechar.** `makeFooter` marcava Cancelar **e a primária** com
    `data-slot="sheet-close"`, então o mesmo botão saía `close-button` nas
    composições e `api` no `Playground` — a referência contradizia a si mesma. Hoje
    só o Cancelar carrega a marca, e as duas plays afirmam isso nos dois sentidos.
19. **FECHADO · as asserções das composições foram alinhadas pela união**, com o
    vanilla como referência: `SecondaryNavigation` e `BottomPanel` afirmam corpo e
    rodapé nas cinco.
20. **FECHADO · o ritmo do formulário é `nds-stack` `sm` + `xs` nas cinco**, na
    story e no snippet. `nds-grid` não aparece mais em arquivo de sheet, e react,
    vue e svelte têm teste negativo cobrando isso.
21. **FECHADO · o vue não silencia mais a regra de acessibilidade.** O
    `FOCUS_RULE_GUARDA` estava nas três stories, e a medição mostrou que era
    **herança de família alheia**: na reka instalada quem monta âncoras de foco é
    `Combobox`, `Menu`, `Popover` e `Select` — o `DialogContentImpl`, caminho de
    Dialog, AlertDialog e Sheet, nunca as monta. Desligava uma regra que este
    componente não tinha motivo para desligar.
22. **FECHADO · o meta das composições do vanilla diz o contrato real** de
    delegação; as duas metades do texto anterior eram falsas desde que a
    delegação por `data-slot` entrou.
23. **FECHADO · a citação é "PRD D9" nas cinco.** A D10 é do `dialog.md`, e
    quatro stacks apontavam para lá — referência cruzada errada envelhece calada,
    porque o número existe nos dois documentos.

**Docs page**

24. **FECHADO · a ação primária FECHA o painel nas cinco docs pages**, saindo
    `api`, por decisão da dona — a referência já fazia, e as outras quatro só
    disparavam o evento deixando o painel aberto. **O alcance era maior do que o
    item dizia**: no vue faltava em DEZ prévias (demonstração, Do & Don't e
    variantes), porque lá cada uma monta o próprio painel, enquanto no vanilla um
    construtor único serve todas. No vue isso exigiu painel CONTROLADO em vez de
    `SheetClose`: a reka fecha dentro do clique e o ouvinte de captura já anotou
    `close-press`, então o fecho sairia `close-button` e perderia a distinção que
    o vocabulário existe para guardar.
25. **FECHADO · `componentSlug` vai a todos os containers que o aceitam**, nas
    cinco. O que mais pesava é o `DocsPageLayout`: sem a prop ali, o
    `mountDocsTracking` da página inteira caía na derivação por URL.

**Construtores de snippet**

26. **CONTINUA ABERTO · nomes de construtor em português no vue e no svelte.** A
    granularidade por stack é forma e fica registrada — o svelte não tem
    construtor por lado nem por estado, porque o snippet sai dos args, e o vanilla
    serve tudo por funções parametrizadas; as contagens mudaram nesta passagem,
    com os construtores novos do segundo painel e das composições, e por isso não
    são repetidas aqui: quem quiser o número mede. **O que não é forma é o
    IDIOMA**: `sheetSideDireitoSource` e `sheetEditPerfilSource` no vue,
    `perfilSheetEditSource`, `sheetNavegacaoSecundariaSource` e
    `sheetTermosWithScrollSource` no svelte, contra react e angular em inglês.
    Não entrou na lista de ninguém nesta rodada e segue de pé — é lote de
    renomeação, não item de revisão de componente.

> **FECHADA · 2026-09-16** — C5 (trava de rolagem) só tem portão no vanilla.
> **Fecha quando**: react, vue, svelte e angular têm um passo de story que afirma a página travada com o painel aberto e solta depois do fecho.
> **Como fechou**: as cinco afirmam, lendo a linha-base antes de abrir e cobrando
> trava E soltura. **A mecânica diverge de propósito, a força não**: vanilla, vue e
> svelte leem `body.style.overflow`; o react lê o estilo inline de `<html>` e
> `<body>` com o control `modal` ligado (lá a trava depende dele) e **não** o
> computado, que passaria numa página já travada por CSS; o angular lê
> `data-rdx-scroll-locked`, porque a lib troca de estratégia por navegador.
> Provado com defeito plantado: com a trava inerte, a `Controlled` do vanilla
> reprova.

> **FECHADA · 2026-09-16** — C7 (corpo com `role="group"` + `aria-label`) não tem portão em nenhuma stack.
> **Fecha quando**: `States/LongScrollBody` das cinco nomeia o corpo e afirma `role="group"` e o nome acessível.
> **Como fechou**: as cinco nomeiam o corpo com `'Termos de uso'` e afirmam o trio
> `tabindex="0"` + `role="group"` + nome. As cinco JÁ implementavam o ramo, e
> nenhuma o exercitava — o papel só é emitido quando o nome chega, então sem a
> prop os três atributos somem juntos e nada reprovava. Provado com defeito
> plantado: sem `role="group"`, a `LongScrollBody` do vanilla reprova.

> **FECHADA · 2026-09-16** — react e angular não afirmam o motivo do fechamento em story, e angular não tem teste de `sheetCloseReason` (inconsistência 10).
> **Fecha quando**: o `Playground` das duas afirma `escape`, `overlay`, `close-button` e `api`, e existe teste unitário do mapeador no angular.
> **Como fechou**: os dois `Playground` afirmam as quatro palavras, e o angular
> ganhou `sheet-close-reason.test.ts` com 10 casos — para isso o mapeador saiu
> para `ui/sheet-close-reason.ts`, porque teste unitário em node não importa
> módulo com `@Component`. No react a confirmação passou a chamar
> `markConfirmation()`, que existia sem call site: sem ela, confirmar saía com o
> motivo da lib em vez de `api`.

> **FECHADA · 2026-09-16** — `Compositions/AdvancedFilters` do vue e o snippet dela não têm `<form>` religado (inconsistência 17).
> **Fecha quando**: a story e `sheetFiltersAvancadosSource` do vue têm `<form id>` e primária `type="submit" form="<id>"`, com asserção.
> **Como fechou**: story e snippet religados e afirmados. **E a varredura achou o
> mesmo defeito num lugar que a pendência não cobria**: os snippets PUBLICADOS das
> docs pages de react, vue, svelte e angular traziam `<form id>` sem
> `preventDefault`, ao lado de uma prévia que guardava — o defeito da D9
> reimpresso no bloco que a pessoa copia. Só o vanilla publicava certo; os quatro
> foram corrigidos.

> **FECHADA · 2026-09-16** — `States/Controlled` do svelte abre pelo gatilho interno (inconsistência 14).
> **Fecha quando**: a story do svelte abre por estado externo, sem `SheetTrigger`, como nas outras quatro.
> **Como fechou**: a story ganhou cena própria, sem `SheetTrigger`, abrindo por
> estado e afirmando também a trava de rolagem e o motivo `escape`.

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

**O guarda do VÉU chegou a ganhar `!important` em 2026-09-20 — e ele SAIU no
mesmo dia.** O motivo nunca foi do Sheet: `sheet.css` também veste o **Drawer**,
e lá o véu de react, vue e svelte desvanecia 0,5s sob a preferência, porque a
`vaul` declara
`[data-vaul-overlay][data-vaul-snap-points="false"]{animation-duration:.5s}` em
(0,2,0), contra o nosso `.nds-sheet-overlay` em (0,1,0), e injeta a folha dela
por `head.appendChild` depois da nossa. **Um degrau, e uma folha de terceiro.**

A dona recusou o `!important` e mandou resolver a fragilidade na raiz: a
animação da lib saiu por `patch-package`, e o véu deixou de animar em qualquer
componente (§5). **Não há `!important` em `sheet.css`** — a única ocorrência da
palavra no arquivo é a prosa do comentário que explica por que ela não está lá.
Medição, aritmética e o desenho novo estão nas **D17 e D18 do
[`drawer.md`](drawer.md)** e em `PATCHES.md`.

**Esta é a TERCEIRA camada do mesmo defeito neste arquivo**: a guarda da classe
nua perdendo para `[data-side]` (abaixo), a guarda inerte por token
(`guarda_de_movimento_inerte`), e agora a guarda derrotada por CSS injetado em
runtime. As três têm a mesma assinatura — declaração presente, com cara de
correta, que não pinta nada —, e nenhum portão que leia a NOSSA folha pode ver a
terceira.

**E o bloco da própria folha passou a segurar em 2026-09-17.** As quatro entradas
por lado são declaradas em `.nds-sheet-content[data-side="…"]`, (0,2,0), e a
guarda mirava a classe nua, (0,1,0): perdia na cascata, e o painel deslizava pela
lateral inteira para quem pediu menos movimento — que é exatamente o movimento
grande que a preferência existe para evitar. A metade que já servia (as duas
transições declaradas na classe nua) continua onde estava; o véu segue na lista
de seletores da guarda por regressão, já que ele não anima mais por regra
nenhuma. Portão: `guarda_de_movimento_inerte`.

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

**O terceiro evento PASSOU a ser compartilhado com o Dialog, em 2026-09-16.** Até
essa data o Sheet disparava `dialog_confirm` e o Dialog disparava `dialog_action`
(`{ component: "dialog", action_label, location }`) — dois nomes e dois formatos
para a mesma pergunta, em componentes que compartilhavam os outros dois eventos
de propósito. Por decisão da dona o `dialog_action` foi aposentado: saiu das cinco
`analytics.ts`, as cinco `DialogDocs.*` passaram a mandar `dialog_confirm`, o
`action_label` virou `action` e entrou o `trigger_id` — o mesmo do `dialog_open`
que precedeu a confirmação, que é o que liga as duas pontas da série no GA4.

**E fechar o tipo revelou um QUARTO disparador.** O `component` do
`dialog_confirm` era `string` solto, o único dos três eventos da família sem a
união — e por isso aceitava calado qualquer valor. Ao apertá-lo para
`'dialog' | 'alert-dialog' | 'sheet'`, o build do Angular reprovou em
`DrawerDocs.ts`: **o Drawer confirma por este evento**, embora tenha
`drawer_open` e `drawer_close` próprios e não tenha `drawer_confirm` em stack
nenhuma. A união inclui `'drawer'` porque é o que as cinco fazem hoje; a
assimetria — abrir e fechar por família própria, confirmar pela família do
Dialog — fica registrada aqui, sem conserto por conta própria.

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


