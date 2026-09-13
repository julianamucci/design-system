# PRD — Drawer

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-07.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Gaveta **arrastável**, ancorada a uma borda da tela, com alça de arraste e cantos
arredondados do lado de dentro.

Não é o Sheet com outro nome: tem folha própria, painel próprio, alça própria e
cantos próprios. O que ele **reusa** do Sheet são três peças, e só três: o véu
(`.nds-sheet-overlay`), o título e a descrição. Editar qualquer uma delas alcança
os dois componentes.

| vizinho | diferença que decide |
|---|---|
| Sheet | não arrasta, não tem alça, encosta na borda com quinas retas |
| Dialog | nasce no centro, sem relação com borda |

O que só existe aqui: o **gesto**. Arrastar o painel para fora da tela o dispensa
— e isso é extra de ponteiro, nunca o único caminho.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | O título é obrigatório e vincula `aria-labelledby` automaticamente | `accessibility.items.item1` |
| C2 | A descrição é opcional; quando existe, vincula `aria-describedby` | `accessibility.items.item2` |
| C3 | O foco fica preso: Tab e Shift+Tab circulam dentro do painel | `accessibility.items.item3` |
| C4 | `Escape` fecha quando `dismissible` | `accessibility.items.item4` |
| C5 | O arraste dispensa o painel, e é EXTRA de ponteiro — nunca o único caminho | `accessibility.items.item5` |
| C6 | Painel e véu param de animar sob `prefers-reduced-motion` | `accessibility.items.item6` |
| C7 | O corpo rolável entra na ordem de tabulação e recebe `role="group"` quando nomeado | `accessibility.items.item7` |
| C8 | O rodapé põe o primário à direita no horizontal e em cima no empilhamento — regra em `02-alinhamento-botoes.md` | no SNIPPET, `drawer.source.test.ts` do vue; no DOM renderizado, — (nenhuma stack assere; aberto na `18-overlay.md`) |
| C9 | Painel com `<form>` tem como submeter: botão de submissão dentro, ou `form="<id>"` fora | `6c1ce87c0` — sem portão automático |

## 3. Decisões fixadas

### D1 · O rodapé segue a regra transversal de grupos de botões

**Corrigida em** 2026-09-07 (`b4183e846` na folha, `0a5432549` na marcação).
**Estado**: `column-reverse` empilhado, `row` com `justify-end` a partir de 40rem.
No DOM escreve-se o **secundário primeiro** — `Cancelar`, depois `Salvar`.
**Por que a ordem invertida no DOM**: uma ordem serve os dois eixos. O
`column-reverse` põe o primário em cima quando empilha, e o `row` o põe à direita
quando cabe lado a lado. A marcação fica igual nas cinco stacks e o eixo é decisão
da folha.
**Medição**: era `flex-direction: column` puro — sozinho entre as quatro folhas
com rodapé de par, já que alert-dialog, dialog e sheet faziam `column-reverse`
mais o ponto de quebra. O efeito era o primário **embaixo**, ao contrário da
regra, e o rodapé nunca virava horizontal.

### D2 · O contorno de cluster do vanilla saiu, e ele não era só alinhamento

**Fixada em** 2026-09-07 (`0a5432549`).
**Medição**: o vanilla embrulhava o rodapé num `.nds-cluster[data-justify=end]`
para compensar a folha. O embrulho impunha `gap: 16px` e botões de largura
natural, contra os **8px** e a largura cheia que alert-dialog, dialog e sheet
renderizam — os quatro rodapés da família usam `--spacing-2`.
**Leitura que fica**: era divergência do vanilla, não lacuna da folha. Com a folha
corrigida (D1), o contorno pôde sair.

### D3 · Um teste verde guardava a inversão

**Registrada em** 2026-09-07 (`0a5432549`), e fica aqui porque é a forma mais cara
de errar.
**Medição**: react, vue e svelte estavam com a ordem invertida nas TRÊS
superfícies — story, docs page e snippet. E no **vue** o `drawer.source.ts` trazia
um docblock AFIRMANDO a ordem invertida como intencional, com um caso verde em
`drawer.source.test.ts` cobrando exatamente essa ordem.
**Por que guardar**: o portão passava, o próximo leitor acreditava, e a correção
parecia regressão. No svelte, as superfícies discordavam DENTRO do mesmo arquivo
— a seção de Composições já estava certa enquanto treze outros blocos não.

### D4 · A alça existe só em `bottom`

**Estado**: `.nds-drawer-handle` é `display: none` por padrão e vira `block` só sob
`[data-direction="bottom"]`.
**Geometria**: 100px de largura (`6.25rem`, literal) por `--spacing-1` de altura,
`--radius-full`, fundo `--muted`, centralizada por `margin-inline: auto` com
`margin-top: --spacing-4`.
**Por quê**: a alça é affordance de gesto vertical a partir de baixo. Nas outras
três direções ela sugeriria um arraste que não é o daquele lado.

### D5 · O raio e a borda ficam só do lado virado para DENTRO da tela

**Estado**: `--radius-xl` nos dois cantos internos e borda de 1px `--border` do
mesmo lado. Em `bottom`, os cantos de cima; em `left`, os da direita.
**Contraste**: o Sheet não tem raio nenhum. É o que dá ao drawer a leitura de
"folha de papel que subiu".

### D6 · O corpo é `flex: 1 1 auto`, nunca o atalho — e aqui foi MEDIDO

**Estado**: `flex: 1 1 auto` com `min-height: 0` e `overflow: auto`, com padding
só nas laterais.
**Medição**: o atalho `flex: 1` zera a base, e com base zero o corpo não contribui
nada para a altura automática do painel — o `max-height: 80vh` nunca chega a
apertar ninguém e o conteúdo transborda em vez de rolar. Medido: painel com
`clientHeight` **720** e `scrollHeight` **2157**.
**Por que o `min-height: 0`**: sem ele o item flex tem tamanho mínimo automático
igual ao conteúdo e nunca encolhe, então a barra de rolagem simplesmente não
aparece.
**Histórico**: este corpo não existia. O React resolvia com `style={{ maxHeight }}`
inline — proibido no projeto — e as outras stacks não resolviam, então conteúdo
longo empurrava o rodapé com os botões para fora da tela.

### D7 · O painel tem sombra `xl`, como toda a família modal

**Estado desde 2026-09-10**: `box-shadow: var(--elevation-xl)` em `.nds-drawer-content`.
**Por quê**: a dona fixou nesse dia a regra de elevação por TIPO de superfície, e
o drawer entrou como os outros painéis que interrompem a página. A escada, como
`ELEVACAO_POR_TIPO` a declara hoje:

| degrau | tipo | folhas |
|---|---|---|
| `xs` | relevo de controle, no plano da página | `button`, `input-otp`, `menubar`, `number-field`, `related-card`, `sidebar`, `tabs`, `tags-input`, `toggle`, `toggle-group` |
| `sm` | card, sobre o background | `card`, `slider` |
| `md` | flutuante interativo | `popover`, `dropdown-menu`, `select`, `combobox`, `navigation-menu`, `calendar`, `composer` |
| `lg` | flutuante passivo | `hover-card`, `tooltip` |
| `xl` | modal, drawer e toast | `dialog`, `alert-dialog`, `sheet`, **`drawer`**, `toast` |

**Até 2026-09-12 esta linha listava quatro degraus** — "card `sm` · flutuante
interativo `md` · flutuante passivo `lg` · modal e drawer `xl`" —, e ela já estava
incompleta no próprio 2026-09-10: o toast entrou em `xl` naquele mesmo dia
(`d65c42a67`), por motivo de CAMADA e não de tipo (`--z-toast` é 1080, acima do
`--z-modal` 1050). O degrau `xs` nasceu dois dias depois (`aaa9ea44c`, quando a
medição achou quinze declarações cravando aquela sombra à mão, sem seguir o modo
escuro). Enumerar a categoria inteira dentro do PRD de UM componente é justamente
a forma que envelhece: o que vale para o drawer é a linha do `xl`; a escada de
verdade mora em `ELEVACAO_POR_TIPO`, que é o que o portão
`elevacao_fora_do_mapa` lê.
**A sombra é direcional**: as camadas do token descem em y. No drawer de baixo
quase toda ela cai fora do viewport e o que se vê é a borda de cima; no de cima
ela desce sobre o conteúdo e fica bem mais visível. É o mesmo token nos quatro
lados — a diferença é geometria, não regra.

**Histórico — revertido em 2026-09-10.** Até então o painel não tinha sombra
nenhuma, com o motivo de que ele encosta na borda da tela e quem o separa do
fundo é o véu. Fica o registro porque o argumento não era ruim; ele perdeu para
a consistência da categoria, e quem quiser revisitá-lo precisa revisitar a
regra inteira, não só o drawer.

### D8 · `touch-action: none` é o que faz o gesto existir

**Estado**: declarado no painel.
**Medição**: sem isso o navegador trata o movimento como rolagem da página e nunca
entrega os `pointermove` ao painel. As três stacks que rodam lib de gesto já
recebiam a declaração da própria lib; na folha ela é do design system, e é o que
permite às outras duas rodarem o gesto que implementam em casa.

**Nota de 2026-09-08**: esta linha dizia que o valor era "o da lib, LIDO na folha
que ela injeta". Descrever o próprio contrato como cópia do de uma dependência
convida a tratá-lo como emprestado — foi assim que o atributo de direção passou
anos chamando-se `data-vaul-drawer-direction` na folha que as CINCO leem (ver D13). O valor é `none` porque é o único que entrega `pointermove` ao
painel, e isso é verdade independente de quem mais o declare.
**O que nenhum portão desta casa alcança**: o toque. A suíte dirige um ponteiro de
mouse, onde `touch-action` não tem efeito. A convivência desta declaração com a
rolagem por toque dentro do corpo é herdada da lib e continua sem medição.

### D9 · A transição é suprimida durante o arraste, por dois mecanismos

**Estado**: `.nds-drawer-content:not([data-swiping])` — durante o arraste quem
manda é o transform escrito a cada quadro seguindo o ponteiro, e interpolar por
cima deixaria o painel atrasado em relação ao dedo.
**Medição que corrigiu a nota anterior**: `[data-swiping]` é escrito pelo motor de
ponteiro de CADA stack — vanilla em `ui/drawer-swipe.ts`, angular na diretiva
`NdsDrawerSwipe` (o motor era compartilhado até 2026-09-08; ver a nota em
`docs/shared/primitives/drawer-swipe.ts`). A versão antiga da nota dizia que
a lib escrevia o atributo, e era FALSO — procurado na fonte publicada, ele não
aparece uma única vez; a lib suprime a transição por `style` inline
(`transition: none`), que vence esta folha de qualquer jeito. O seletor era um
gancho que ninguém puxava. Agora duas stacks o puxam, e nas outras três a
supressão continua vindo do inline: mesmo efeito, dois mecanismos.
**Consequência para `prefers-reduced-motion`**: ao soltar, o transform inline é
apagado e a volta ao repouso é ESTA transição — por isso é ela que precisa parar
sob movimento reduzido (§8). O arraste em si não é animação: é o painel
acompanhando o ponteiro, e não há o que reduzir enquanto o dedo está na tela.

**Pendência de comentário, medida em 2026-09-12 e ainda de pé**: o docblock da
transição em `drawer.css` diz "`[data-swiping]` é escrito pelo motor de ponteiro
compartilhado — vanilla e angular". Compartilhado ele não é desde 2026-09-08
(`2dcd473fa`): o que ficou em `docs/shared/primitives/drawer-swipe.ts` são os
limiares e as funções que DECIDEM, e a fiação é de cada stack — `ui/drawer-swipe.ts`
no vanilla, a diretiva `NdsDrawerSwipe` em `ui/drawer.ts` no angular. A palavra
sobreviveu à mudança na folha que as CINCO leem, e é defeito de código: não se
corrige aqui.

### D10 · O cabeçalho centraliza em `bottom` e `top`, e vai à esquerda a partir de **48rem**

**Estado**: gap `--spacing-0-5`, padding `--spacing-4`, centralizado nas duas
direções verticais.
**Atenção ao número**: 48rem aqui; o Sheet e o Dialog usam **40rem**. Dois pontos
de corte na mesma família — não copie um no outro.

### D11 · A largura é custom property, com o default em `:root`

**Estado**: `--drawer-width: 75%` e `--drawer-max-width: 24rem`, declarados em
`:root`; nas direções `left` e `right` o teto só se aplica **a partir de 40rem**.
**Por quê**: mesma medição do Sheet — declarado no seletor da peça, o valor apaga
o override de quem consome, porque as regras de direção são (0,2,0) e qualquer
utilitária é (0,1,0).
**Diferença do Sheet**: abaixo de 40rem o painel aqui é 75% de verdade, sem teto.

### D12 · O foco entra no cancelar só onde a confirmação é o assunto

**Fixada em** 2026-09-07, decisão da dona.
**Estado**: `WithConfirmation` sim; `WithForm` não — para não cobrar um Tab a mais
de quem só quer editar.
**Nota de implementação**: cada stack escolhe o alvo pela API da sua lib, e o
**angular consulta `[ndsDrawerClose]`, não `data-slot`**, porque host binding de
diretiva disputa o atributo. As cinco `play` de confirmação afirmam qual elemento
tem o foco **e qual não tem**.

### D13 · O atributo de direção é `data-direction`, e não o nome de uma lib

**Trocada em** 2026-09-08 (`b5724a109` na folha, mais um commit por stack).
**Estado**: os dezessete seletores da folha leem `[data-direction]`, e as cinco
stacks emitem esse atributo.
**Histórico**: até então a folha compartilhada — lida pelas CINCO — se ancorava em
`data-vaul-drawer-direction`, o nome que a lib de gaveta escreve. As duas stacks
sem lib tinham de imitar o atributo de uma dependência que elas não usam, e a
folha do design system só funcionava enquanto aquele nome existisse upstream.
**Regra que fica**: o contrato de marcação é do design system. Nome de
dependência entra em `PATCHES.md` quando é divergência intencional, não no
seletor que as cinco leem.

### D14 · O `<form>` do painel precisa de quem o submeta

**Corrigida em** 2026-09-08 (`6c1ce87c0`), nas cinco.
**Medição**: o `<form>` estava lá e não havia botão de submissão nenhum nem
`form="<id>"`. Com dois campos o navegador **não faz submissão implícita**, então
o Enter num campo não disparava nada — mesmo defeito de teclado que um
`type="submit"` fora do form produz, só que em silêncio em vez de mentindo.
**Por que nenhum portão pega**: o markup é válido. Foram doze superfícies em
cinco stacks — story, snippet do painel Code e docs page —, e o Angular era o
caso extremo: a story `WithForm` não tinha `<form>` sequer.

## 4. Anatomia

```
sheet-overlay                 véu — reusado do Sheet, não declarado aqui
drawer-content [data-direction]
├── drawer-handle             só em bottom (D4)
├── drawer-header             gap 2px, padding 16px; centralizado em bottom/top (D10)
│   ├── drawer-title             obrigatório — regra do Sheet
│   └── drawer-description       opcional — regra do Sheet
├── drawer-body               cresce e rola; padding só lateral (D6)
└── drawer-footer             gruda no fundo; primário à direita ou em cima (D1)
```

**O corpo é a única parte com padding só nas laterais**: o respiro de cima e de
baixo vem do cabeçalho e do rodapé, que têm padding completo.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/drawer.css`.

| propriedade | valor | token |
|---|---|---|
| superfície | — | `--background` — três dos quatro painéis modais leem isto; ver `dialog.md` D1 |
| texto | — | `--foreground` |
| tamanho de texto do painel | 14px | `--text-control` |
| borda (só do lado de dentro) | 1px | `--border` |
| raio (só nos cantos de dentro) | — | `--radius-xl` — ver D5 |
| largura em left/right | 75%, teto de 384px a partir de 40rem | `--drawer-width` / `--drawer-max-width` — ver D11 |
| teto em bottom/top | 80vh, com margem oposta | `--spacing-24` |
| alça | 100px × 4px, pílula | **literal** e `--spacing-1`, `--radius-full`, fundo `--muted` |
| margem superior da alça | 16px | `--spacing-4` |
| gap do cabeçalho | 2px | `--spacing-0-5` |
| padding do cabeçalho e do rodapé | 16px | `--spacing-4` |
| padding lateral do corpo | 16px | `--spacing-4` |
| gap do rodapé | 8px | `--spacing-2` |
| sombra | — | `--elevation-xl` — modal; ver D7 |
| entrada, saída e volta ao repouso | — | `--duration-base`, com `ease-in-out` literal |
| camada | — | `--z-modal` |

**Conferida linha a linha em 2026-09-12, depois da tokenização de elevação**
(`aaa9ea44c`, `7975f6b53`): as dezesseis linhas fecham com a folha. A sombra
ganhou linha própria nessa conferência — **até então ela vivia só numa nota solta
abaixo da tabela** ("Sombra `--elevation-xl` (D7, revertida em 2026-09-10)"), que
era a única propriedade pintada da folha fora da tabela e ainda lia como se o
`xl` fosse o que tinha sido revertido; o que foi revertido é a decisão ANTERIOR,
de não ter sombra. O instrumento
`node scripts/tabela-tokens.mjs drawer` confirma: nenhuma linha das tabelas das
cinco stacks deixa de fechar com a folha, e os dois tokens que a folha lê sem
aparecer nas tabelas das docs pages são justamente `--elevation-xl` e
`--radius-full` — o segundo já estava aqui, na linha da alça.

**O degrau `xs` que nasceu naquela rodada não toca este painel**: nenhuma das
onze folhas que o consomem é de superfície modal (ver D7).

**O título e a descrição não estão nesta tabela de propósito**: eles são regra do
`sheet.css` (`.nds-sheet-title` e `.nds-sheet-description`), reusada aqui. Os
valores estão na tabela do [PRD do Sheet](sheet.md), e mexer neles alcança os dois
componentes.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, rolagem travada |
| Swiping | ponteiro arrastando | transição suprimida; o transform segue o dedo (D9) |
| Settling | ao soltar | a transição devolve o painel ao repouso — é ela que para sob movimento reduzido |
| Transitioning | entrada e saída | deslizamento a partir da borda da direção |

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `direction` | `bottom \| top \| left \| right` | `bottom` |
| `modal` | boolean | `true` |
| `dismissible` | boolean | `true` — Escape, clique no véu e arraste |
| `onClose` | `(reason: DrawerCloseReason) => void` | — · **só o vanilla** |

**O `onClose(reason)` da fábrica é quem alimenta o `reason` do `drawer_close` no
vanilla**, e faltava nesta tabela. As quatro palavras são as mesmas do §9
(`escape` · `overlay` · `close-button` · `api`), e é a fábrica que sabe qual
caminho fechou: o Escape, o clique no véu, o botão de saída e o `close()` de
código chegam ali já nomeados, sem a dedução que as outras quatro stacks têm de
fazer a partir do evento da lib. Nas outras quatro o motivo sai do
`<slug>-close-reason` ao lado do primitivo (§9). **Até 2026-09-12 esta tabela não
tinha a linha**, e a docs page do vanilla já publicava a prop na tabela de API.

**A fábrica do vanilla também tem API imperativa, e ela é o que tornou o gatilho
dispensável**: o que `createDrawer` devolve é o wrapper com `open()`, `close()`,
`toggle()` e `isOpen()` — mais o descarte de `tornarDestruivel`. `close()` e o
`toggle()` que fecha informam `api`; o descarte chama `onOpenChange(false)` e
**não** chama `onClose`, porque desmontar não é a pessoa fechando (mesma decisão
do AlertDialog, `alert-dialog.md` §9). Os verbos são os do Sidebar, em inglês.

**O que mudou em 2026-09-12 foi o `trigger`, não os verbos.** `open()` e
`isOpen()` já existiam nesta fábrica; a rodada do gatilho escondido
(`7f24ea325`) tornou `trigger` opcional e apagou o espelho `stateExterno`, com a
guarda de reentrância passando a morar no próprio `open()`. É a distinção que
separa esta fábrica do Sheet e do Dialog, que naquela semana ganharam `open()` e
`isOpen()` de fato (`efdf144cd`).

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla, angular | motor de ponteiro PRÓPRIO, que escreve `[data-swiping]` (D9); do compartilhado vêm só os limiares e as funções que decidem |
| svelte | `shouldScaleBackground` e `activeSnapPoint` chegaram a ser expostos contra o que o comentário compartilhado afirma, e foram recolhidos em `3807596f8` |
| angular | consulta `[ndsDrawerClose]` para o foco inicial, porque host binding disputa `data-slot` (D12) |
| vanilla | `trigger` é OPCIONAL desde 2026-09-12 — a gaveta comandada de fora se abre por `open()`, sem gatilho nenhum |

**Por que `trigger` pôde ficar opcional aqui, e a medição que decidiu**: a
fábrica o usava em DOIS lugares — anexar ao wrapper e ouvir o clique. Não escreve
`aria-haspopup`, `aria-expanded` nem `aria-controls`, e não o usa como âncora,
porque a gaveta encosta na borda da tela. Sem gatilho, quem anuncia o papel é
quem montou o botão externo.

**No DropdownMenu a mesma pergunta tem resposta oposta, e vale escrever**: lá o
gatilho tem SETE usos, e um deles é ser a âncora do posicionamento — menu
suspenso não tem onde ficar sem ela. Contar os usos antes de afrouxar o tipo é o
que separa as duas respostas; simetria de API teria dado a mesma para os dois.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Drawer`, `DrawerBody`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger` |
| vue | `Drawer`, `DrawerBody`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerTitle`, `DrawerTrigger` |
| svelte | `Drawer`, `DrawerBody`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger` |
| vanilla | `createDrawer` |
| angular | `[ndsDrawerSwipe]`, `button[ndsDrawerClose]`, `button[ndsDrawerTrigger]`, `div[ndsDrawerBody]`, `div[ndsDrawerFooter]`, `div[ndsDrawerHeader]`, `h1[ndsDrawerTitle]` … `h6[ndsDrawerTitle]` (os seis), `nds-drawer`, `ng-template[ndsDrawerContent]`, `p[ndsDrawerDescription]` |

O índice do svelte também reexporta as formas curtas — `Body`, `Close`, `Content`, `Description`, `Footer`, `Header`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável nas cinco, cada uma de um
jeito** — medido na fonte de cada lib, não na documentação delas:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `asChild` no `DrawerTitle` — o filho escrito por quem compõe recebe id, classe e slot por fusão de props | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | snippet `child` + prop `level` | `div` com `aria-level="2"` |
| angular | seletor por elemento, nos SEIS níveis | o que quem escreve usar |
| vanilla | opção `titleLevel` da fábrica | `2` |

**Até 2026-09-12 a linha do react dizia `prop render (BaseUIComponentProps<'h2'>)`**,
que é o mecanismo do **AlertDialog** — daquela stack, e da base-ui. O Drawer do
react não roda base-ui: roda `vaul`, cujo `Title` é o `Title` do dialog do radix,
e a delegação de elemento dali chama-se `asChild`. A story `HeadingH3` daquela
stack escreve exatamente isso (`<DrawerTitle asChild><h3>…</h3></DrawerTitle>`),
então a linha errada convivia com a prova ao lado — a mesma forma de apodrecer da
D9 e do §8 deste arquivo: texto copiado do PRD vizinho porque a estrutura das duas
seções é igual.

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

**Atributos**: título obrigatório ligando `aria-labelledby`; descrição opcional
ligando `aria-describedby`.

**Teclado**: Tab e Shift+Tab circulam dentro do painel; Escape fecha quando
`dismissible`.

**O corpo rolável** entra na ordem de tabulação (WCAG 2.1.1) e recebe
`role="group"` quando você lhe dá um nome — o mesmo trio do Sheet e do Dialog.

**O que NÃO se faz, de propósito:**

- o arraste nunca é o único caminho para dispensar (C5) — em teclado e em leitor
  de tela ele não existe;
- animação própria acrescentada por quem consome precisa parar sob
  `prefers-reduced-motion`: o painel e o véu já param, o extra não.

**Movimento reduzido** — o C6 afirma que painel e véu param, e é verdade. Aqui
DUAS camadas seguram, como no `alert-dialog.md` §8:

- **a de token**: a folha declara duração só por `var(--duration-base)`, e
  `docs/shared/tokens/motion.css` zera a escada inteira sob a preferência;
- **a da própria folha**: o bloco `@media (prefers-reduced-motion: reduce)` no
  FIM de `drawer.css` zera `animation` e `transition` de `.nds-drawer-content` e
  de `.nds-drawer-content:not([data-swiping])`. Ele vem depois das regras de
  transição, com os mesmos seletores, e por isso vence.

O véu é do Sheet e a folha de lá o desliga — é a única metade do C6 que não mora
neste arquivo.

**Até 2026-09-12 este parágrafo creditava só a camada de token**, e mandava ler o
mecanismo em `hover-card.md` §8 — que descreve guardas INERTES. A guarda desta
folha não é inerte, e o comentário dela até diz o que ela faz com o gesto: a volta
ao repouso passa a ser instantânea, o acompanhamento do ponteiro continua (não é
animação, é a posição do dedo), e a resistência elástica para além do aberto é
desligada pelo motor de ponteiro, não pelo CSS. Descrever a folha do vizinho é o
defeito que a D8 deste mesmo arquivo já tinha registrado uma vez.

## 9. Analytics

| evento | quando | payload | quem dispara |
|---|---|---|---|
| `drawer_open` | o painel abre | `{ component: "drawer", trigger_id, location }` | as cinco |
| `drawer_close` | o painel fecha | idem, mais `reason` | as cinco |
| `dialog_confirm` | a ação primária do rodapé da composição é acionada | `{ component: "drawer", action: "confirm", trigger_id, location }` | **só o angular** |

**O `dialog_confirm` é de UMA stack, e o estado é divergência, não decisão.**
Medido em 2026-09-12: a única chamada da árvore está em
`nortear-design-system-angular/src/components/docs/DrawerDocs.ts`, no
`aoConfirmar(qual, secao)` que o rodapé das Composições chama — e ali o
`location` vem do TEMPLATE, para que clique nascido nas Composições não se
registre como `docs_demo`. Nas outras quatro o botão primário existe nas mesmas
composições e não rastreia nada: o `confirm` só aparece como rótulo traduzido.

O conteúdo compartilhado está do lado das quatro — `analytics.description`
publica dois eventos, `drawer_open` e `drawer_close` —, então o angular dispara
um terceiro que a própria página dele não lista na tabela. A pendência é de
código ou de conteúdo, não deste arquivo, e vai relatada: ou as outras quatro
passam a disparar e o conteúdo ganha a terceira linha, ou o angular para. A
palavra `dialog_confirm` já é tipada em `AnalyticsEvents` pela família do Dialog,
então nenhum portão de tipo reprova a assimetria.

**Até 2026-09-12 esta tabela tinha duas linhas e nenhuma coluna de quem
dispara**, e a última frase da seção — "o evento era disparado só pelo Angular.
Hoje as cinco disparam" — se lia como se valesse para todos. Ela vale para
`drawer_open` e `drawer_close`; o `dialog_confirm` continua sozinho.

**`trigger_id` carrega a DIREÇÃO** — `bottom`, `right`, `left` ou `top` —, nunca
o título traduzido, que partiria a mesma série em um valor por idioma no GA4. O
campo era `label` até 2026-09-10, quando a dona unificou o campo de quem abriu em
`trigger_id` na categoria inteira (`18-overlay.md` §Analytics); os valores não
mudaram, e o tipo proíbe o campo antigo (`label?: never`).

**`reason` é obrigatório no fechamento**, e tem vocabulário fechado no tipo:
`escape`, `overlay`, `close-button` ou `api`. É o vocabulário do design
system, não o da lib — motivo inventado contamina a série, e motivo ausente
esconde a diferença entre desistir e concluir.

**E quem deduz o motivo fica AO LADO DO PRIMITIVO**, exportado pelo mesmo índice
das peças — a docs page só repassa a palavra (`18-overlay.md` §Analytics, portão
`motivo_sintetizado_na_docs_page`). O vanilla e o Angular já faziam assim; as
outras três mudaram de casa em 2026-09-12 — `react/ui/drawer-close-reason.ts`,
`vue/ui/drawer/drawer.close-reason.ts` e `svelte/ui/drawer/close-reason.ts` —, e
enquanto a dedução morava na página ela não tinha teste nenhum.

O par `onDrag`/`onRelease` sai JUNTO do mesmo observador, nas três: é o
pareamento que mantém o motivo certo, e separá-los é o defeito.

**O default do Drawer é `close-button`, e ele é diferente do da família do
Dialog de propósito**: aqui o que sobra depois de Escape, véu e arraste é o botão
de saída do rodapé, que a lib não anuncia por evento próprio. Na família do
Dialog o botão TEM anúncio, e o que sobra é o fechamento por código, que é `api`.
Trocar um pelo outro faz "confirmou e fechou" chegar ao relatório como "apertou o
botão de fechar".

**O arraste que dispensa é anotado no ARRASTE, não na soltura** — a lib fecha
antes de anunciar a soltura (`closeDrawer(); onRelease(event, false)`), então
anotar ali chegaria depois do evento. Arraste curto, que volta ao repouso, é
anunciado com `open = true` e limpa a anotação; sem isso o próximo fechamento por
botão herdaria um motivo que não é dele.

**As duas pendências registradas em 2026-09-07 fecharam em 2026-09-08**: a prosa
pedia o título traduzido (`2f64c9b2d`), e o PAR `drawer_open`/`drawer_close` era
disparado só pelo Angular. Hoje as cinco disparam esses dois — o `dialog_confirm`
é o que continua sozinho, e está na tabela acima.

**Até 2026-09-12 esta linha dizia "o evento era disparado só pelo Angular. Hoje
as cinco disparam"**, sem nomear qual evento. Escrita quando a tabela tinha duas
linhas, ela passou a ler como quitação geral no dia em que apareceu um terceiro
evento que só o Angular manda. Pendência fechada se nomeia pelo que fechou.

## 10. Reconstruir do zero

Ordem: folha → primitivo → alça → cabeçalho, corpo e rodapé → motor de ponteiro
→ stories → docs page.

- **O rodapé escreve o secundário primeiro** (D1). Inverter a marcação para
  "corrigir" o visual quebra o outro eixo.
- **O corpo é `flex: 1 1 auto` com `min-height: 0`** (D6) — o atalho deixa o
  conteúdo transbordar em vez de rolar, e o rodapé sai da tela.
- **`touch-action: none` no painel** (D8), senão o gesto não existe — e nenhum
  portão daqui mede isso.
- **A alça só em `bottom`** (D4), e os cantos só do lado de dentro (D5).
- **O ponto de corte do cabeçalho é 48rem**, não 40 (D10).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, direções, alça, gesto, rodapé | `docs/shared/styles/nds/drawer.css` |
| véu, título e descrição (reusados) | `docs/shared/styles/nds/sheet.css` |
| regra do par de botões | `docs/shared/guidelines/02-alinhamento-botoes.md` — **o texto canônico**; a seção homônima da `04-padroes-design-sistema.md` só aponta para lá |
| regra do gesto (constantes e as três decisões) | `docs/shared/primitives/drawer-swipe.ts` |
| fiação do gesto, por stack | `ui/drawer-swipe.ts` no vanilla · diretiva `NdsDrawerSwipe` no angular · a lib nas outras três |
| texto, props, critérios de teste | `docs/shared/content/drawer/translations.json` |
| desenho e anotações | Figma, página `Drawer` (conjunto `698:116`) |
| portões determinísticos | `node scripts/audit.mjs drawer --json` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 54 chaves `nav` saíram do conteúdo em 2026-09-12.** As páginas do vue e
do svelte liam o conteúdo, então este slug mostrava "When to Use" onde as outras
três mostravam "Usage", e "Tests" onde as outras mostravam "Pruebas" — deriva de
escrita, invisível para quem lê uma stack só.

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


