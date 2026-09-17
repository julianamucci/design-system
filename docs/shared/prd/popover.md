# PRD — Popover

> **Estado descrito**: 2026-09-15. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.

## 1. Identidade

Painel flutuante ancorado a um gatilho, aberto por **clique**, que recebe foco e
guarda conteúdo interativo.

É o único da família de overlay que não é menu nem dica, e isso obriga a escolher
entre dois contratos de foco. A escolha está fixada na decisão D1.

O que o separa dos vizinhos, em uma linha cada:

| vizinho | diferença que decide |
|---|---|
| Tooltip | abre no hover, não recebe foco, tem seta |
| HoverCard | abre no hover e no foco do gatilho, é conteúdo de APOIO — nada interativo dentro |
| DropdownMenu | o teclado pertence à LISTA: setas andam, letra é typeahead, Tab fecha |
| Dialog | interrompe a página; o popover fica ao lado dela |

A pergunta que decide entre Popover e DropdownMenu: **a pessoa vai escolher ou
vai compor?** Se digitar uma letra ali dentro é atalho, é menu; se é texto, é
popover.

## 2. Contrato de comportamento

Cada linha é verificável. A coluna do portão diz quem reprova se ela deixar de
valer — e `—` é dívida declarada, não ausência de risco.

| # | o contrato | portão |
|---|---|---|
| C1 | Abre no clique do gatilho | passo "Clicar no gatilho abre o painel" da `Playground`, nas cinco — e a `Open` abre por `defaultOpen` nas cinco desde 2026-09-17, quando o vanilla deixou de encenar o clique (§7, item 12) |
| C2 | Ao abrir, o foco ENTRA no painel: primeiro `[data-autofocus]`, senão o primeiro focável, senão o próprio painel | `testes.functional.item1` + passo "O foco entra no painel ao abrir" da `Playground`, nas cinco — o degrau do `data-autofocus` é de 2026-09-16, ver D13 |
| C3 | O foco NÃO fica preso: Tab a partir do último focável, ou Shift+Tab a partir do primeiro, **fecha o painel e devolve o foco ao gatilho** | a `Focused`, nas cinco, nos DOIS sentidos — ver D11 |
| C4 | `Escape` fecha e devolve o foco ao gatilho | `testes.functional.item2` + passo de Escape da `Playground`, nas cinco |
| C5 | Clique fora fecha, uma vez só | `testes.functional.item3` + passo "Clicar fora fecha" na `Playground` das CINCO (o angular voltou a declará-lo ali em 2026-09-17) + passo `'Com o painel aberto, clicar em "Antes" fecha o painel uma vez só'` da `Focused`, nas cinco, que é o único que exercita clique em elemento FOCÁVEL — ver D15 |
| C6 | O painel SEMPRE tem nome acessível — `aria-labelledby` quando há título visível, `aria-label` quando o conteúdo é livre | `testes.accessibility.item5` + passos de `Default` e `WithTitle`, nas cinco + regra `aria-dialog-name` do axe |
| C7 | No modo padrão o painel NÃO recebe `aria-modal` — nem como `"false"` | passo "O painel não é modal" da `Playground`, nas cinco |
| C8 | `modal: true` liga QUATRO coisas JUNTAS: foco preso, rolagem travada, `aria-modal="true"` e o resto da página escondido do leitor de tela | story `Modal`, nas cinco: `aria-modal`, o laço de Tab, a trava de rolagem (desde 2026-09-16) e o escondimento com restauração (desde 2026-09-17, ver D16) |
| C9 | Sem espaço no `side` pedido, o painel vira para o lado oposto (auto-flip) | story `SideTop`, nas cinco: lado exato com espaço, virada sem espaço — ver D0 |
| C10 | Renderiza em portal no `body`; fechado, não existe no DOM | `notes.item3` |
| C11 | Nenhuma região viva: o painel não é anúncio, é alcançado | inspeção — nenhuma regra de axe cobre ausência de `aria-live` |
| C12 | No modo não-modal, o foco levado a OUTRO elemento da página — que não o gatilho — fecha o painel com `overlay`, uma vez, e o foco FICA onde foi posto | a `Focused`, nas cinco — ver D15 |

## 3. Decisões fixadas

A tabela existe para que reverter custe uma leitura. Reverter é permitido; fazer
sem saber, não.

### D0 · O C9 era falso no vanilla, e a story que o gateava não podia reprovar

**Fixada em** 2026-09-13, a partir de uma captura de tela da dona: o Playground
do vanilla com `side: 'top'` abria o painel **fora da tela**, e o mesmo
Playground no angular abria certo.

Eram três camadas, e só a primeira estava à vista:

1. **O quadro da story.** O Playground do vanilla era `layout: 'padded'` contra
   `centered` no react, no svelte e no angular. Com `padded` o quadro começa no
   topo do canvas e o gatilho não tem nada acima dele. Corrigido para `centered`.
2. **O `flip` não estava ligado.** `positionFloating` tem `flip` **opt-in** — por
   uma razão escrita e boa, que é o lado ser LIDO pela folha em outros
   componentes (a seta do tooltip) — e o popover nunca o pediu. O eixo PRINCIPAL
   não é clampado de propósito, porque clampar empurraria o painel por cima do
   gatilho. Sem flip e sem clamp, "não cabe" significa "sai da tela". Ligado
   aqui, e é seguro: a folha do popover não lê `[data-side]` e não há seta.
3. **O `data-side` mentiria.** Ele era escrito do lado PEDIDO, na montagem, e o
   retorno de `positionFloating` — que traz o lado onde o painel de fato ficou —
   era descartado. Agora o atributo vem do retorno.

**E a story que "prova" o C9 não podia reprovar.** No vanilla ela GARANTIA espaço
acima, de propósito, para o flip não acontecer — mas o espaço vinha de
`data-split="last"`, que põe `margin-top: auto` no ÚLTIMO filho, e o popover era
filho único: já era o último, e nada era empurrado. Ninguém viu porque, sem
flip, o painel era desenhado acima do mesmo jeito — **fora da tela**. A story
afirmava "posicionado acima" medindo um painel que ninguém conseguia ler. O
espaço virou um irmão de verdade, e um passo novo tira esse irmão e exige que o
lado vire e que o `data-side` acompanhe.

**Fechado nas cinco no mesmo dia**, por decisão da dona de nunca deixar um
conserto criar divergência nova — regra que entrou no `CLAUDE.md` nesta rodada.
A `SideTop` das outras quatro afirmava `data-side ∈ {top, bottom}`: aceita os
dois, passa com ou sem flip. Agora cada uma exige o lado EXATO com espaço, a
virada sem espaço, e a geometria junto do atributo nos dois casos.

**O flip existe nas quatro libs — medido, não presumido.** No angular a leitura
foi até a fonte: o `RdxPopperContentWrapper` monta `flip()` com o padrão
`side: 'flip'`, e o `data-side` sai do placement RESOLVIDO. Nenhuma bandeira foi
ligada em stack nenhuma; faltava só a asserção.

**E o arranjo falso era de todas, não do vanilla.** Três das quatro achavam o
mesmo `data-split="last"` com o popover como filho único — o utilitário põe
`margin-top: auto` no ÚLTIMO filho, e ele já era o último. No react ele nem isso:
a lib deixa um nó depois do gatilho, então o `:last-child` daquela árvore nunca
foi ele. O espaço vinha de `layout: 'centered'`, por acidente. Hoje o espaço é um
irmão de verdade nas cinco; vue, svelte e angular declaram `layout: 'padded'` na
própria `SideTop`, o vanilla herda `padded` do `meta`, e o react segue `centered`
com o contêiner `nds-stack nds-min-h-100` (§7, inconsistência 14).

**Efeito colateral registrado**: depois desta rodada, `data-split` não tem mais
NENHUM consumidor vivo nas cinco stacks — só menções em comentário, explicando
por que ele saiu. A `SideTop` era o único uso do utilitário no repositório
inteiro, e era inerte nas cinco.

**Por que ele não empurrava, medido com sonda em 2026-09-13**: `margin-top: auto`
só empurra se o último filho GERAR CAIXA. No vanilla a fábrica devolve um
wrapper com `display: contents`, que não gera — quem vira item do flex é o
gatilho, um nível abaixo. A sonda leu contêiner de 400px, `display: flex`, último
filho com `margin-top` computado em `auto`, e o gatilho em `top: 0`. No react o
mecanismo é outro e o silêncio é o mesmo: a lib deixa um nó DEPOIS do gatilho,
então o `:last-child` daquela árvore nunca foi ele.

A regra fica em `layout.css` — o idioma é correto e a alternativa seria altura em
`style` inline, que a casa proíbe —, com o comentário reescrito: ele prometia um
`data-split="N"` que nunca existiu, e agora declara a precondição que não se vê
do call site.

### D1 · Não-modal por padrão

**Fixada em** 2026-09-02 (`65b406bfb`).
**Medição**: a fonte de cada lib foi lida, não a documentação delas. Nenhuma emite
`aria-modal` no popover e quatro nascem não-modais; o `bits-ui` é a única sem
`modal` — o que ele tem é `trapFocus`, com padrão da LIB `true`, e o painel do
Svelte não deixava o Tab sair.
**Por quê**: metade de cada contrato é o defeito clássico — painel que o leitor
de tela anuncia como diálogo e que o Tab atravessa como se não fosse. `aria-modal`
manda esconder o resto da página, e sem foco preso ele MENTE.
**Para revisitar**: seria preciso mostrar um caso em que conteúdo ao lado da
página exige inércia do resto. Hoje esse caso é o Dialog.

### D2 · `modal` é entregue nas cinco, e liga QUATRO coisas juntas

**Fixada em** 2026-09-02 (`16c6f7ee0`), sob a regra "entregar ou remover".
**Medição**: a prop estava na tabela de props desde sempre e existia em três das
cinco, com semântica diferente em duas. No `base-ui` (react) `modal` sozinho
**não prende foco** — `focusManagerModal = modal !== false && hasClosePart`, e
até 2026-09-12 esta família não expunha um `Popover.Close`; o que ele entregava
era trava de rolagem e backdrop interno. A referência da implementação é a
`reka-ui`, que entrega inteiro sozinha.

**Com a peça de fechar, medido em 2026-09-12** — e o resultado não é o que a
frase acima faria esperar: o comportamento de TECLADO não muda, porque o laço de
tabulação escrito à mão no `PopoverContent` já fazia o que a lib faria. O que
passa a acontecer é a lib esconder de fato o resto da página (`markOthers`: 11
subárvores `aria-hidden` contra 7), que é a metade que o `aria-modal` sempre
prometeu e não cumpria. Nenhuma violação de axe nos dois estados.

O laço à mão FICA, e não é redundância esquecida: ele é o único trap quando o
painel modal não tem controle de fechar, e o contrato de `modal` não pode
depender do conteúdo que alguém pôs dentro.

**A story que guarda isso mostra a mesma composição nas cinco desde 2026-09-13**:
dois CHECKBOX e nenhuma peça de fechar. Nas quatro stacks de lib a ausência é
obrigatória — com um controle registrado, quem prende o foco é a lib, e a story
mediria a lib. No vanilla não é, e ainda assim ela segue a mesma forma, por
decisão da dona: a story de um contrato tem de mostrar a mesma coisa nas cinco,
senão comparar as páginas deixa de responder alguma coisa.

Eram um par Cancelar/Confirmar, e nas quatro de lib os dois eram **inertes** —
botão que promete ação e não entrega, publicado como exemplo canônico. Checkbox
é controle que se basta: ele não promete nada além de marcar. **E com isso o
Escape passou a ser a única saída daquele painel** — com o foco preso e a
rolagem travada, um Escape que falhasse deixaria quem usa sem caminho nenhum —,
então ele ganhou asserção própria na play do vanilla. Provado desligando o ramo
do Escape na fábrica: a story reprova com "popover ainda aberto".

**E ele contava como focável um elemento que o Tab nunca visita, até 2026-09-13.**
A lista de seletores declarava no docblock que `[tabindex="-1"]` fica de fora —
"é marcador de foco programático, não parada na ordem de tabulação" — e **só o
último seletor cobrava isso**. `input[tabindex="-1"]` entrava pela porta do
`input:not([disabled])`.

Estava latente no vanilla e no angular, e não no react: a base-ui renderiza, ao
lado de cada `Checkbox`, um `<input type="checkbox" tabindex="-1" aria-hidden>`
escondido. Bastou a story do modo modal passar a usar checkbox para o elemento
escondido virar o "último focável", o ramo do laço deixar de disparar e **o foco
sair do painel** — exatamente o contrato que o laço existe para sustentar.
Corrigido nas três stacks que têm a lista, aplicando o filtro a todos os
seletores; vue e svelte não a têm, porque ali o trap é da lib.

**O que a correção expôs, e é o que vale guardar**: no angular a story passava
porque media o elemento errado. Com a lista honesta, o painel ficava sem
nenhum focável e o Tab virava no-op — o foco não ia para lugar errado, não se
movia. A causa é a ponte de foco do portal do `radix-ng`, que inertiza o
conteúdo enquanto o foco está fora (`disableFocusInside`) e só o reabilita num
`focusin` **com `relatedTarget`**. A play chamava `.focus()` direto, e foco
programático não tem `relatedTarget`. Medido: entrando por Tab a partir do
gatilho, a ponte devolve o tabindex e o laço fecha. Era o instrumento, não o
componente — e a asserção nova de "o primeiro focável recebe o foco" virou, de
graça, o portão dessa reabilitação.
**Para revisitar**: separar os três em props independentes reabre o defeito de D1.

### D3 · O painel se nomeia por título OU por `aria-label`

**Fixada em** 2026-09-05 (`bfe1d5182`), decisão da dona.
**Medição**: o conteúdo documentava a variante `Default` como painel de conteúdo
livre — sem título — e o Do & Don't mandava "sempre forneça PopoverTitle". A
página proibia a própria variante padrão. A variante fica; o painel passa a ter
nome por `aria-label` quando não há título.
**Consequência de implementação**: o `aria-label` não chegava sozinho em três
stacks — a fábrica do vanilla e o `NdsPopoverContent` do angular não tinham por
onde recebê-lo (atributo em `<ng-template>` não renderiza), e o `PopoverContent`
do vue precisou SOLTAR o `aria-labelledby` que a reka crava apontando para o
gatilho; com ele, o `aria-label` era silencioso.
**Cuidado ao revisitar**: os dois contratos no mesmo elemento são ambiguidade,
não redundância. Com título, quem nomeia é o `aria-labelledby`.

### D4 · O gap do cabeçalho é `--spacing-1-5`, e o título e a descrição zeram margem

**Fixada em** 2026-09-05 (`058824828` + `f9e09de52`).
**Medição**: era `--spacing-0-5` (2px), e 2px nunca foi o espaçamento real — o
título é `h*` e a descrição é `<p>`, e margem de agente de usuário **não colapsa
dentro de container flex**. As duas somavam por cima do gap. Zerar as margens
revelou um valor fora da escala da família; 6px é o que dialog e sheet usam.
**Para revisitar**: `margin: 0` nos dois é parte da decisão, não detalhe.

### D5 · O tamanho de texto mora no CONTENT, não no header

**Fixada em** 2026-09-05 (`24d3ed02c`).
**Medição**: enquanto vivia em `.nds-popover-header`, a variante `Default` — que
é painel de conteúdo livre e não tem header — ficava com texto visivelmente maior
que as outras duas na mesma página.
**Regra que fica**: o popover é superfície pequena e o CORPO dele tem um tamanho
só, com header ou sem.

**O título é a exceção, e ela precisou ser escrita em 2026-09-13.** Até esse dia
`.nds-popover-title` declarava margem e peso e **nenhum `font-size`** — e "um
tamanho só" era falso de um jeito que ninguém enxergava: o título é `h*`, o
agente de usuário dá a ele um multiplicador RELATIVO sobre os 14px do painel
(`h2` é `1.5em`, `h3` é `1.17em`), então ele saía **21px** ou **16px** conforme o
nível de cabeçalho que quem escreve escolhesse. O mesmo popover apareceu nos dois
tamanhos numa captura de tela lado a lado, vanilla contra angular.

Fixado em `--text-control-lg` (16px), por decisão da dona: é o mesmo do Dialog, o
irmão de papel mais próximo; fica um degrau acima do corpo, que é o que separa
título de texto, e um degrau abaixo de sheet e alert-dialog, que são superfícies
maiores. Portão: `titulo_sem_tamanho`, que cruza as DUAS pontas — a fábrica do
vanilla montar cabeçalho e a folha se calar. Sozinha, nenhuma das duas é defeito.

### D6 · A largura é literal, e é a única da família sem gancho de customização

**Estado**: `width: 18rem` (288px) cravado na folha.
**Contraste medido**: o HoverCard tem `--hover-card-width` e o Sheet tem
`--sheet-width`/`--sheet-max-width`, ambos declarados em `:root` justamente para
que override em qualquer ancestral vença. O popover não tem equivalente.
**Para revisitar**: se virar custom property, o default vai para `:root` pelo
mesmo motivo medido nos outros dois — declarado no seletor da peça, ele APAGA os
overrides do consumidor.

### D7 · A cadeia de `transform-origin` cita as três libs

**Fixada em** 2026-09-05 (`bfe1d5182`).
**Medição**: a cadeia citava duas de três. Sem o degrau `--bits-popover-content-transform-origin`,
só o Svelte perdia a origem direcional — o painel crescia do centro em vez de
crescer do gatilho, **em silêncio**, porque `center` é fallback válido.
**Nota de método**: o nome do degrau do bits é montado a partir do rótulo que o
componente passa. No hover-card esse rótulo é `link-preview`, não `hover-card` —
não derive o nome por analogia.

### D8 · `aria-controls` só existe enquanto o painel existe

**Estado**: o gatilho declara `aria-expanded` e `aria-haspopup="dialog"` sempre, e
`aria-controls` apenas com o painel montado.
**Medição**: apontar para id ausente reprova em `aria-valid-attr-value`. No Vue há
um passo a mais — a lib escreve `aria-controls=""`, e vazio é pior que ausente.

### D9 · O vanilla ganhou sub-fábricas de cabeçalho, título e descrição

**Fixada em** 2026-09-05 (`62a902795`).
**Medição**: as classes existiam no CSS compartilhado e nas outras quatro stacks
como componentes; no vanilla quem compunha montava a `<div>` e escrevia a classe
à mão, e o `data-slot` documentado não saía em lugar nenhum.

### D10 · O título sai em `h2`, e `level` × `titleLevel` NÃO é divergência

**Fixada em** 2026-09-09.

**O nível.** `createPopoverTitle` saía em `<h4>` e passou a sair em `<h2>`. As
outras quatro anunciam nível 2: o React pelo `Popover.Title` do base-ui, que
renderiza `<h2>`; Vue e Svelte por `role="heading" aria-level="2"` escrito à mão
em 2026-08-15 justamente para casar com ele; o Angular deixa a tag para quem
consome. O `h4` entrou quatro dias depois disso, em `a8ef7a15c` — a passagem que
deu ao vanilla a CAPACIDADE de trocar o nível e, junto, escolheu um valor sem
comparar com o que as outras anunciavam. O 4 nunca teve justificativa escrita, e
nada reprovava porque qualquer nível é HTML válido.

**Os dois nomes de opção são a MESMA regra, e isto está escrito aqui porque já
foi relatado como defeito três vezes.** O nome é relativo ao que a peça monta:

| a fábrica monta | a opção se chama | exemplos |
|---|---|---|
| só o título | `level` | `createPopoverTitle`, `createCardTitle` |
| o componente inteiro, com o título como um campo entre vários | `titleLevel` | `createDialog`, `createSheet`, `createDrawer`, `createAlertDialog` |

`createCardTitle({ titleLevel })` leria "title title level". A mesma regra vale
fora do vanilla: no Svelte o wrapper de story usa `titleLevel` e o snippet emite
`level`, que é o nome da prop do bits — escopos diferentes, nomes diferentes, sem
divergência.

**Os defaults também não são arbitrários entre si**: overlay que interrompe a
página sai em `h2` (dialog, sheet, drawer, alert-dialog e agora o popover), e
card — que é conteúdo EM FLUXO — não afirma nível nenhum, saindo `<div>` como
nas outras quatro.

### D11 · O Tab para fora FECHA o painel, nas cinco

**Fixada em** 2026-09-16, decisão da dona.
**Medição, corrigida em 2026-09-17 na fonte das quatro libs**: o foco saía nas
cinco (C3), mas o painel só fechava em **duas** — react, pelo
`closeOnFocusOut = true` da base-ui (`FloatingFocusManager.js:127`, nunca
desligado em `popover/`), e angular, pela assinatura explícita de `focusOut` do
radix-ng (`radix-ng-primitives-popover.mjs:608-613`). As outras três não
fechavam, **e cada uma por uma razão diferente**:

- **vue** — a reka liga o `keydown` do `FocusScope` NO TEMPLATE
  (`FocusScope.js:168`), então ele roda com ou sem trap, e a única porteira
  (`:142`, `!loop && !trapped`) não fecha, porque o popover passa `loop`. O Tab a
  partir do último tabulável DÁ A VOLTA (`:152-156`): o foco nunca sai, e o
  `focusOutside` da `DismissableLayer` nunca dispara;
- **svelte** — o bits também passa `loop` sem condição, mas protege na
  REGISTRAÇÃO: `focus-scope.svelte.js:93-94` retorna cedo sem trap, e os
  ouvintes só nascem em `:143`. No não-modal o laço é inerte, o foco sai e o
  `onFocusOutside` dispara — só que ele só ANOTAVA o motivo, sem dispensar;
- **vanilla** — não tinha ouvinte de foco nenhum.

**A primeira versão desta decisão dizia "react, vue e angular fechavam", e
estava errada no vue** — lida na `DismissableLayer`, sem descer ao
`FocusScope`. A correção seguinte generalizou o laço da reka para o bits, e
errou no svelte. Duas leituras de alto nível, dois erros, a mesma premissa. O
que decide é ONDE a lib põe a porteira, e isso não se deriva de uma lib para
outra: se mede em cada uma.

**Como cada stack fecha no Tab da borda, estado final de 2026-09-17** — as cinco
por TECLA, com `preventDefault()`, e nenhuma por detector de foco:

| stack | interceptação | quem devolve o foco ao gatilho |
|---|---|---|
| vanilla | `keydown` no `document`, só com o foco DENTRO do painel | o `close()` da fábrica |
| react | `onKeyDownCapture` no popup — sem ela, as sentinelas da base-ui (`FloatingPortal.mjs:175-198`) mandariam o foco ao VIZINHO do gatilho; o motivo cru `imperative-action` é trocado por `focus-out` → `overlay` | o `FloatingFocusManager` da lib |
| vue | `@keydown.capture` com `stopPropagation()` — o handler da reka, ligado no template (`FocusScope.js:168`), roda na bolha do mesmo elemento e não chega a dar a volta; desligar o laço não era opção, o `PopoverContentImpl` passa `loop` fixo | o `closeAutoFocus` da reka |
| svelte | `keydown` no painel, fechando por `dismiss('overlay')` | a própria stack, pelo gatilho registrado no contexto |
| angular | `keydown` no painel, fechando com o motivo cru `focus-out` | o escopo de foco do radix-ng |

**O destino do foco — decisão da dona em 2026-09-17: volta ao GATILHO, nos dois
sentidos.** Era pendência aberta desta mesma decisão, e a Fase D a respondeu em
navegador antes de alguém decidir: o C3 dizia "segue a ordem da página", e isso
não funciona com painel em portal no fim do `<body>` — "depois dele" é fora do
documento. Medido nas suítes filtradas das cinco:

| stack | o que acontecia no Tab para fora |
|---|---|
| react | fechava, e o foco ia ao próximo focável DEPOIS DO GATILHO — a base-ui cerca o portal com sentinelas de foco (`FloatingPortal.mjs:175-198`, `getNextTabbable(domReference)`) |
| vue | fechava, e a lib devolvia o foco ao gatilho |
| vanilla | fechava, e o foco caía no `<body>` |
| svelte, angular | **nem fechavam**: o foco saía do documento sem `focusin`, e o detector de "foco saiu" das duas libs nunca disparava. Num navegador real é igual — o foco escapa para a barra de endereço |

Foram oferecidas duas saídas: a ordem lógica do gatilho, que é o que a base-ui
faz, e a devolução ao gatilho. A dona escolheu a segunda — mais simples de
implementar e de explicar, ao custo de um Tab a mais para seguir a página.

**Três consequências, e a terceira é a que mais importa:**

1. **O mecanismo passa a ser o mesmo nas cinco**: interceptar Tab/Shift+Tab na
   borda do painel, com `preventDefault()`, e fechar com `overlay`. Por TECLA, e
   não por detector de foco — a tabela acima é a prova de que detector de foco
   não dispara num portal no fim do documento. A tabela "Como cada stack fecha"
   mais acima traz os caminhos FINAIS das cinco;
2. a rodada anterior deixou de chamar `preventDefault` de propósito, "para o
   foco seguir a ordem da página" — com o destino no gatilho, o Tab nativo não
   pode mover o foco, e o comentário que dizia aquilo passou a ser falso;
3. **a asserção que só dizia "o foco saiu do painel" não prova mais nada.** Ela
   passava no vue com o foco no gatilho, no react com o foco no vizinho dele, e
   teria passado com o foco no `<body>`. A `Focused` das cinco passa a exigir o
   foco NO gatilho, nos dois sentidos.
**Por quê**: painel não-modal que continua aberto com o foco longe dele é painel
órfão — quem navega por teclado já seguiu a página, e o conteúdo fica na tela
sem dono. O motivo relatado é `overlay`, que é o que o vocabulário fechado já
reserva para "saiu do painel sem decidir nada".
**Escopo**: NÃO vale no modo modal, onde o foco fica preso e não há "sair".
**Para revisitar**: precisaria de um caso em que ler o painel enquanto se
interage com a página ao lado seja o uso esperado — e esse caso é o HoverCard.

### D12 · `aria-describedby` nas cinco

**Fixada em** 2026-09-16, decisão da dona.
**Medição**: só react e angular o emitiam, pelas libs. A maioria (3, incluindo a
referência) NÃO tinha — e mesmo assim o conteúdo compartilhado prometia o
atributo em três chaves × três idiomas, e a story do svelte
(`popover.stories.ts:67`) AFIRMAVA a ligação que a stack não entregava.
**Por quê**: aqui a maioria estava errada. A alternativa era apagar nove
afirmações de documentação e uma asserção, perdendo a leitura da descrição em
sequência ao título — que é o ganho real do atributo para quem usa leitor de
tela.
**Cuidado ao revisitar**: o par com o C6 é de papéis distintos — `labelledby`
NOMEIA, `describedby` DESCREVE. Os dois no mesmo elemento não são ambiguidade,
ao contrário do que vale para `aria-label` × `aria-labelledby` (D3).

### D13 · `data-autofocus` é o primeiro degrau do C2

**Fixada em** 2026-09-16, decisão da dona.
**Medição**: o atributo era lido só no angular (`ui/popover.ts:409`), com motivo
escrito — o Calendar dentro do Popover. Varredura do repositório inteiro no
mesmo dia: ele existe em DOIS lugares, `angular/ui/calendar.ts:374` que ESCREVE
e `angular/ui/popover.ts:409` que LÊ. Mais nada.
**O contrato, igual nas cinco**: ao abrir, o foco vai ao primeiro
`[data-autofocus]` dentro do painel; sem marca, ao primeiro focável; sem nenhum,
ao próprio painel. `[data-autofocus]` com `tabindex="-1"` VALE como alvo — é
foco programático, que é exatamente o que o atributo pede.
**Por que não virou regra de categoria**: Dialog, Sheet, Drawer e AlertDialog
não leem o atributo; eles usam o `openAutoFocus` da lib, que é outra coisa (e
`autoFocus` do InputOTP é uma terceira). Escrever isto no `18-overlay.md`
anunciaria invariante de categoria sobre metade dos componentes.

> **ASSIMETRIA REGISTRADA · 2026-09-16** — depois desta decisão as cinco LEEM o
> atributo, mas só o Calendar do angular o ESCREVE. Pôr um Calendar dentro de um
> Popover foca o dia certo sozinho ali e não nas outras quatro. Não é capacidade
> inerte (quem compõe pode marcar à mão em qualquer stack), mas é a mesma
> composição se comportando diferente. A dona decidiu em 2026-09-16 **não** puxar
> o `calendar` para a passagem do popover.
> **Fecha quando**: o `calendar` das outras quatro marcar o dia em vista com
> `data-autofocus`, como o do angular — primeira tarefa de `/pipeline fix calendar`.
>
> **E um segundo item para a mesma passagem, registrado em 2026-09-17**: a D15
> passou a fechar o painel quando o foco sai dele, e o Calendar dentro do
> Popover é o único consumidor do primitivo nas cinco stacks. A leitura diz que
> navegar a grade com as setas não fecha o painel — o foco da grade fica dentro
> dele —, mas **nada prova**: a play do `calendar-compositions` abre o painel e
> clica num dia, e nunca anda pela grade pelo teclado, em stack nenhuma.
> **Fecha quando**: a composição de seletor de data das cinco navegar a grade
> com as setas, com o painel aberto, e afirmar que ele continua aberto.

### D14 · `alignOffset` entregue nas cinco

**Fixada em** 2026-09-16, decisão da dona, sob a mesma regra "entregar ou
remover" da D2 — e invertida em relação a ela: na D2 a prop estava documentada e
faltava em duas stacks; aqui ela existia em duas e não estava documentada em
lugar nenhum.
**Medição**: prop no react (padrão `0`) e input no angular (padrão `0`); ausente
do vanilla, e vue e svelte não a declaram (só a repassam por spread). Fora do
popover, porém, `alignOffset` já é vocabulário da casa nas mesmas duas stacks —
context-menu, dropdown-menu, hover-card, menubar, navigation-menu e select no
react; combobox, context-menu, hover-card, select, menubar e dropdown-menu no
angular —, e a divergência dele já estava registrada, em aberto, na §7 do
`hover-card.md` e do `dropdown-menu.md`. Não era prop nova: era prop pela metade.
**Consequência de implementação**: o vanilla não tinha onde recebê-la. O
`positionFloating` (`src/lib/floating.ts`) recebe um `offset` só, do eixo
PRINCIPAL. O deslocamento do eixo cruzado entra em `FloatingOptions` e na função
pura `computeFloatingPosition` — **nunca como parâmetro posicional**, porque há
seis call sites naquela stack (tooltip, hover-card, dropdown-menu, menubar,
submenu, popover) e inserir posição quebraria todos. Com padrão `0`, os outros
cinco ficam idênticos.

**Esta decisão nasceu dizendo "entregue nas cinco", e a afirmação era falsa em
duas — corrigido em 2026-09-17.** A asserção nova da `SideTop` (`alignOffset: 8`,
exigindo o painel 8 px deslocado no eixo cruzado) reprovou no vue e no svelte
medindo **0 px**: as duas libs usam o `@floating-ui`, que **só aplica
deslocamento de alinhamento com `start`/`end`** — com `align: 'center'`, que é o
padrão, ele não faz nada. A base-ui, o radix-ng e o vanilla o aplicam também no
centro, e é por isso que react, angular e vanilla nunca tiveram o defeito.
Conserto nas duas: o painel passa à lib uma ÂNCORA VIRTUAL já deslocada no eixo
cruzado (vue `PopoverContent.vue`, `crossAxisReference`, com o gatilho e o
`PopoverAnchor` registrados num contexto próprio; svelte `popover-content.svelte`,
`effectiveAnchor` como `customAnchor`).

O que isto ensina além do popover: **prop de posicionamento entregue não é prop
de posicionamento que age.** A tabela de props publicava `alignOffset` nas duas
stacks antes de hoje, e ele era inerte no alinhamento padrão — o tipo compilava,
a docs page listava, e nenhuma story pedia o efeito. Vale para qualquer
`*Offset` que apareça nos vizinhos flutuantes.

### D15 · O painel não-modal fecha quando perde o foco

**Fixada em** 2026-09-17, decisão da dona.
**Medição**: as `Focused` das cinco ganharam um focável antes e outro depois do
gatilho, para a asserção de destino da D11 ter dentes — e o passo "com o foco em
Antes e o painel aberto, o Tab não fecha" mostrou três comportamentos para o
mesmo estado:

| stack | foco levado por código para fora do painel aberto |
|---|---|
| vanilla, svelte | o painel ficava aberto |
| vue, angular | o painel fechava na hora — fechamento por perda de foco da reka e do radix-ng |
| react | o `focus()` não fechava; e o Tab seguinte caía numa sentinela da base-ui posta logo antes do gatilho, fechava o painel e devolvia o foco ao mesmo lugar: **a tecla não avançava** |

O estado só era alcançável por código da aplicação: clique fora já fechava nas
cinco, e pelo teclado a D11 fecha antes de o foco sair.

**O contrato, igual nas cinco**:
- foco levado a outro elemento do documento que não esteja no painel nem seja o
  gatilho → o painel fecha, com `overlay`, **uma vez**, e o foco **fica onde foi
  posto** — não é devolvido ao gatilho, porque quem o moveu escolheu o destino;
- **o gatilho conta como parte do painel**: clicar nele com o foco dentro fecha
  uma vez só, pelo clique, sem um segundo fechamento por perda de foco. Foi
  exatamente essa disputa que fez o svelte tirar a detecção por foco em
  2026-09-17 — o clique alternava o painel e a perda de foco o fechava junto;
- **clique fora continua sendo um fechamento só**, embora o clique mova o foco
  antes de o evento de clique chegar;
- foco que sai do DOCUMENTO — outra janela, barra de endereço — **não** fecha:
  não há elemento de destino. A saída pelo teclado nas bordas do painel é da D11.

**Por quê**: é o argumento do painel órfão da D11 levado até o fim — o painel
não-modal fica aberto só enquanto o foco está nele. E alinha pela maioria das
libs, em vez de desligar comportamento de três delas.

**Consequência que conta**: o defeito da tecla engolida no react deixa de ser
alcançável. Com o `focus()` fechando, o estado "foco antes do gatilho com o
painel aberto" não existe mais.

**Como cada stack detecta a perda de foco, medido na fonte e na suíte em
2026-09-17:**

| stack | detecção | o gatilho conta como painel | o foco fica onde foi posto | clique fora = um fechamento |
|---|---|---|---|---|
| vanilla | ouvinte de `focusin` no `document`, registrado só depois que o foco entra no painel | excluído no ouvinte | o `close()` só devolve o foco quando ele estava no painel ou no `<body>` | o `close()` remove o ouvinte de clique antes de o `click` chegar |
| react | ouvinte PRÓPRIO (`onBlur`/`onFocus` do React, que atravessam portal) — o `closeOnFocusOut` da base-ui nunca disparava: o `markInsideReactTree` (`FloatingFocusManager.mjs:324`) marca o foco como interno e a checagem sai cedo (`:290-293`) | registro de gatilhos do próprio popover | a lib não puxa de volta | `closedRef` cancela o segundo — **defeito anterior a esta passagem**: clique em elemento FOCÁVEL fora gerava dois `popover_close` só com a lib |
| vue | a lib — `DismissableLayer.js:65-71` | a lib (`PopoverContentNonModal.js:138-139`) | a lib: interação fora suprime o `closeAutoFocus` (`:125`, `:134`) | a lib: o `pointerdown` fora bloqueia o `focusin` seguinte (`:140`) |
| svelte | `onFocusOutside` do bits, com o gatilho excluído | excluído no handler | a bandeira `leftByFocus` bloqueia a devolução ao gatilho | a checagem de clique fora do bits sai quando o painel já saiu (`use-dismissable-layer.svelte.js:121-125`) |
| angular | a lib | `isRelatedTargetInside` (`floating-focus-manager.mjs:509`) | `shouldPreserveMovedFocus()` (`focus-scope.mjs:655-663`) | perda de foco ignorada com o botão pressionado (`:499`), e `close()` sai cedo (`popover.mjs:215`) |

**O instrumento, porque ele decidiu três provas de dentes.** O `userEvent.click`
não reproduz a ordem real: no sintético o `click` chega antes da detecção de
perda de foco das libs, que é assíncrona, e o passo do clique no gatilho passava
COM o defeito. Duas chamadas soltas de `userEvent.pointer` não geram `click`
nenhum. O que pegou nas três stacks de lib assíncrona: pressionar e soltar na
MESMA instância de `userEvent.setup()`, com pausa de relógio entre os dois.

**E por que a cobertura antiga nunca viu o fechamento duplo do react**: a
Playground das cinco testa "clicar fora fecha" num `<p>` NÃO focável, que só
aciona o caminho do ponteiro. A `Focused` ganhou o passo em elemento focável nas
cinco. O dente foi provado no react
(sem o `closedRef`, três fechamentos) e no vue (anúncio duplicado plantado,
"expected 2 to be 1"). Nas outras três — vanilla, svelte e angular — o segundo
anúncio não se produz sem artifício, pelas guardas da última coluna da tabela
acima; ali o passo fica como portão de regressão, que reprova no dia em que a
guarda sumir.

### D16 · No modo modal, o resto da página é escondido do leitor de tela

**Fixada em** 2026-09-17, decisão da dona (item 7 da §7).
**Medição**: as cinco já prendiam o foco, travavam a rolagem e anunciavam
`aria-modal="true"` — mas esconder o resto da página, que é o que o `aria-modal`
PROMETE, só acontecia em parte: o vue escondia sempre (a reka, pelo pacote
`aria-hidden`), react e angular **só quando havia peça de fechar registrada** no
painel, e svelte e vanilla nunca. Leitores de tela honram `aria-modal` de forma
desigual, e o caso conhecido é o VoiceOver do Safari.

**O contrato**: modo modal e painel aberto → todo elemento fora do painel recebe
`aria-hidden="true"`, pelo percurso "esconder os outros" (os IRMÃOS de cada
ancestral do painel até o `<body>`), **sempre**, com ou sem peça de fechar. Ao
fechar e ao desmontar, **cada elemento volta ao valor de antes**. No modo
não-modal, nada é escondido. Com isso o modal deixa de ser três coisas e passa a
ser QUATRO (C8, D2).

**`aria-hidden`, e não `inert`**: `inert` também bloqueia ponteiro nos elementos
de fora, e isso ameaçaria "clique fora fecha". Medido no angular: se o `inert`
fosse aplicado, o clique fora ainda fecharia (o evento cai no `<body>`), mas o
controle clicado ficaria inalcançável.

**As libs não bastavam, e a razão é a mesma nas duas que tentaram**: elas tratam
`aria-hidden="false"` como "não escondido", escrevem `"true"` e, ao desfazer,
**removem o atributo** — o valor original nunca voltava (base-ui
`markOthers.mjs:91,98-99,122`; pacote `aria-hidden` 1.2.6
`dist/es2015/index.js:66,78-79,97-100`). Por isso react, angular, svelte e
vanilla escrevem o percurso, e o vue acrescenta um complemento que devolve o
`"false"` depois que a lib desfaz.

**A contagem é por ELEMENTO e no nível do documento**, não por instância: o valor
original é lido pela primeira instância que esconde e devolvido quando a última
solta. Guardar "o valor anterior" em cada instância falha com dois painéis
fechando fora de ordem — é a mesma razão da trava de rolagem contada.

**REGIÕES VIVAS não são escondidas.** A primeira redação desta decisão dizia
"todo elemento", e estava errada: escondida, uma região viva para de anunciar, e
um toast de "salvo" ou de erro fica MUDO com o painel aberto. As duas libs já
faziam a exceção (`markOthers` da base-ui; pacote `aria-hidden`
`index.js:131-133`), e foi a medição do vue e do svelte que a trouxe.

| stacks | o que fica de fora |
|---|---|
| vanilla, react, angular, svelte | `[aria-live]` com qualquer valor (inclusive `off`), `<script>`, e os seis papéis de região viva implícita: `status`, `alert`, `log`, `progressbar`, `marquee`, `timer` |
| vue | `[aria-live]` e `<script>` — **divergência de mecânica de lib**: quem escolhe é o pacote `aria-hidden` da reka, e alargar exigiria patch |

**O svelte esteve nessa segunda linha por algumas horas de 2026-09-17, e saiu.**
Ele implementou a exceção copiando o que a lib fazia — `[aria-live]` e `<script>`
— e a medição do portão mostrou que a lista das outras três era maior. Como ali o
algoritmo é NOSSO, alargar custou uma constante; o vue fica porque a escolha é do
pacote. Detalhe de implementação que vale guardar: os papéis são lidos como lista
de tokens em minúsculas, e não por seletor `[role~="status"]`, porque o seletor de
atributo do CSS **não** é insensível a caixa.

`role="region"` **continua** escondido, de propósito: marco não é anúncio.
Consequência registrada da divergência: um elemento marcado SÓ por
`role="status"`, sem `aria-live` explícito, é escondido no vue e não nas outras
quatro. O toaster da casa declara `aria-live`, então o caso alcançável é o de
quem compõe por papel.

**O valor `'trap-focus'` do angular saiu junto**, por decisão da dona no mesmo
dia: ele prendia o foco e anunciava `aria-modal` **sem** travar a rolagem e sem
esconder — metade de um contrato, que é o que a D1 e a D2 proíbem. O `modal`
daquela stack passou a ser `boolean`, como nas outras quatro, e `aria-modal`, o
laço de tabulação e o escondimento passaram a sair da MESMA pergunta, em vez de
três condições que podiam discordar.

**Portões**: passo `'Com o painel modal aberto, o resto da página fica escondido
do leitor de tela, e volta ao fechar'` na `Modal`, e
`'Uma região viva fora do painel continua anunciando com o modal aberto'` — as
duas nas cinco, com o contraste (um elemento comum CONTINUA escondido), que é o
que impede a exceção larga demais de passar. E na `Focused`,
`'No modo não-modal, o resto da página não é escondido'`. Provado com defeito
plantado nas cinco, nos três sentidos: sem esconder, sem restaurar o valor
anterior, e escondendo no não-modal.

**Medido e SEM defeito, para não ser remedido**: popover aninhado. Um segundo
popover aberto de dentro de um painel modal **não** é escondido — o percurso é um
instantâneo dos irmãos no instante de abrir, e o painel novo entra no `<body>`
depois; e nada sobra ao fechar. Um relatório desta passagem afirmou o contrário,
sem medir.

### D17 · Aberto, o painel acompanha o gatilho

**Fixada em** 2026-09-17, decisão da dona (item 8 da §7): "reposicionar nos seis
consumidores agora".
**Medição**: o vanilla calculava a posição UMA vez, ao abrir; rolar a página —
inclusive dentro de um contêiner — ou redimensionar a janela deixava o painel
parado enquanto o gatilho se movia. As outras quatro nunca tiveram o defeito: as
libs usam o `autoUpdate` do floating-ui.
**Mecanismo**: `autoUpdateFloating` (`src/lib/floating.ts`) escuta rolagem em
cada ancestral rolável do gatilho e na janela, redimensionamento da janela, e
mudança de tamanho do gatilho e do painel (`ResizeObserver`), agrupando por
quadro; devolve a limpeza. No popover é ligado ao abrir e desligado no `close()`,
que o desmonte também chama. Cada atualização refaz a posição com o MESMO `side`,
`align`, `sideOffset`, `alignOffset` e `flip`, e reescreve o `data-side`.
**Escopo**: a decisão valeu para os SEIS consumidores do `positionFloating` no
vanilla — ver a D8 do `tooltip.md` (onde a SETA é refeita a cada atualização), a
D10 do `hover-card.md` e a D13 do `dropdown-menu.md` (com a tabela de onde o
acompanhamento age e onde não age). O menu de contexto fica de fora por ser
ancorado num PONTO: não há gatilho que se mova.
**Portão**: passo `'Com o painel aberto, o gatilho deslocado e a página rolada
reposicionam o painel junto dele'` na `States/Open`, mais a `ListenerCleanup`,
que reprovou com `window:scroll` e `window:resize` sobrando quando a limpeza foi
retirada. Reposicionar não anuncia estado nem move foco, e o passo afirma isso.
**Limite declarado**: a sonda de vazamento só conta ouvintes de `window` e
`document`; os de contêiner rolável e o `ResizeObserver` ficam provados pelo
teste unitário do utilitário.

## 4. Anatomia

```
popover                       (raiz — só estado; caixa própria só no vanilla e no angular)
└── popover-trigger           o gatilho; aria-expanded + aria-haspopup="dialog"

<body>                        (portal — irmão da raiz, não filho do gatilho)
└── .nds-popover-positioner   a lib põe no lugar; o painel ocupa fluxo normal dentro dele
    │                         (classe só no react e no angular; sem data-slot em stack nenhuma)
    └── popover-content       role="dialog" · a caixa
        ├── popover-header        ESTRUTURA — coluna com gap próprio
        │   ├── popover-title        h2 (ou role="heading" aria-level="2"), peso medium
        │   └── popover-description  p nas cinco (era `div` no svelte até 2026-09-17), --muted-foreground
        └── [conteúdo arbitrário]  campo, botão, seleção — é o que distingue
                                   este painel de um menu ou de uma dica
```

**O que é obrigatório**: `popover-content`. Tudo mais é composição.

**Três formas documentadas**, e o header é opcional nas três: conteúdo livre (a
padrão), cabeçalho com título e descrição, e formulário embutido — o formulário é
conteúdo arbitrário no mesmo lugar.

**`position: absolute` NÃO fica no painel.** Quem posiciona é o positioner, e o
painel ocupa fluxo normal dentro dele. Tirar o painel do fluxo colapsava o
positioner para 0×0, e o painel passava a crescer para BAIXO a partir do ponto de
ancoragem: com `side="top"` ele cobria o próprio gatilho, sem erro e com
`data-side="top"` dizendo que estava certo. A fábrica sem lib continua cravando
`position: absolute` inline, que é onde essa responsabilidade de fato mora.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/popover.css`.

| propriedade | valor | token |
|---|---|---|
| largura | 288px | **literal** (`18rem`) — ver D6 |
| padding | 16px | `--spacing-4` |
| gap entre filhos diretos do content | 10px | `--spacing-2-5` |
| gap do header | 6px | `--spacing-1-5` — ver D4 |
| superfície | — | `--popover` |
| texto | — | `--popover-foreground` |
| descrição | — | `--muted-foreground` |
| borda | 1px | `--border` |
| raio | — | `--radius` |
| sombra | — | `--elevation-md` |
| tamanho de texto | 14px | `--text-control`, **no content** — ver D5 |
| tamanho do título | 16px | `--text-control-lg`, o mesmo do Dialog — ver D5 |
| peso do título | 500 | `--font-weight-medium` |
| camada | — | `--z-popover` |

**A sombra é `md` porque o Popover é flutuante INTERATIVO** — recebe foco e
aceita ação. O degrau sai do tipo de superfície, pela regra da categoria em
`04-padroes-design-sistema.md` §Qual degrau, e é cobrado por
`elevacao_fora_do_mapa`.

Esta linha dizia "não a `xl` do Tooltip e do HoverCard" e ficou errada no dia em
que os dois desceram para `lg` (2026-09-10): descrevia os vizinhos, então nada
que tocasse aquelas folhas passava por aqui. Agora ela cita a regra, que é o que
de fato decide o degrau.

**Animação: nenhuma**, nem para entrar nem para sair — decisão da dona em
2026-09-12.

**Histórico, porque as duas metades caíram por motivos diferentes.** A ENTRADA
saiu primeiro, por corrida de teste: `opacity: 0` no `data-starting-style` era
lido como "não visível" por checagem síncrona e derrubava `toBeVisible` nas
plays. Ficou a SAÍDA (`data-ending-style`: opacidade e `scale(0.95)` em
`--duration-fast`), e ela caiu agora por comportamento: animar a saída obriga o
painel a SOBREVIVER ao fechamento até a transição terminar — no Angular é o
portal do radix-ng que o segura, e o docblock de `ui/popover.ts` de lá registra
isso como a razão de o portal existir. Painel que continua na tela depois de a
pessoa fechar é lentidão percebida, num componente que a família trata como leve
e não-modal.

**E a saída não animava nas cinco — animava em TRÊS.** Medido em 2026-09-12
dentro de cada lib: `data-ending-style` é convenção da base-ui, e aparece em 108
arquivos do `@base-ui/react`, 33 do `@radix-ng/primitives` e 10 do `bits-ui`. Na
`reka-ui` do Vue são **zero**, e o vanilla não tem lib. A regra da folha
compartilhada declarava um movimento que dois dos cinco painéis nunca
executaram — e ninguém percebia, porque o seletor simplesmente não casava.

É a mesma espécie do `close-button` inalcançável descrito na §9: uma declaração
COMPARTILHADA que só parte das stacks consegue honrar. Nos dois casos o
documento e a folha diziam "o componente faz X", e o que decidia era o que cada
lib publicava. Tirar a animação fecha esse eixo pelo lado consistente: agora as
cinco não animam, em vez de três animarem e duas não.

Quem for reintroduzir movimento: a entrada é o lado que já custou caro, e
reintroduzi-la exige espera de relógio nas plays das cinco — e o atributo que a
dispara precisa existir nas cinco libs, ou volta a divergência de agora.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | conteúdo desmontado — não é painel escondido |
| Open | clique no gatilho | montado; foco no primeiro focável |
| Controlled | `open` vem de fora | o painel não guarda estado próprio; abrir e fechar passam pelo consumidor, avisado a cada mudança |
| Modal | `modal` ativo | foco preso, rolagem travada, `aria-modal="true"` — ver D2 |
| Transitioning | — | **não existe mais**: sem animação, o painel desmonta no fechamento (2026-09-12) |
| Focused | Tab em elemento interno | anel de foco do próprio elemento, via `--ring` |

## 7. API

Props compartilhadas — mesmo nome nas cinco, e mesmo padrão em todas menos uma
linha:

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean, …) => void` — o segundo argumento difere por stack, ver inconsistência 10 | — |
| `modal` | boolean | `false` |
| `side` | `top \| right \| bottom \| left` | `bottom` |
| `align` | `start \| center \| end` | `center` |
| `sideOffset` | number | `4` nas cinco — ver abaixo |

**O `sideOffset` do vanilla era o DOBRO, e virou `4` por decisão da dona em
2026-09-12.**
Medido no mesmo dia: `createPopover` abria com `sideOffset = 8`
(`nortear-design-system-vanilla/src/components/ui/popover.ts`), contra `4` no
`PopoverContent` do react, no do vue, no do svelte e no `input` do angular. O
valor não é compensação de seta — o popover não tem seta — e o `positionFloating`
recebe o número como vão puro, então o painel do vanilla nasce 4px mais longe do
gatilho que os outros quatro. Pior: o docblock da opção naquela fábrica diz "mesmo
nome e mesmo padrão das outras stacks", e esta tabela dizia o mesmo — duas
afirmações concordando entre si e discordando do código.

**Até 2026-09-12 esta seção abria com "mesmo nome e mesmo padrão nas cinco"**, sem
ressalva.

**Por que o `4` venceu, contra a regra de que o vanilla é a referência**: aqui o
vanilla não era a referência, era o desalinhado. O `4` é o que as quatro libs
entregam, o que o conteúdo compartilhado publica na tabela de props e o que os
snippets de três stacks ensinam; o `8` existia em um lugar só, sem justificativa
escrita, e a própria docs page do vanilla o repetia sobrescrevendo a tabela
compartilhada. A regra da referência resolve divergência de MARKUP e de
COMPORTAMENTO, onde a lib esconde o contrato — não escolha de número em que
quatro implementações e a documentação já concordam.

Mudou junto o corte do snippet: `popover.source.ts` omitia `sideOffset` quando o
valor era 8, então depois da troca ele esconderia o override real e imprimiria o
default como se fosse escolha. Passou a omitir o 4.

**Também mudou o nível do título no Angular**, no mesmo dia e pelo mesmo relato:
os 27 títulos de popover da stack saíam em `<h3>` contra o `<h2>` das outras
quatro. Ali o nível não tem default a herdar — o título é diretiva de ATRIBUTO,
e quem escreve o template escolhe a tag —, então o portão que lia o default não
tinha o que ler. Ganhou um ramo que mede call site. Detalhe do inventário: o
popover não era o único, e os outros 12 pontos do Angular (onze demos do Drawer,
um título só-para-leitor do Command) foram junto, porque a regra é da categoria.

### Divergências de forma, registradas e não "alinhadas"

Forma de API não tem fonte de verdade — cada lib tem a sua.

| stack | como difere |
|---|---|
| vanilla | fábrica: `createPopover({ trigger, content, … })` devolve `{ open, close, toggle, setOpen }` — é `setOpen` que dá forma ao modo controlado, e não há leitor de estado. Sub-fábricas `createPopoverHeader/Title/Description`; `createPopoverTitle` aceita `level` |
| vanilla, angular | recebem o nome acessível por opção/`input` (`ariaLabel`); nas outras três é atributo no elemento |
| angular | a LIB aceita `modal` não booleano (o `radix-ng` recebe também a string `'trap-focus'`), mas o wrapper **não expõe isso**: `PopoverModal` é `boolean`, como nas outras quatro, desde 2026-09-17 — o valor saiu por decisão da dona, ver D16 |
| svelte | a lib não tem `modal`; o mecanismo é `trapFocus` + `preventScroll` no Content |
| todas | o segundo argumento do `onOpenChange` (item 10): vanilla e svelte `(open, reason?)` no vocabulário do design system; vue `update:open [value, reason?]`; react `(open, eventDetails)` da base-ui; angular `RdxPopoverOpenChange`. A tabela compartilhada publica os quatro motivos fechados, que é o que atravessa as cinco |
| react, vue | o `data-slot="popover"` da RAIZ não existe (item 9): nas duas a raiz da lib não renderiza elemento, então o atributo não chegava ao DOM. Removido em 2026-09-17, em vez de ficar como atributo que ninguém pode consultar. A raiz com caixa própria é só do vanilla (`display: contents`) e do angular (`nds-inline-block`) |
| vue | ao esconder o resto da página no modo modal, a lista do que fica de fora é do pacote `aria-hidden` da reka, e é menor que a das outras quatro — ver a tabela da D16 |

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Popover`, `PopoverClose`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` |
| vue | `Popover`, `PopoverAnchor`, `PopoverClose`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` |
| svelte | `Popover`, `PopoverClose`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverPortal`, `PopoverTitle`, `PopoverTrigger` |
| vanilla | `createPopover`, `createPopoverDescription`, `createPopoverHeader`, `createPopoverTitle` — e o controle de fechar, que aqui é uma MARCA e não uma fábrica: `data-slot="popover-close"` em qualquer elemento do painel, com delegação no PAINEL |
| angular | `[ndsPopoverDescription]`, `[ndsPopoverTitle]`, `button[ndsPopoverClose]`, `button[ndsPopoverTrigger]`, `div[ndsPopoverHeader]`, `div[ndsPopover]`, `ng-template[ndsPopoverContent]` |

**O snippet de extensibilidade publicava `<nds-popover>` e `<nds-form>` até 2026-09-12**, e no Angular o
SELETOR carrega o elemento: a peça é `div[ndsPopover]`, como a linha acima já dizia e
como o `anatomy.structureCode` do conteúdo compartilhado já escrevia. A mesma
página ensinava as duas formas, e a errada era a da seção que ninguém relê — quem
copiasse receberia erro de template, porque snippet é string em JSON e nada nesta
casa o compila. Portão: `tag_angular_inexistente`, que tira a régua dos
`selector:` declarados pela própria stack.


O índice do svelte também reexporta as formas curtas — `Close`, `Content`, `Description`, `Header`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O título do popover é a exceção da família, nas duas pontas.** No vanilla ele é
o único com `level` (padrão `h2`, porque o painel é `role="dialog"` e o
`aria-labelledby` procura um cabeçalho antes de cair no nome do gatilho); no
Angular o seletor é `[ndsPopoverTitle]` **sem elemento**, então a tag é escolha
de quem escreve, sem os dois níveis fixos que dialog, sheet, drawer e
alert-dialog impõem.

**Até 2026-09-12 esta linha dizia "padrão `h4`"**, e contradizia a D10 do mesmo
arquivo, que registra a passagem para `h2` em 2026-09-09. Medido em 2026-09-12
no código: `createPopoverTitle` abre com `const { level = 2 }`
(`nortear-design-system-vanilla/src/components/ui/popover.ts`), e o docblock
acima dela carrega o histórico do `h4`. Duas afirmações sobre o mesmo default no
mesmo documento é a forma de defeito que o PRD existe para não ter: a que a
revisão de componente lê é a da §7, e era a errada.

### Inconsistências entre stacks, medidas em 2026-09-15

Medidas arquivo a arquivo no código de 2026-09-15, com leitura da fonte das libs
onde o comportamento é delas. Caminhos curtos: `react/…` é
`nortear-design-system-react/src/components/…`, e assim nas outras;
`ui/popover/` no vue e no svelte. Nada aqui foi rodado em navegador.

**Comportamento e markup**

1. **Tab para fora do painel fecha em três stacks e não fecha em duas.** react:
   a base-ui monta `FloatingFocusManager` com `closeOnFocusOut = true` por
   padrão (`@base-ui/react/floating-ui-react/components/FloatingFocusManager.js:127`),
   e `PopoverPopup.js` não o desliga. vue: a `DismissableLayer` da reka emite
   `dismiss` no `focusOutside` não prevenido (`reka-ui/dist/DismissableLayer/DismissableLayer.js:65-70`).
   angular: "outside-press + focus-out always close"
   (`radix-ng-primitives-popover.mjs:543`, fecha em `:613`). svelte: a camada
   do bits só CHAMA o `onFocusOutside`, sem dispensar
   (`bits-ui/dist/bits/utilities/dismissible-layer/use-dismissable-layer.svelte.js:80-90`),
   e `ui/popover/popover-content.svelte:97-100` só anota o motivo. vanilla: não
   há ouvinte de foco (`ui/popover.ts:556-591` trata Escape, Tab modal e clique
   fora). Maioria (3): fecha. A referência não fecha, e o C3 só diz que o foco
   sai — não diz se o painel fica. **Decisão da dona.**

   **Remedido em 2026-09-17, e este item estava errado no vue.** A
   `DismissableLayer` emite `dismiss` no `focusOutside`, como está escrito — mas
   o `focusOutside` nunca chega pelo Tab, porque o `FocusScope` da reka dá a
   volta antes (`FocusScope.js:142,152-156,168`). A maioria real era **duas**
   (react e angular), não três. Decidido e fechado pela D11, que registra o
   caminho de cada stack.
2. **`aria-describedby` só existe em duas.** react: a base-ui liga
   (`@base-ui/react/popover/popup/PopoverPopup.js:94`), provado em
   `react/ui/popover.stories.tsx:95` e `popover-variants.stories.tsx:158`.
   angular: o `RdxPopoverDescription` liga, provado em
   `angular/ui/popover.stories.ts:99-114` e `popover-variants.stories.ts:127`.
   vue, svelte e vanilla não o emitem em lugar nenhum
   (`vanilla/ui/popover.ts:423-436` só nomeia). E a story do svelte AFIRMA o que
   não entrega: `svelte/ui/popover/popover.stories.ts:67` descreve a descrição
   "ligada por aria-describedby". Maioria (3): sem — incluindo a referência —,
   contra a §8, que promete o atributo. **Decisão da dona.**
3. **O react não emite `data-state`.** vanilla escreve no gatilho e no painel
   (`ui/popover.ts:368,379`); angular na raiz, no gatilho e no painel
   (`ui/popover.ts:221,244,464`); vue e svelte recebem da lib e o afirmam nas
   stories de estado (`svelte/ui/popover/popover-states.stories.ts:125`). O react
   não escreve, e a base-ui publica `data-popup-open`/`data-open`; nenhum arquivo
   `popover*` do react menciona `data-state`. O conteúdo compartilhado cita
   `data-state` seis vezes. Maioria (4), com a referência: `data-state`.
4. **A descrição do svelte é `<div>`.** `svelte/ui/popover/popover-description.svelte:13`.
   vanilla `<p>` (`ui/popover.ts:255`), vue `<p>` (`ui/popover/PopoverDescription.vue:11`),
   react `<p>` pela base-ui (`@base-ui/react/popover/description/PopoverDescription.js:29`),
   angular `<p>` nos 20 usos das stories. Maioria (4), com a referência: `<p>`.
5. **Sem título e sem nome declarado, o nome de reserva sai de quatro receitas.**
   vanilla: `aria-label` do gatilho, senão o texto dele, senão `'Popover'`
   (`ui/popover.ts:431-435`). react: `aria-label` do gatilho, senão o texto, e
   nada se os dois faltarem (`ui/popover.tsx:151-152`). angular: `aria-label`,
   senão o texto, senão `null` (`ui/popover.ts:349-350`). svelte: SÓ o texto do
   gatilho, senão `'Popover'` — ignora o `aria-label` dele, então um gatilho só
   de ícone nomeia o painel "Popover" (`ui/popover/popover-content.svelte:67-70`).
   vue: não calcula; a reka aponta `aria-labelledby` para o gatilho
   (`ui/popover/PopoverContent.vue:44-48`). Maioria (3: vanilla, react, angular):
   `aria-label` do gatilho primeiro. O caminho do vue é mecânica de lib e dá o
   mesmo nome; o do svelte não dá.
6. **`data-autofocus` só é lido no angular.** `angular/ui/popover.ts:409` o
   prefere ao primeiro focável (motivo escrito: o Calendar dentro do Popover).
   vanilla (`ui/popover.ts:476`), react, vue e svelte não o leem. Maioria (4),
   com a referência: não lê. Registrar ou promover é **decisão da dona**.
7. **O que `modal` faz com o resto da página muda por stack.** vue: a reka
   esconde os irmãos por `aria-hidden` sempre (`useHideOthers`, citado em
   `ui/popover/Popover.vue:25-27`). react e angular: só quando há peça de fechar
   registrada no painel — `aria-hidden` na base-ui, `inert` no radix-ng
   (`react/ui/popover.tsx:20-25`, `angular/ui/popover.ts:97-99`). svelte e
   vanilla: nunca. Foco preso, trava de rolagem e `aria-modal` são iguais nas
   cinco; esta metade não. Mecânica de lib nas três com lib — registrar; a
   pergunta que sobra é se o vanilla deve esconder o resto.
8. **O vanilla posiciona uma vez só.** `positionFloating` roda em `open()`
   (`ui/popover.ts:456`) e nada reposiciona em rolagem de contêiner ou
   redimensionamento. reka, bits e radix-ng usam `autoUpdate` do floating-ui
   (`reka-ui/dist/Popper/PopperContent.js`,
   `bits-ui/dist/bits/utilities/floating-layer/use-floating-layer.svelte.js`,
   `radix-ng-primitives-popper.mjs`); na base-ui a chamada não foi localizada
   nesta medição. A folha e o conteúdo não dizem o que se espera.
9. **Raiz e positioner — divergência de framework, registrar.** vanilla: raiz
   `div[data-slot="popover"]` com `display: contents` (`ui/popover.ts:354-356`),
   sem positioner. angular: raiz `div[ndsPopover]` com `nds-inline-block` e
   positioner `.nds-popover-positioner` (`ui/popover.ts:219-220,234`). react:
   `data-slot="popover"` passado a uma raiz que não renderiza elemento
   (`ui/popover.tsx:50`), positioner com a classe (`:248`). vue: o mesmo
   `data-slot` inerte (`ui/popover/Popover.vue:73`) e o wrapper da reka sem
   classe. svelte: nem `data-slot` na raiz, e o wrapper do bits sem classe. O
   `data-slot="popover"` do react e do vue é atributo que não chega ao DOM.

**API**

10. **Divergência de API — registrar, não alinhar.** O segundo argumento do
    `onOpenChange`: vanilla `(open, reason?)` no vocabulário do design system
    (`ui/popover.ts:157`); svelte o mesmo (`ui/popover/popover.svelte:48`); vue
    `update:open [value, reason?]` (`ui/popover/Popover.vue:34-38`); react
    `(open, eventDetails)` da base-ui, com o motivo cru; angular
    `RdxPopoverOpenChange` com `reason` cru. A tabela compartilhada publica
    `(open: boolean) => void` — **corrigido em 2026-09-16** para publicar o
    segundo argumento, que as cinco entregam. E `alignOffset`: prop do react
    (`ui/popover.tsx:185`, padrão `0`) e input do angular (`ui/popover.ts:165`,
    padrão `0`), **ausente** do vanilla e da tabela compartilhada.
    **Esta linha dizia "repassado à lib no vue e no svelte", e a remedição de
    2026-09-16 a derrubou**: `alignOffset`/`align-offset` tem ZERO ocorrências
    em qualquer arquivo de popover das duas. O que existe é o spread de props
    para a lib, que não é a mesma afirmação — e a diferença importa, porque
    "repassado" faz parecer entregue. Fechado pela D14.

**Stories e asserções**

11. **O conjunto de stories de estado difere.** react: `Closed`, `Open`,
    `Controlled`, `CloseButton`, `Modal`. vue e svelte: `Closed`, `Open`,
    `Controlled`, `Modal`. vanilla: mais `Focused` e `ListenerCleanup`
    (`ui/popover-states.stories.ts:226,492`). angular: mais `Focus`
    (`ui/popover-states.stories.ts:212`) — outro nome para a mesma story. A
    `Focused` do vanilla é a única que prova o C3 (`:289`); a `Focus` do angular
    para no anel de foco. O motivo `close-button` é provado na `Playground` de
    vue, svelte, vanilla e angular e numa story própria no react
    (`react/ui/popover-states.stories.tsx:306`). Maioria (3: react, vue, svelte):
    sem story de foco; a referência tem. **Decisão da dona**:
    `Focused` nas cinco (com o passo do C3) ou em nenhuma.
12. **A `Open` abre por clique só no vanilla.** `vanilla/ui/popover-states.stories.ts:112-143`
    clica o gatilho; react, vue, svelte e angular montam com `defaultOpen` e não
    clicam. O clique está coberto pela `Playground` das cinco (C1). Maioria (4):
    `defaultOpen` — e o nome da story do svelte diz isso ("Open (defaultOpen)").
13. **Fechar por confirmação é provado de forma desigual.** `Form`: react, vue e
    angular provam o Atualizar E o Enter num campo
    (`react/ui/popover-variants.stories.tsx:266,279`,
    `vue/ui/popover/popover-variants.stories.ts:257,268`,
    `angular/ui/popover-variants.stories.ts:219,229`); svelte só o Atualizar
    (`:159`); **vanilla nenhum dos dois** — o ouvinte de `submit` existe e a play
    para em "aceitam digitação" (`vanilla/ui/popover-variants.stories.ts:177-202`).
    `EditProfile`: vue e angular provam Cancelar e Atualizar
    (`vue/…/popover-compositions.stories.ts:129,136`,
    `angular/ui/popover-compositions.stories.ts:132,145,153`); react, svelte e
    vanilla só o preenchimento. `TableFilter`: só o angular prova que Aplicar
    fecha por código (`:231`). Maioria na `Form` (3): Atualizar + Enter.
14. **A `SideTop` do vanilla mede menos.** Não passa `sideOffset`
    (`vanilla/ui/popover-compositions.stories.ts:307`, padrão 4) e não mede o
    vão nem o `data-side` no primeiro passo (`:329-340`); as outras quatro usam
    `sideOffset` 12 e exigem `data-side="top"` e o vão de 12px com espaço
    (`react/ui/popover-compositions.stories.tsx:429-436`,
    `vue/…/popover-compositions.stories.ts:445`, `svelte/…:272`,
    `angular/ui/popover-compositions.stories.ts:450`). O alinhamento no eixo
    cruzado é provado em vue, svelte e vanilla, não em react e angular. E o
    quadro: react `centered` com `nds-min-h-100` (`:40,69`); vue, svelte e
    angular `padded` na story (`vue:371`, `svelte:211`, `angular:412`); vanilla
    `padded` pelo `meta`. Maioria (4): vão de 12 medido.
15. **O `layout` dos `meta` diverge.** `popover-states`, `-variants` e
    `-compositions` são `padded` no vanilla (`:28`, `:22`, `:21`) e `centered`
    nas outras quatro. A `Playground` do vue não declara `layout`
    (`vue/ui/popover/popover.stories.ts:20-30`) — cai no `padded` padrão — contra
    `centered` nas outras quatro. Maioria (4) nos dois casos; nos três arquivos, a
    referência é a minoria.
16. **Só o svelte renomeia stories.** `name: 'Side top (auto-flip)'`
    (`svelte/ui/popover/popover-compositions.stories.ts:203`), `'Open (defaultOpen)'`
    e `'Controlled (open prop)'` (`popover-states.stories.ts:98,141`). As outras
    quatro usam o nome do export, e o menu lateral das cinco deixa de casar.
    Maioria (4): sem `name`.
17. **As plays de composição do vanilla afirmam renderização, não
    comportamento.** `TableFilter` não prova que marcar um status mantém o painel
    aberto (`vanilla/ui/popover-compositions.stories.ts:160`; nas outras quatro
    há o passo, ex. `react/…:249`); `QuickSettings` diz "renderizam com estados
    iniciais" (`:276`) onde as outras provam "independentes entre si". Maioria
    (4): comportamento.
18. **Escape na `Modal` só no vanilla; trava de rolagem em nenhuma.** O passo
    "Sem peça de fechar, o Escape é a única saída" existe só em
    `vanilla/ui/popover-states.stories.ts:463`. Nenhuma das cinco `Modal` mede a
    trava de rolagem (C8). Maioria (4): sem o passo do Escape — e a D2 explica
    por que ele importa nas cinco.

**Snippets e docs page**

19. **O svelte tem UM construtor de snippet.** `svelte/ui/popover/popover.source.ts`
    exporta só `popoverSource`, com 13 casos no teste; react 12 construtores e
    **22** casos, vue 13 e 26, vanilla 11 e 22, angular 12 e 44 (contagem de
    `it`/`test`). **O 23 do react era erro de contagem**, achado na remedição de
    2026-09-16: `^\s*(it|test)\(` devolve 22, e contando `it.each` e aninhados
    devolve 26 — nenhum dos dois métodos chega a 23. Número em PRD que ninguém
    recontou é como qualquer outra afirmação não verificada. As stories do svelte reaproveitam a `transform` do `meta`. O
    audit não reprova (o slug volta vazio), porque a regra olha a presença de
    `transform`, não a granularidade. Maioria (4): construtor por story.
20. **A tabela de props da docs page do vanilla é literal, e uma linha é
    falsa.** `vanilla/docs/PopoverDocs.ts:1145-1155` escreve tipo, padrão,
    obrigatoriedade (`'Sim'`/`'Não'`, 14 ocorrências) e várias descrições em
    português fixo, então a tabela não troca de idioma. E a linha de `side`
    (`:1147`) acrescenta "A posição é fixa: não há reposicionamento automático
    por colisão" — falso desde 2026-09-13, quando o `flip` foi ligado (D0). As
    outras quatro leem `props.table.*` do conteúdo. Maioria (4): conteúdo.
21. **O angular publica um `extensibilityCode` local.** `EXTENSIBILITY_CODE` em
    `angular/docs/PopoverDocs.ts:171`, passado em `:675`, com o motivo em `:162`.
    As outras quatro leem `props.extensibilityCode` do conteúdo
    (`react/…:1124`, `vue/…:1210`, `svelte/…:944`, `vanilla/…:1170`). É snippet
    fora do conteúdo compartilhado, invisível a quem lê o JSON — a mesma perda
    que a regra de nunca pôr `*Code` em override existe para evitar. Maioria (4):
    conteúdo — o que falta é a variante `angular` no JSON dizer o que a local
    diz.

**O que foi medido igual nas cinco**, para não ser remedido: `componentSlug:
'popover'`; os mesmos sete `trackId` nas quatro stacks com lista literal
(`default`, `withTitle`, `form`, `editProfile`, `tableFilter`, `colorPicker`,
`quickSettings`) e `trackId: key` no angular; os tipos `popover_open` e
`popover_close` idênticos nos cinco `analytics.ts`, com `reason` obrigatório;
os mesmos valores de `location` (`docs_demo`, `docs_variantes`,
`docs_composicoes`, `docs_do_dont`); as quinze seções da docs page; `sideOffset`
4, `side` `bottom` e `align` `center` como padrão; a asserção de ausência de
`aria-modal` na `Playground`; o laço de Tab e o `aria-modal` na `Modal`; a
`SideTop` exigindo o lado exato e a virada.

> **PENDÊNCIA · 2026-09-15, em fechamento desde 2026-09-16** — as inconsistências
> 1 a 21 acima estão abertas.
> **As quatro que pediam decisão da dona foram decididas em 2026-09-16**: a 1
> pela D11 (o Tab para fora fecha nas cinco), a 2 pela D12 (`aria-describedby`
> nas cinco) e a 6 pela D13 (`data-autofocus` promovido). A 11 fechou sem D
> própria, por ser o PORTÃO da D11: a `Focused` passa a existir nas cinco, com o
> passo do C3 exigindo as duas metades — o foco sai e o painel fecha. Entrou
> junto a D14 (`alignOffset` entregue nas cinco), que saiu do item 10.
> **Remedidas em 2026-09-16**: 19 dos 21 itens seguem exatos; a 10 e a 19 tinham
> afirmação errada DESTE documento, corrigidas acima.
> **FECHADA em 2026-09-17.** Os 21 itens e os seis achados novos (N1–N6) estão
> alinhados, ou declarados na tabela de forma acima com a premissa medida. As
> decisões da dona que fecharam os que dependiam dela: D11 e a devolução do foco
> ao gatilho (item 1), D12 (2), D13 (6), a `Focused` nas cinco (11), D14 (10),
> D15, D16 (7) e D17 (8). O item 13 fechou com as provas de confirmação iguais
> nas cinco, o 9 com a remoção do atributo inerte, e o N5 com a classe no lugar
> do `style` inline.

> **PENDÊNCIA · 2026-09-17** — no vanilla, com dois popovers aninhados abertos,
> **um único Escape fecha os dois**: cada instância escuta o `keydown` no
> `document`, e não há pilha de camadas. A `18-overlay.md` diz o contrário —
> "Escape fecha o overlay do topo da pilha" —, e as quatro libs mantêm essa
> pilha. Medido de passagem em 2026-09-17, ao verificar o escondimento em
> painel aninhado (D16).
> **É a MESMA família de um item já aberto**: o `dialog.md` registra, desde
> 2026-09-15, que "no vanilla um Escape fecha todos os painéis abertos". O
> mecanismo é o mesmo — ouvinte por instância no `document` —, então o conserto
> é do vanilla como um todo, não deste componente.
> **Fecha quando**: o vanilla tiver uma pilha de camadas que só entregue o
> Escape ao painel do topo, com asserção de painel aninhado no popover e no
> dialog.

> **PENDÊNCIA · 2026-09-15** — a trava de rolagem do modo modal (C8) não tem
> asserção em stack nenhuma.
> **Confirmada por varredura em 2026-09-16**: `overflow`, `scrollLock`,
> `lockBodyScroll`, `body.style`, `scrollHeight` e `scrollTop` têm ZERO
> ocorrências em todos os arquivos de story de popover das cinco stacks. As cinco
> `Modal` medem `aria-modal` e o laço de Tab, e nenhuma toca em rolagem — ou
> seja, um terço do que a D2 promete não é cobrado em lugar nenhum.
> **FECHADA em 2026-09-16**: a `Modal` das cinco mede a rolagem travada com o
> painel aberto e destravada depois de fechar, e o portão foi provado com a
> trava inerte plantada. Em 2026-09-17 a mesma story ganhou o escondimento do
> resto da página (D16), de modo que as QUATRO coisas que o `modal` liga passaram
> a ter asserção nas cinco.

## 8. Acessibilidade

**Atributos.** Painel: `role="dialog"`, mais `aria-labelledby` **ou** `aria-label`
(C6), `aria-describedby` quando há descrição — **nas cinco desde 2026-09-16**
(D12); até então só no react e no angular, onde a lib o liga —, e
`aria-modal="true"` só no modo modal — e, desde 2026-09-17, junto com o resto da
página escondido por `aria-hidden` (D16), porque anunciar inércia sem cumpri-la é
a metade que engana. Gatilho: `aria-expanded`, `aria-haspopup="dialog"`, e `aria-controls` só
com o painel montado (D8).

**Teclado.** Tab percorre os focáveis do painel; a partir do último, **fecha o
painel e devolve o foco ao gatilho** (D11). Shift+Tab espelha, a partir do
primeiro. No modo modal o Tab volta ao primeiro, e ali não há "sair". Escape
fecha e devolve o foco ao gatilho. Enter e Espaço ativam o gatilho.

**O que NÃO se faz, de propósito:**

- não se anuncia `aria-modal="false"` — atributo que anuncia o que não existe já
  custou caro nesta casa (o `aria-label` DESCARTADO em drawer e sheet, por estar
  num `div` sem papel);
- não se usa região viva: o painel não é anúncio, ele é alcançado;
- não se prende o foco por padrão — ver D1.

**Movimento reduzido**: não há movimento para reduzir. Desde 2026-09-12 a folha
não declara transição nem animação nenhuma (§5), e a guarda de
`prefers-reduced-motion` saiu junto — com o motivo escrito no fim de
`popover.css`, porque guarda que não tem o que desligar anuncia proteção
inexistente e sobrevive à leitura de quem procura por ela.

**Até 2026-09-12 esta linha dizia** que "o painel para sob
`prefers-reduced-motion`, e quem o para é a camada de TOKEN". Era verdade
enquanto a saída animava em `var(--duration-fast)`. Se o movimento voltar, volta
com ela: o mecanismo da categoria — por que a camada de token é quem para, e por
que o bloco `@media` da própria folha costuma NÃO ser quem segura — está por
extenso em `hover-card.md` §8.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `popover_open` | o painel abre | `{ component: "popover", trigger_id, location }` |
| `popover_close` | o painel fecha | `{ component: "popover", reason, location }` — `reason` obrigatório, ver abaixo |

**`trigger_id` é id estável em kebab-case**, igual nas cinco stacks, nunca o
texto traduzido — traduzido, o mesmo evento vira três valores no GA4 e a série
não junta. `location` diz de qual seção o exemplo saiu; a demonstração herda
`docs_demo` e as demais seções se nomeiam.

**`reason` é OBRIGATÓRIO, fechado e do design system** — desde 2026-09-10, por
decisão da dona: `escape | overlay | close-button | api`, as mesmas quatro
palavras do `drawer_close`, para a família ser uma dimensão só no GA4.

| motivo | caminho |
|---|---|
| `escape` | tecla Escape |
| `overlay` | saiu do painel sem decidir nada — clique fora, foco que saiu, ou clique no gatilho de novo |
| `close-button` | controle de fechar explícito DENTRO do painel — existe nas cinco desde 2026-09-12 |
| `api` | fechado por código — é aqui que cai "salvou e fechou" |

**Até 2026-09-12 a linha do `api` ficava FORA da tabela**, empurrada para depois
dos parágrafos abaixo por uma edição que cresceu no meio dela — em markdown,
linha em branco encerra a tabela, então o quarto motivo renderizava como texto
solto e a tabela do vocabulário fechado mostrava três palavras.

**A peça de fechar tem duas formas, e a diferença é de framework, não de
contrato**: nas quatro stacks de framework ela é componente ou diretiva sobre um
botão — `PopoverClose` em react, vue e svelte, `button[ndsPopoverClose]` no
angular; no vanilla é a marca direta, `data-slot="popover-close"`, com delegação
no PAINEL — e não uma sub-fábrica, porque o conteúdo do painel é montado ANTES de
`createPopover()` existir, então uma `createPopoverClose()` não teria em que
popover chamar `close()`. É a mesma escolha que o Dialog e o Sheet desta stack
fizeram em 2026-09-11 (`PATCHES.md#vanilla-overlay-close-api`).

**Até 2026-09-12 esta linha dizia "no svelte e no angular"**, e o react e o vue
tinham acabado de ganhar a peça na mesma rodada (`a2ef8471a`). Medido em
2026-09-12: `PopoverClose` está exportado no índice das três stacks de
componente, e nas três ele acrescenta a anotação do motivo por cima do
fechamento da lib — no react o `Popover.Close` do base-ui já publica
`close-press` e o `popoverCloseReason` traduz; no vue a anotação vai na FASE DE
CAPTURA, porque o handler da lib nasce antes e com `@click` simples a raiz
emitiria `api`; no svelte o `onclick` do wrapper anota antes de repassar.

**Até 2026-09-12 o `close-button` era inalcançável em três das cinco.** react,
vue e vanilla declaravam a palavra no tipo e não tinham como produzi-la; o
sintoma que a dona viu foi concreto — na story do vanilla com botões no painel, o
"Cancelar" não fechava nada, enquanto o mesmo botão no Angular fechava. E este
PRD afirmava, na mesma página, que a família "não expõe um `Popover.Close`" (§3) e
que o controle "existe no react, no svelte e no angular" (§9): duas linhas
erradas em sentidos opostos, e nenhuma delas sobre o vanilla, que é a referência.

**Duas diferenças deliberadas em relação ao drawer**, e as duas vêm de o popover
ser não-modal:

- **`trigger-press` vai para `overlay`, não para `api`.** O drawer o manda para
  `api` porque lá o gatilho fica coberto pelo véu e só código fecha por ele;
  aqui o gatilho continua clicável, e clicar de novo é vontade de quem usa.
- **O padrão é `api`, não `close-button`.** Os formulários do popover fecham POR
  CÓDIGO ao salvar; com o padrão do drawer, "concluiu" chegaria ao relatório
  como "apertou o botão de fechar" — apagando o sinal que justifica o campo
  existir, que é desistiu × concluiu.

**E até 2026-09-13 essa regra não valia em stack nenhuma**, apesar de escrita
aqui. Medido naquele dia, a partir de outra captura de tela da dona:

| stack | Cancelar | confirmar (Salvar / Aplicar) |
|---|---|---|
| react, angular | fecha · `close-button` | fecha · `close-button` — motivo ERRADO |
| vue, svelte, vanilla | fecha · `close-button` | **não fecha** — botão inerte |

Os dois lados erravam, em sentidos opostos, e o segundo é o mais silencioso: o
painel some do mesmo jeito, e os dois desfechos chegam ao relatório com o mesmo
motivo. Corrigido nas cinco: **o Cancelar é a peça de fechar; o confirmar fecha
por CÓDIGO.**

Três coisas que só apareceram implementando, e cada uma muda o conserto:

1. **Fechar por código não emite evento em duas libs.** No `@radix-ng` o
   `onOpenChange` só sai de dentro de `show()`/`close()`, e no `bits-ui` a raiz
   só chama o callback quando quem escreve o estado é a lib. Nas duas, escrever
   no `open` de fora fecha o painel **em silêncio** — trocar a peça pelo código
   sem mais nada transformaria "motivo errado" em "evento nenhum", que é pior. O
   `api` passou a ser emitido onde a decisão acontece.
2. **A `reka-ui` publica `close()` no slot da raiz**, então o vue não precisou
   tornar story nenhuma controlada — e o fechamento por ali já chega como `api`,
   porque não há anotação pendente.
3. **O submit de formulário é confirmação, e fecha no `submit`, não no clique.**
   Fechar no clique desmontaria o formulário antes do envio, e só o caminho do
   `submit` cobre o **Enter num campo**.

**Como cada stack chega ao motivo**, porque só duas o recebem pronto:

| stack | caminho |
|---|---|
| react, angular | a lib entrega o motivo cru; `popoverCloseReason` traduz — e ela mora em `popover-close-reason.ts`, arquivo PRÓPRIO ao lado do primitivo |
| vanilla | a fábrica conhece todos os caminhos e o passa em `onOpenChange(open, reason)` |
| vue, svelte | a lib NÃO publica o motivo; o painel, o gatilho e o botão de fechar o ANOTAM pelo contexto, e a raiz o entrega junto com a mudança de estado |

**Até 2026-09-12 a linha das duas primeiras dizia que a função era "exportada do
primitivo"**, e o arquivo separado não é detalhe de arrumação: cada uma das duas
stacks tem o próprio motivo escrito no topo dele. No react, exportar função de um
arquivo de componente quebra o fast refresh (`react-refresh/only-export-components`),
e a regra aponta esse caminho; no angular, o arquivo separado é o que deixa a
tradução ser PURA e se testar sem instanciar as diretivas. As duas versões da
função carregam o MESMO mapa de propósito — `escape-key` → `escape`,
`outside-press`/`focus-out`/`trigger-press` → `overlay`, `close-press` →
`close-button`, e todo o resto em `api` —, e cada uma tem o seu
`popover-close-reason.test.ts` cobrando a tabela.

**Histórico — revertido em 2026-09-10.** Até então a linha dizia "`reason` é
opcional por medição, não por descuido": o `base-ui` publicava o motivo e ele ia
no payload, a `reka-ui` não publicava e o campo saía. O argumento de que
cravar um valor seria inventar dado estava certo; o que o derrubou foi medir
duas coisas. Primeiro, o campo ia em 2 de 5 stacks — amostra enviesada com cara
de completa, em que o GA4 não separa "motivo desconhecido" de "stack que não
reporta". Segundo, as duas que mandavam repassavam o valor CRU da lib, e os
vocabulários da `base-ui` e do `radix-ng` só se sobrepõem em parte: a série não
juntava nem entre elas. O gesto, porém, é observável sem a lib — é o que o
drawer do vue e do svelte já fazia. Portão: `reason_parcial_entre_stacks`.

## 10. Reconstruir do zero

Ordem: folha → primitivo da stack → sub-partes → stories → docs page.

**Armadilha de cada stack**, todas medidas:

- **react (`base-ui`)** — `modal` sozinho não prende foco: `focusManagerModal =
  modal !== false && hasClosePart`, e `hasClosePart` conta os `Popover.Close`
  renderizados dentro do painel. A família passou a expor um em 2026-09-12, então
  o painel modal COM controle de fechar ganha o `aria-hidden` da lib sobre o
  resto da página; sem ele, quem prende é o laço de tabulação da própria stack.
  Ver D2 para a medição das duas combinações.
- **vue (`reka-ui`)** — o `PopoverContentModal` é outro componente, não uma prop;
  e há dois atributos a desfazer: o `aria-labelledby` cravado apontando para o
  gatilho, e o `aria-controls=""` no gatilho.
- **svelte (`bits-ui`)** — não existe `modal`. `trapFocus` tem padrão `true` na
  lib e precisa ser desligado explicitamente para o contrato não-modal valer.
  Desligar não custa contrato: a entrada do foco e a devolução ao gatilho rodam
  FORA do `trap`.
- **angular (`radix-ng`)** — atributo estático em `<ng-template>` não renderiza,
  então o nome acessível entra por `input`. E host binding de diretiva APAGA
  atributo estático do template: `data-slot` disputado se resolve na diretiva,
  não no ponto de uso.
- **vanilla** — sem lib: `position: absolute` inline é responsabilidade da
  fábrica. Animação não é armadilha de stack nenhuma desde 2026-09-12: a folha é
  uma só e não declara movimento, então as cinco abrem e fecham na hora.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, tokens, animação | `docs/shared/styles/nds/popover.css` |
| contrato de foco e modal (bloco canônico) | `nortear-design-system-vanilla/src/components/ui/popover.ts`, cabeçalho |
| versão curta por stack | o mesmo bloco, resumido, no primitivo de cada uma |
| texto das docs pages, props, critérios de teste | `docs/shared/content/popover/translations.json` |
| desenho, anotações de Dev Mode | Figma, página `Popover` (componente `677:3`) |
| divergências intencionais sobre libs | `PATCHES.md` |
| portões determinísticos | `node scripts/audit.mjs popover --json` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 54 chaves `nav` saíram do conteúdo em 2026-09-12.** As páginas do vue e do
svelte liam o conteúdo, e por isso "When to Use" e "Cuándo Usar" apareciam aqui
onde as outras três diziam "Usage" e "Cuándo usar".

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

> **PENDÊNCIA · 2026-09-12** — no Angular, três arquivos de story do popover não
> têm `transform` no painel Code: `popover-compositions` (5 stories),
> `popover-states` (5) e `popover-variants` (3). `node scripts/audit.mjs popover
> --json` reprova os três por `story_file_sem_transform`, e é a ÚNICA coisa que
> ele acha neste slug.
> **Medido em 2026-09-12**: `popover.source.ts` daquela stack tem **um**
> construtor, o `popoverPlaygroundSource`, contra 12 no react, 13 no vue e 9 no
> vanilla — o svelte tem um só e passa, porque as quatro stories de lá o
> reaproveitam por `transform`. Ou seja: treze stories do Angular publicam o
> template da story no painel que existe para ser COPIADO.
> **É a mesma forma que o hover-card fechou em 2026-09-09**, quando aquela stack
> passou de 1 construtor para dez, um por story, com `hover-card.source.test.ts`
> guardando os dez em 32 casos — e com a exceção das stories de markup idêntico
> declarada e a premissa verificada. O caminho é esse, e a proporção a alcançar é
> a das outras quatro.
> **Fecha quando** as treze stories tiverem construtor (ou exceção declarada com
> a premissa cobrada por caso) e o audit deste slug voltar vazio.
>
> **FECHADA em 2026-09-13; remedida em 2026-09-15.** `node scripts/audit.mjs
> popover --json` devolve `{"popover": []}` com exit 0. O Angular tem hoje **12**
> construtores em `popover.source.ts` para 14 stories — `Closed` e `Focus`
> dividem o `popoverBasicSource` (template e `props` idênticos; o que as separa é
> interação), e `Form` e `EditProfile` dividem o `popoverFormSource` — e
> `popover.source.test.ts` cobra a tabela nos dois sentidos. A
> lista `SEM_CONSTRUTOR`, que carregava seis stories cruas como dívida declarada,
> deixou de existir no mesmo dia, junto com o último item dela
> (`popover.source.test.ts:98`).


