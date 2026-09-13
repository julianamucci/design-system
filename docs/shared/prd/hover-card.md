# PRD — HoverCard

> **Estado descrito**: 2026-09-12. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

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
| C1 | Abre no hover do gatilho, depois da espera de abertura | play, nas cinco |
| C2 | Abre TAMBÉM no foco por Tab, sem exigir ponteiro | `accessibility.items.item1` — é o que WCAG 1.4.13 pede |
| C3 | Permanece aberto enquanto o ponteiro estiver sobre o CARTÃO: dá para o cursor viajar do gatilho até ele | `accessibility.items.item2` |
| C4 | `Escape` fecha | `accessibility.items.item3` — cláusula "dismissable" da 1.4.13 |
| C5 | O gatilho é DESCRITO pelo cartão via `aria-describedby`, e só enquanto o cartão existe | `accessibility.items.item5` |
| C6 | Renderiza em portal, fora da raiz da página | `notes.item2` |
| C7 | Sem espaço no `side` pedido, vira para o lado oposto | story de posicionamento |
| C8 | O conteúdo do cartão NÃO é o único caminho para a informação | `accessibility.items.item4` — julgamento, sem portão automático |

## 3. Decisões fixadas

### D1 · `aria-describedby`, nunca `aria-labelledby`

**Estado**: o gatilho é descrito pelo cartão, e a associação existe só com o
cartão aberto — ele só está no documento nesse intervalo.
**Por quê**: `aria-labelledby` trocaria o NOME do gatilho pelo texto do cartão. O
gatilho continua se chamando o que ele é; o cartão acrescenta descrição.

### D2 · As esperas são 600ms para abrir e 300ms para fechar

**Estado**: iguais nas cinco stacks, expostas como `openDelay`/`closeDelay`.
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

## 4. Anatomia

```
hover-card                    (raiz — só estado)
└── hover-card-trigger        aria-describedby aponta para o cartão enquanto ele existe
    └── hover-card-positioner (existe na marcação de react e angular; as outras três não o nomeiam)
        └── hover-card-content  a caixa — CASCO, ver D5
            └── [conteúdo arbitrário]
```

**O que é obrigatório**: `hover-card-content`. O título e o corpo do exemplo de
referência **não são partes do componente** — a story preenche o cartão com um
perfil inteiro, e as composições publicadas trazem cartão de link e cartão de
métrica.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/hover-card.css` — **dezessete declarações**, e o
arquivo é pequeno o bastante para a conta fechar: **onze** nas dez linhas da
tabela abaixo — a linha da largura vale por duas, a declaração no `:root` e a
leitura no painel — e **seis** fora dela, nomeadas logo depois.

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

**Até 2026-09-12 esta seção prometia "dezesseis declarações, e a lista abaixo é
toda ela"**, e a lista tinha nove linhas. Medido em 2026-09-12, contando a folha:
eram dezessete, e a que faltava na tabela era justamente o `position: absolute`
do painel. Ela foi contada, virou linha da tabela, e **saiu da folha em
2026-09-13** (D8) — junto com o `max-width: none` que dependia dela (D4).

**O degrau da sombra sai do TIPO de superfície**, não da comparação com os
vizinhos: flutuante passivo é `lg`, pela regra em
`04-padroes-design-sistema.md` §Qual degrau, cobrada por `elevacao_fora_do_mapa`.
Esta linha dizia "a mesma do Tooltip e mais alta que a do Popover (`md`)", e
descrever vizinho é o que já envelheceu a linha equivalente do popover no dia em
que tooltip e hover-card desceram de `xl` para `lg`.

**Animação**: só a saída anima (`data-ending-style`), para evitar corrida entre
opacidade zero na entrada e checagem síncrona de visibilidade — foi ela que
derrubava `toBeVisible` nas plays.

**Até 2026-09-12 esta linha dizia "pelo mesmo motivo do Popover"**, e o motivo do
Popover deixou de existir: naquele dia ele parou de animar por completo, por
decisão da dona, e não sobrou lado nenhum para comparar. Citar vizinho pelo nome
envelhece sozinho — a mesma lição que a pendência da §8 vem medindo.

**`position: absolute` no painel foi a divergência ABERTA desta folha, e fechou
em 2026-09-13** (D8). Vale guardar como ela sobreviveu, porque o mecanismo é o
que esta casa vem pagando repetido: o `tooltip.css` tirou a declaração
equivalente em 2026-09-04 (ver `tooltip.md` D1) e o `popover.css` a RECUSA num
comentário no topo do seletor (ver `popover.md` §4), pelo mesmo defeito medido
nos dois — fora do fluxo, o invólucro que a lib posiciona colapsa para 0×0.

Aqui a declaração continuou, e este parágrafo dizia, com todas as letras, que o
colapso estava **medido e tratado como dado, não como defeito**, e que era
"decisão de CÓDIGO, relatada e não resolvida aqui". Ou seja: a medição certa, no
documento certo, e a correção esperando uma rodada que só veio quando outro
agente a relatou como achado NOVO. É a regra do CLAUDE.md sobre defeito medido e
adiado — o que fecha a rodada não é a linha no documento, é o portão. Agora ele
existe: `folha_tira_do_fluxo_sem_dizer_onde`.

**`prefers-reduced-motion` é atendido pela camada de TOKEN, e a ausência de um
bloco `@media` nesta folha NÃO é defeito** — foi relatada como tal duas vezes,
em 2026-09-08 e 2026-09-09, sempre pela mesma leitura: `hover-card.css` era a
única da categoria sem o bloco, e as outras oito tinham. Sob a preferência,
`docs/shared/tokens/motion.css` zera a escada inteira de `--duration-*`, e a
transição da saída usa `var(--duration-fast)`. Medido em 2026-09-09 em motor de
CSS real (Chromium com `reducedMotion: 'reduce'`, lendo `getComputedStyle`):
este painel para, junto com os outros 21 alvos de overlay sondados.

**Até 2026-09-12 a frase acima estava no presente — "é a única da categoria".**
São DUAS desde aquele dia: o `popover.css` perdeu a guarda junto com a animação,
e o motivo está escrito no fim daquela folha. Sete das nove têm bloco.

Os blocos por folha das vizinhas são redundância, e vários deles não seguram
nada: a guarda mira a classe nua, (0,1,0), contra uma declaração em
`[data-ending-style]` ou `[data-open]`, (0,2,0), e perde na cascata — `@media`
não acrescenta especificidade. Ninguém tinha notado porque a camada de token já
fazia o trabalho. Quem está nessa situação hoje está listado na pendência da §8;
o exemplo que morava aqui era o do popover, e ele saiu do mundo em 2026-09-12. O
único caso que o token não alcança é duração LITERAL, fora de
`var(--duration-*)`; aqui não é o caso, e as duas utilitárias que estavam nessa
situação foram corrigidas no fim de `utilities.css`.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | conteúdo fora do documento |
| Opening | hover ou foco, durante a espera | nada visível ainda — a espera É o estado |
| Open | espera cumprida | cartão montado; `aria-describedby` ativo |
| Closing | ponteiro sai, durante a espera de fechamento | cartão ainda montado |
| Transitioning | saída | opacidade e escala até a transição terminar |

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

`side` e `align` moram no Content, não na raiz.

**`open` é a única linha da tabela que não vale nas cinco**: o vanilla não a tem —
lá o modo controlado é imperativo, e os outros seis nomes existem em todas.
Medido em 2026-09-12 em `HoverCardOptions`.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| svelte | a lib é `LinkPreview`, não `HoverCard`; `defaultOpen` não existe nela e é implementado no wrapper — registrado em `PATCHES.md#svelte-hovercard-defaultopen` |
| vanilla | fábrica `createHoverCard`, que devolve `{ open, close, toggle, isOpen }` — o modo controlado é imperativo, e não há `open` como opção: quem controla chama os verbos e recebe cada mudança de volta em `onOpenChange` |
| react, angular | montam o `hover-card-positioner` nomeado; vue, svelte e vanilla não |

**Até 2026-09-12 a linha do vanilla dizia** que a fábrica "ainda expõe
`open`/`close` em vez dos verbos em inglês que o popover e o sidebar adotaram", e
a frase não fechava consigo mesma: `open` e `close` SÃO os verbos em inglês, e são
os mesmos que `createPopover` devolve. Medido em 2026-09-12 nos dois arquivos, a
divergência real é o quarto membro de cada tupla — `createHoverCard` devolve
`isOpen()`, um LEITOR de estado, e `createPopover` devolve `setOpen()`, um
ESCRITOR. Ela cai do gesto: o popover tem modo controlado por opção (`open`), e
`setOpen` é por onde ele anda; o cartão não tem opção controlada nenhuma, e quem o
comanda por fora precisa saber se ele está aberto. Divergência de forma de API não
tem fonte de verdade, então isto fica registrado e não "alinhado".

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

## 8. Acessibilidade

**Atributos**: gatilho com `aria-describedby` apontando para o cartão enquanto ele
existe (D1). Nenhum `role` de diálogo — este painel não é diálogo.

**Teclado**: Tab no gatilho abre; Escape fecha. Não há foco dentro do cartão, e é
por isso que ele não pode guardar ação.

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

**O bloco `@media` por folha é cinto e suspensório, e alguns não seguram nada.**
A guarda mira a classe nua, (0,1,0), contra uma declaração em
`[data-ending-style]`, `[data-open]` ou `[data-state]`, (0,2,0), e perde na
cascata — `@media` não acrescenta especificidade. Quais folhas estão assim hoje
está na pendência abaixo; o exemplo que este parágrafo dava era o do `popover.css`,
e ele saiu do mundo em 2026-09-12 junto com a animação. Esta folha não tem bloco
próprio, e isso **não é defeito**: já foi relatado como tal duas vezes, e é o
motivo de esta seção existir.

**O caso que a guarda de token NÃO cobre é duração literal**, fora de
`var(--duration-*)` — nenhum overlay tem, e o tratamento dos que têm vive no fim
de `utilities.css`. Ao acrescentar movimento a qualquer folha desta categoria, a
regra é uma só: declare a duração por token, e ela para de graça.

**E isso tem portão desde 2026-09-10**: `movimento_sem_guarda_eficaz` reprova
duração literal em qualquer folha compartilhada que não tenha guarda de
`prefers-reduced-motion` — e reprova também a guarda que existe mas PERDE, por
especificidade menor ou por vir antes com especificidade igual. Movimento por
`var(--duration-*)` fica de fora de propósito, porque a camada de token já o
alcança.

> **PENDÊNCIA · 2026-09-09** — guardas de overlay que não seguram nada, por
> especificidade: miram a classe nua (0,1,0) contra declarações em `[data-state]`,
> `[data-closed]`, `[data-open]` ou `[data-ending-style]` (0,2,0), e perdem.
> **Estreitada em 2026-09-10, porque metade fechou.** O que esta linha temia —
> "a próxima duração literal cai no vão" — passou a ser cobrado pelo
> `movimento_sem_guarda_eficaz`, que reprova exatamente a guarda que perde. O que
> sobra é enfeite: blocos que anunciam proteção sobre movimento que o token já
> para, e que o portão não acusa porque ali não há duração literal.
> **REFEITA em 2026-09-12, varrendo as nove folhas: são QUATRO, e duas nunca
> estiveram na lista.** A do `popover.css` saiu — não por ter sido consertada, mas
> porque o Popover deixou de animar por decisão da dona, e sem `[data-ending-style]`
> não há declaração para a guarda perder; as duas coisas saíram juntas da folha,
> com o motivo escrito lá. Em troca entraram o `tooltip.css` e o `sheet.css`, que
> têm a mesma forma desde sempre e nunca foram contados:
>
> | folha | a guarda mira | a declaração que ela deveria desligar | quem vence |
> |---|---|---|---|
> | `tooltip.css` | `.nds-tooltip-content` | `…[data-ending-style]` — a transição de saída | a declaração; a guarda é INERTE por inteiro |
> | `dialog.css` | `.nds-dialog-overlay`, `.nds-dialog-content` | `…[data-open]`, `…[data-state="open"]`, `…[data-closed]` — as quatro animações | a declaração; a guarda é inerte por inteiro |
> | `dropdown-menu.css` | `.nds-dropdown-menu-item`, `.nds-dropdown-menu-content` | `…[data-open]`, `…[data-state="open"]` — a animação de entrada | a declaração; **metade** da guarda serve, porque a transição do ITEM está na classe nua e a guarda vem depois |
> | `sheet.css` | `.nds-sheet-overlay`, `.nds-sheet-content` | `.nds-sheet-content[data-side="…"]` — as quatro animações de entrada, uma por lado | a declaração; **metade** da guarda serve, porque a animação do VÉU e as duas transições estão na classe nua |
>
> As três que seguram: `drawer.css` (a guarda repete o próprio
> `:not([data-swiping])` da declaração e vem depois), `alert-dialog.css` (a guarda
> ENUMERA os dez seletores de atributo, um a um) e `command.css` (declaração e
> guarda na mesma classe nua). O `hover-card.css` não tem guarda, de propósito.
>
> **Até 2026-09-12 esta pendência dizia "são DUAS"**, e o erro não foi de
> contagem: foi ter estreitado a lista tirando o caso que fechou sem varrer a
> categoria de novo. Lista de defeito que só encolhe é lista que envelhece — e
> aqui ela encolheu duas vezes enquanto dois casos iguais estavam de pé o tempo
> todo. Quem fechar isto varre as nove folhas, não relê a lista.
> **E uma referência apodreceu junto**: o comentário desta mesma família no
> `hover-card.css` usava a guarda do popover como exemplo VIVO da perda na
> cascata. Os dois lados do exemplo deixaram de existir, e ele passou a descrever
> a FORMA do defeito em vez do caso — citar vizinho pelo nome envelhece sozinho,
> que é exatamente o que esta pendência vem medindo desde 2026-09-09.
> **Fecha quando**: as quatro guardas (`tooltip.css`, `dialog.css`,
> `dropdown-menu.css` e `sheet.css`) forem removidas com o motivo escrito na
> folha, ou passarem a mirar seletor que vença a declaração — e quando a varredura
> que decide isso for a das nove folhas da categoria, não a leitura desta lista.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `hover_card_open` | o cartão abre | `{ component: "hover-card", trigger_id, location }` |
| `hover_card_close` | o cartão fecha | `{ component: "hover-card", location }` |

`trigger_id` é id estável em kebab-case, igual nas cinco, **nunca** o texto do
gatilho traduzido — ver D7. A espera de abertura serve de filtro contra hover de
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

A mesma afirmação falsa vivia em mais duas superfícies, e as três foram
corrigidas juntas em 2026-09-09: as tabelas de analytics do **react** e do
**vue** anunciavam um campo `label` que nenhuma stack emite e nenhum tipo
declara — as duas colapsavam os dois eventos numa linha só —, e a descrição do
conteúdo compartilhado pedia `trigger_id` como obrigatório nos DOIS eventos.
Svelte e vanilla já traziam a forma certa, uma linha por evento, e foi a delas
que as outras duas passaram a seguir.

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
| geometria, tokens, largura e teto | `docs/shared/styles/nds/hover-card.css` |
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
