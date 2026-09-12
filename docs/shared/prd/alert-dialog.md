# PRD — AlertDialog

> **Estado descrito**: 2026-09-07, revisado em 2026-09-10 (pipeline `fix` — D3,
> D4, D6, §5, §7, §8 e §9 mudaram, cada um com a linha antiga registrada no lugar).
> **⚠ Escrito ANTES da revisão serial deste componente.** Espere que decisões
> mudem — e quando mudarem, a linha se move para o histórico com a nova data e a
> nova medição, em vez de ser reescrita por cima.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Diálogo de **decisão obrigatória**: interrompe a página e não deixa sair sem
escolher. É irmão do Dialog, e o que os separa não é estilo — é decisão.

| o que difere | Dialog | AlertDialog |
|---|---|---|
| papel | `role="dialog"` | `role="alertdialog"` |
| clique no véu | fecha | **não fecha** |
| Escape | fecha | **fecha**, e equivale a cancelar |
| botão de fechar no canto | tem | **não tem** |
| rodapé | opcional | **obrigatório** — é a única saída visível |

A linha "desfoque do véu — tem × não tem" saiu desta tabela em 2026-09-10: ela
descrevia o Dialog até 2026-09-08, quando o desfoque foi retirado de lá, e ficou
dois dias afirmando uma diferença que não existia mais — com a D8 deste mesmo
arquivo já dizendo o contrário. Hoje nenhum véu desfoca, e esta tabela só lista
o que SEPARA os irmãos.

As duas folhas são irmãs de código também: o VÉU do `alert-dialog.css` consome
as keyframes `nds-dialog-fade-in` / `-fade-out` declaradas em `dialog.css`; o
PAINEL usa `nds-animate-in` / `-out`, de `utilities.css` — o mesmo movimento do
alert dispensável.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | `role="alertdialog"` — sinaliza decisão obrigatória, não diálogo comum | `accessibility.item1` |
| C2 | O nome vem do título e está SEMPRE presente; a descrição é opcional | `accessibility.item2` |
| C3 | O foco fica preso, e o foco INICIAL vai ao Cancelar | `accessibility.item3` |
| C4 | Ao fechar, o foco volta ao gatilho | `accessibility.item4` |
| C5 | `Escape` fecha sem executar a ação; clique no véu **não** fecha | `accessibility.item5` |
| C6 | Todo texto e borda cumprem 4,5:1 pelos tokens do tema | `accessibility.item6` |
| C7 | O rodapé traz o par Cancelar + Ação, e é a saída visível | `notes` e o docblock da folha |

## 3. Decisões fixadas

### D1 · Sem clique-fora, com Escape — e o comentário dizia o contrário

**Corrigida em** 2026-08-17 e reafirmada em 2026-09-07.
**Estado**: clique no véu NÃO fecha. `Escape` FECHA, e equivale a cancelar.
**Medição**: o comentário da folha afirmava que Escape não fechava, e contradizia
o próprio conteúdo compartilhado do componente (`testes.functional.item4`). A
WAI-ARIA manda o alertdialog seguir o teclado do dialog: tirar a única saída de
teclado seria pior do que o risco de dispensa acidental — que é justamente o que
o clique-fora bloqueado já cobre.
**Onde a versão errada ainda apareceu depois**: numa anotação do Figma, copiada do
comentário antigo, corrigida em 2026-09-06. Vale como lembrete de que afirmação
errada se replica para onde a documentação for.
**Não é configuração de quem consome**: é o perfil do componente, fixado na
construção, e vale nas cinco stacks.

### D2 · Sem botão de fechar no canto, e por isso o rodapé é obrigatório

**Estado**: a folha NÃO declara equivalente ao `.nds-dialog-close`.
**Por quê**: a saída visível é o par Cancelar + Ação. Um X no canto seria uma
terceira saída ambígua — some com a decisão sem dizer qual foi.

### D3 · O foco inicial vai ao Cancelar

**Estado**: não ao primeiro focável, e não à ação — ao Cancelar, por escolha
EXPLÍCITA nas cinco stacks.
**Por quê**: evita confirmação acidental de quem aperta Enter por reflexo. É a
única peça da família em que o foco inicial é escolhido, e não herdado da ordem
do DOM.
**Como cada stack escolhe**:

| stack | mecanismo |
|---|---|
| vanilla | a fábrica chama `cancelButton.focus()` ao abrir |
| react | o Content passa ao `initialFocus` da base-ui uma ref que o Cancel entrega por contexto interno |
| vue | a reka registra o Cancel no painel (`onCancelElementChange`) e o foca ao abrir |
| svelte | o painel procura o botão pelo slot do Cancelar ao abrir |
| angular | o `NdsAlertDialogCancel` se registra na raiz, que o foca no `(openAutoFocus)` do `rdxDialogPopup`, cancelando o evento |

Vale também na abertura por TOQUE, em que a base-ui e o radix-ng focariam o
painel; a story `Open` do react cobre esse caminho.

**Até 2026-09-10 isto era verdade em três stacks**: react e angular chegavam ao
Cancelar pela ORDEM do DOM (ele vem antes da ação no rodapé), e a base-ui ainda
foca o painel, e não o botão, quando a abertura vem de toque. Reordenar o rodapé
ou abrir pelo toque mudava o foco sem que nada reprovasse.

### D4 · A descrição é OPCIONAL

**Fixada em** 2026-08-17, decisão da dona: a documentação alinha ao código.
**Medição**: a descrição era opcional no código e obrigatória na anatomia.
Corrigidas cinco chaves nos três idiomas, e o caminho ganhou contrato
(`testes.accessibility.item8`) e story nas cinco (`WithoutDescription`).
**Achado da medição, e é o que interessa guardar**: das cinco, só o **Vue**
quebrava — o `DialogContentImpl` da reka gera o id da descrição sempre e ligava
`aria-describedby` a um id inexistente (a própria lib avisa disso em
desenvolvimento). Corrigido no wrapper, por registro da descrição.
**O Svelte tinha a mesma falha, latente** (medida em 2026-09-10): a bits grava o
id da descrição na raiz e não o apaga quando ela sai, e o valor dela vence o de
quem consome. Removida a descrição com o painel aberto, o `aria-describedby`
ficava apontando para um id sumido. Desde então a descrição do wrapper é um
`<p>` próprio que se registra no painel, como no Vue.

### D5 · Não há eixo de tamanho

**Estado**: uma largura só — `100% − 32px`, teto de 512px — que se adapta por
viewport, não por prop.
**Medição**: existiu um `data-size="sm"` de 20rem com rodapé de duas colunas, e
foi removido: o Vanilla nunca o implementou, nenhuma story o exercia, nada o
documentava.
**Não há eixo de tom tampouco**: o tom vem da variante do Button usado na ação.

### D6 · O bloco de mídia é opcional e muda o alinhamento do cabeçalho

**Estado**: caixa de 40px com raio `--radius-md` e fundo `--muted`, ícone de 24px
dentro, margem inferior de 8px.
**Comportamento**: `:has(.nds-alert-dialog-media)` centraliza a CAIXA do ícone no
mobile e a devolve à esquerda a partir de 40rem. O TEXTO do cabeçalho não depende
dela: ele já é centralizado no mobile, com ou sem mídia, pela regra do próprio
cabeçalho.
**Por que `:has()` e não uma classe**: a presença do ícone é o que decide, e quem
compõe não precisa lembrar de marcar o cabeçalho.
**Até 2026-09-10 esta linha dizia que o `:has()` centralizava o cabeçalho** — e a
frase se espalhou para quatro stories e para `testes.visual.item6`. A regra
repetia `text-align` à toa; saiu, com o estilo computado medido idêntico antes e
depois, nas duas larguras, com e sem mídia.

**E a segunda versão da mesma frase sobreviveu até 2026-09-12**: onze comentários
nas cinco stacks diziam que a mídia tem de ser o primeiro filho do cabeçalho, e
**sete** davam o `:has()` como a razão. O seletor casa em qualquer posição — lê
PRESENÇA, não ordem —, e o motivo verdadeiro é só a leitura ícone → título →
descrição. O Vue e o vanilla foram corrigidos numa rodada; os outros cinco
ficaram, mais dois que a busca por frase não achou porque a redação era outra.

O que torna esta família caro de pegar: a asserção ao lado (`firstElementChild`)
está CERTA e continua verde, então nada denuncia a explicação errada. Quem lesse
o comentário aprenderia que mover a mídia quebra o layout, e mexeria no CSS para
consertar o que já funciona. Portão: `afirmacao_de_has_sobre_ordem`, que confere
a premissa na folha do próprio slug — se `<slug>.css` tiver um `:has()` que de
fato leia posição, como o `.nds-card:has(> img:first-child)`, a afirmação passa.

### D7 · A superfície é `--background`, e a família não concorda

**Estado**: `--background` / `--foreground` — igual ao Sheet e ao Drawer,
diferente do Dialog, que lê `--popover`.

**A divergência é de QUATRO folhas, e o registro dela é a D1 do `dialog.md`**,
onde a tabela nomeia as quatro. Esta linha dizia "as três folhas" e contava sem
o Drawer; a contagem foi corrigida em 2026-09-09. Aqui fica só o lado deste
componente — três dos quatro concordam, e o Dialog é o que destoa —, porque
manter a medição inteira em dois arquivos é ter duas cópias para envelhecer.

Enquanto durar, o que vale é a regra estrutural: a classe do painel resolve a
superfície, e ninguém pinta fundo por fora.

### D8 · O véu não desfoca

**Estado**: sem `backdrop-filter` — e desde 2026-09-08 nenhuma folha modal tem.

**Histórico**: esta linha dizia "só o véu do Dialog tem", e era verdade até o
desfoque ser retirado de lá (ver `dialog.md`, D5). Vale reparar em como ela
apodreceu: a afirmação descrevia o VIZINHO, então nada que tocasse o Dialog
passava por este arquivo. Afirmação sobre o que os outros fazem é a que mais
envelhece sem aviso — e a única defesa é não fazê-la, ou marcá-la como
comparação datada, que é o que esta linha virou.

## 4. Anatomia

```
alert-dialog-overlay          véu, sem desfoque (D8)
alert-dialog-content          role="alertdialog" · centralizado por translate
├── alert-dialog-header       coluna, centralizada; à esquerda a partir de 40rem
│   ├── alert-dialog-media       opcional — caixa de ícone (D6)
│   ├── alert-dialog-title       obrigatório: é o nome do diálogo
│   └── alert-dialog-description opcional (D4)
└── alert-dialog-footer       obrigatório — Cancelar + Ação (D2)
```

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/alert-dialog.css`.

| propriedade | valor | token |
|---|---|---|
| véu | 80% de opacidade | `--overlay` |
| superfície | — | `--background` — ver D7 |
| texto | — | `--foreground` |
| largura | `100% − 32px`, teto de 512px | `--spacing-8` na folga; teto **literal** (`32rem`) |
| padding | 24px | `--spacing-6` |
| gap do painel | 16px | `--spacing-4` |
| borda | 1px | `--border` |
| raio | — | `--radius-card` |
| sombra | — | `--elevation-xl` — modal; era `lg` até 2026-09-10 |
| gap do cabeçalho | 8px | `--spacing-2` |
| título | 18px, semi-bold, entrelinha 1, tracking -0.025em | `--text-control-xl` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| gap do rodapé | 8px | `--spacing-2` |
| caixa de mídia | 40px, raio médio, fundo neutro | `--spacing-10`, `--radius-md`, `--muted` |
| ícone dentro da mídia | 24px | `--spacing-6` |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**Sem raio variável**: aqui o `--radius-card` vale em qualquer largura — diferente
do Dialog, que é reto abaixo de 40rem.

**Animação**: entrada com `--duration-spring` e `--ease-spring`; saída com
`--duration-base` e `--ease-exit`. As keyframes do véu vêm de `dialog.css`
(`nds-dialog-fade-*`); as do painel, de `utilities.css` (`nds-animate-*`).

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, foco inicial no Cancelar (D3) |
| Transitioning | entrada e saída | fade no véu, fade e zoom no painel |
| Focused | Tab entre os dois botões | anel do próprio botão |

Não há estado de tamanho nem de tom (D5).

A tabela de "Configurações" da docs page (`states.*`) é outro recorte, e os dois
convivem de propósito: esta lista o que muda NA TELA; aquela, como quem usa chega
a cada situação (fechado, aberto, confirmação, cancelamento, controlado).

## 7. API

| prop | o que faz |
|---|---|
| `open` | estado controlado — react, vue (`v-model:open`), svelte (`bind:open`), angular; **o vanilla não tem** |
| `defaultOpen` | estado inicial não controlado — **o svelte não tem** (o `open` dele é bindável) |
| `onOpenChange` | callback com o novo estado — no vue é `update:open`, no angular `(openChange)` |
| `description` | texto de apoio, opcional; sem ele o diálogo não declara descrição (D4). Nas stacks de peças, é a peça Description |
| `asChild` | compõe com um filho sem renderizar wrapper — **só react e vue**; o svelte delega pelo snippet `child` |
| `onClick` | callback da confirmação ou do cancelamento — `onClick` no react, `@click` no vue, `onclick` no svelte, `(click)` no angular; no vanilla, o `onClick` dos botões que a fábrica recebe. O diálogo fecha depois de disparar |
| `className` / `class` | classes adicionais, que se SOMAM às do componente — `className` no react, `class` nas outras (inclusive `createAlertDialogMedia`, que recebia `className` até 2026-09-10). No angular o PAINEL recebe classe pela entrada `panelClass` da raiz, porque o conteúdo é um `ng-template` |
| `onClose` | callback com o motivo do fechamento (`escape` · `close-button` · `api`) — **só o vanilla**; nas outras quatro o motivo sai do mecanismo de cada lib |

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger` |
| vue | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogTitle`, `AlertDialogTrigger` |
| svelte | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger` |
| vanilla | `createAlertDialog`, `createAlertDialogMedia` |
| angular | `button[ndsAlertDialogAction]`, `button[ndsAlertDialogCancel]`, `button[ndsAlertDialogTrigger]`, `div[ndsAlertDialogFooter]`, `div[ndsAlertDialogHeader]`, `div[ndsAlertDialogMedia]`, `h1[ndsAlertDialogTitle]` … `h6[ndsAlertDialogTitle]` (os seis), `nds-alert-dialog`, `ng-template[ndsAlertDialogContent]`, `p[ndsAlertDialogDescription]` |

**Cada stack também exporta a peça que diz por que o diálogo fechou**, desde
2026-09-12, ao lado do primitivo e pelo mesmo índice das peças — `react` e
`angular` em `ui/dialog-close-reason.ts` (a família inteira num arquivo só),
`vue` em `ui/alert-dialog/alert-dialog.close-reason.ts`, `svelte` em
`ui/alert-dialog/close-reason.ts`, e o `vanilla` na própria fábrica, pelo
`onClose(reason)`. As três palavras daqui são um SUBCONJUNTO declarado das
quatro da família, e o Vue guarda isso com uma prova de tipo, além da declaração
no portão. Ver `dialog.md` §Peças para a tabela completa e o motivo de cada
forma.

O índice do svelte também reexporta as formas curtas — `Action`, `Cancel`, `Content`, `Description`, `Footer`, `Header`, `Media`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável nas cinco, cada uma de um
jeito** — medido na fonte de cada lib, não na documentação delas:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `render` (`BaseUIComponentProps<'h2'>`) | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | prop `level` do wrapper — ele escreve a tag pelo snippet `child` da lib, e o `aria-level` sai do mesmo valor | `h2` |
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
tinha medido porque nenhuma superfície exercitava a capacidade. **Desde
2026-09-10 o wrapper faz a delegação por dentro**: `level` sozinho entrega a tag
certa, e o padrão virou `h2` de verdade — até então era `div` com
`aria-level="2"`, e a guideline 18 já dizia "h2 por padrão, nas cinco".

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

**Atributos**: `role="alertdialog"`, `aria-labelledby` sempre presente (o título),
`aria-describedby` só quando há descrição.

**Teclado**: Tab e Shift+Tab circulam entre Cancelar e Ação; Enter e Espaço ativam
o botão focado; Escape fecha sem executar a ação.

**O que NÃO se faz, de propósito:**

- não se fecha por clique no véu (D1);
- não se põe um X no canto (D2);
- não se dá foco inicial à ação (D3).

**Movimento reduzido**: o painel para sob `prefers-reduced-motion`, e aqui DUAS
camadas seguram. A de token: a folha declara duração só por `var(--duration-*)`,
e `docs/shared/tokens/motion.css` zera a escada inteira sob a preferência. E a
da própria folha: o bloco `@media` vem DEPOIS das regras de animação, com os
mesmos seletores e a mesma especificidade, e por isso vence. Não é uma das
guardas inertes que o `hover-card.md` §8 descreve — esta linha dizia que era, e
copiava a explicação do vizinho sem medir a folha daqui.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | o diálogo abre | `{ component: "alert-dialog", trigger_id, location }` |
| `dialog_confirm` | a ação é executada | idem |
| `dialog_close` | fecha, por qualquer caminho | idem, mais `reason` |

O `component` é `alert-dialog`, em kebab-case desde a unificação do vocabulário —
esta linha ainda dizia `alert_dialog` enquanto a tabela logo acima já dizia o
contrário. Mesma família de eventos do Dialog e do Sheet, com a peça
identificada no payload.

**`reason` é obrigatório, no vocabulário da família** (`dialog.md` §9). Aqui só
três palavras aparecem, porque clique fora não fecha este componente (D1):
`escape`; `close-button` para o Cancelar; e `api` para a ação que confirma. A
ação e o Cancelar são as duas partes de fechar da lib, e a lib entrega o mesmo
motivo para as duas — por isso, nas quatro stacks com lib, a demonstração marca
a confirmação ANTES de o diálogo fechar. Sem a marca, "confirmou a exclusão"
chegaria ao relatório como "apertou o botão de fechar".

**No vanilla quem entrega o motivo é a própria fábrica**, pela opção
`onClose(reason)` (desde 2026-09-10): ela sabe qual botão fechou, e por isso a
demonstração de lá não precisa marcar a confirmação — o `dialog_confirm` sai do
clique da ação, registrado antes do fechamento. **Até essa data o Escape do
vanilla fechava sem `dialog_close` nenhum**: o fechamento era rastreado à mão
nos cliques dos dois botões.

**E o desmonte não responde à pergunta** (2026-09-12): o callback de limpeza da
fábrica chamava `close('api')`, então toda troca de idioma da docs page com a
pergunta na tela mandava um `dialog_close` com a palavra de quem confirmou a
exclusão. Hoje o painel sai sem `onClose` e sem devolver foco a um gatilho que
está deixando o documento; `onOpenChange(false)` continua. A ausência de motivo é
asserção da `ListenerCleanup` — lista vazia, não "algum motivo" —, e o portão é o
`desmonte_emite_fechamento` (`dialog.md` §9).

**As três palavras são exceção DECLARADA, não uma lista mais curta por acaso.**
`FAMILIA_DE_MOTIVO`, em `scripts/audit.mjs`, registra que o `AlertDialogCloseReason`
não tem `overlay` e confere a premissa contra a linha C5 deste arquivo: se o
componente passar a fechar por clique no véu, a exceção cai e o portão volta a
cobrar a palavra. Sem isso, "menos palavras" é exatamente a porta por onde o
Sheet ficou seis semanas atrás do Dialog sem nada reprovar.

**Ids estáveis nas cinco, no `trigger_id`**: `destructive` e `neutral` na
demonstração e em Variantes; `pair1-do`, `pair1-dont`, `pair2-do`, `pair2-dont`
no Do & Don't — batendo com as chaves `doDont.pair1/pair2` do conteúdo. O campo
era `label` até 2026-09-10, quando a dona unificou o campo de quem abriu em
`trigger_id` na categoria inteira (`18-overlay.md` §Analytics); os valores não
mudaram, e o tipo proíbe o campo antigo.

**Até 2026-09-10 esta linha dizia "fecha sem executar"**, e o conteúdo
compartilhado documentava um campo `trigger` com `"cancel_button"` que nenhuma
stack mandava. O Angular nem disparava `dialog_open` e `dialog_close` — só o
`dialog_confirm`, sem `label` e sem `location` —, e o Vue e o Svelte fechavam
sem motivo.

## 10. Reconstruir do zero

Ordem: folha → primitivo → cabeçalho e rodapé → mídia → stories → docs page.

- **As três decisões de saída andam juntas** (D1, D2, D3): sem clique-fora, com
  Escape, foco inicial no Cancelar. Implementar duas das três produz um diálogo
  que engana.
- **A descrição é opcional, e o Vue precisa de cuidado** (D4): a reka gera o id
  sempre, então o wrapper tem de registrar a descrição em vez de deixar o
  `aria-describedby` apontar para o vazio.
- **As keyframes vêm das vizinhas** — o véu, de `dialog.css`; o painel, de
  `utilities.css`. Não duplique.
- **A caixa de mídia se alinha por `:has()`** (D6), não por classe; o texto do
  cabeçalho se centraliza no mobile sem ela.
- **O foco inicial no Cancelar é EXPLÍCITO** (D3) — não confie na ordem do
  rodapé.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, mídia, decisões de saída | `docs/shared/styles/nds/alert-dialog.css` |
| keyframes de entrada e saída | `docs/shared/styles/nds/dialog.css` (véu) e `utilities.css` (painel) |
| texto, props, critérios de teste | `docs/shared/content/alert-dialog/translations.json` |
| desenho e anotações | Figma, página `AlertDialog` (componente `212:3`) |
| portões determinísticos | `node scripts/audit.mjs alert-dialog --json` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |

**As 54 chaves `nav` saíram do conteúdo em 2026-09-12.** Este slug foi o
sintoma que abriu a investigação: o menu dizia "Estados" no react e no vanilla,
que leem o `ui.json`, e "Configurações" no vue, no svelte e no angular, que
liam o conteúdo — o angular por uma ponte `navLabel()` que tentava o conteúdo
primeiro. Somando `nav.usage` em inglês e espanhol, eram cinco rótulos
divergentes só aqui, de 173 medidos em 82 slugs. O título da seção continua
vindo do conteúdo, e continua sendo "Configurações": é ali que a palavra do
componente vale.

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas. A palavra própria
do componente vive no TÍTULO da seção. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

