# PRD — HoverCard

> **Estado descrito**: 2026-09-15. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.

## 1. Identidade

Cartão de apoio, mostrado no **hover e no foco** do gatilho, com conteúdo mais
longo que o de um Tooltip e ainda assim **de apoio**: quem depende dele para
concluir a tarefa precisa de outro lugar.

| vizinho | diferença que decide |
|---|---|
| Tooltip | texto curto, tem seta, não é alcançável com o ponteiro dentro |
| Popover | abre no CLIQUE e recebe foco; aceita conteúdo interativo |
| Dialog | interrompe a página |

A regra que separa este dos outros dois é a de conteúdo: **nada aqui pode ser a
única forma de chegar à informação**, e nada aqui pode ser ação destrutiva ou
submit — em touch não há caminho acessível até eles.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | Abre no hover do gatilho, depois da espera de abertura | play `Playground` (passo do ponteiro) e `Variants/WithShortDelay` (abre em menos de 550ms), nas cinco |
| C2 | Abre TAMBÉM no foco por Tab, sem exigir ponteiro | play `Playground` (`userEvent.tab()`), nas cinco; conteúdo em `accessibility.items.item1` — é o que WCAG 1.4.13 pede. Ver a inconsistência 3 da §7: foco programático não abre em duas |
| C3 | Permanece aberto enquanto o ponteiro estiver sobre o CARTÃO: dá para o cursor viajar do gatilho até ele | play `States/Open` (`panelEntrar`), nas cinco; `accessibility.items.item2` |
| C4 | `Escape` fecha | play `Playground` (passo do Escape), nas cinco; `accessibility.items.item3` — cláusula "dismissable" da 1.4.13 |
| C5 | O gatilho é DESCRITO pelo cartão via `aria-describedby`, e só enquanto o cartão existe | plays `States/Open` (aponta para `panel.id`) e `States/Closed` + fim do `Playground` (atributo ausente), nas cinco; `accessibility.items.item5` |
| C6 | Renderiza em portal, fora da raiz da página | `notes.item2`; a sonda `panelOpen()` consulta `document.body`, não o canvas |
| C7 | Sem espaço no `side` pedido, vira para o lado oposto, e o painel fica ONDE o `data-side` diz | play `Compositions/Sides` com `expectOndeDiz`, nas cinco (D8) |
| C8 | O conteúdo do cartão NÃO é o único caminho para a informação | `accessibility.items.item4`; desde a **D15** as composições `TermDefinition` e `ExplainedMetric` das cinco afirmam o link e o `href` do gatilho — era o único item desta tabela sem portão, e o que faltava não era instrumento: era o exemplo canônico cumprir a própria regra |

## 3. Decisões fixadas

### D1 · `aria-describedby`, nunca `aria-labelledby`

**Estado**: o gatilho é descrito pelo cartão, e a associação existe só com o
cartão aberto — ele só está no documento nesse intervalo.
**Por quê**: `aria-labelledby` trocaria o NOME do gatilho pelo texto do cartão. O
gatilho continua se chamando o que ele é; o cartão acrescenta descrição.

### D2 · As esperas são 600ms para abrir e 300ms para fechar

**Estado**: iguais nas cinco stacks, expostas como `openDelay`/`closeDelay`. Quatro
declaram o padrão no próprio wrapper (constantes no react e no vanilla, `withDefaults`
no vue, desestruturação no svelte); o angular não declara e herda 600/300 dos inputs
do gatilho do `radix-ng`. No angular os dois moram no GATILHO, não na raiz — ver a
tabela de divergências de forma na §7.
**Por quê**: a espera de abertura é o filtro natural contra hover de baixa
intenção — é ela que evita que passar o mouse por cima conte como engajamento.
**Orientação registrada**: para previews ricos, 300–500ms; abaixo disso o cartão
passa a abrir quando ninguém pediu.

### D3 · A largura é custom property, com o default em `:root`

**Fixada em** 2026-08-17 (`80d9e7722`).
**Estado**: `--hover-card-width: 20rem` (320px) declarado em `:root`; o painel lê
`var(--hover-card-width, 20rem)`.
**Medição**: enquanto o valor morava só no fallback, o token não existia para quem
varre o CSS à procura de declaração — gancho real de customização, invisível ao
leitor. E o lugar da declaração é `:root` porque valor declarado no seletor da
própria peça vence por especificidade e APAGA o override de quem consome.

### D4 · ~~Teto percentual não vale neste painel~~ — REVOGADA pela D8

**Fixada em** 2026-08-21 (`186d2dfdf`), **revogada em** 2026-09-13.
**O que ela dizia**: a família `nds-w-*` carrega `max-width: 100%` para não
transbordar o pai, e aqui o pai — o invólucro de posicionamento — tinha largura
**zero**. Uma porcentagem de zero é zero: `nds-w-md` derrubava o painel de 448px
para 34px. A correção foi `max-width: none` pela classe REPETIDA
(`.nds-hover-card-content.nds-hover-card-content`, especificidade (0,2,0)).
**Por que caiu**: a medição estava certa e a causa era outra. A largura zero do
invólucro não era natureza dele — era o `position: absolute` da folha (D8)
tirando o painel do fluxo. Com o painel de volta ao fluxo o invólucro tem a
largura do conteúdo, a porcentagem resolve contra um número de verdade, e a
regra virou inerte: medido removendo-a com a suíte do React em 32 de 32 verdes.
**O que sobreviveu**: a regra não podia depender de ancestral, e isso continua
valendo para a próxima. `.nds-hover-card-positioner` só existe na marcação do
React e do Angular; Vue, Svelte e Vanilla montam o painel sem invólucro nomeado.

### D8 · A folha NÃO posiciona o cartão

**Fixada em** 2026-09-13.
**Medição**: `position: absolute` morava em `hover-card.css` e derrubava as
quatro stacks de lib de uma vez. Replantado e medido pela story `Sides` do
React, com o cartão pedindo `side="top"`: `involucro=0x0`, painel publicando
`top` e terminando **76,6px ABAIXO** do topo do gatilho. Em toda stack de lib o
painel vive em FLUXO dentro de um elemento que a lib posiciona; fora do fluxo,
esse elemento colapsa para 0×0 e é contra uma caixa sem tamanho que a lib
calcula tudo — inclusive a colisão, que fica sem o que comparar.
**Quem escreve `position`**: o Vanilla, na fábrica, porque lá quem se posiciona é
o próprio painel (`measurePanel`, dentro de `positionFloating`).
**Por que ninguém viu**: a folha é válida, a lib não reclama de invólucro vazio e
o cartão APARECE. A story dos lados existia e passava, porque afirmava o
`data-side` — que a lib publica corretamente — e não a coordenada.
**Instrumento**: `expectOndeDiz` (`docs/shared/testing/hover-card-probe.ts`) cobra
o invariante que sobrevive ao flip — o painel está ONDE ELE DIZ QUE ESTÁ —, nas
cinco stacks. Portão da folha: `folha_tira_do_fluxo_sem_dizer_onde`.
**Precedente**: o tooltip mediu e removeu a mesma declaração em 2026-09-04 e
fechou sem deixar instrumento. Foi assim que a declaração sobreviveu nove dias na
folha vizinha e teve de ser medida do zero.

### D9 · O vão é 4px nas cinco, e a conta é uma só

**Fixada em** 2026-09-13.
**Medição**: o `sideOffset` era 8 no Vanilla e no Angular contra 4 nas outras
três — o Angular documentando "8 para bater com o Vanilla", premissa que era
verdadeira. Os dois foram para 4, que é o que a dona já tinha decidido para o
Popover na mesma semana: o vão é decisão do design system, e a divergência vinha
de cada stack herdar o padrão da própria lib.
**Junto veio a conta**: o Vanilla tinha um `positionHoverCard` próprio — uma
QUARTA cópia da geometria, fora da consolidação que `lib/floating.ts` registra —
e por isso nunca ganhou limite de viewport, troca de lado nem `sideOffset` como
parâmetro. Passou a chamar `positionFloating(..., { flip: true })`, que também é
quem escreve o `data-side` final.
**Terceira divergência da mesma família**: só o Vanilla não marcava o gatilho com
`data-slot="hover-card-trigger"`. A ausência não aparecia porque nenhuma story
consultava o gatilho por `data-slot` — a primeira que consultou achou zero pares
no Vanilla e quatro em todas as outras.

### D5 · O casco é o contrato; o miolo é exemplo

**Estado**: `.nds-hover-card-content` declara superfície, borda, raio, padding e
largura — e **mais nada**. A folha inteira não tem `font-size`, não tem segunda
cor de texto e não tem `gap`.
**Consequência**: o que a story de referência usa para título e corpo
(`--text-control`, `--muted-foreground`, `--spacing-2` entre eles) é escolha do
exemplo, não do sistema. Quem compõe traz o próprio ritmo.
**Registrado também no Figma**, onde a anotação de tokens separava mal as duas
listas até 2026-09-07.

### D6 · A cadeia de `transform-origin` cita as três libs, e o nome do bits é `link-preview`

**Fixada em** 2026-09-06 (`30c62422d`).
**Medição**: sem o degrau do bits, só o Svelte perdia a origem direcional — o
cartão crescia do centro em vez de crescer do gatilho, em silêncio, porque
`center` é fallback válido.
**A armadilha do nome**: no bits o equivalente do hover-card **não se chama
hover-card**, é `link-preview` — o `hover-card-content.svelte` importa
`LinkPreview as HoverCardPrimitive`, e o nome sai de
`getFloatingContentCSSVars("link-preview")`. Escrever `--bits-hover-card-…` por
simetria com tooltip e popover produziria uma variável inexistente, e nada
reprovaria.

### D7 · Os eventos existem e o campo é `trigger_id`

**Fixada em** 2026-09-06 (`30c62422d`), corrigida na prosa em 2026-09-07 (`41e155bc3`).
**Medição**: a página anunciava `hover_card_open` e `hover_card_close` como
"eventos relevantes"; nenhum dos dois existia em `AnalyticsEvents` e nenhum
preview vivo disparava evento algum. O portão não via porque cobrava
`analytics.table.*`, e este componente anuncia em PROSA.
**Correção de payload junto**: o conteúdo pedia `label` como "texto do trigger", e
texto traduzido parte o mesmo evento em um valor por idioma no GA4.

**Renomeada em 2026-09-09**, por decisão da dona: o campo passou a se chamar
`trigger_id`. O motivo é o próprio defeito que esta decisão consertou — `label`
convidava a mandar o texto do gatilho, e o nome anterior guardava metade desse
convite. `trigger_id` diz que é identificador, e não rótulo.

A medição que pesou: o campo tinha TRÊS nomes para o mesmo papel — um aqui e no
popover, `trigger_id` no tooltip (sozinho) e `label` nos quatro modais e no
command. Os dois primeiros nasceram no MESMO commit (`fb2ba485d`, 2026-07-27), a
fiação em massa de 125 arquivos: uma passagem só emitiu dois nomes para o mesmo
campo, porque nada declarava um. Portão: `campo_gatilho_divergente`. Os modais
chegaram ao mesmo nome em 2026-09-10 — o Dialog primeiro, e AlertDialog, Sheet e
Drawer no mesmo dia, por decisão da dona (`18-overlay.md` §Analytics).

### D10 · Aberto, o cartão acompanha o gatilho

**Fixada em** 2026-09-17, decisão da dona na passagem do popover ("reposicionar
nos seis consumidores do `positionFloating` agora").
**Medição**: o vanilla calculava a posição UMA vez, ao abrir. Com o cartão
aberto, rolar a página — inclusive dentro de um contêiner — ou redimensionar a
janela deixava o cartão parado enquanto o gatilho se movia.

**A frase que estava aqui — "as outras quatro stacks nunca tiveram o defeito: as
quatro libs reposicionam sozinhas" — era GENERALIZAÇÃO, e caiu em 2026-09-18.**
Ela foi escrita medindo o vanilla e presumindo as outras quatro, porque todas
usam `autoUpdate` do floating-ui em algum degrau. Medidas uma a uma, são
**quatro contra uma**:

| stack | ancestral rolável rola | ponto medido |
|---|---|---|
| vanilla | **reposiciona** | `lib/floating.ts` — `scrollAncestors` + `autoUpdateFloating` |
| react · base-ui | **reposiciona** | não há ouvinte de rolagem que dispense |
| svelte · bits-ui | **reposiciona** | `use-floating-layer.svelte.js:191-201` → `autoUpdate` com `ancestorScroll` no default |
| angular · radix-ng | **reposiciona** | `radix-ng-primitives-popper.mjs:596` → `autoUpdate`, `updatePositionStrategy` `'optimized'` |
| vue · reka-ui | **DISPENSA o cartão** | `HoverCardContentImpl.js:150-153` — escuta `scroll` na captura e chama `onDismiss()` |

**A exceção do vue é da LIB e fica declarada, não alinhada.** Rolar um ancestral
do gatilho fecha o cartão naquela stack, e o usuário vê o cartão sumir onde as
outras quatro o veem acompanhar. Não é divergência de API — é comportamento —,
mas alinhar exigiria interceptar o ouvinte de rolagem da reka antes que ele
dispense, e a decisão de pagar esse preço não é desta passagem.

**O que isto ensina sobre o documento, e é a parte que vale guardar**: a frase
generalizava a partir de UMA medição e de uma semelhança de implementação
("todas usam floating-ui"), e sobreviveu porque **nenhuma story afirmava o
comportamento nas outras quatro** — a D10 nasceu com portão só no vanilla. O
portão que falta é sempre o que deixa a frase envelhecer.

**O degrau que faltava foi construído em 2026-09-18, e a exceção do vue passou a
ser COBRADA em vez de só declarada.**

Até então nenhuma das cinco afirmava o que acontece ao rolar. As sondas cutucavam
o reposicionamento por `resize`, e nas libs que reposicionam `ancestorScroll` e
`ancestorResize` registram o MESMO callback — então o cutucão provava
reposicionamento e **não provava sobrevivência à rolagem**. A diferença entre
reposicionar e dispensar, que é a única divergência de comportamento desta
decisão, vivia só na leitura de fonte.

As cinco ganharam um passo na `States/Controlled`, com o gatilho dentro de um
ancestral rolável de verdade, e **os rótulos são diferentes de propósito** —
rótulo igual sobre comportamento oposto seria mentira para quem compara as cinco
páginas:

| stack | rótulo do passo | o que ele afirma |
|---|---|---|
| react · svelte · vanilla · angular | `'Rolar um ancestral não fecha o cartão, e ele acompanha o gatilho'` | o painel aberto continua sendo o MESMO nó, e andou junto com o gatilho |
| vue | `'Rolar um ancestral dispensa o cartão — exceção declarada da D10'` | o painel DESMONTA, e quem fechou foi a rolagem, não a espera |

**O passo do vue é o que fecha o argumento.** Ele foi provado neutralizando a
condição EXATA que a reka testa (`target.contains(gatilho)`): com ela desligada o
cartão sobrevive, e a asserção reprova dizendo que a exceção da D10 caiu. Ou
seja, o passo mede o mecanismo descrito aqui e não um efeito parecido — e no dia
em que um bump da reka mudar isso, a decisão volta para a mesa em vez de
envelhecer em silêncio.

**Três defeitos de cena e de instrumento apareceram ao construir o degrau**, e
todos os três reprovavam o componente CERTO:

- **flip lido como falta de acompanhamento.** Com o primeiro comentário curto, o
  gatilho nasce perto do topo, o painel abre para cima e rolar 60px o joga para
  fora da janela — a lib vira para baixo, o gatilho desce 60px e o painel SOBE
  42px. Reposicionamento correto, medida descaracterizada. Corrigiu-se a CENA,
  não a asserção;
- **leitura intermediária.** A sonda devolvia na PRIMEIRA mudança da coordenada,
  o que bastava quando o reposicionamento acontecia num passo só. Dentro de um
  ancestral rolável ele acontece em vários, com plateau no meio: leu `left 177`
  onde o final era 185 — os 8px do respiro do `shift` — e acusou o painel de ter
  andado 48px. Agora exige leituras iguais consecutivas, com a espera-por-mudança
  antes, para não aprovar painel que nunca se moveu;
- **contêiner sem curso.** Cena em que o ancestral não rola faz as duas metades
  passarem sem nada acontecer. A sonda cobra curso mínimo e deslocamento real do
  gatilho antes de medir — e essa guarda pegou um plantio mal feito na primeira
  tentativa, que é a evidência de que ela não é enfeite.
**Mecanismo**: `autoUpdateFloating` (`nortear-design-system-vanilla/src/lib/floating.ts`)
escuta rolagem em cada ancestral rolável do gatilho e na janela, redimensionamento
da janela, e mudança de tamanho do gatilho e do cartão, agrupando por quadro. É
ligado ao abrir e desligado no `hide()`. Cada atualização refaz a posição com o
MESMO `side`, `align` e `flip` (D9), e reescreve o `data-side` e o `data-align`
finais.
**O que não acontece**: reposicionar não chama `onOpenChange` nem move foco — o
cartão continua o mesmo, só em outro lugar.
**Portão**: DOIS passos na `States/Controlled`, e desde 2026-09-18 eles existem
nas cinco stacks.

1. **O gatilho deslocado reposiciona o painel junto dele** — `'Com o painel
   aberto, o gatilho deslocado e a página rolada reposicionam o painel junto
   dele'`. Nasceu no vanilla. O gatilho dessa story fica encostado à esquerda,
   então o passo começa o deslocamento em 200 px — com o respiro de borda, 40 px
   a partir de zero seriam parcialmente engolidos com o componente CERTO.
2. **Rolar um ancestral**, com o rótulo de cada stack na tabela acima: quatro
   afirmam que o cartão sobrevive e acompanha; o vue afirma que ele é dispensado.

Os dois moram em `floating-follow-probe.ts`, que existe nas cinco com a MESMA
assinatura — `checkPanelSurvivesAncestorScroll(panel, trigger, scroller,
{ stillOpen, by })`. A uniformidade não é estética: os dois elementos do meio são
ambos `HTMLElement`, então trocá-los de ordem numa stack faria a chamada copiada
de outra medir a coisa errada **sem o compilador ver nada**. Uma das cinco nasceu
com a ordem trocada nesta mesma rodada, por corrida entre agentes, e foi
realinhada — é a forma que o `fixture_duplicada_entre_stories` existe para pegar.
**Limite declarado**: a sonda de vazamento das stories só conta ouvintes de
`window` e `document`; os de contêiner rolável e o observador ficam provados
pelo teste unitário do utilitário.

### D11 · `alignOffset` é ZERO nas cinco

**Decidido em 2026-09-17**, pela dona. O react declarava `alignOffset: 4`; o
angular declarava 0; vue e svelte não declaravam. Passa a ser 0 nas cinco, que é
o valor do vanilla.

**Por que importava, sendo 4px**: o deslocamento cruzado só existe de verdade em
três das cinco. Todas as stories das cinco usam `align: 'center'`, e aí o
`@floating-ui` — que é quem posiciona no vue e no svelte — **ignora**
`alignOffset`, enquanto base-ui, radix-ng e a conta do vanilla o aplicam também
no centro. Ou seja, o número não divergia só no papel: o painel do react saía 4px
fora do lugar em relação aos outros quatro, e nenhuma story via, porque nenhuma
afirma a coordenada do eixo cruzado.

**Por que não virou 4 nas cinco**: alinhar por cima custaria conta própria no vue
e no svelte, que foi o preço que o popover pagou na D14 dele — e aqui não há
motivo de desenho para pagá-lo. O cartão é centrado no gatilho.

**A D9 não cobriu isto, e parecia ter coberto.** Ela fixou o vão em 4px nas cinco
e a conta numa só — mas o vão é `sideOffset`, o eixo PRINCIPAL. `alignOffset` é o
cruzado, e ficou de fora sem uma linha dizendo isso. Quem leu a D9 depois tinha
todo motivo para achar o assunto encerrado.

**Portão**: `expectCentradoNoEixoCruzado`, em `hover-card-probe.ts`, no Playground
das cinco. Ele afirma a **coordenada** — o centro do painel coincidindo com o
centro do gatilho no eixo perpendicular ao lado —, e não o valor da opção:
afirmar `alignOffset === 0` seria repetir a constante para ela mesma, que é a
forma de asserção que deixou a D8 passar meses. `ALIGN_OFFSET_PADRAO = 0` fica
declarado ao lado do `SIDE_OFFSET_PADRAO`, e é ele que a mensagem de erro cita.

**E a asserção não passa sem afastar a cena da borda**, o que não é detalhe de
implementação: o executor de teste **não aplica o `layout: 'centered'`** — isso é
do canvas do Storybook. No vitest a story renderiza encostada à esquerda, e o
painel de 320px trava em `left 0`. Medido em 2026-09-17: gatilho em `left 116.2`,
centro 15,2px fora. O painel não está descentrado por defeito; está batendo na
borda da janela. `comACenaLongeDaBorda`, na mesma sonda, é quem resolve isso nas
cinco — e mora lá para que não existam cinco formas de afastar a cena.

### D12 · Só foco VISÍVEL abre o cartão

**Decidido em 2026-09-17**, pela dona. Tab abre nas cinco, e sempre abriu. O que
diverge é `.focus()` por SCRIPT: vue, vanilla e angular abriam; react e svelte
não, porque base-ui e bits-ui filtram por `:focus-visible`. Passa a não abrir nas
cinco.

**Por quê**: o cartão é apoio pedido por um gesto. Foco movido por script não é
gesto do usuário — é a página se reorganizando —, e um painel que aparece aí é
ruído sobre alguém que não pediu nada. O caso que motiva a regra de acessibilidade
(alcançar o conteúdo pelo teclado) é o Tab, e ele segue funcionando nas cinco.

**Isto põe a referência contra o comportamento atual dela**, e é deliberado: a
regra do vanilla-referência vale para o que ele mede CERTO sobre o contrato do
design system. Aqui ele não mede uma decisão — herdou "qualquer foco abre" de não
ter filtro nenhum.

**Portão**: passo `'Foco programático não abre o cartão'` na `States/Closed` das
cinco: `focarSemGesto(trigger)`, espera de RELÓGIO maior que o atraso de abertura,
e o painel ausente. Espera de relógio e não `waitFor`, porque a prova é de
ausência.

**`trigger.focus()` pelado NÃO serve, e isto custou uma medição.** O Chromium só
trata foco de script como invisível quando o foco ANTERIOR veio do mouse —
estado que os eventos do executor não produzem. Com `.focus()` cru,
`matches(':focus-visible')` dá **true** e o cartão abre até nas stacks cujas libs
já filtram exatamente como esta decisão manda: o passo reprovaria o comportamento
certo. `focarSemGesto` embrulha `focus({ focusVisible: false })`, que é a forma
que a plataforma tem de dizer "este foco não é gesto de usuário" — a frase desta
decisão, quase palavra por palavra.

### D13 · Clique fora fecha o cartão nas cinco

**Decidido em 2026-09-17**, pela dona. react, vue, svelte e angular já fechavam;
o vanilla só fechava com Escape. Passa a fechar nas cinco.

**Por quê**: cartão de apoio que sobrevive a um clique noutro lugar é overlay
preso — o usuário já mudou de assunto e ele continua na tela, cobrindo o que veio
depois. E as duas saídas que o vanilla tinha não bastam: Escape não é caminho em
touch, e tirar o ponteiro não acontece quando o ponteiro foi para outro lugar
clicando.

**Segunda vez que a referência perde neste componente, e pelo mesmo motivo da
D12**: o vanilla não estava afirmando um contrato, estava sem o ouvinte.

**Portão**: passo `'Clique fora fecha o cartão'` na `States/Open` das cinco —
clique no `<body>`, fora do gatilho e fora do painel, e o painel desmonta. O
evento sai com o `reason` de fechamento por clique fora, como nas outras quatro.

### D14 · Ninguém anima a saída

**Decidido em 2026-09-17**, pela dona. react, svelte e angular animavam; vue e
vanilla fechavam secos. Passa a fechar seco nas cinco, e
`.nds-hover-card-content[data-ending-style]` saiu da folha.

**A causa é a mesma do tooltip, e a decisão é a mesma**: `[data-ending-style]` é
atributo de LIB e não chega às cinco. base-ui, bits-ui e radix-ng o escrevem; a
`reka-ui` instalada não o tem em `dist/`, e o vanilla desmonta o nó na hora. No
máximo três das cinco animariam, e a referência não era uma delas.

**Este componente era o gêmeo não fechado de 2026-09-16.** Naquele dia o tooltip
perdeu a transição de saída por esta razão exata, e o hover-card ficou — com a
folha declarando um movimento que duas stacks nunca executaram. Fechar os dois
com respostas opostas deixaria dois PRDs discordando sobre a mesma pergunta.

**O que sai junto**: a folha deixa de declarar movimento, e com isso a ausência
de bloco `prefers-reduced-motion` nela deixa de ser um assunto — não há o que
guardar. A §5 passa de QUINZE declarações para DOZE.

**Portão**: nenhum novo. A ausência de movimento é o estado da folha, e
`guarda_de_movimento_inerte` cobra a forma certa se ele voltar.

### D15 · As composições publicadas MODELAM o caminho alternativo, e o C8 ganha portão

**Decidido em 2026-09-17**, pela dona. Em `TermDefinition` e `ExplainedMetric` o
gatilho deixa de ser `<button>` e passa a ser um LINK com destino: o verbete no
glossário e a página da métrica. Nas cinco stacks, na story, na docs page e no
snippet do painel Code.

**O que isto conserta é a página ensinando o que ela própria não faz.** O C8 diz
que o conteúdo do cartão não pode ser o único caminho para a informação, e o
conteúdo compartilhado manda, com todas as letras, "sempre tenha um glossário ou
página dedicada como alternativa de acesso". As duas composições publicadas eram
justamente os dois casos em que esse julgamento MORDE — gatilho sem destino, num
componente que em touch não tem caminho acessível nenhum — e nenhuma das cinco
declarava a alternativa. O leitor via a regra escrita ao lado do exemplo que a
violava.

**E o C8 deixa de ser julgamento sem portão.** Era o único item do contrato com
essa marca na §2. O caminho alternativo, sendo o destino do próprio gatilho, é
verificável: a story afirma que o gatilho é um link e que o `href` aponta para
onde deve. Julgamento continua necessário para o conteúdo NOVO que alguém
escrever; o que muda é que o exemplo canônico passa a demonstrar a saída, em vez
de deixá-la implícita.

**Gatilho `<button>` continua demonstrado**, e vale dizer para ninguém "consertar"
de volta: a `Sides` usa botões, e a anatomia segue registrando que o gatilho pode
ser link, botão ou texto. O que a D15 diz não é "gatilho é link" — é "onde o
cartão carrega informação que só existe ali, o gatilho leva a ela".

**Portão**: nas cinco, `TermDefinition` e `ExplainedMetric` afirmam
`getByRole('link', …)` e o `href` do gatilho. Destinos fixos, iguais nas cinco e
nos três idiomas (URL não se traduz, como o `/users/joana` da `UserProfile` já
faz): `/glossario/wcag-2-2-aa` e `/metricas/conversao`.

## 4. Anatomia

```
hover-card                    (raiz — só estado; vira elemento só no vanilla e no angular)
└── hover-card-trigger        aria-describedby aponta para o cartão enquanto ele existe

[portal no <body>, só enquanto aberto]
└── hover-card-positioner     (classe nomeada só em react e angular; vue e svelte têm invólucro anônimo da lib; vanilla não tem)
    └── hover-card-content    a caixa — CASCO, ver D5
        └── [conteúdo arbitrário]
```

O positioner NÃO é filho do gatilho: vive no portal. `data-slot="hover-card"` só
chega ao DOM no vanilla (`<div>` com `display: contents`) e no angular (`<span>`); no
react e no vue o atributo é passado a uma raiz de lib que não renderiza elemento, e o
svelte não o escreve.

**O que é obrigatório**: `hover-card-content`. O título e o corpo do exemplo de
referência **não são partes do componente** — a story preenche o cartão com um
perfil inteiro, e as composições publicadas trazem cartão de link e cartão de
métrica.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/hover-card.css` — **doze declarações**, e o
arquivo é pequeno o bastante para a conta fechar: **nove** na tabela abaixo — a
linha da largura vale por duas, a declaração no `:root` e a leitura no painel, e a
linha de posicionamento vale por zero — e **três** fora dela, nomeadas logo depois.

Eram quinze até 2026-09-17. As três que saíram são as da saída animada, retirada
pela D14.

| propriedade | valor | token |
|---|---|---|
| largura | 320px | `--hover-card-width`, default em `:root` — ver D3 |
| posicionamento | — | **a folha não posiciona**: quem posiciona é a lib de cada stack, e o Vanilla na fábrica; ver D8 |
| padding | 16px | `--spacing-4` |
| superfície | — | `--popover` |
| texto | — | `--popover-foreground` |
| borda | 1px | `--border` |
| raio | — | `--radius` |
| sombra | — | `--elevation-lg` — flutuante passivo; era `xl` até 2026-09-10 |
| camada | — | `--z-popover` |

As seis de fora: o `transform-origin` da cadeia de três libs (D6), o `isolation`
e o `z-index` do `.nds-hover-card-positioner`, e as três da saída animada
(`opacity`, `transform`, `transition`).

Recontado em 2026-09-15: eram dezessete até 2026-09-13, quando saíram
`position: absolute` (D8) e `max-width: none` (D4).

**O degrau da sombra sai do TIPO de superfície**, não da comparação com os
vizinhos: flutuante passivo é `lg`, pela regra em
`04-padroes-design-sistema.md` §Qual degrau, cobrada por `elevacao_fora_do_mapa`.
Esta linha dizia "a mesma do Tooltip e mais alta que a do Popover (`md`)", e
descrever vizinho é o que já envelheceu a linha equivalente do popover no dia em
que tooltip e hover-card desceram de `xl` para `lg`.

**Animação**: nenhuma, desde 2026-09-17 (D14). A folha não declara movimento.

Até essa data a saída animava por `[data-ending-style]` — e só onde a lib publica
o atributo: react (base-ui), svelte (bits, `getDataTransitionAttrs`) e angular
(radix-ng). O vue (a reka instalada publica só `data-state`) e o vanilla (a
fábrica remove o painel na hora) já fechavam secos, e por isso a regra descrevia
um movimento que duas das cinco nunca executaram. A entrada nunca animou nesta
folha, de propósito: opacidade zero na entrada entrava em corrida com a checagem
síncrona de visibilidade e derrubava `toBeVisible` nas plays.

**`position: absolute` no painel ficou nesta folha até 2026-09-13** (D8), medido
e registrado aqui como dado enquanto o `tooltip.css` já o tinha tirado pelo mesmo
defeito. O que fechou foi o portão, não a linha no documento:
`folha_tira_do_fluxo_sem_dizer_onde`.

**`prefers-reduced-motion` deixou de ser uma pergunta nesta folha em 2026-09-17**,
quando a D14 tirou a saída animada: não há movimento, e portanto não há o que
reduzir. A ausência de um bloco `@media` aqui **nunca foi defeito**, e chegou a
ser relatada como tal três vezes — em 2026-09-08, 2026-09-09 e de novo hoje,
sempre pela mesma leitura, a de que esta era a única folha da categoria sem o
bloco. Enquanto havia transição, quem a parava era a camada de TOKEN: sob a
preferência, `docs/shared/tokens/motion.css` zera a escada inteira de duração, e
a transição media por ela. Medido em 2026-09-09 num motor de CSS real (Chromium
com `reducedMotion: 'reduce'`, lendo `getComputedStyle`): o painel parava, junto
com os outros 21 alvos de overlay sondados.

Vale guardar o mecanismo, porque ele continua valendo para as vizinhas. Os blocos
por folha delas são redundância, e quatro **não seguravam nada até 2026-09-17**:
a guarda mirava a classe nua, (0,1,0), contra uma declaração em
`[data-ending-style]` ou `[data-open]`, (0,2,0), e perdia na cascata — `@media`
não acrescenta especificidade. Ninguém tinha notado porque a camada de token já
fazia o trabalho. As quatro foram corrigidas, e
`guarda_de_movimento_inerte` reprova a volta; o histórico está na §8. O único
caso que o token não alcança é duração LITERAL, fora da escada — e o exemplar
mais caro dele também caiu naquele dia, no `.nds-chevron` de `utilities.css`.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | conteúdo fora do documento |
| Opening | hover ou foco, durante a espera | nada visível ainda — a espera É o estado |
| Open | espera cumprida | cartão montado; `aria-describedby` ativo |
| Closing | ponteiro sai, durante a espera de fechamento | cartão ainda montado |
| ~~Transitioning~~ | — | **não existe desde 2026-09-17** (D14): o painel desmonta ao fechar, nas cinco |

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `openDelay` | number | `600` |
| `closeDelay` | number | `300` |
| `side` | `top \| right \| bottom \| left` | `bottom` |
| `align` | `start \| center \| end` | `center` |

`side` e `align` moram no Content, não na raiz. `sideOffset` (padrão 4, D9) existe
nas cinco.

**Duas linhas da tabela não valem igual nas cinco**, medido em 2026-09-15: `open`
não existe no vanilla — lá o modo controlado é imperativo —, e `openDelay`/`closeDelay`
moram no GATILHO no angular (`hover-card.ts:246`, alias de `delay`/`closeDelay` do
`RdxPreviewCardTrigger`), e não na raiz. Os demais nomes existem nas cinco no lugar
que a tabela diz.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| svelte | a lib é `LinkPreview`, não `HoverCard`; `defaultOpen` não existe nela e é implementado no wrapper — registrado em `PATCHES.md#svelte-hovercard-defaultopen` |
| vanilla | fábrica `createHoverCard`, que devolve `{ open, close, toggle, isOpen }` — o modo controlado é imperativo, e não há `open` como opção: quem controla chama os verbos e recebe cada mudança de volta em `onOpenChange`. `isOpen()` é LEITOR, ao contrário do `setOpen()` escritor do `createPopover`, porque aqui não há opção controlada por onde andar |
| angular | `openDelay`/`closeDelay` são inputs do `ndsHoverCardTrigger`, não do `span[ndsHoverCard]`; o gatilho só aceita `a` e `button`, ganha `type="button"` quando é botão sem tipo e expõe `disabled`; a classe extra do painel é o input `contentClass` do `ng-template` |
| react | a classe extra do painel é `className`; vue, svelte e vanilla usam `class` |
| react, angular | montam o `hover-card-positioner` nomeado; vue e svelte têm invólucro anônimo da lib, e o vanilla posiciona o próprio painel |

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `HoverCard`, `HoverCardContent`, `HoverCardTrigger` |
| vue | `HoverCard`, `HoverCardContent`, `HoverCardTrigger` |
| svelte | `HoverCard`, `HoverCardContent`, `HoverCardPortal`, `HoverCardTrigger` |
| vanilla | `createHoverCard` |
| angular | `a[ndsHoverCardTrigger], button[ndsHoverCardTrigger]`, `ng-template[ndsHoverCardContent]`, `span[ndsHoverCard]` |

**O snippet de extensibilidade publicava `<nds-hover-card>` até 2026-09-12**, e no Angular o
SELETOR carrega o elemento: a peça é `span[ndsHoverCard]`, como a linha acima já dizia e
como o `anatomy.structureCode` do conteúdo compartilhado já escrevia. A mesma
página ensinava as duas formas, e a errada era a da seção que ninguém relê — quem
copiasse receberia erro de template, porque snippet é string em JSON e nada nesta
casa o compila. Portão: `tag_angular_inexistente`, que tira a régua dos
`selector:` declarados pela própria stack.


O índice do svelte também reexporta as formas curtas — `Content`, `Portal`, `Root`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

Este componente **não tem título de cabeçalho**, então não há seletor `h2[…]`
nem `h3[…]` aqui — a nota de nível de cabeçalho vale para dialog, sheet, drawer
e alert-dialog, que são os que nomeiam o painel com um cabeçalho.

### Inconsistências entre stacks, medidas em 2026-09-15

Medidas arquivo a arquivo, lendo o código das cinco stacks e a fonte instalada das
quatro libs. Nenhuma suíte foi rodada. `node scripts/audit.mjs hover-card --json`
não reporta nada (`[]`): nenhum item abaixo tem portão hoje. Caminhos curtos:
`ui/` é `src/components/ui/` de cada stack (`ui/hover-card/` no vue e no svelte),
`docs/` é `src/components/docs/HoverCardDocs.*`.

> **DESFECHO · 2026-09-18.** A passagem `fix` reconferiu os 22 contra o código e
> **os 22 continuavam valendo em substância** — só as linhas tinham andado, e só
> no vanilla, empurradas pela D10. Nenhum tinha caducado sozinho em três dias, o
> que é a informação mais útil desta lista: inconsistência medida e não fechada
> não evapora.
>
> Fecharam agora: os itens **1 a 4** viraram as decisões **D11 a D14**; os
> **10 a 16** eram a pendência de paridade de asserção, e as cinco ganharam os
> quatro passos canônicos e perderam as asserções sem dentes; os **18 a 22**
> eram docs page e conteúdo ensinando o que o código não faz.
>
> **Continuam abertos, e de propósito**: os itens **5 a 9**, que são mecânica de
> lib ou forma de framework — atributo de estado no painel, formato do `id`,
> presença da raiz no DOM, os delays morando no gatilho no angular, e a contagem
> de stories. Estes se REGISTRAM, não se alinham. A única coisa que mudou neles é
> que o item 5 deixou de ter asserção exclusiva do svelte.
>
> **O que a reconferência acrescentou, e a lista de 2026-09-15 não tinha:** a
> leitura do item 1 subestimava o defeito (dizia que o deslocamento cruzado só
> aparece em `start`/`end`; aparece em `center`, que é o que todas as stories
> usam), e o item 4 tinha precedente pronto no tooltip desde 2026-09-16 sem que
> ninguém ligasse os dois.

**Comportamento**

1. **Default de `alignOffset`.** react `4` (`ui/hover-card.tsx:178`); angular `0`
   (`ui/hover-card.ts:135`); vue e svelte não declaram, e as libs usam 0; vanilla
   não tem a opção (`HoverCardOptions`, `ui/hover-card.ts:95-110`). Maioria (3): 0.
   **RESOLVIDA pela D11 em 2026-09-17**: zero nas cinco. Quem alinha é o react.
   E a leitura que estava escrita aqui — "com `align` em `start`/`end`, o react
   desloca 4px e as outras não" — **subestimava o defeito**: em `center`, que é o
   que TODAS as stories das cinco usam, base-ui e radix-ng também aplicam o
   deslocamento cruzado; só o `@floating-ui` (vue e svelte) o ignora ali. O painel
   do react já estava 4px fora do lugar na configuração que todo mundo exercita.
2. **Que foco abre.** react só abre em `:focus-visible` (`useFocus` do base-ui,
   `PreviewCardTrigger.js:71`; comentário em `ui/hover-card.tsx:55-59`) e svelte
   também (`isFocusVisible`, `bits-ui/dist/bits/link-preview/link-preview.svelte.js:134-137`).
   vue (`reka-ui/dist/HoverCard/HoverCardTrigger.js:54`), angular
   (`radix-ng-primitives-preview-card.mjs:707-714`) e vanilla (`ui/hover-card.ts:288`)
   abrem com foco cru, inclusive programático. Maioria (3), com a referência: foco
   cru. Nas duas o filtro é da lib — alinhar exige interceptar, senão declarar.
   **RESOLVIDA pela D12 em 2026-09-17**: só foco visível abre, nas cinco. Quem
   alinha são vue, vanilla e angular.
3. **Clique fora fecha?** react (`useDismiss`, `PreviewCardRoot.js:81`), vue
   (`DismissableLayer`, `HoverCardContentImpl.js:161-167`), svelte
   (`onInteractOutside`, `link-preview.svelte.js`) e angular (`outsidePress: () => true`,
   `radix-ng-primitives-preview-card.mjs:493`) fecham. O vanilla só escuta Escape no
   documento (`ui/hover-card.ts:219-221,253`): clicar fora não fecha. Maioria (4):
   fecha; a referência não. **RESOLVIDA pela D13 em 2026-09-17**: fecha nas cinco.
   Quem alinha é o vanilla.
4. **Saída animada.** react, svelte (`getDataTransitionAttrs`, `link-preview.svelte.js:228`)
   e angular (`data-ending-style` no popup, `radix-ng-primitives-preview-card.mjs:516`)
   publicam `[data-ending-style]` e animam a saída da folha. O vue não: a reka
   publica só `data-state` (`HoverCardContentImpl.js:174`). O vanilla remove o
   painel na hora (`ui/hover-card.ts:266`). Maioria (3): anima; a referência não.
   **RESOLVIDA pela D14 em 2026-09-17**: ninguém anima, e a regra saiu da folha.
   Quem alinha são react, svelte e angular — retirando a animação, não somando-a.
5. **Atributo de estado no painel.** react e angular: `data-open`/`data-closed`; vue e
   svelte: `data-state` (`HoverCardContentImpl.js:174`, `link-preview.svelte.js:227`);
   vanilla: nenhum. Mecânica de lib — registrar, não alinhar. Mas a story
   `States/Controlled` do svelte afirma `data-state="open"`
   (`ui/hover-card/hover-card-states.stories.ts:183`), uma asserção que só existe
   nessa stack.
6. **Formato do `id` do painel.** vanilla `hover-card-N` (`ui/hover-card.ts:196`);
   react `nds-hover-card-<useId>` (`ui/hover-card.tsx:195`); vue
   `useId(undefined, 'nds-hover-card-content')` (`HoverCardContent.vue:40`); svelte
   `$props.id()`, só quando a lib não deu id (`hover-card-content.svelte:59,65`);
   angular `contentId` do radix-ng (`ui/hover-card.ts:268`). Não há contrato sobre o
   formato, só sobre o vínculo (C5). Registrar.
7. **Raiz no DOM.** Só vanilla (`<div data-slot="hover-card">` com `display: contents`,
   `ui/hover-card.ts:206-207`) e angular (`<span>`, `ui/hover-card.ts:188`) renderizam
   a raiz. react e vue passam `data-slot` a uma raiz de lib sem elemento
   (`ui/hover-card.tsx:121`, `HoverCard.vue:64`), e o svelte não o escreve. Só o
   Playground do vanilla (`hover-card.stories.ts:127`) e o do angular
   (`hover-card.stories.ts:119-120`) afirmam a raiz. Divergência de API de framework —
   registrar, não alinhar.

**API**

8. **Onde moram as esperas**, **nome da classe extra** e **forma do gatilho** no
   angular — ver a tabela de divergências de forma acima. Divergência de API —
   registrar, não alinhar.

**Stories e asserções**

9. **Conjunto de stories.** As quatro stacks de lib têm as mesmas 12 (`Playground`;
   `Variants/Default`, `WithShortDelay`; `States/Closed`, `Open`, `Controlled`;
   `Compositions/UserProfile`, `LinkPreview`, `TermDefinition`, `ExplainedMetric`,
   `Sides`, `ExtraPanelClass`). O vanilla tem 13: soma `States/ListenerCleanup`
   (`ui/hover-card-states.stories.ts:276`), que prova a limpeza dos ouvintes de
   documento que só a fábrica registra — legítima. O svelte é o único que dá `name:`
   em inglês a 7 stories (`compositions:61,90,121`, `states:88,164`,
   `variants:44,72`). Maioria (4): sem `name`.
10. **`States/Controlled` mede coisas diferentes.** react, vue, vanilla e angular
    montam dois botões externos e um espelho do estado, e afirmam abrir e fechar por
    fora (`states.stories:216-288`, `:204-269`, `:164-237`, `:194-260`). O svelte
    nasce com `open: true` nos args e afirma só que abriu e que o Escape fecha
    (`states.stories.ts:163-191`). Maioria (4): botões externos. O passo extra do
    vanilla (`:240-263`) prova `open`/`close`/`toggle`/`isOpen`, e o título dele fala
    em "apelidos em português" que a fábrica não tem mais.
11. **`onOpenChange` no Playground.** react (`hover-card.stories.tsx:173,185`), vue
    (`:170,182`), vanilla (`:141,153`) e angular (`:143,155`) afirmam que o callback
    foi chamado. O svelte nem declara o argType (`hover-card.stories.ts:32-82`) e não
    afirma. Maioria (4).
12. **`Variants/Default` afirma o `data-slot` do gatilho** no react (`:96`), vue
    (`:92`) e svelte (`:66`). O vanilla afirma só que o link é visível (`:68`), embora
    escreva o `data-slot` desde 2026-09-13 (D9). O angular afirma a ausência de um
    atributo `openDelay` (`:83`). Maioria (3): `data-slot`.
13. **`Compositions/TermDefinition` — nome do painel.** react (`:231`), vue (`:219`),
    svelte (`:153`) e vanilla (`:196`) usam `accessibleName(panel)` vazio, que olha
    `aria-label` e `aria-labelledby`. O angular só afirma a ausência de `aria-label`
    (`hover-card-compositions.stories.ts:211`). Maioria (4).
14. **`Compositions/LinkPreview` — `href` do gatilho.** Afirmado no react (`:175`),
    vue (`:162`), svelte (`:115`) e vanilla (`:137`); ausente no angular
    (`:144-151`). Maioria (4).
15. **`aria-label` nos gatilhos das stories.** Só o vanilla os escreve
    (`ui/hover-card-compositions.stories.ts:169,255,311`). Por isso o `TermDefinition`
    dele procura "Definição de WCAG 2.2 AA" e as outras quatro procuram "WCAG 2.2 AA".
    Maioria (4): sem `aria-label`. O comentário de `paresAbertos` na sonda
    compartilhada (`docs/shared/testing/hover-card-probe.ts:179-180`) ainda diz que
    "duas" stacks acrescentam.
16. **Espera de abertura do angular.** `ui/hover-card.fixtures.ts:50-62` redefine
    `waitForOpen`/`waitForQuantidade` só com `data-side`, e dispensa o `assentado` da
    sonda (`hover-card-probe.ts:59-67`: visibilidade, opacidade, `noLugarDeEspera`),
    que as outras quatro usam direto. Maioria (4): a sonda.

**Construtores de snippet e testes**

17. **Um construtor por story?** react, vue e angular: 10 exports cada. svelte: 8, e
    não tem construtor de espera curta, controlado nem fechado, então
    `States/Closed`, `Open`, `Controlled` e `Variants/WithShortDelay` publicam o
    genérico `hoverCardSource` (`states.stories.ts:33`, `variants.stories.ts:31`).
    vanilla: 5 construtores parametrizados (`hoverCardSourceWith`) — a forma de
    fábrica, legítima. No react, `Compositions/UserProfile` e `States/Open` publicam o
    genérico (`compositions:42`, `states:37`), e vue, svelte e angular usam
    `hoverCardPerfilSource`. Nome: o vue chama de `hoverCardDefaultSource` o que react,
    svelte e angular chamam de `hoverCardWaitDefaultSource`. Casos `it(` declarados:
    react 20, vue 20, angular 23, svelte 15, vanilla 15.

**Docs page e conteúdo**

18. **`trigger_id` das variantes.** No vanilla, `buildProfilePreview` crava
    `'user-profile'` (`docs/HoverCardDocs.ts:121`) e serve às variantes `default` e
    `withDelay` (`:537`, `:544`). As outras quatro mandam `'default'` e `'with-delay'`
    (react `:596,618`; vue `:751,792`; svelte `:571,588`; angular `:404,415`).
    Maioria (4). Defeito de payload: as três variantes do vanilla viram um valor só no
    GA4.
19. **Tabela de analytics do angular.** A linha de `hover_card_close` anuncia payload
    `component, reason, location` (`docs/HoverCardDocs.ts:1071`), e `reason` saiu em
    2026-09-10 (§9). As duas linhas usam `analytics.description` como coluna de
    gatilho. As outras quatro dizem `onOpenChange(true|false)` e payload sem `reason`
    (react `:918-926`, vue `:384-385`, svelte `:836-837`, vanilla `:807-815`).
    Maioria (4).
20. **Snippet de interface local do angular** (`INTERFACE_CODE`,
    `docs/HoverCardDocs.ts:186-188`): `sideOffset = input(8)` e `label = input('')`.
    O componente tem `sideOffset` 4 (`ui/hover-card.ts:132`, D9) e nenhum input
    `label`. Só o angular tem esse snippet.
21. **Snippets compartilhados de extensibilidade.** O `props.extensibilityCode.vanilla`
    termina em `card.abrir()` nos três idiomas (`translations.json:241,650,1059`), e a
    fábrica só tem `open()`. A página do vanilla o renderiza (`docs/HoverCardDocs.ts:740`).
    O `props.extensibilityCode.angular` põe `[openDelay]`/`[closeDelay]` no
    `span[ndsHoverCard]` e `class` no `<ng-template>`: nenhum dos dois funciona. A
    página do angular não o usa, porque troca por um `EXTENSIBILITY_CODE` local e
    correto (`:192-215`, `:603`), mas a variante errada continua no conteúdo
    compartilhado, que é o que o `@nortear/ds-core` publica.
22. **Demonstração.** O `href` do gatilho é `#joana` em react (`:393`), vue, svelte e
    vanilla (`:116`), e `?path=/docs/components-display-avatar--docs` no angular
    (`:554`). Maioria (4). `componentSlug` no container: svelte (`:227`) e vanilla
    (`:369`) passam; react (`:383`) e vue (`:444`) não passam; o angular não tem o
    input. É informativo, porque o container não injeta `data-track*`. As quinze
    seções e os ids de `trackId` das variantes são iguais nas cinco.

## 8. Acessibilidade

**Atributos**: gatilho com `aria-describedby` apontando para o cartão enquanto ele
existe (D1). Nenhum `role` de diálogo — este painel não é diálogo.

**Teclado**: Tab no gatilho abre; Escape fecha. Não há foco dentro do cartão, e é
por isso que ele não pode guardar ação. No react e no svelte só o foco VISÍVEL abre
(filtro da lib), e foco programático não abre; nas outras três, abre — inconsistência
2 da §7.

**O que NÃO se faz, de propósito:**

- não se põe ação destrutiva nem submit dentro do cartão — em touch não há
  caminho acessível até eles;
- não se usa `aria-labelledby` — trocaria o nome do gatilho (D1);
- não se depende do cartão como único caminho para a informação.

### Movimento reduzido — o mecanismo da categoria inteira

Fica aqui, por extenso, porque foi neste componente que a leitura errada pousou
duas vezes. Os outros oito PRDs de Overlay apontam para esta seção.

**Quem para o movimento é a camada de TOKEN, não a folha.** Sob
`prefers-reduced-motion: reduce`, `docs/shared/tokens/motion.css` zera a escada
inteira de `--duration-*` — os oito degraus, incluindo `panel` e `spring`, que
até 2026-09-08 escapavam e eram justamente os de movimento maior. Todo movimento
declarado com `var(--duration-*)` para sozinho.

**E as nove folhas da categoria declaram movimento só assim**: medido em
2026-09-09, zero durações literais em `popover`, `hover-card`, `tooltip`,
`sheet`, `dropdown-menu`, `drawer`, `dialog`, `alert-dialog` e `command`. Logo
os nove param, e o `b3f525fde` confirmou num motor de CSS real com a preferência
emulada — 28 declarações lidas por `getComputedStyle`, 22 alvos de overlay. Desde
2026-09-12 o `popover` não declara movimento NENHUM, o que o tira da conta pelo
lado de cima: são oito folhas com movimento, todas por token.

**O bloco `@media` por folha é cinto e suspensório, e alguns não seguravam
nada.** A guarda mirava a classe nua, (0,1,0), contra uma declaração em
`[data-ending-style]`, `[data-open]` ou `[data-state]`, (0,2,0), e perdia na
cascata — `@media` não acrescenta especificidade. Quatro folhas estavam assim e
foram corrigidas em 2026-09-17, com o relato na §8; o exemplo que este parágrafo
dava era o do `popover.css`, e ele saiu do mundo em 2026-09-12 junto com a
animação. Esta folha não tem bloco próprio, e isso **não é defeito**: já foi
relatado como tal duas vezes, e é o motivo de esta seção existir.

**O caso que a guarda de token NÃO cobre é duração literal**, fora de
`var(--duration-*)` — nenhum overlay tem, e o tratamento dos que têm vive no fim
de `utilities.css`. Ao acrescentar movimento a qualquer folha desta categoria, a
regra é uma só: declare a duração por token, e ela para de graça.

**E isso tem portão desde 2026-09-10, hoje em duas regras.**
`movimento_sem_guarda_eficaz` reprova duração literal em folha compartilhada sem
guarda de `prefers-reduced-motion`. `guarda_de_movimento_inerte` — acrescentada
em 2026-09-17 — reprova a guarda que EXISTE, mira a classe e perde na cascata,
por especificidade menor ou por vir antes com especificidade igual.

A separação nasceu de uma falha do portão único, e ela vale registrar: a regra
original desistia quando a duração vinha de `var(--duration-*)`, com o argumento
de que a camada de token já alcança. O argumento está certo sobre o MOVIMENTO e
errado sobre a FOLHA — o movimento para, e o bloco continua ali anunciando uma
proteção que a cascata descartou. Era exatamente por essa porta que as três
guardas desta pendência passavam sem serem vistas. Agora o token decide qual das
duas regras cobra, não se alguma cobra.

> **FECHADA · 2026-09-17** — guardas de overlay que não seguram nada, por
> especificidade: miram a classe nua (0,1,0) contra declarações em `[data-state]`,
> `[data-closed]`, `[data-open]` ou `[data-ending-style]` (0,2,0), e perdem.
> **Estreitada em 2026-09-10, porque metade fechou.** O que esta linha temia —
> "a próxima duração literal cai no vão" — passou a ser cobrado pelo
> `movimento_sem_guarda_eficaz`, que reprova exatamente a guarda que perde. O que
> sobra é enfeite: blocos que anunciam proteção sobre movimento que o token já
> para, e que o portão não acusa porque ali não há duração literal.
> **Remedida em 2026-09-15, folha a folha nas nove, sem ler esta lista: eram
> QUATRO.** A varredura de 2026-09-12 já tinha tirado o `popover.css` (deixou de
> animar, e a guarda saiu junto) e somado `tooltip.css` e `sheet.css`, que nunca
> tinham sido contados. Nenhuma duração literal nas nove.
>
> **São TRÊS desde 2026-09-16**: o `tooltip.css` saiu pelo mesmo caminho do
> `popover.css` — por decisão da dona a transição de saída foi removida (o
> `[data-ending-style]` é atributo de lib e não chegava às cinco), e a guarda saiu
> junto, com o motivo escrito na folha. Aquela folha não declara mais movimento
> nenhum.
>
> | folha | a guarda mira | a declaração que ela deveria desligar | quem vence |
> |---|---|---|---|
> | `dialog.css` | `.nds-dialog-overlay`, `.nds-dialog-content` (`:293-298`) | `…[data-open]`, `…[data-state="open"]`, `…[data-closed]` — as quatro animações (`:231-246`) | a declaração; a guarda é inerte por inteiro |
> | `dropdown-menu.css` | `.nds-dropdown-menu-item`, `.nds-dropdown-menu-content` (`:414-420`) | `.nds-dropdown-menu-content[data-open]`, `…[data-state="open"]` — a animação de entrada (`:410-412`) | a declaração; **metade** da guarda serve, porque a transição do ITEM está na classe nua (`:89`) e a guarda vem depois |
> | `sheet.css` | `.nds-sheet-overlay`, `.nds-sheet-content` (`:347-353`) | `.nds-sheet-content[data-side="…"]` — as quatro animações de entrada, uma por lado (`:129-163`) | a declaração; **metade** da guarda serve, porque a animação do VÉU (`:94`) e as duas transições (`:296`, `:305`) estão na classe nua |
>
> As três que seguram, conferidas na mesma data: `drawer.css` (a guarda repete o
> `:not([data-swiping])` da declaração e vem depois, `:309` × `:362-368`),
> `alert-dialog.css` (a guarda enumera os dez seletores de atributo, `:180-193`) e
> `command.css` (declaração e guarda na mesma classe nua, `:129` × `:298-302`).
> `hover-card.css` e `popover.css` não têm guarda, de propósito. Quem fechar isto
> varre as nove folhas de novo, e não relê esta lista.
>
> **COMO FECHOU, em 2026-09-17.** A varredura foi feita por INSTRUMENTO, sobre as
> **52** folhas de `docs/shared/styles/nds/` e não sobre as nove — a lista já
> tinha errado a conta duas vezes, e comparar especificidade a olho é como ela
> errou. As três se confirmaram, e a varredura larga trouxe o que a estreita não
> tinha:
>
> - `dialog.css`, `dropdown-menu.css` e `sheet.css` — a guarda passou a repetir os
>   ATRIBUTOS da declaração, que é a forma que `alert-dialog.css` já usava certo.
>   Doze declarações de movimento que o bloco dizia desligar e não desligava.
> - `calendar.css` — **quarta folha, e fora da categoria**: a guarda estava na
>   linha 102 e as duas classes que ela mira são declaradas em `:200` e `:476`.
>   Especificidade IGUAL e guarda antes: quem vem depois vence. Foi para o fim do
>   arquivo. Nenhuma varredura "das nove" a encontraria, porque calendário não é
>   overlay — e o defeito nunca foi da categoria, era da cascata.
> - `utilities.css` — `.nds-chevron` media `var(--duration, 200ms)`, e
>   **`--duration` sem sufixo não existe na escada**: esta linha era o único
>   consumo dele no repositório, então o que sempre valia era o fallback. O
>   chevron ficava fora da camada de token e girava sob a preferência em **106
>   pontos de 40 arquivos** — o disclosure do sistema inteiro. Aqui não havia
>   guarda a consertar: o defeito era estar fora da escada. `--duration-base` vale
>   200ms, então a troca é idêntica na tela.
>
> Sobraram treze classes com movimento que a guarda da própria folha não menciona
> — e nenhuma é defeito: todas medem por `var(--duration-*)`, e a camada de token
> as para. Cinto sem suspensório não é o mesmo que suspensório arrebentado, e foi
> confundir os dois que fez esta lista oscilar entre três e quatro.
>
> **O que impede a volta**: `guarda_de_movimento_inerte`, provado plantando o
> defeito no `dialog.css` (4 → 10 → 4 achados, plantio e restauro na mesma
> chamada).

> **FECHADA · 2026-09-18** — docs pages e conteúdo compartilhado ensinavam ou mediam
> o que o código não faz: `reason` na tabela de analytics do angular e
> `sideOffset = input(8)` e `label = input('')` no `INTERFACE_CODE` dele (§7, itens
> 19 e 20); `card.abrir()` no `props.extensibilityCode.vanilla` e delays na raiz no
> `props.extensibilityCode.angular` (item 21); `trigger_id` `user-profile` nas
> variantes `default` e `withDelay` do vanilla (item 18).
> **Fecha quando**: `grep` não acha `reason` no `HoverCardDocs.ts` do angular, nem
> `input(8)`/`label = input` ali, nem `abrir()` em
> `docs/shared/content/hover-card/translations.json`; a variante `angular` de
> `props.extensibilityCode` põe as esperas no `ndsHoverCardTrigger` e a classe em
> `contentClass`; e o vanilla manda `default` e `with-delay`.
>
> **Fechou, e com dois itens que a lista não tinha.** O `reason`, o `input(8)`, o
> `label`, o `abrir()`, os delays e os três `trigger_id` saíram. A reconferência
> achou mais: `anatomy.structureCode.vanilla` chamava DOIS helpers inexistentes,
> com nome diferente em cada idioma (`criarAvatar`/`buildAvatar`/`construirAvatar`
> — identificador não se traduz, e nenhum dos seis existia); e
> `tokens.customizationCode` ensinava a acelerar uma transição que a D14 acabava
> de remover. Os dois são snippet que o leitor COPIA, publicado nas cinco páginas
> de uma vez.
>
> Fechou também o que a lista chamava de item 22: o gatilho da demonstração do
> angular apontava para a docs page do Avatar enquanto as outras quatro apontavam
> para `#joana`. Alinhado à maioria, que inclui a referência — o cartão é prévia
> de perfil, e a página do Avatar não é o assunto dele.

> **FECHADA · 2026-09-18** — paridade de asserção entre as stories (§7, itens 10 a
> 16): `onOpenChange` sem asserção no Playground do svelte; `States/Controlled` do
> svelte sem botões externos; `Variants/Default` sem `data-slot` no vanilla e no
> angular; `TermDefinition` sem `accessibleName` e `LinkPreview` sem `href` no angular;
> `waitForOpen` próprio do angular sem o `assentado` da sonda; `aria-label` só nos
> gatilhos do vanilla; e o título de passo "apelidos em português" no vanilla.
> **Fecha quando**: cada story citada afirma nas cinco o que a maioria afirma, ou
> declara na própria story por que não afirma (premissa verificada); e o
> `hover-card.fixtures.ts` do angular deixa de redefinir a espera.
>
> **Fechou, e o que ela custava estava subestimado.** As cinco ganharam quatro
> passos canônicos com rótulo idêntico, e caíram: quatro asserções do angular que
> não podiam reprovar (uma delas afirmando um atributo DOM que binding de
> propriedade nunca escreve, e que passava igual na story ao lado que o declara);
> um `waitFor` lendo `CSSStyleDeclaration` VIVO, que não reprovava e penduraria;
> o `posicionado()` local do angular, que devolvia painel possivelmente invisível;
> a `States/Controlled` do svelte, com 3 asserções contra 11 do vanilla; e a play
> do `ExtraPanelClass`, que afirmava classe e largura e não afirmava o miolo — foi
> por ela que um ramo de conteúdo faltando sobreviveu meses no svelte, com a story
> VERDE mostrando o cartão errado.
>
> E uma forma NOVA quase entrou junto: a asserção de `href` da D15 nasceu
> comparando a constante do próprio arquivo com ela mesma, em duas stacks. Medido:
> com as duas URLs trocadas para um destino errado, a forma tautológica fecha
> **6/6 verde**. A lição está em `.claude/commands/quality.md`, na lista das
> asserções que não podem reprovar.

> **DECIDIDA · 2026-09-17** — comportamento que divergia sem decisão registrada
> (§7, itens 1 a 4): `alignOffset` 4 só no react; foco programático não abre no
> react e no svelte; clique fora não fecha no vanilla; saída animada ausente no vue
> e no vanilla. Os três últimos punham a referência (vanilla) contra a maioria, e
> por isso não se alinhavam sem a dona.
>
> As quatro viraram decisão na mesma rodada: **D11** (zero nas cinco), **D12** (só
> foco visível abre), **D13** (clique fora fecha nas cinco) e **D14** (ninguém
> anima a saída).
>
> Duas leituras que a medição corrigiu na hora de decidir, e que valem mais que as
> decisões em si:
>
> - o item 1 parecia coberto pela **D9** e não estava — ela fixou o `sideOffset`,
>   que é o eixo principal, e o `alignOffset` ficou de fora sem uma linha dizendo;
> - em **dois dos três** casos em que "a referência contradiz a maioria", o vanilla
>   não estava afirmando contrato nenhum: estava sem o ouvinte (D13) e sem o filtro
>   (D12). A regra da referência vale para o que ele mede certo, e ausência não é
>   medição.
>
> **Fecha quando**: o código das cinco cumpre as quatro, com os portões que cada
> uma nomeia.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `hover_card_open` | o cartão abre | `{ component: "hover-card", trigger_id, location }` |
| `hover_card_close` | o cartão fecha | `{ component: "hover-card", location }` |

`trigger_id` é id estável em kebab-case, **nunca** o texto do gatilho traduzido — ver
D7. Os tipos são iguais nas cinco `lib/analytics.ts` (`trigger_id` e `location`
opcionais). Os valores das docs pages são iguais em quatro. O vanilla manda
`user-profile` também para as variantes `default` e `with-delay` (inconsistência 18
da §7). A espera de abertura serve de filtro contra hover de
baixa intenção, então não há necessidade de filtrar de novo no consumidor.

**O fechamento leva só `component` e `location`** — nem `trigger_id`, nem
`reason`.

**`reason` SAIU em 2026-09-10**, por decisão da dona. O campo ia em 1 de 5
stacks — só o angular, com o valor cru do `radix-ng` (`trigger-hover`,
`escape-key`, `outside-press`) —, e isso é amostra enviesada com cara de completa:
o GA4 não separa "motivo desconhecido" de "stack que não reporta". A saída
coerente era espalhar ou remover, e espalhar exigiria um vocabulário novo mais
a tradução nas cinco. Removido porque o componente é PASSIVO: fechar é quase
sempre "o ponteiro saiu", e ninguém ia agir sobre a quebra. O popover, que
aceita formulário e onde desistiu × concluiu é pergunta de produto, ficou com o
campo — obrigatório e fechado. Portão: `reason_parcial_entre_stacks`.

As tabelas de analytics das docs pages trazem uma linha por evento nas cinco. A do
angular ainda anuncia `reason` no fechamento (inconsistência 19 da §7).

## 10. Reconstruir do zero

Ordem: folha → primitivo → stories → docs page.

- **svelte (`bits-ui`)** — o componente se chama `LinkPreview`. Isso contamina
  dois pontos: o import e o nome da custom property de origem (D6).
- **react (`base-ui`) e angular (`radix-ng`)** — nomeiam o positioner; qualquer
  regra que dependa dele vale só nessas duas (D4, e foi por isso que ela caiu).
- **vue (`reka-ui`)** — sem positioner nomeado.
- **vanilla** — sem lib: as duas esperas são timers próprios, e o cartão precisa
  ouvir `mouseenter` para cumprir C3.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, tokens e largura | `docs/shared/styles/nds/hover-card.css` |
| texto, props, critérios de teste | `docs/shared/content/hover-card/translations.json` |
| divergências intencionais sobre libs | `PATCHES.md` |
| desenho e anotações | Figma, página `HoverCard` (componente `674:3`) |
| portões determinísticos | `node scripts/audit.mjs hover-card --json` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 57 chaves `nav` saíram do conteúdo em 2026-09-12.** As páginas do vue e do
svelte liam o conteúdo: "When to Use" contra "Usage", e "Tests" contra
"Pruebas". O menu passa a ser o mesmo nas cinco.

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas — e desde a mesma
data o TÍTULO da seção é a mesma frase, derivada do mesmo lugar. A linha abaixo
registra por quê. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

**As 42 chaves de título de seção saíram do conteúdo em 2026-09-12**, e
**15 delas diziam palavra diferente da do item de menu que salta para a
seção** — "Quando e Como Usar" contra "Quando Usar", "Design Tokens" contra
"Tokens", "Componentes Relacionados" contra "Relacionados". O `h2` agora
nasce do id que a própria seção declara, então divergir deixou de ser possível
em vez de passar a ser proibido. Portões: `titulo_de_secao_no_conteudo`,
`titulo_de_secao_pedido_ao_conteudo` e `titulo_passado_ao_container` — o
terceiro existe porque no Angular um `[title]` esquecido **não** reprova no
`ngc` (é atributo global do HTML) e viraria tooltip silencioso no cabeçalho.



> **FECHADA · 2026-09-09** — a pendência de 2026-09-08 (os três arquivos de
> story do Angular sem `transform` no painel Code). `audit.mjs hover-card` não
> reporta mais `story_file_sem_transform`.
>
> *Primeira metade, 2026-09-08*: a docs page do Angular renderizava 3 dos 5
> itens de `usage.guidelines` e passou a renderizar os cinco.
>
> *Segunda metade, 2026-09-09*: o Angular passou de 1 construtor para 12
> stories a **dez construtores** em `hover-card.source.ts`, um por story, com as
> doze stories fiadas — a proporção que esta campanha mediu em tooltip, sheet,
> dropdown-menu, context-menu e drawer. `hover-card.source.test.ts` guarda os
> dez com **32 casos**. A única exceção é declarada e tem a premissa verificada:
> States/Closed, States/Open e Compositions/UserProfile renderizam o mesmo markup
> e compartilham `hoverCardPerfilSource` — como nas outras quatro stacks —, e um
> caso compara os três templates entre si, reprovando nomeando a story que
> divergir. Outro caso cobra que todo par story×transform esteja na tabela, de
> modo que story nova sem construtor reprova em vez de herdar em silêncio.
