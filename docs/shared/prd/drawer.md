# PRD — Drawer

> **Estado descrito**: 2026-09-15. **Revisão serial fechada em** 2026-09-07.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.

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

Cada linha é verificável. A coluna do portão diz quem reprova se ela deixar de
valer — e `—` é dívida declarada, não ausência de risco.

| # | o contrato | portão |
|---|---|---|
| C1 | O título é obrigatório e vincula `aria-labelledby` automaticamente | `Playground` passo 1 (`toHaveAccessibleName`) e `HeadingH3`, nas cinco |
| C2 | A descrição é opcional; quando existe, vincula `aria-describedby` | `Playground` passo 1 (`toHaveAccessibleDescription`), nas cinco |
| C3 | O foco fica preso: Tab e Shift+Tab circulam dentro do painel | `Playground` (seis Tabs e o foco continua dentro), nas cinco |
| C4 | `Escape` fecha; com a dispensa desligada, não fecha | o caminho positivo: `Playground` passo 4, nas cinco. O negativo: `NotDismissible` em quatro — **o angular fecha com Escape** e a story dele não tem o passo (§7, inconsistência 1) |
| C5 | O arraste dispensa o painel, e é EXTRA de ponteiro — nunca o único caminho | `DragToDismiss`, nas cinco (arraste curto, arraste longo, Escape no mesmo painel, alça sem foco) |
| C6 | Painel e véu param de animar sob `prefers-reduced-motion` | `movimento_sem_guarda_eficaz`, que lê a folha; nenhuma story liga a preferência |
| C7 | O corpo rolável entra na ordem de tabulação e recebe `role="group"` quando nomeado | `WithScroll`, nas cinco |
| C8 | O rodapé põe o primário à direita no horizontal e em cima no empilhamento — regra em `02-alinhamento-botoes.md` | no SNIPPET, `drawer.source.test.ts` do vue e do angular; no DOM renderizado, — (pendência abaixo) |
| C9 | Painel com `<form>` tem como submeter: botão de submissão dentro, ou `form="<id>"` fora | `WithForm` lendo `button.form`, nas cinco |

**FECHADA · 2026-09-20.** As cinco `WithForm` afirmam a ordem RENDERIZADA do
rodapé — `toEqual(['Cancelar', 'Confirmar'])` sobre o DOM — mais a outra metade:
o `flex-direction` computado de `.nds-drawer-footer` conferido contra o ponto de
corte de 40rem, e a posição do primário (à direita em `row`, em cima em
`column-reverse`). Dentes provados nas cinco invertendo os dois botões.

O que a pendência media era uma lacuna de MÉTODO, não de ordem: as cinco já
renderizavam certo, e as cinco afirmavam com `toContain`, que passa com qualquer
ordem. A do angular chegava a se chamar "nessa ordem de leitura" sem afirmar
ordem nenhuma — nome de passo prometendo o que a asserção não cobra.

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
o drawer entrou como os outros painéis que interrompem a página. O que vale para o
drawer é a linha `xl`; a escada inteira mora em `ELEVACAO_POR_TIPO`
(`scripts/audit.mjs`), que é o que o portão `elevacao_fora_do_mapa` lê. Cópia
conferida contra o mapa em 2026-09-15:

| degrau | tipo | folhas |
|---|---|---|
| `xs` | relevo de controle, no plano da página | `button`, `input-otp`, `menubar`, `number-field`, `related-card`, `sidebar`, `tabs`, `tags-input`, `toggle`, `toggle-group` |
| `sm` | card, sobre o background | `card`, `slider` |
| `md` | flutuante interativo | `popover`, `dropdown-menu`, `select`, `combobox`, `navigation-menu`, `calendar`, `composer` |
| `lg` | flutuante passivo | `hover-card`, `tooltip` |
| `xl` | modal, drawer e toast | `dialog`, `alert-dialog`, `sheet`, **`drawer`**, `sonner` |

O toast está em `xl` por motivo de CAMADA, não de tipo (`--z-toast` é 1080, acima
do `--z-modal` 1050), e a folha dele chama-se `sonner` desde 2026-09-13.

**A sombra é direcional**: as camadas do token descem em y. No drawer de baixo
quase toda ela cai fora do viewport e o que se vê é a borda de cima; no de cima
ela desce sobre o conteúdo e fica bem mais visível. É o mesmo token nos quatro
lados — a diferença é geometria, não regra.

**Revertido em 2026-09-10.** Até então o painel não tinha sombra nenhuma, com o
motivo de que ele encosta na borda da tela e quem o separa do fundo é o véu. O
argumento perdeu para a consistência da categoria; quem quiser revisitá-lo precisa
revisitar a regra inteira, não só o drawer.

### D8 · `touch-action: none` é o que faz o gesto existir

**Estado**: declarado no painel.
**Medição**: sem isso o navegador trata o movimento como rolagem da página e nunca
entrega os `pointermove` ao painel. As três stacks que rodam `vaul` recebem a
mesma declaração da folha que a lib injeta; na folha compartilhada ela é do design
system, e é o que permite às outras duas rodarem o gesto que implementam em casa.
O valor é `none` porque é o único que entrega `pointermove` ao painel — é
contrato próprio, não cópia do de uma dependência (ver D13).
**O que nenhum portão desta casa alcança**: o toque. A suíte dirige um ponteiro de
mouse, onde `touch-action` não tem efeito. A convivência desta declaração com a
rolagem por toque dentro do corpo continua sem medição.

### D9 · A transição é suprimida durante o arraste, por dois mecanismos

**Estado**: `.nds-drawer-content:not([data-swiping])` — durante o arraste quem
manda é o transform escrito a cada quadro seguindo o ponteiro, e interpolar por
cima deixaria o painel atrasado em relação ao dedo.
**Quem escreve `[data-swiping]`**: a fiação de ponteiro de duas stacks — vanilla em
`ui/drawer-swipe.ts`, angular na diretiva `NdsDrawerSwipe` de `ui/drawer.ts`. Do
compartilhado `docs/shared/primitives/drawer-swipe.ts` vêm só os limiares e as
funções que DECIDEM (separado em 2026-09-08, `2dcd473fa`). A `vaul` não escreve o
atributo — procurado na fonte publicada, ele não aparece; a lib suprime a
transição por `style` inline (`transition: 'none'`), que vence a folha de qualquer
jeito. Mesmo efeito, dois mecanismos.
**Consequência para `prefers-reduced-motion`**: ao soltar, o transform inline é
apagado e a volta ao repouso é ESTA transição — por isso é ela que precisa parar
sob movimento reduzido (§8). O arraste em si não é animação: é o painel
acompanhando o ponteiro, e não há o que reduzir enquanto o dedo está na tela.

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
**Nota de implementação**: cada stack escolhe o alvo pela API da sua lib (§7,
inconsistência 16), e o **angular consulta `[ndsDrawerClose]`, não `data-slot`**,
porque host binding de diretiva disputa o atributo. As cinco `WithConfirmation`
afirmam qual elemento tem o foco; quatro afirmam também qual NÃO tem — o vanilla
não (`drawer-compositions.stories.ts:202-205`, §7 inconsistência 15).

### D13 · O atributo de direção é `data-direction`, e não o nome de uma lib

**Trocada em** 2026-09-08 (`b5724a109` na folha, mais um commit por stack).
**Estado**: os dezessete seletores da folha leem `[data-direction]`, e as cinco
stacks emitem esse atributo no painel.
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
**Por que o markup sozinho não denuncia**: é válido. Foram doze superfícies em
cinco stacks — story, snippet do painel Code e docs page. O portão hoje é a
`WithForm` das cinco lendo `button.form` (C9).

### D15 · A entrada do painel ANIMA nas cinco — e duas delas só pareciam animar

**Fixada em** 2026-09-20, por decisão da dona, sobre medição em navegador.

**O que havia**: três stacks animavam pela folha que a `vaul` injeta, e a §6 já
listava `Transitioning`. Mas a §7 #4 dizia "o vanilla não anima; o angular anima
pelas regras da folha", e **metade disso era falso**:

| stack | antes | mecanismo |
|---|---|---|
| react, vue, svelte | anima (painel 900→737) | folha que a `vaul` injeta |
| vanilla | **painel não anima**; só o véu | a fábrica não escrevia marcador nenhum |
| angular | **INERTE** | ver abaixo |

**A entrada do angular era a mais instrutiva.** O `data-starting-style` ESTAVA no
DOM nos dois primeiros quadros — e o `transform` computado **já era identidade**.
Havia atributo e não havia estado de partida de onde interpolar: o painel nascia
em repouso e fazia uma oscilação de 2px (bottom) / 5px (left) antes de assentar.
Medido quadro a quadro, com o painel de 163,5px:

    antes    0:0px* 1:0px* 2:0px 3:0px … 23:0px        (* = marcador presente)
    depois   0:164px* 1:164px* … 6:161 7:154 … 17:0px

A causa é de ordem, não de CSS: o marcador do `@radix-ng` chega por **host
binding**, ou seja numa passada de atualização, e o `requestAnimationFrame` que o
remove pode chegar antes de o navegador ter computado qualquer estilo com ele. O
conserto põe o marcador como **atributo ESTÁTICO de host** — escrito na criação
do elemento, antes da inserção e do paint. Aplicado ao painel E ao véu, que tem a
mesma regra no `sheet.css` e teria o mesmo defeito.

**E a folha já tinha tudo.** No vanilla não foi preciso CSS novo: as quatro
regras `[data-starting-style]`/`[data-ending-style]` de `drawer.css` existiam e
**ninguém as puxava**. Declaração inerte à espera de leitor, a terceira desta
família medida em uma semana.

**O que vale**: a entrada anima nas cinco, e **o movimento é asserção**. Não
basta afirmar que o painel apareceu — foi exatamente isso que deixou o angular
passar meses com uma entrada que parecia existir. A forma que as cinco usam:
achar o painel por SELETOR (não pelo helper de portal, ver abaixo), afirmar
`getAnimations().length > 0` no instante da abertura, amostrar a posição em laço
de RELÓGIO e cobrar deslocamento significativo mais repouso no mínimo da série.

**Esperar o portal NÃO serve para medir geometria**: o helper gateia em opacidade
> 0.9, e opacidade e transform correm na mesma curva — a 0,9 o painel ainda está
a **38px** da borda (medido). Asserção de posição feita ali lê o caminho, não o
destino. As cinco ganharam `waitForAnimationsDone`, que espera
`getAnimations().finished` e é leitura pura.

**A SAÍDA fica fora desta decisão**, e o vanilla continua sem leitor de
`[data-ending-style]`: adiar a remoção do painel até o `transitionend` mexe com o
helper de portal fechado, com o `ListenerCleanup` e com o `destroy()`. Tarefa
própria, registrada aqui para não virar linha de mensagem de commit.

### D16 · Um fechamento emite UM `drawer_close`

**Fixada em** 2026-09-20, por decisão da dona, sobre medição.

**Por que precisou existir**: o svelte emitia **DOIS** `onOpenChange(false)` por
dispensa de arraste — o primeiro com `reason: 'overlay'`, o segundo caindo no
default **`close-button`**. No GA4 isso é uma dispensa contada duas vezes, com o
motivo errado na segunda, envenenando a série de `reason` com um botão que
ninguém apertou.

**A causa estava na fonte da lib**, e explica por que só o arraste duplicava —
`vaul-svelte`, `closeDrawer(fromWithin)`:

    if (!fromWithin) {
        handleOpenChange(false);   // anúncio 1
        opts.open.current = false; // o setter do box anuncia de novo → 2
    }

Escape, véu e botão do rodapé chegam por `closeDrawer(true)` e pulam o primeiro
anúncio. O segundo encontra a anotação já consumida e cai no default. Consertado
com guarda de transição no WRAPPER — não na lib, não em patch.

**O que vale**: um fechamento, um evento, com o motivo daquele caminho. E a
asserção **CONTA as chamadas**: afirmar que o evento saiu é precisamente o que
passava com o defeito de pé. As cinco afirmam contagem e motivo nos caminhos de
arraste e de Escape — a agente do svelte estendeu ao Escape por conta própria,
"para o contrato valer nos dois caminhos e não só onde o defeito apareceu".

## 4. Anatomia

```
sheet-overlay                 véu — reusado do Sheet, não declarado aqui
drawer-content [data-direction]
├── drawer-handle             só em bottom (D4); sem data-slot, aria-hidden, sem foco
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

**Conferida em 2026-09-15** com `node scripts/tabela-tokens.mjs drawer`: as 40
linhas das cinco tabelas de docs page (8 por stack) fecham com a folha, sem
divergência entre stacks. Os dois tokens que a folha lê e nenhuma tabela lista são
`--elevation-xl` e `--radius-full` — os dois já estão aqui.

**O degrau `xs` não toca este painel**: nenhuma das dez folhas que o consomem é de
superfície modal (ver D7).

**O título e a descrição não estão nesta tabela de propósito**: eles são regra do
`sheet.css` (`.nds-sheet-title` e `.nds-sheet-description`), reusada aqui. Os
valores estão na tabela do [PRD do Sheet](sheet.md), e mexer neles alcança os dois
componentes.

**As regras de entrada e saída (`[data-starting-style]`/`[data-ending-style]`,
`drawer.css:326-349`) só são lidas no angular** — ver §7, inconsistência 4.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, rolagem travada |
| Swiping | ponteiro arrastando | transição suprimida; o transform segue o dedo (D9) |
| Settling | ao soltar | a transição devolve o painel ao repouso — é ela que para sob movimento reduzido |
| Transitioning | entrada e saída | deslizamento a partir da borda da direção — em quatro stacks; o vanilla monta e desmonta no mesmo quadro (§7, inconsistência 4) |

## 7. API

| prop | tipo | padrão | onde existe |
|---|---|---|---|
| `open` | boolean | — | react, vue, svelte (`bind:open`), angular (`model`); o vanilla expõe verbos |
| `defaultOpen` | boolean | `false` | react, vue, angular — **não** existe no svelte nem no vanilla (inconsistência 7) |
| `onOpenChange` | `(open: boolean) => void` | — | nas cinco (`update:open` no vue, `openChange`/`onOpenChange` no angular) |
| `direction` | `bottom \| top \| left \| right` | `bottom` | nas cinco |
| `modal` | boolean | `true` | nas cinco |
| `dismissible` | boolean | `true` — Escape, clique no véu e arraste | react, vue, svelte, vanilla; no angular é o inverso, `disablePointerDismissal`, e **não alcança o Escape** (inconsistência 1) |
| `onClose` | `(reason: DrawerCloseReason) => void` | — | **só o vanilla** |

**O `onClose(reason)` da fábrica é quem alimenta o `reason` do `drawer_close` no
vanilla.** As quatro palavras são as mesmas do §9 (`escape` · `overlay` ·
`close-button` · `api`), e é a fábrica que sabe qual caminho fechou: o Escape, o
clique no véu, o botão de saída, o arraste (`overlay`) e o `close()` de código
chegam ali já nomeados. Nas outras quatro o motivo sai do helper de motivo ao lado
do primitivo (§9).

**A fábrica do vanilla também tem API imperativa**: o que `createDrawer` devolve é
o wrapper com `open()`, `close()`, `toggle()` e `isOpen()` — mais o descarte de
`tornarDestruivel`. `close()` e o `toggle()` que fecha informam `api`; o descarte
chama `onOpenChange(false)` e **não** chama `onClose`, porque desmontar não é a
pessoa fechando (mesma decisão do AlertDialog, `alert-dialog.md` §9). Os verbos
são os do Sidebar, em inglês. `trigger` é opcional desde 2026-09-12 (`7f24ea325`),
com a guarda de reentrância morando no próprio `open()`.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla, angular | motor de ponteiro PRÓPRIO, que escreve `[data-swiping]` (D9); do compartilhado vêm só os limiares e as funções que decidem |
| svelte | `shouldScaleBackground` e `activeSnapPoint` não são declarados no wrapper (recolhidos em `3807596f8`); chegam à lib por `restProps` com o padrão dela |
| angular | `dismissible` é `disablePointerDismissal`; `panelClass` no `ng-template[ndsDrawerContent]`, porque o painel nasce no portal e não há elemento onde escrever classe; consulta `[ndsDrawerClose]` para o foco inicial (D12) |
| vue | o alvo do foco inicial é prop do `DrawerContent` (`initial-focus="panel" \| "close"`), porque a `vaul-vue` cancela o foco automático e não repassa o evento |
| vanilla | `trigger` é OPCIONAL — a gaveta comandada de fora se abre por `open()`, sem gatilho nenhum |

**Por que `trigger` pôde ficar opcional aqui, e a medição que decidiu**: a
fábrica o usava em DOIS lugares — anexar ao wrapper e ouvir o clique. Não escreve
`aria-haspopup`, `aria-expanded` nem `aria-controls` (as quatro libs escrevem —
inconsistência 5), e não o usa como âncora, porque a gaveta encosta na borda da
tela. Sem gatilho, quem anuncia o papel é quem montou o botão externo.

**No DropdownMenu a mesma pergunta tem resposta oposta, e vale escrever**: lá o
gatilho tem SETE usos, e um deles é ser a âncora do posicionamento — menu
suspenso não tem onde ficar sem ela. Contar os usos antes de afrouxar o tipo é o
que separa as duas respostas; simetria de API teria dado a mesma para os dois.

### Peças, por stack

Extraído dos exports e dos seletores do código em 2026-09-15.

| stack | peças |
|---|---|
| react | `Drawer`, `DrawerBody`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger` |
| vue | `Drawer`, `DrawerBody`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerTitle`, `DrawerTrigger` |
| svelte | `Drawer`, `DrawerBody`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger` |
| vanilla | `createDrawer` |
| angular | `[ndsDrawerSwipe]`, `button[ndsDrawerClose]`, `button[ndsDrawerTrigger]`, `div[ndsDrawerBody]`, `div[ndsDrawerFooter]`, `div[ndsDrawerHeader]`, `h1[ndsDrawerTitle]` … `h6[ndsDrawerTitle]` (os seis), `nds-drawer`, `ng-template[ndsDrawerContent]`, `p[ndsDrawerDescription]`, mais a constante `NDS_DRAWER` |

O índice do svelte também reexporta as formas curtas — `Body`, `Close`, `Content`,
`Description`, `Footer`, `Header`, `Overlay`, `Portal`, `Root`, `Title`,
`Trigger` —, para quem importa o namespace inteiro. As stories usam a forma longa.

**O helper do motivo de fechamento sai junto das peças**: `drawerCloseReason` e
`DrawerCloseReason` no angular (`ui/drawer.ts`) e no vanilla (só o tipo);
`drawerCloseReason`, `createDrawerCloseWatch` e `createDrawerDragWatch` no índice
do vue; `drawerCloseReason` e `createDrawerCloseWatch` no índice do svelte; no
react, módulo à parte `ui/drawer-close-reason.ts`.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável nas cinco, cada uma de um
jeito** — medido na fonte de cada lib, não na documentação delas:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `asChild` no `DrawerTitle` (o `Title` do dialog do radix, por baixo da `vaul`) — o filho escrito por quem compõe recebe id, classe e slot por fusão de props | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | snippet `child` + prop `level` | `div` com `aria-level="2"` |
| angular | seletor por elemento, nos SEIS níveis | o que quem escreve usar |
| vanilla | opção `titleLevel` da fábrica | `2` |

**No svelte `level` sozinho não troca a tag.** O título daquela lib renderiza
`<div role="heading">` e o `level` só alimenta o `aria-level`. Quem entrega o
cabeçalho de verdade é o snippet `child`, e os dois andam juntos: sem `level`, um
`h3` escrito pelo `child` sairia com `aria-level="2"`, e a tag brigaria com o ARIA.

**O nome da opção é relativo ao ESCOPO da fábrica, e isso NÃO é divergência** —
já foi relatado como tal três vezes. Fábrica que monta só o título usa `level`
(`createPopoverTitle`, `createCardTitle`); fábrica que monta o componente
inteiro usa `titleLevel` (`createDialog`, `createSheet`, `createDrawer`,
`createAlertDialog`). No Svelte o andaime de story usa `titleLevel` e passa
`level` à peça, que é a prop do bits.

**Por que isso importa**: `heading-order` do axe reprova salto de nível, e o
painel não sabe de que profundidade da página foi aberto.

**A story é `HeadingH3`**, no arquivo de variantes das cinco stacks, com o painel
aberto e o título em `h3`. Ela afirma as duas metades: o elemento renderizado é o
pedido (`tagName`), e o `aria-labelledby` do painel continua resolvendo NELE, com
o nome acessível saindo do seu texto.

### Inconsistências entre stacks, medidas em 2026-09-15

Medidas arquivo a arquivo nas cinco stacks, sem suíte de navegador — onde o item
depende de comportamento de lib, a medição é na fonte publicada em
`node_modules`. `node scripts/audit.mjs drawer --json` devolveu **zero violações**
nesta data: nenhuma das divergências abaixo é vista por portão.

**Comportamento**

1. **Escape com a dispensa desligada.** Vanilla não fecha
   (`ui/drawer.ts:454`); react, vue e svelte não fecham e afirmam isso
   (`NotDismissible`: react `drawer-states.stories.tsx:320`, vue
   `drawer/drawer-states.stories.ts:305`, svelte `drawer/drawer-states.stories.ts:190`).
   Angular fecha: o input é `disablePointerDismissal` (`ui/drawer.ts:499`, `:592`),
   o docblock chama isso de deliberado por WCAG 2.1.2 (`:480-485`), e a
   `NotDismissible` de lá não tem passo de Escape (`drawer-states.stories.ts:278-300`)
   — mas o rodapé tem saída explícita, então não há armadilha a evitar.
   Maioria (4) e referência: Escape não fecha. O NOME do input é divergência de
   API — registrar; o comportamento não é.
2. **O arraste que dispensa não emite `drawer_close` no angular.**
   `dismissBySwipe` escreve o model direto (`ui/drawer.ts:605-607`), e o
   `@radix-ng` só emite `onOpenChange` dentro de `show()`/`close()`
   (`radix-ng-primitives-dialog.mjs:214-220`) — o `case 'swipe'` de
   `drawerCloseReason` (`ui/drawer.ts:220`) nunca é alcançado, e o docblock de
   `dismissBySwipe` (`:600-603`) ainda diz que o motivo vira `'action'`, palavra que
   saiu do vocabulário. Vanilla fecha por `overlay` na fábrica (`ui/drawer.ts:409`);
   react, vue e svelte anotam `overlay` no `onDrag` (`drawer-close-reason.ts:73-78`,
   `drawer.close-reason.ts:113-121`, `close-reason.ts:105-110`). Maioria (4):
   `drawer_close` com `overlay`. Medido na fonte, não no navegador.
3. **Foco inicial.** Vue foca o PAINEL (`DrawerContent.vue:140-145`); vanilla vai
   ao primeiro focável (`ui/drawer.ts:393`), react e svelte ligam o foco
   automático da lib com o primeiro tabbable (`drawer.tsx:84`, `drawer.svelte:65`),
   angular idem (`ui/drawer.ts:557-563`) — que é o corpo rolável quando existe.
   Maioria (4) e referência: primeiro focável. Nenhuma play vê: todas afirmam só
   "o foco está dentro do painel".
4. **Animação de entrada e saída.** Vanilla não anima: a fábrica não escreve
   `data-starting-style`/`data-ending-style` (zero ocorrências em `ui/drawer.ts`) e
   remove o painel no mesmo quadro (`:427-428`). Angular anima pelas regras da
   folha (`drawer.css:326-349`) com os atributos do `@radix-ng`
   (`radix-ng-primitives-dialog.mjs:572`). React, vue e svelte animam pela folha
   que a `vaul` injeta (`slideFrom*`, `vaul/dist/index.mjs:62`), e não pelas
   regras da folha compartilhada. Maioria (4): anima; a referência não.
5. **O gatilho anuncia o diálogo em quatro stacks.** As quatro libs escrevem
   `aria-haspopup="dialog"` (com `aria-expanded`/`aria-controls`) no gatilho —
   `radix-ng-primitives-dialog.mjs:794`, `reka-ui/dist/Dialog/DialogTrigger.js:33`,
   `bits-ui/dist/bits/dialog/dialog.svelte.js:127`, `@radix-ui/react-dialog`; a
   fábrica do vanilla não escreve nenhum dos três (docblock `ui/drawer.ts:126-132`).
   Só o angular assere (`drawer-states.stories.ts:98`). Maioria (4): anuncia.

**Markup e `data-slot`**

6. **`data-slot` fora do painel.** Raiz: `div[data-slot="drawer"]` no vanilla
   (`ui/drawer.ts:270`) e no host do angular (`ui/drawer.ts:504`); react e vue
   passam `data-slot="drawer"` a uma raiz que não renderiza elemento
   (`drawer.tsx:144`, `Drawer.vue:105`), svelte não passa — divergência de API
   (raiz provider), registrar. Gatilho: `drawer-trigger` em react, vue, svelte e
   angular; no vanilla o botão fica `button` — Maioria (4). Fechador:
   `drawer-close` em react, vue e svelte, escrito por quem compõe no vanilla
   (é o gancho da delegação, `ui/drawer.ts:380-383`), ausente no angular por disputa
   de host binding (`ui/drawer.ts:771-784`) — registrar.
7. **`defaultOpen` não existe em duas stacks.** React, vue e angular têm a prop;
   svelte só tem `open` bindável (`drawer.svelte:64-70`, e o andaime
   `DrawerStory.svelte:41-49` a emula); vanilla abre por `open()`. Divergência de
   API — registrar. **Mas a tabela de props da docs page do svelte publica
   `defaultOpen`** (`DrawerDocs.svelte:954`), que o componente de lá não aceita —
   isso é defeito, não API.

**Stories — conjunto e asserções**

8. **`ListenerCleanup` e o passo 6 do `Playground` só existem no vanilla**
   (`drawer-states.stories.ts:357`, `drawer.stories.ts:218-233`): prova de
   `destroy()` e dos verbos da fábrica. Mecânica de fábrica — registrar. Nos
   outros arquivos o conjunto é o mesmo nas cinco (Playground; Closed, Open,
   Controlled, NotDismissible, DragToDismiss; Bottom, Top, Left, Right, WithScroll,
   HeadingH3; WithForm, WithConfirmation); só a ordem difere — o vanilla declara
   `HeadingH3` logo depois de `Bottom` (`drawer-variants.stories.ts:98`), as outras
   quatro por último.
9. **O `Playground` cobra coisas diferentes.** Espião de `onOpenChange`: react
   (`drawer.stories.tsx:157,170`), vue (`drawer/drawer.stories.ts:183,197`) e
   angular (`drawer.stories.ts:130,145`); svelte espiona o `onCancel` do andaime
   (`drawer/drawer.stories.ts:186-190`); vanilla nada — Maioria (3). Clique no véu
   FECHA: só o angular assere (`drawer.stories.ts:193-201`), e nenhuma outra story
   das quatro cobre o caminho positivo do véu. Controls: svelte sem `modal`
   (`drawer/drawer.stories.ts:38-91`), angular sem `dismissible`
   (`drawer.stories.ts:21-49`); react, vue e vanilla têm os dois.
10. **`Closed`, `Open` e `Controlled` afirmam atributos diferentes.**
    `data-slot="drawer-trigger"`: react (`drawer-states.stories.tsx:108`), vue
    (`:117`) e angular (`:99`); svelte e vanilla não. `Open` do angular troca `role` e
    `data-slot` por `data-state="open"` (`drawer-states.stories.ts:147`); as outras
    quatro afirmam `role` e `data-slot`. `Controlled` do angular afirma
    `data-state` em vez do nome acessível (`:216`). `Controlled` do svelte abre pelo
    `DrawerTrigger` interno do andaime, rotulado "Abrir via estado externo"
    (`drawer/drawer-states.stories.ts:129,140`), sem botão de fora — Maioria (4):
    botão externo comandando o estado.
11. **`Left` afirma uma posição que passa durante a entrada.** `left < 1` —
    verdade também com o painel a −384px no meio da transição, como o próprio vue
    registra (`drawer/drawer-variants.stories.ts:178-182`) — em react
    (`drawer-variants.stories.tsx:167`), svelte (`:135`), vanilla (`:195`) e angular
    (`:171`). Só o vue espera e mede `Math.abs(...) < 2`, em `Left` e `Right`
    (`:183-185`, `:211-214`). Maioria (4) com a asserção fraca; a forma do vue é a
    que tem dentes.
12. **Variantes do angular afirmam nome sem valor** (`toHaveAccessibleName()`,
    `drawer-variants.stories.ts:115,143,169,194`); as outras quatro afirmam o texto.
    E o rodapé das variantes do svelte tem dois botões (o andaime é um só,
    `DrawerStory.svelte:179-207`), contra um `Fechar` nas outras quatro.
13. **`WithForm`.** Svelte abre à direita (`drawer/drawer-compositions.stories.ts:39`),
    as outras quatro em baixo. Angular tem um passo a mais, o corpo como região
    rolável (`drawer-compositions.stories.ts:170-180`), e conta os botões do painel
    inteiro em vez do rodapé (`:150`). Nenhuma das cinco afirma a ordem do rodapé
    no DOM (pendência do §2).
14. **`NotDismissible` do react tem um passo que as outras não têm** — o painel
    ENTRA na tela (`drawer-states.stories.tsx:298-318`), porque só ali a raiz assume o
    controle com a dispensa desligada (`drawer.tsx:114-150`). Mecânica da stack —
    registrar.
15. **`WithConfirmation`.** Svelte: a ação principal NÃO tem a variante
    destrutiva (`DrawerStory.svelte:201-207`) e nenhum passo a cobra
    (`drawer/drawer-compositions.stories.ts:116-120`); as outras quatro afirmam
    `nds-button-destructive` — Maioria (4). Vanilla: não afirma que a ação principal
    fica SEM foco (`drawer-compositions.stories.ts:202-205`); as outras quatro sim.
    Passo `type="button"` e `form` nulo só em vanilla (`:207-214`) e svelte
    (`:131-138`). Angular não afirma o nome acessível (`:243-245`). Corpo com texto
    em vanilla e svelte; sem corpo em react, vue e angular.
16. **API do alvo de foco inicial** — divergência de API, registrar: vanilla opção
    `initialFocus` (elemento, `drawer-compositions.stories.ts:179`); react
    `onOpenAutoFocus` no `DrawerContent` (`drawer-compositions.stories.tsx:180-198`);
    vue prop `initial-focus="close"` (`drawer/drawer-compositions.stories.ts:175`);
    svelte `onOpenAutoFocus`, hoje só no andaime (`DrawerStory.svelte:101-107,120`);
    angular output `(openAutoFocus)` com `[ndsDrawerClose]`
    (`drawer-compositions.stories.ts:210-222`).
17. **`DragToDismiss` afirma `data-swiping` ausente só onde a stack o escreve**
    (vanilla `drawer-states.stories.ts:519`, angular `:441`) — segue de D9,
    registrar. O angular espera a devolução de foco com `waitFor` (`:469-471`); as
    outras quatro leem na hora.

**Docs page**

18. **Demonstração.** Vanilla monta UMA gaveta, só `bottom`
    (`DrawerDocs.ts:287-305`); as outras quatro montam as quatro direções (react
    `DrawerDocs.tsx:402-415`, vue `DrawerDocs.vue:606-650`, svelte
    `DrawerDocs.svelte:365` em diante, angular `DrawerDocs.ts:610-643`). Maioria (4);
    o conteúdo tem as quatro legendas (`demonstration.labels.bottom|right|left|top`).
19. **Onde `drawer_open` e `drawer_close` nascem.** Angular: só na Demonstração,
    com `location: 'docs_demo'` (`DrawerDocs.ts:614-617`, `810-821`) — os painéis
    vivos de Do & Dont, Variantes e Composições (`:354-589`) não têm ouvinte. As
    outras quatro rastreiam todo painel vivo com o `location` da seção (react
    `trackDrawer` em `DrawerDocs.tsx:351,492,663,753,843`; vue
    `DrawerDocs.vue:620-1152`; svelte `drawerWatch` em demo, do-dont, variantes e
    composições; vanilla `buildDrawerDemo` em `DrawerDocs.ts:297-729`). Maioria (4).
20. **`dialog_confirm` só no angular** (`DrawerDocs.ts:555,582,832-839`). As outras
    quatro não disparam, e `analytics.description` lista só `drawer_open` e
    `drawer_close`. Maioria (4): não dispara.
21. **Quem produz `api`, e o default do motivo.** Vanilla: `close()`/`toggle()`
    (`ui/drawer.ts:500-503`). Angular: é o default, e inclui `trigger-press` e
    `none` (`ui/drawer.ts:222-226`). Svelte `markProgrammatic`
    (`close-reason.ts:111`) e vue gesto `confirm` (`drawer.close-reason.ts:68-69`)
    existem sem chamador. React não tem caminho que produza `api`
    (`drawer-close-reason.ts:49-53`). Motivo não anotado cai em `close-button` em
    react, vue e svelte, e em `api` no angular. Os NOMES dos sinais divergem —
    svelte `escape-key|outside-press|drag-dismiss|imperative-action`, vue
    `escape-key-down|pointer-down-outside|drag-dismiss|confirm`, react sem tipo de
    sinal — e isso é API, registrar; o default e a ausência de produtor não são.
22. **O "não faça" do par 1 abre um diálogo SEM nome** no vanilla (`title: ''`,
    `DrawerDocs.ts:372-379`) e no svelte (sem `DrawerTitle`,
    `DrawerDocs.svelte:547-563`); react e vue dão ao painel um título `nds-sr-only`
    (`DrawerDocs.tsx:529`, `DrawerDocs.vue:766`), angular usa o título ruim da
    tabela de UX writing (`DrawerDocs.ts:369-387`). Maioria (3): o painel tem nome.
    O "não faça" do par 2 é descritivo, sem painel, só no angular (`:404-412`); nas
    outras quatro é um painel vivo.
23. **Container de Variantes e `componentSlug`.** Angular usa `nds-docs-variants`
    (`DrawerDocs.ts:671`); as outras quatro reusam o container de composições
    (react `DrawerDocs.tsx:596`, vue `DrawerDocs.vue:871`, svelte
    `DrawerDocs.svelte:611`, vanilla `DrawerDocs.ts:466`). `componentSlug` chega a:
    react — layout, composições ×2, relacionados, notas; angular — layout,
    importação, variantes, composições, relacionados, notas; svelte e vanilla — só
    composições ×2; vue — nenhuma seção, só o SEO (`DrawerDocs.vue:147`). Sem
    maioria.
24. **Título da lista de leitor de tela.** Angular lê
    `accessibility.screenReader.title` do conteúdo (`DrawerDocs.ts:709`); as outras
    quatro leem `tNav('common.screenReader')`. Maioria (4): cromo.
25. **Tabela de analytics.** Colunas: vanilla e angular leem `tNav('common.event')`
    e irmãs; react monta um ternário por locale (`DrawerDocs.tsx:280-284`); vue
    crava `'Evento'`, `'Quando dispara'`, `'Payload'` (`DrawerDocs.vue:1238-1242`);
    svelte crava `'Evento'`, `'Trigger'`, `'Payload'` (`DrawerDocs.svelte:1018-1022`).
    Linhas: react e vue têm duas; svelte e vanilla somam uma linha `—` com
    `analytics.description`; angular soma `docs_page_view`
    (`DrawerDocs.ts:1194-1198`). Coluna de gatilho: react, vue e angular do
    conteúdo; svelte `onOpenChange(true|false)`; vanilla `onOpenChange(true)` e
    `onClose(reason)`. Payload: react e angular `component, trigger_id, location`;
    vue, svelte e vanilla `{ component: 'drawer', location, trigger_id }`. Maioria
    nas colunas (2, e é a referência): vocabulário compartilhado.
26. **Importação.** Segundo bloco de código em svelte (`DrawerDocs.svelte:606-607`),
    vanilla (`DrawerDocs.ts:413-416`) e angular (`DrawerDocs.ts:665-666`); react
    (`DrawerDocs.tsx:593`) e vue (`DrawerDocs.vue:866-867`) só o import. Maioria (3)
    e referência: com o segundo bloco.
27. **A tabela de props do vanilla contradiz a fábrica.** Publica `trigger` como
    obrigatório (`DrawerDocs.ts:804`) e `trigger: HTMLElement` na interface (`:763`),
    contra `trigger?:` (`ui/drawer.ts:134`); `footer` como `HTMLElement`, contra
    `HTMLElement | HTMLElement[]` (`ui/drawer.ts:165`); não tem linha para
    `titleLevel`, `bodyLabel` nem `initialFocus`. Nomes de prop por stack — vue
    `onUpdate:open`, angular `open` como `model<boolean>`, `openChange`,
    `disablePointerDismissal` e a tabela de `panelClass` (`DrawerDocs.ts:1021-1085`) —
    são API, registrar.

**Snippets**

28. **Ordem do rodapé no snippet.** Vue (`drawer/drawer.source.test.ts:167-182`) e
    angular (`drawer.source.test.ts:532-537`, `:554`) afirmam cancelar antes do
    primário; react só afirma rodapé depois do corpo (`drawer.source.test.ts:160`);
    svelte e vanilla não afirmam. As cinco têm `drawer.source.test.ts`. A linha
    "no Vue" da tabela de invariantes da `18-overlay.md` está menor que o código.

**PASSAGEM DE 2026-09-20 — o que a lista era, e o que a medição fez com ela.**

A §7 declara de si mesma que foi medida **sem suíte de navegador**. Sete itens
comportamentais foram medidos em navegador antes de qualquer conserto, e o
resultado justifica a cautela: **seis confirmados, um derrubado** (#4, a entrada
do angular), e **dois defeitos que a lista não previa** — o evento duplo do
svelte (D16) e o véu do vanilla que anima enquanto o painel não animava.

Corrigidos e fora da lista: **1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 15, 19, 20, 22,
23, 25, 26, 27** e a metade de #6 e #18 que era defeito. Continuam registrados
como divergência de API, com a premissa conferida: **7** (`defaultOpen`), **16**
(alvo de foco inicial), **21** (nomes dos sinais), **14** e **8** (mecânica de
stack).

**Cinco afirmações da própria §7 caíram na medição, e vale saber a forma de
cada uma:**

- **#11 generalizava**: "só o vue mede `Math.abs(...)`" — o `Right` do react e o
  do vanilla **já** mediam; faltava-lhes só a espera. A asserção fraca era do
  `Left`, não do par. Eu mandei consertar os dois, e duas agentes mediram antes.
- **#5 listava três atributos como se fossem escritos juntos**: `aria-controls`
  **só existe com o painel aberto** (confirmado na fonte das quatro libs). As
  stories passaram a afirmar as duas metades separadamente.
- **#21 dizia que o react "não tem caminho que produza `api`"** — tinha a
  capacidade; faltava um PRODUTOR nomeado.
- **#23 dizia que o vue não passa `componentSlug` a seção nenhuma** — passava a
  três, em HEAD, sem modificação.
- **#12 dizia "um `Fechar` nas outras quatro"**, e isso só vale para as quatro
  direções: na `HeadingH3` a maioria é um botão, na `WithScroll` é o par — e ali
  o vue e o vanilla, que é a referência, é que estão certos. Alinhar nos dois
  sentidos teria criado divergência nova.

**O que continua aberto desta lista**: #17 e #24, que são cromo, e a segunda
metade de #25 (coluna de gatilho e linha extra). E o portão que a pendência
original pedia — nenhum ainda vê estas divergências — continua sem existir: o
que as pegou foi medição, não regra.

**FECHADA · 2026-09-20 — o arraste que dispensa não emitia `drawer_close` no
angular.** `dismissBySwipe` passou a fechar por `close('swipe')` do primitivo, em
vez de escrever o model direto: o `close()` emite `onOpenChange` com motivo, e o
`case 'swipe'` de `drawerCloseReason` — que existia e nunca era alcançado — passa
a devolver `overlay`, como nas outras quatro. A `DragToDismiss` coleta os motivos
anunciados e afirma `toEqual(['overlay'])`; replantando o `open.set(false)`,
reprova com `expected [] to deeply equal [ 'overlay' ]`.

A medição acrescentou o que a dedução não via: **existia um output que disparava**
(`openChange`, do `model`), sem motivo. Era atalho disponível e errado — o
contrato pede o motivo, não só o fechamento.

## 8. Acessibilidade

**Atributos**: título obrigatório ligando `aria-labelledby`; descrição opcional
ligando `aria-describedby`; `aria-modal="true"` só no modo modal — escrito à mão
em react e vue (`drawer.tsx:223`, `DrawerContent.vue:182`), pela lib no svelte e no
angular, pela fábrica no vanilla.

**Teclado**: Tab e Shift+Tab circulam dentro do painel; Escape fecha quando
`dismissible` — no angular, sempre (§7, inconsistência 1).

**O corpo rolável** entra na ordem de tabulação (WCAG 2.1.1) e recebe
`role="group"` quando você lhe dá um nome — o mesmo trio do Sheet e do Dialog.

**O que NÃO se faz, de propósito:**

- o arraste nunca é o único caminho para dispensar (C5) — em teclado e em leitor
  de tela ele não existe;
- a alça não recebe foco nem nome: o arraste vale no painel inteiro, não nela;
- animação própria acrescentada por quem consome precisa parar sob
  `prefers-reduced-motion`: o painel e o véu já param, o extra não.

**Movimento reduzido** — o C6 afirma que painel e véu param, e DUAS camadas
seguram, como no `alert-dialog.md` §8:

- **a de token**: a folha declara duração só por `var(--duration-base)`, e
  `docs/shared/tokens/motion.css` zera a escada inteira sob a preferência;
- **a da própria folha**: o bloco `@media (prefers-reduced-motion: reduce)` no
  FIM de `drawer.css` zera `animation` e `transition` de `.nds-drawer-content` e
  de `.nds-drawer-content:not([data-swiping])`. Ele vem depois das regras de
  transição, com os mesmos seletores, e por isso vence.

Sob a preferência, a volta ao repouso depois do arraste é instantânea; o
acompanhamento do ponteiro continua (é a posição do dedo, não animação); e a
resistência elástica ao puxar além do aberto é desligada pelo motor de ponteiro
(`drawerSwipeTranslate` com `reducedMotion`), não pelo CSS — nas stacks com
`vaul`, a lib não tem esse corte.

O véu é do Sheet e a folha de lá o desliga — é a única metade do C6 que não mora
neste arquivo.

## 9. Analytics

| evento | quando | payload | quem dispara |
|---|---|---|---|
| `drawer_open` | o painel abre | `{ component: "drawer", trigger_id, location }` | as cinco — no angular só na Demonstração (inconsistência 19) |
| `drawer_close` | o painel fecha | idem, mais `reason` | as cinco — no angular só na Demonstração, e não no arraste (inconsistências 2 e 19) |
| `dialog_confirm` | a ação primária do rodapé das Composições é acionada | `{ component: "drawer", action: "confirm", trigger_id, location }` | **só o angular** |

Os dois primeiros estão tipados nos cinco `analytics.ts` com `label?: never`.

**`trigger_id` carrega a DIREÇÃO** — `bottom`, `right`, `left` ou `top` —, nunca
o título traduzido, que partiria a mesma série em um valor por idioma no GA4. É o
campo único de quem abriu na categoria (`18-overlay.md` §Analytics, decisão da
dona em 2026-09-10).

**`reason` é obrigatório no fechamento**, e tem vocabulário fechado no tipo:
`escape`, `overlay`, `close-button` ou `api`. É o vocabulário do design
system, não o da lib — motivo inventado contamina a série, e motivo ausente
esconde a diferença entre desistir e concluir.

**E quem deduz o motivo fica AO LADO DO PRIMITIVO**, exportado pelo mesmo índice
das peças — a docs page só repassa a palavra (`18-overlay.md` §Analytics, portão
`motivo_sintetizado_na_docs_page`): `react/ui/drawer-close-reason.ts`,
`vue/ui/drawer/drawer.close-reason.ts`, `svelte/ui/drawer/close-reason.ts`,
`drawerCloseReason` em `angular/ui/drawer.ts`, e o `onClose` da fábrica no vanilla.
Os três primeiros têm teste de unidade ao lado (`drawer-close-reason.test.ts`,
`drawer.close-reason.test.ts`, `close-reason.test.ts`).

O par `onDrag`/`onRelease` sai do mesmo módulo, nas três stacks com `vaul`: é o
pareamento que mantém o motivo certo, e separá-los é o defeito.

**O default do Drawer é `close-button`, e ele é diferente do da família do
Dialog de propósito**: aqui o que sobra depois de Escape, véu e arraste é o botão
de saída do rodapé, que a lib não anuncia por evento próprio. Na família do
Dialog o botão TEM anúncio, e o que sobra é o fechamento por código, que é `api`.
Trocar um pelo outro faz "confirmou e fechou" chegar ao relatório como "apertou o
botão de fechar". O angular é a exceção: lá a lib anuncia `close-press`, e o
default é `api` (inconsistência 21).

**O arraste que dispensa é anotado no ARRASTE, não na soltura** — a lib fecha
antes de anunciar a soltura (`closeDrawer(); onRelease(event, false)`), então
anotar ali chegaria depois do evento. Arraste curto, que volta ao repouso, é
anunciado com `open = true` e limpa a anotação; sem isso o próximo fechamento por
botão herdaria um motivo que não é dele.

**FECHADA · 2026-09-20 — pelo lado que era maioria.** O angular deixou de
disparar `dialog_confirm`, e o método que o emitia saiu junto. As cinco docs
pages agora concordam com o `analytics.description` do conteúdo compartilhado,
que lista `drawer_open` e `drawer_close` e mais nada.

A palavra continua tipada em `AnalyticsEvents` pela família do Dialog, e é por
isso que nenhum portão de tipo via a assimetria: o evento era válido, só não era
do drawer.

> **FECHADA · 2026-09-08** — as duas pendências registradas em 2026-09-07: a prosa de analytics pedia o título traduzido (`2f64c9b2d`), e o par `drawer_open`/`drawer_close` era disparado só pelo angular. Hoje as cinco disparam o par.

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
- **Entrada e saída leem `data-starting-style`/`data-ending-style`** — quem monta
  o painel sem lib precisa escrever os dois, ou o painel salta (inconsistência 4).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, direções, alça, gesto, rodapé | `docs/shared/styles/nds/drawer.css` |
| véu, título e descrição (reusados) | `docs/shared/styles/nds/sheet.css` |
| regra do par de botões | `docs/shared/guidelines/02-alinhamento-botoes.md` — **o texto canônico**; a seção homônima da `04-padroes-design-sistema.md` só aponta para lá |
| regra do gesto (constantes e as três decisões) | `docs/shared/primitives/drawer-swipe.ts` |
| fiação do gesto, por stack | `ui/drawer-swipe.ts` no vanilla · diretiva `NdsDrawerSwipe` no angular · a `vaul` nas outras três |
| motivo do fechamento, por stack | ver §9 |
| texto, props, critérios de teste | `docs/shared/content/drawer/translations.json` |
| desenho e anotações | Figma, página `Drawer` (conjunto `698:116`) |
| portões determinísticos | `node scripts/audit.mjs drawer --json` |
| tabela de tokens contra a folha | `node scripts/tabela-tokens.mjs drawer` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs/shared/primitives/docs-page-landmarks.ts` |

**Rótulo de menu e título de seção não moram no conteúdo** desde 2026-09-12: o
`h2` nasce do id que a seção declara, então divergir deixou de ser possível em vez
de passar a ser proibido. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo`, `vocabulario_de_nav_divergente`,
`titulo_de_secao_no_conteudo`, `titulo_de_secao_pedido_ao_conteudo` e
`titulo_passado_ao_container` — o último porque no Angular um `[title]` esquecido
**não** reprova no `ngc` (é atributo global do HTML) e viraria tooltip silencioso
no cabeçalho.
