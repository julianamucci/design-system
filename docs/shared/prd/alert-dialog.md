# PRD — AlertDialog

> **Estado descrito**: 2026-09-15. **Revisão serial fechada em** 2026-09-10
> (`eff06ba10`), com a rodada de categoria de 2026-09-12 por cima.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
>
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.

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

Nenhum véu modal desfoca (D8); a tabela só lista o que SEPARA os irmãos.

As duas folhas são irmãs de código também, e o PAINEL do `alert-dialog.css`
usa `nds-animate-in` / `-out`, de `utilities.css` — o mesmo movimento do alert
dispensável.

**O VÉU não consome keyframe nenhum desde 2026-09-20.** Até 2026-09-22 este
parágrafo afirmava, no presente, que ele consumia `nds-dialog-fade-in` /
`-fade-out` de `dialog.css` — keyframes que o commit `12c81620b` removeu. A
nota datada abaixo isentava explicitamente só §5 e §6, e §1 e §11 ficaram
descrevendo um mundo que acabou.


> **2026-09-20 — o VÉU NÃO ANIMA MAIS, por decisão da dona, nos quatro componentes que o têm.** O que anima é o PAINEL, que é quem entra; o véu aparece com ele. Saíram as regras de animação de véu de `sheet.css`, `dialog.css` e `alert-dialog.css`, e com elas os keyframes `nds-sheet-fade-in`, `nds-dialog-fade-in` e `nds-dialog-fade-out`, que ficaram órfãos.
>
> **Nasceu de um defeito, e a simplificação é o conserto**: o véu do Drawer em react, vue e svelte desvanecia 0,5s sob `prefers-reduced-motion`, porque a folha que a `vaul` injeta declara a duração dele um degrau de especificidade acima do nosso guarda (medido; ver a D17 de [`drawer.md`](drawer.md)). Véu que não anima não tem guarda a perder — a decisão apaga a categoria do problema em vez de vencer a disputa de cascata.
>
> §1 e §11 foram corrigidos em 2026-09-22, depois de a Fase B medir que os dois
> afirmavam no presente o que tinha sido removido. §5 e §6 descrevem o estado
> ANTERIOR e ficam como histórico, por decisão.

## 2. Contrato de comportamento

Cada linha é verificável. A coluna do portão diz quem reprova se ela deixar de
valer — e `—` é dívida declarada, não ausência de risco. As chaves citadas são
de `testes.*` no conteúdo compartilhado; as stories são as das cinco stacks,
salvo onde a linha diz outra coisa.

| # | o contrato | portão |
|---|---|---|
| C1 | `role="alertdialog"` — sinaliza decisão obrigatória, não diálogo comum | `accessibility.item1` + play do `Playground` nas cinco (`toHaveAttribute('role', 'alertdialog')`) |
| C2 | O nome vem do título e está SEMPRE presente; a descrição é opcional | `accessibility.item2`/`item8`/`item9` + `Playground` (`aria-labelledby`), `WithoutDescription` (sem `aria-describedby`) e `HeadingH3` (o vínculo sobrevive à troca de nível), nas cinco |
| C3 | O foco fica preso, e o foco INICIAL vai ao Cancelar | `functional.item5` + ciclo de Tab do `Playground` e foco no Cancelar na `Open`, nas cinco; a negativa "a ação NÃO tem foco" só em três — ver §7, item 5 |
| C4 | Ao fechar, o foco volta ao gatilho | `accessibility.item5` + `Confirmed` e `Cancelled` nas cinco, pelo teclado |
| C5 | `Escape` fecha sem executar a ação; clique no véu **não** fecha | `functional.item4`/`item6` + clique no véu no `Playground` de react, vue, vanilla e angular e na `Open` do svelte; Escape no `Playground` de react, vue, svelte e angular e na `Controlled` do vanilla |
| C6 | Todo texto e borda cumprem 4,5:1 pelos tokens do tema | `accessibility.item6`/`item7` + varredura axe da `Open`, que termina aberta, nas cinco |
| C7 | O rodapé traz o par Cancelar + Ação, e é a saída visível | — |

**O C7 não tem portão.** Quem afirma a obrigatoriedade é o docblock de
`alert-dialog.css` (linhas 37–39), em prosa que nenhum portão lê. O conteúdo
fala do rodapé só em `anatomy.item7` ("agrupa Cancel e Action. Empilhado em
mobile, lado a lado em desktop") — geometria, não saída obrigatória —, e
nenhuma das quatro `notes` trata dele. As `Responsive` das cinco afirmam que o
rodapé existe e a ordem dos botões, mas sobre a composição da própria story:
uma composição que entregasse o painel sem rodapé passaria nas cinco stacks.

## 3. Decisões fixadas

### D1 · Sem clique-fora, com Escape

**Corrigida em** 2026-08-17 e reafirmada em 2026-09-07.
**Estado**: clique no véu NÃO fecha. `Escape` FECHA, e equivale a cancelar.
**Medição**: o comentário da folha afirmava que Escape não fechava, e contradizia
o próprio conteúdo compartilhado do componente (`testes.functional.item4`). A
WAI-ARIA manda o alertdialog seguir o teclado do dialog: tirar a única saída de
teclado seria pior do que o risco de dispensa acidental — que é justamente o que
o clique-fora bloqueado já cobre.
**Onde a versão errada ainda apareceu depois**: numa anotação do Figma, copiada do
comentário antigo, corrigida em 2026-09-06.
**Não é configuração de quem consome**: é o perfil do componente, fixado na
construção, e vale nas cinco stacks — `disablePointerDismissal` no modo
`'alert-dialog'` da base-ui, `pointerDownOutside`/`interactOutside` prevenidos
pela reka, `interactOutsideBehavior = "ignore"` no bits, `provideRdxDialogVariant({
forcePointerDismissalDisabled: true })` no angular (`alert-dialog.ts:80-84`), e
véu sem ouvinte no vanilla.

### D2 · Sem botão de fechar no canto, e por isso o rodapé é obrigatório

**Estado**: a folha NÃO declara equivalente ao `.nds-dialog-close`.
**Por quê**: a saída visível é o par Cancelar + Ação. Um X no canto seria uma
terceira saída ambígua — some com a decisão sem dizer qual foi.

### D3 · O foco inicial vai ao Cancelar

**Estado**: não ao primeiro focável, e não à ação — ao Cancelar, por escolha
EXPLÍCITA nas cinco stacks.
**Por quê**: evita confirmação acidental de quem aperta Enter por reflexo.
**Como cada stack escolhe**:

| stack | mecanismo |
|---|---|
| vanilla | a fábrica chama `cancelButton.focus()` ao abrir (`alert-dialog.ts:251`) |
| react | o Content passa ao `initialFocus` da base-ui uma ref que o Cancel entrega por contexto interno (`alert-dialog.tsx:117-127`, `246-254`) |
| vue | a reka registra o Cancel no painel (`onCancelElementChange`) e o foca ao abrir |
| svelte | o painel procura o botão pelo slot do Cancelar ao abrir (`alert-dialog-content.svelte:68-82`) |
| angular | o `NdsAlertDialogCancel` se registra na raiz, que o foca no `(openAutoFocus)` do `rdxDialogPopup`, cancelando o evento (`alert-dialog.ts:194-199`) |

Até 2026-09-10 react e angular chegavam ao Cancelar pela ORDEM do DOM, e a base-ui
e o radix-ng focam o painel quando a abertura vem de toque: reordenar o rodapé ou
abrir pelo toque mudava o foco sem que nada reprovasse. É por isso que a escolha é
explícita, e é por isso que a abertura por toque tem story:

| stack | o que a story `Open` mede |
|---|---|
| react | painel aberto na montagem **e** abertura por toque — `openByTouch()` dispara `pointerdown`/`pointerup` com `pointerType: 'touch'`, porque `userEvent` não carrega tipo de ponteiro; afirma ainda que a ação e o painel NÃO têm foco |
| angular | o mesmo par, com o mesmo helper `openByTouch()`; afirma que o painel NÃO tem foco, mas não a ação |
| svelte | só o painel aberto na montagem; afirma o foco no Cancelar e a negativa da ação |
| vue, vanilla | só o painel aberto na montagem; afirmam o foco no Cancelar, sem negativa |

### D4 · A descrição é OPCIONAL

**Fixada em** 2026-08-17, decisão da dona: a documentação alinha ao código.
**Medição**: a descrição era opcional no código e obrigatória na anatomia.
Corrigidas cinco chaves nos três idiomas, e o caminho ganhou contrato
(`testes.accessibility.item8`) e story nas cinco (`WithoutDescription`).
**Achado da medição, e é o que interessa guardar**: das cinco, só o **Vue**
quebrava — o `DialogContentImpl` da reka gera o id da descrição sempre e ligava
`aria-describedby` a um id inexistente. Corrigido no wrapper, por registro da
descrição (`alert-dialog.context.ts`, `AlertDialogContent.vue:44-53`).
**O Svelte tinha a mesma falha, latente** (medida em 2026-09-10): a bits grava o
id da descrição na raiz e não o apaga quando ela sai, e o valor dela vence o de
quem consome. Desde então a descrição do wrapper é um `<p>` próprio que se
registra no painel (`alert-dialog-description-registry.ts`), como no Vue.
**A remoção COM o painel aberto é medida em duas stacks** — ver §7, item 7.

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
mobile e a devolve à esquerda a partir de 40rem (`alert-dialog.css:234-241`). O
TEXTO do cabeçalho não depende dela: ele já é centralizado no mobile, com ou sem
mídia, pela regra do próprio cabeçalho (linhas 83–94).
**Por que `:has()` e não uma classe**: a presença do ícone é o que decide, e quem
compõe não precisa lembrar de marcar o cabeçalho.
**O seletor lê PRESENÇA, não ordem**: a folha não tem `:first-child` nem
combinador. A mídia vem primeiro no cabeçalho só pela leitura ícone → título →
descrição, e é isso que a asserção `header.firstElementChild === media` mede
(`WithMedia` e `Playground` nas cinco).

**Estado medido em 2026-09-15**: 23 linhas em 15 arquivos das cinco stacks
mencionam `:has(` no código do componente (primitivo ou `source`, `stories`,
`variants`, e o `source.test` do svelte), e nenhuma o dá como dependente da
ordem. A última sobrevivente — o comentário de
`alert-dialog.source.test.ts` do svelte, que não nomeava o seletor — foi
reescrita e hoje diz "O CSS NÃO depende da ordem" (linhas 75–80).
Portão: `afirmacao_de_has_sobre_ordem`, que confere a premissa na folha do
próprio slug — se `<slug>.css` tiver um `:has()` que de fato leia posição, como o
`.nds-card:has(> img:first-child)`, a afirmação passa.

**E o portão tem um alcance declarado**: ele só lê blocos de comentário que
mencionem `:has(`, porque é essa saída antecipada que o mantém barato. Afirmação
falsa sobre a folha que NÃO nomeie o seletor passa por baixo dele.

### D7 · A superfície é `--background`, e a família não concorda

**Estado**: `--background` / `--foreground` — igual ao Sheet e ao Drawer,
diferente do Dialog, que lê `--popover`.

**A divergência é de QUATRO folhas, e o registro dela é a D1 do `dialog.md`**.
Aqui fica só o lado deste componente — três dos quatro concordam, e o Dialog é o
que destoa —, porque manter a medição inteira em dois arquivos é ter duas cópias
para envelhecer.

Enquanto durar, o que vale é a regra estrutural: a classe do painel resolve a
superfície, e ninguém pinta fundo por fora.

### D8 · O véu não desfoca

**Estado**: sem `backdrop-filter` — e desde 2026-09-08 nenhuma folha modal tem
(ver `dialog.md`, D5). Afirmação sobre o que os vizinhos fazem envelhece sem
aviso; esta é comparação datada.

## 4. Anatomia

```
alert-dialog-overlay          véu, sem desfoque (D8)
alert-dialog-content          role="alertdialog" · aria-modal="true" · centralizado por translate
├── alert-dialog-header       coluna, centralizada; à esquerda a partir de 40rem
│   ├── alert-dialog-media       opcional — caixa de ícone (D6)
│   ├── alert-dialog-title       obrigatório: é o nome do diálogo (h2 por padrão)
│   └── alert-dialog-description opcional (D4)
└── alert-dialog-footer       obrigatório — Cancelar + Ação (D2)
    ├── alert-dialog-cancel
    └── alert-dialog-action
```

`aria-modal="true"` sai de lugares diferentes, com o mesmo resultado nas cinco:
escrito pelo wrapper em react (`alert-dialog.tsx:124`) e vue
(`AlertDialogContent.vue:71`), pela lib no svelte (`DialogContentState` do bits)
e no angular (`forceModal` do radix-ng), e pela fábrica no vanilla
(`alert-dialog.ts:200`). As cinco `Playground` o afirmam.

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
| sombra | — | `--elevation-xl` — modal |
| gap do cabeçalho | 8px | `--spacing-2` |
| título | 18px, semi-bold, entrelinha 1, tracking -0.025em | `--text-control-xl`, `--font-weight-semi-bold` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| gap do rodapé | 8px | `--spacing-2` |
| caixa de mídia | 40px, raio médio, fundo neutro, margem inferior de 8px | `--spacing-10`, `--radius-md`, `--muted`, `--spacing-2` |
| ícone dentro da mídia | 24px | `--spacing-6` |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**Conferida linha a linha em 2026-09-15**: as dezesseis linhas fecham com a
folha. `node scripts/tabela-tokens.mjs alert-dialog` compara 11 linhas por stack
(55 no total) e fecha com zero linha divergente da folha, zero token do
componente fora das tabelas e zero divergência entre stacks.

**Sem raio variável**: aqui o `--radius-card` vale em qualquer largura — diferente
do Dialog, que é reto abaixo de 40rem.

**Animação**: entrada com `--duration-spring` e `--ease-spring`; saída com
`--duration-base` e `--ease-exit`. A folha cobre as três convenções de estado das
libs — `[data-open]`/`[data-closed]`/`[data-ending-style]` (base-ui, radix-ng) e
`[data-state]` (reka, bits, e a fábrica do vanilla, que o escreve à mão).

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, foco inicial no Cancelar (D3) |
| Transitioning | entrada e saída | fade no véu, fade e zoom no painel |
| Focused | Tab entre os dois botões | anel do próprio botão |

Não há estado de tamanho nem de tom (D5).

A tabela de "Estados" da docs page (`states.*`) é outro recorte, e os dois
convivem de propósito: esta lista o que muda NA TELA; aquela, como quem usa chega
a cada situação (fechado, aberto, confirmação, cancelamento, controlado). As
cinco páginas passam as mesmas cinco linhas; o vanilla sobrescreve
`states.open.trigger` e `states.controlled.*` porque a fábrica não recebe estado
aberto.

## 7. API

| prop | o que faz |
|---|---|
| `open` | estado controlado — react, vue (`v-model:open`), svelte (`bind:open`), angular; **o vanilla não tem** |
| `defaultOpen` | estado inicial não controlado — **o svelte não tem** (o `open` dele é bindável) |
| `onOpenChange` | callback com o novo estado — no vue é `update:open`, no angular `(openChange)` (e `(onOpenChange)`, que traz também o motivo da lib) |
| `description` | texto de apoio, opcional; sem ele o diálogo não declara descrição (D4). Nas stacks de peças, é a peça Description |
| `asChild` | compõe com um filho sem renderizar wrapper — **só react e vue**; o svelte delega pelo snippet `child` |
| `onClick` | callback da confirmação ou do cancelamento — `onClick` no react, `@click` no vue, `onclick` no svelte, `(click)` no angular; no vanilla, o `onClick` dos botões que a fábrica recebe. O diálogo fecha depois de disparar |
| `className` / `class` | classes adicionais, que se SOMAM às do componente — `className` no react, `class` nas outras (inclusive `createAlertDialogMedia`). No angular o PAINEL recebe classe pela entrada `panelClass` da raiz, porque o conteúdo é um `ng-template` |
| `onClose` | callback com o motivo do fechamento (`escape` · `close-button` · `api`) — **só o vanilla**; nas outras quatro o motivo sai do mecanismo de cada lib |

### Divergências de forma, registradas e não "alinhadas"

Forma de API não tem fonte de verdade — cada lib tem a sua.

| stack | como difere |
|---|---|
| vanilla | fábrica `createAlertDialog({ trigger, title, titleLevel, description, media, cancelButton, actionButton, defaultOpen, onOpenChange, onClose, class })` que recebe os botões PRONTOS — a variante de cada um é de quem os cria. Um wrapper `div[data-slot="alert-dialog"]` fica na página com o gatilho; o painel é portalado no `open()` |
| react | peças sobre a base-ui; `AlertDialogCancel` defaulta a `outline`, `AlertDialogAction` herda o padrão do Button; o motivo do fechamento é traduzido por `dialogCloseReason` + `markConfirmation()` (`ui/dialog-close-reason.ts`) |
| vue | peças sobre a reka; Action defaulta a `default` e Cancel a `outline`; os dois entregam o `@click` na CAPTURA, antes do fechamento da lib (`PATCHES.md#vue-alert-dialog-click-order`); não exporta `Overlay` nem `Portal` — o Content os monta |
| svelte | peças sobre o bits; Action e Cancel com os mesmos defaults do vue; a Action renderiza `Dialog.Close` (a `Action` da lib não fecha) e as duas fazem ponte de Enter/Espaço para o `onclick` (`alert-dialog-action.svelte:33-42`); o título escreve a tag pelo snippet `child` |
| angular | diretivas de atributo no elemento nativo; o painel é `ng-template[ndsAlertDialogContent]`; Cancel e Action não aplicam variante — quem compõe põe `ndsButton variant="…"` |

### Peças, por stack

Extraído dos exports e dos seletores do código.

| stack | peças |
|---|---|
| react | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger` |
| vue | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogTitle`, `AlertDialogTrigger` |
| svelte | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger` |
| vanilla | `createAlertDialog`, `createAlertDialogMedia` |
| angular | `button[ndsAlertDialogAction]`, `button[ndsAlertDialogCancel]`, `button[ndsAlertDialogTrigger]`, `div[ndsAlertDialogFooter]`, `div[ndsAlertDialogHeader]`, `div[ndsAlertDialogMedia]`, `h1[ndsAlertDialogTitle]` … `h6[ndsAlertDialogTitle]` (os seis), `nds-alert-dialog`, `ng-template[ndsAlertDialogContent]`, `p[ndsAlertDialogDescription]`, mais a constante `NDS_ALERT_DIALOG` |

**O motivo do fechamento, por stack** — quatro das cinco têm o vocabulário de
TRÊS palavras deste componente:

| stack | onde | o que exporta |
|---|---|---|
| vanilla | `ui/alert-dialog.ts:70` | `AlertDialogCloseReason`, entregue pela própria fábrica em `onClose(reason)` |
| vue | `ui/alert-dialog/alert-dialog.close-reason.ts`, reexportado pelo `index.ts` | `AlertDialogCloseReason`, `alertDialogCloseReason` (reaproveita o mapeador do Dialog), `createAlertDialogCloseWatch`, `ALERT_DIALOG_CANCEL_SLOT`, e a prova de tipo `AlertDialogFalaODialetoDoDialog` |
| svelte | `ui/alert-dialog/close-reason.ts`, reexportado pelo `index.ts` | `AlertDialogCloseReason`, `alertDialogCloseReason`, `createAlertDialogCloseWatch` (outra assinatura — ver §7, item 11) |
| angular | `ui/dialog-close-reason.ts:37,101`, reexportado por `alert-dialog.ts:330-334` | `AlertDialogCloseReason`, `alertDialogCloseReason(motivo, { confirmed })` |
| react | `ui/dialog-close-reason.ts` | **nenhum tipo próprio** — a docs page usa o `DialogCloseReason` de quatro palavras. Ver §7, item 10 |

O índice do svelte também reexporta as formas curtas — `Action`, `Cancel`, `Content`, `Description`, `Footer`, `Header`, `Media`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável nas cinco, cada uma de um
jeito**:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `render` (`BaseUIComponentProps<'h2'>`) | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | prop `level` do wrapper — ele escreve a tag pelo snippet `child` da lib, e o `aria-level` sai do mesmo valor (`alert-dialog-title.svelte:21,34-38`) | `h2` |
| angular | seletor por elemento, nos SEIS níveis | o que quem escreve usar |
| vanilla | opção `titleLevel` da fábrica (`alert-dialog.ts:88,220`) | `2` |

**O nome da opção é relativo ao ESCOPO da fábrica, e isso NÃO é divergência** —
já foi relatado como tal três vezes. Fábrica que monta só o título usa `level`
(`createPopoverTitle`, `createCardTitle`); fábrica que monta o componente
inteiro usa `titleLevel` (`createDialog`, `createSheet`, `createDrawer`,
`createAlertDialog`). No Svelte o wrapper de story usa `titleLevel` e o snippet
emite `level`, que é a prop do bits.

**No svelte, `level` sozinho não trocaria a tag**: o título daquela lib renderiza
`<div role="heading">` e o `level` só alimenta o `aria-level`. Quem entrega o
cabeçalho de verdade é o snippet `child`, e o wrapper faz a delegação por dentro
desde 2026-09-10 — antes o padrão era `div` com `aria-level="2"`.

**Por que isso importa**: `heading-order` do axe reprova salto de nível, e o
painel não sabe de que profundidade da página foi aberto — um diálogo disparado
de dentro de uma seção já em `h3` precisa sair em `h4`.

**A story `HeadingH3`**, no arquivo de variantes das cinco stacks, abre o painel
na montagem com o título pedido em `h3` e afirma as duas metades: o elemento
renderizado é o pedido (`tagName`), e o `aria-labelledby` do painel continua
resolvendo NELE, com o nome acessível saindo do seu texto. O svelte afirma ainda
`aria-level="3"`, que é mecânica só daquela lib.

### Inconsistências entre stacks, medidas em 2026-09-15

Medidas arquivo a arquivo no código desta data. `node scripts/audit.mjs
alert-dialog --json` fecha com **zero** achados: nenhuma das divergências abaixo
tem portão que a veja.

1. **O gatilho do angular não se nomeia.** `NdsAlertDialogTrigger`
   (`nortear-design-system-angular/src/components/ui/alert-dialog.ts:203-208`)
   não declara `data-slot`; Cancel e Action declaram por host binding
   (`:300`, `:323`). Maioria (4): react (`alert-dialog.tsx:61,69`), vue
   (`AlertDialogTrigger.vue:10`), svelte (`alert-dialog-trigger.svelte:7`) e o
   vanilla, que é a referência (`alert-dialog.ts:172`), escrevem
   `data-slot="alert-dialog-trigger"`. Não medido: se o host binding de Cancel e
   Action vence o `data-slot` que o `ndsButton` composto no mesmo elemento
   também escreve.
2. **A raiz só existe no DOM em duas stacks.** O vanilla deixa na página
   `div[data-slot="alert-dialog"]` com `data-dialog-id` (`alert-dialog.ts:160-168`),
   e o angular o host `nds-alert-dialog` com o mesmo slot (`alert-dialog.ts:96-98`).
   Em react, vue e svelte a raiz da lib não renderiza elemento — o react passa
   `data-slot` a um Root que não tem onde escrevê-lo (`alert-dialog.tsx:46`).
   Divergência de mecânica de lib — registrar, não alinhar.
3. **A variante padrão de Cancel e Action só existe em três stacks.** React
   (Cancel `outline`, `alert-dialog.tsx:238`; Action herda o Button), vue
   (`AlertDialogAction.vue:17`, `AlertDialogCancel.vue:17`) e svelte
   (`alert-dialog-action.svelte:16`, `alert-dialog-cancel.svelte:13`) aplicam a
   classe do Button no wrapper. No vanilla os botões chegam prontos, e no angular
   quem compõe escreve `ndsButton variant="outline"` em cada Cancelar. Divergência
   de API — registrar, não alinhar; o efeito é que "Cancelar é outline" é regra
   do componente em três e convenção de quem compõe em duas.
4. **O conjunto de stories é o mesmo, com uma a mais no vanilla.** As cinco têm
   `Playground`; `Closed`, `Open`, `Confirmed`, `Cancelled`, `Controlled` em
   estados; `Destructive`, `Neutral`, `WithMedia`, `WithoutDescription`,
   `LongDescription`, `Responsive`, `ExtraClass`, `HeadingH3` em variantes. O
   vanilla acrescenta `ListenerCleanup`
   (`alert-dialog-states.stories.ts:332`), que prova que desmontar não emite
   `onClose` — mecânica que só a fábrica tem; nas outras quatro o desmonte é da
   lib. A `Controlled` do vanilla não é controlada: cobre `functional.item4`
   (Escape) e declara `functional.item7` em `coversNotApplicable`
   (`:261-267`). Registrar.
5. **A negativa do foco inicial — "a ação NÃO tem foco" — falta em duas stacks.**
   React afirma na `Open` (`alert-dialog-states.stories.tsx:217`) e no
   `Playground` (`alert-dialog.stories.tsx:275`); vue no `Playground`
   (`alert-dialog.stories.ts:289`); svelte na `Open`
   (`alert-dialog-states.stories.ts:129`) e no `Playground` (`:223`). **Vanilla e
   angular só afirmam o foco no Cancelar** (vanilla `Open` `:139-141` e
   `Playground` `:223`; angular `Open` `:180` e `Playground` `:226`). Maioria
   (3): as duas metades.
6. **O contrato de gatilho e de isolamento é afirmado em partes diferentes.**
   `aria-haspopup="dialog"` no gatilho: vue (`alert-dialog.stories.ts:218`),
   vanilla (`:154`) e angular (`:167`); react e svelte não afirmam.
   `aria-expanded` falso → verdadeiro → falso: só vue (`:219`, `:231`, `:340`),
   embora o vanilla o escreva à mão (`alert-dialog.ts:174,258,293`). Página de
   trás isolada (`aria-hidden` fora do painel): só react
   (`alert-dialog.stories.tsx:246`) e vue (`:242`, `:244`). Sem maioria nas três
   asserções; o vanilla, que é a referência, escreve os dois atributos do
   gatilho e afirma só um.
7. **A descrição removida com o painel ABERTO só é medida nas duas stacks que
   precisaram de registro.** Vue na `LongDescription`
   (`alert-dialog-variants.stories.ts:416-426`) e svelte no `Playground`
   (`alert-dialog.stories.ts:256-274`, pela caixa `runtimeDescription`). React
   (base-ui) e angular (radix-ng) não têm story que remova a descrição em tempo
   de execução, e nenhum dos dois wrappers tem registro próprio — o
   comportamento da lib nesse caminho não está medido. No vanilla não se aplica:
   a fábrica monta o painel a cada `open()` com opções estáticas.
8. **O motivo do fechamento só é afirmado em story em duas stacks.** Vanilla
   afirma `onClose` com `api`, `close-button` e `escape` em `Confirmed`,
   `Cancelled`, `Controlled` e `Playground` (`alert-dialog-states.stories.ts:176,233,315`;
   `alert-dialog.stories.ts:265`); vue afirma a sequência
   `['escape', 'close-button', 'api']` na `Controlled` (`:500`), com o mapeador do
   primitivo. **React, svelte e angular não afirmam motivo em story nenhuma** — o
   mapeador tem teste de unidade no svelte (`close-reason.test.ts`), no vue
   (`alert-dialog.close-reason.test.ts`) e no angular
   (`dialog-close-reason.test.ts:41-83`); no react o teste do mapeador não tem
   caso de AlertDialog. A ordem "confirmação marcada antes do fechamento" é
   afirmada em story só no vue (`invocationCallOrder`, `:487`).
9. **As asserções das variantes não cobrem as mesmas coisas.** Gatilho `outline`
   na `Neutral`: vue (`:216`), svelte (`:162`), vanilla (`:179`) e angular
   (`:187`) afirmam; **react não** (`alert-dialog-variants.stories.tsx:121-166`).
   Cancelar `outline` na `Neutral`: só vanilla (`:186`) e angular (`:193`). Ordem
   dos rótulos do rodapé na `Destructive`/`Neutral`: só vue (`:159`, `:221`).
   Caixa de mídia SEM `aria-hidden` (o ícone é que se esconde): só angular
   (`alert-dialog-variants.stories.ts:233`, `alert-dialog.stories.ts:218`).
   Ordem VISUAL do rodapé empilhado (ação acima do Cancelar) na `Responsive`: só
   angular (`:379`); as outras quatro afirmam `column-reverse` e a ordem do DOM.
   Maioria na primeira (4): afirmar o gatilho; as demais são asserção de uma ou
   duas stacks.
10. **O react não tem o vocabulário de três palavras.** Vue, svelte, vanilla e
    angular declaram `AlertDialogCloseReason = 'escape' | 'close-button' | 'api'`;
    o react não declara (`grep` vazio em `nortear-design-system-react/src`), e a
    docs page chama `dialogCloseReason` (`AlertDialogDocs.tsx:135`), cujo tipo
    admite `overlay`. O `FAMILIA_DE_MOTIVO` compara os tipos que existem e não
    cobra que cada stack declare o seu — por isso não reporta. Maioria (4): tipo
    próprio, ao lado do primitivo.
11. **A marca da confirmação tem quatro formas, e duas stacks exportam o MESMO
    nome com contratos diferentes.** React: bandeira de MÓDULO, uma para a página
    inteira (`dialog-close-reason.ts:26-30`); angular: campo da docs page,
    `this.confirmed` (`AlertDialogDocs.ts:856,879`); vue e svelte: uma instância
    por preview. `createAlertDialogCloseWatch` do vue recebe um callback e devolve
    `{ onEscapeKeyDown, onClickCapture }` para `v-bind` no Content, com o
    Cancelar detectado por delegação no slot (`alert-dialog.close-reason.ts:97-107`);
    o do svelte não recebe nada e devolve `{ listeners, cancelTrigger,
    markConfirmation, markCancelPress, reset, takeReason }` (`close-reason.ts:89-110`).
    Os tipos de gesto também divergem: `AlertDialogCloseGesture` com
    `'escape-key-down'` no vue, `AlertDialogCloseSignal` com `'escape-key'` no
    svelte. Divergência de API de framework — registrar, não alinhar; o que
    merece decisão é o nome igual para duas assinaturas.
12. **`componentSlug` só chega às seções no angular.** O angular o passa ao
    layout, à importação, às variantes, aos relacionados e às notas
    (`AlertDialogDocs.ts:345,430,437,472,477`); react
    (`AlertDialogDocs.tsx:539,546,727,736`), vue (`AlertDialogDocs.vue:605,613,689,694`),
    svelte (`AlertDialogDocs.svelte:333,341,476,486`) e vanilla
    (`AlertDialogDocs.ts:441,476,672,682`) só o dão ao SEO. O efeito é medido no
    container: o `DocsVariants` do react só monta o `data-track-id` do botão de
    copiar quando recebe o slug (`DocsVariants.tsx:48`). Maioria (4): não passa —
    mas a passagem do Skeleton de 2026-09-14 alinhou para o outro lado (react,
    svelte e vanilla passam o slug às seções em `SkeletonDocs`).
13. **O `trigger_id` é explícito em três páginas e derivado do tom em duas.**
    React, vanilla e angular escrevem `destructive`/`neutral` em cada preview da
    Demonstração e das Variantes; vue (`AlertDialogDemo.vue:57-59`) e svelte
    (`AlertDialogDemo.svelte:63`) omitem e derivam do `tone`, caindo em
    `neutral` sempre que o tom não é destrutivo. Os valores enviados hoje são os
    mesmos nas cinco; no Do & Don't as cinco passam `pair1-do` … `pair2-dont`
    explícitos. Maioria (3): explícito.
14. **A tabela de propriedades tem cinco recortes, e o nível do título só aparece
    em uma.** Raiz: react `open`/`defaultOpen`/`onOpenChange`/`children`
    (`AlertDialogDocs.tsx:594-612`); vue igual com `onUpdate:open` e
    `default slot` (`AlertDialogDocs.vue:311-316`); svelte sem `defaultOpen`
    (declarado); vanilla lista a fábrica — `title`, `titleLevel`, `description`,
    `media`, `defaultOpen`, `onOpenChange`, `onClose` — e uma tabela a mais,
    `createAlertDialogMedia`; angular `open`/`defaultOpen`/`openChange`/
    `panelClass` e uma linha `modal` que existe para dizer que não é entrada
    (`AlertDialogDocs.ts:661,665`), com descrições em override de página
    (`props.table.disabled`, `props.table.modalFixed`, `:60-85`). A forma é
    divergência de API. **O que não é**: o nível do título, capacidade das cinco
    (§7), só tem linha na tabela do vanilla; react, vue e svelte o mencionam só
    no `interfaceCode`, o angular só no comentário `h1…h6`. E a chave
    `props.table.optionalDescription` só é lida pelo vanilla. Na tabela do
    gatilho, `children` é obrigatório em react e vue e opcional no svelte; no
    angular Action e Cancel não têm linha de classe (`:686`, `:691`).
15. **A tabela de tokens do angular está em outra ordem.** As onze linhas são as
    mesmas nas cinco (o instrumento fecha com zero divergência), mas o angular
    põe `--muted-foreground` e `--destructive` antes de `--radius-card` e
    `--spacing-6` por último (`AlertDialogDocs.ts:705-721`). React, vue, svelte e
    vanilla seguem a ordem da folha: véu, painel, descrição, mídia, ação.
    Maioria (4).
16. **Os construtores de snippet não têm o nome das stories, e o vue mistura
    idiomas.** As stories se chamam `WithMedia`, `WithoutDescription` e
    `ExtraClass` nas cinco. Os construtores: react e svelte
    `alertDialogWithIconSource`, `alertDialogNoDescriptionSource`,
    `alertDialogClassNameExtraSource`; vue os mesmos, mais
    `alertDialogConfirmadoSource`, `alertDialogCanceladoSource` e
    `alertDialogDescriptionLongaSource` (`alert-dialog.source.ts:208,226,318`);
    angular `alertDialogWithMediaSource`, `alertDialogWithoutDescriptionSource`,
    `alertDialogExtraClassSource` — o único que bate com a story; vanilla não tem
    construtor por story, e sim `alertDialogSourceWith({...})` sobre um
    `alertDialogSnippet` único. Maioria de nome (angular sozinho acerta a story);
    a forma do vanilla é da stack.
17. **Só o angular prova que todo construtor entra na varredura.** O
    `alert-dialog.source.test.ts` do angular tem "todo construtor exportado pelo
    módulo entra na varredura" e "as catorze stories dos três arquivos têm
    construtor, e só um cada" (`:153-188`). React (25 casos), vue (23), svelte
    (20) e vanilla (13) testam construtor por construtor, sem conferir cobertura.
    A ordem Cancelar antes da Ação no snippet é afirmada em react (`:52`), vue
    (`:208`) e angular (`:243`); svelte e vanilla não a afirmam. Maioria (3) na
    ordem; uma stack na cobertura.

### Pendências

> **PENDÊNCIA · 2026-09-15** — o C7 (rodapé com Cancelar + Ação obrigatório) não tem portão: uma composição sem rodapé passa nas cinco stacks.
> **Fecha quando**: um teste ou regra reprovar um painel montado sem `alert-dialog-footer` ou sem `alert-dialog-cancel`, com o defeito plantado e medido nas cinco.

> **PENDÊNCIA · 2026-09-15** — as dezessete inconsistências acima estão medidas e sem correção; os itens 1, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16 e 17 pedem alinhamento, e os itens 2, 3, 4, 11 e 14 pedem só registro (com as decisões da dona apontadas neles).
> **Fecha quando**: a próxima revisão de código deste componente remedir cada item no HEAD e marcá-lo como fechado ou registrado, como a §7 do `skeleton.md` fez em 2026-09-14.

## 8. Acessibilidade

**Atributos**: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`
sempre presente (o título), `aria-describedby` só quando há descrição. No
gatilho, `aria-haspopup="dialog"` e `aria-expanded`.

**Teclado**: Tab e Shift+Tab circulam entre Cancelar e Ação; Enter e Espaço ativam
o botão focado; Escape fecha sem executar a ação.

**O que NÃO se faz, de propósito:**

- não se fecha por clique no véu (D1);
- não se põe um X no canto (D2);
- não se dá foco inicial à ação (D3).

**Movimento reduzido**: o painel para sob `prefers-reduced-motion`, e aqui DUAS
camadas seguram. A de token: a folha declara duração só por `var(--duration-*)`,
e `docs/shared/tokens/motion.css` (linha 102) zera a escada inteira sob a
preferência, `spring` incluída. E a da própria folha: o bloco `@media`
(`alert-dialog.css:180-193`) vem DEPOIS das regras de animação, com os mesmos
seletores e a mesma especificidade, e por isso vence com `animation: none`. Não é
uma das guardas inertes que o `hover-card.md` descreve. Sem animação, a fábrica
do vanilla remove véu e painel na hora, sem esperar `animationend`
(`alert-dialog.ts:307-314`).

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | o diálogo abre | `{ component: "alert-dialog", trigger_id, location }` |
| `dialog_confirm` | a ação é executada | idem |
| `dialog_close` | fecha, por qualquer caminho | idem, mais `reason` |

O `component` é `alert-dialog`, em kebab-case. Mesma família de eventos do Dialog
e do Sheet, com a peça identificada no payload; nas cinco `analytics.ts` o
`dialog_open` e o `dialog_close` restringem `component` a
`'dialog' | 'alert-dialog' | 'sheet'` e proíbem `label`.

**`reason` é obrigatório, no vocabulário da família** (`dialog.md` §9). Aqui só
três palavras aparecem, porque clique fora não fecha este componente (D1):
`escape`; `close-button` para o Cancelar; e `api` para a ação que confirma. A
ação e o Cancelar são as duas partes de fechar da lib, e a lib entrega o mesmo
motivo para as duas — por isso, nas quatro stacks com lib, a demonstração marca
a confirmação ANTES de o diálogo fechar (as quatro formas da marca estão na §7,
item 11). Sem a marca, "confirmou a exclusão" chegaria ao relatório como "apertou
o botão de fechar".

**No vanilla quem entrega o motivo é a própria fábrica**, pela opção
`onClose(reason)`: ela sabe qual botão fechou, e por isso a demonstração de lá
não precisa marcar a confirmação — o `dialog_confirm` sai do clique da ação,
registrado antes do fechamento (`AlertDialogDocs.ts:153-170`).

**E o desmonte não responde à pergunta** (2026-09-12): o callback de limpeza da
fábrica só desmonta o painel e avisa `onOpenChange(false)`, sem `onClose` e sem
devolver foco a um gatilho que está deixando o documento
(`alert-dialog.ts:390-398`). A ausência de motivo é asserção da `ListenerCleanup`
— lista vazia, não "algum motivo" —, e o portão é o `desmonte_emite_fechamento`
(`dialog.md` §9).

**As três palavras são exceção DECLARADA, não uma lista mais curta por acaso.**
`FAMILIA_DE_MOTIVO`, em `scripts/audit.mjs`, registra que o `AlertDialogCloseReason`
não tem `overlay` e confere a premissa contra a linha C5 deste arquivo: se o
componente passar a fechar por clique no véu, a exceção cai e o portão volta a
cobrar a palavra. **O alcance dele**: compara os tipos que existem, e não cobra
que cada stack declare o seu — a stack sem o tipo (o react, §7 item 10) passa.

**Ids estáveis nas cinco, no `trigger_id`**: `destructive` e `neutral` na
demonstração e em Variantes; `pair1-do`, `pair1-dont`, `pair2-do`, `pair2-dont`
no Do & Don't — batendo com as chaves `doDont.pair1/pair2` do conteúdo. O campo
de quem abriu é `trigger_id` na categoria inteira desde 2026-09-10
(`18-overlay.md` §Analytics), e o tipo proíbe o campo antigo.

## 10. Reconstruir do zero

Ordem: folha → primitivo → cabeçalho e rodapé → mídia → stories → docs page.

- **As três decisões de saída andam juntas** (D1, D2, D3): sem clique-fora, com
  Escape, foco inicial no Cancelar. Implementar duas das três produz um diálogo
  que engana.
- **A descrição é opcional, e vue e svelte precisam de registro** (D4): a reka gera
  o id sempre, e o bits não o apaga quando a descrição sai.
- **As keyframes vêm das vizinhas** — o véu, de `dialog.css`; o painel, de
  `utilities.css`. Não duplique.
- **A caixa de mídia se alinha por `:has()`** (D6), não por classe; o texto do
  cabeçalho se centraliza no mobile sem ela.
- **O foco inicial no Cancelar é EXPLÍCITO** (D3) — não confie na ordem do
  rodapé, nem na abertura por toque.
- **O motivo do fechamento mora ao lado do primitivo**, com as três palavras e a
  marca da confirmação; a docs page só repassa.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, mídia, decisões de saída | `docs/shared/styles/nds/alert-dialog.css` |
| keyframes de entrada e saída DO PAINEL | `utilities.css` (`nds-animate-in` / `-out`). O véu não anima desde 2026-09-20 — `dialog.css` não declara mais keyframe de véu |
| texto, props, critérios de teste | `docs/shared/content/alert-dialog/translations.json` |
| desenho e anotações | Figma, página `AlertDialog` (componente `212:3`, chave `alertDialog` em `docs/shared/figma/design-links.ts`) |
| portões determinísticos | `node scripts/audit.mjs alert-dialog --json` |
| motivo do fechamento | ver a tabela "O motivo do fechamento, por stack" na §7 |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**O menu e os títulos de seção não moram no conteúdo desde 2026-09-12.** Este slug
foi o sintoma que abriu a investigação: o menu dizia "Estados" no react e no
vanilla, que leem o `ui.json`, e "Configurações" no vue, no svelte e no angular,
que liam o conteúdo — cinco rótulos divergentes só aqui, de 173 medidos em 82
slugs. Hoje o menu é cromo, as mesmas quinze seções na mesma ordem nas cinco
páginas (medido nesta data nas cinco `AlertDialogDocs`), e o `h2` de cada seção
nasce do id que a própria seção declara, então divergir deixou de ser possível em
vez de passar a ser proibido. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo`, `vocabulario_de_nav_divergente`,
`titulo_de_secao_no_conteudo`, `titulo_de_secao_pedido_ao_conteudo` e
`titulo_passado_ao_container` — o último existe porque no Angular um `[title]`
esquecido **não** reprova no `ngc` (é atributo global do HTML) e viraria tooltip
silencioso no cabeçalho.
