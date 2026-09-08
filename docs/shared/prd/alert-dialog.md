# PRD — AlertDialog

> **Estado descrito**: 2026-09-07.
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
| desfoque do véu | tem | não tem |

As duas folhas são irmãs de código também: `alert-dialog.css` consome as
keyframes `nds-dialog-fade-in` / `-fade-out` declaradas em `dialog.css`.

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

**Estado**: não ao primeiro focável, e não à ação.
**Por quê**: evita confirmação acidental de quem aperta Enter por reflexo. É a
única peça da família em que o foco inicial é escolhido, e não herdado da ordem
do DOM.

### D4 · A descrição é OPCIONAL

**Fixada em** 2026-08-17, decisão da dona: a documentação alinha ao código.
**Medição**: a descrição era opcional no código e obrigatória na anatomia.
Corrigidas cinco chaves nos três idiomas, e o caminho ganhou contrato
(`testes.accessibility.item8`) e story nas cinco (`WithoutDescription`).
**Achado da medição, e é o que interessa guardar**: das cinco, só o **Vue**
quebrava — o `DialogContentImpl` da reka gera o id da descrição sempre e ligava
`aria-describedby` a um id inexistente (a própria lib avisa disso em
desenvolvimento). Corrigido no wrapper, por registro da descrição.

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
**Comportamento**: `:has(.nds-alert-dialog-media)` centraliza o cabeçalho no
mobile e o devolve à esquerda a partir de 40rem.
**Por que `:has()` e não uma classe**: a presença do ícone é o que decide, e quem
compõe não precisa lembrar de marcar o cabeçalho.

### D7 · A superfície é `--background`, e a família não concorda

**Estado**: `--background` / `--foreground` — igual ao Sheet, diferente do Dialog,
que lê `--popover`.
**Registrado como pendência** na guideline de overlay: as três folhas de painel
modal não concordam entre si, e nenhuma lê `--card`, que é o que a guideline pedia
antes. Enquanto durar, o que vale é a regra estrutural — a classe do painel
resolve a superfície, e ninguém pinta fundo por fora.

### D8 · O véu não desfoca

**Estado**: sem `backdrop-filter`. Só o véu do Dialog tem.

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
| sombra | — | `--elevation-lg` |
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
`--duration-base` e `--ease-exit`. As keyframes vêm de `dialog.css`.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel desmontado |
| Open | gatilho | painel montado, foco preso, foco inicial no Cancelar (D3) |
| Transitioning | entrada e saída | fade no véu, fade e zoom no painel |
| Focused | Tab entre os dois botões | anel do próprio botão |

Não há estado de tamanho nem de tom (D5).

## 7. API

| prop | o que faz |
|---|---|
| `open` | estado controlado |
| `defaultOpen` | estado inicial não controlado |
| `onOpenChange` | callback com o novo estado |
| `optionalDescription` | texto de apoio; sem ele o diálogo não declara descrição (D4) |
| `asChild` | compõe com um filho (ex.: Button) sem renderizar wrapper |
| `onClick` | callback da confirmação ou do cancelamento; o diálogo fecha depois de disparar |
| `className` | classes adicionais |

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger` |
| vue | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogTitle`, `AlertDialogTrigger` |
| svelte | `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger` |
| vanilla | `createAlertDialog`, `createAlertDialogMedia` |
| angular | `button[ndsAlertDialogAction]`, `button[ndsAlertDialogCancel]`, `button[ndsAlertDialogTrigger]`, `div[ndsAlertDialogFooter]`, `div[ndsAlertDialogHeader]`, `div[ndsAlertDialogMedia]`, `h2[ndsAlertDialogTitle], h3[ndsAlertDialogTitle]`, `nds-alert-dialog`, `ng-template[ndsAlertDialogContent]`, `p[ndsAlertDialogDescription]` |

O índice do svelte também reexporta as formas curtas — `Action`, `Cancel`, `Content`, `Description`, `Footer`, `Header`, `Media`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

**O nível do cabeçalho do título é customizável em quatro das cinco, cada uma de
um jeito** — medido na fonte de cada lib, não na documentação delas:

| stack | mecanismo | padrão |
|---|---|---|
| react | prop `render` (`BaseUIComponentProps<'h2'>`) | `h2` |
| vue | prop `as` (ou `as-child`) | `as: 'h2'` |
| svelte | prop `level`, numérica | `level = 2` |
| angular | seletor por elemento, nos SEIS níveis | o que quem escreve usar |
| vanilla | opção `titleLevel` da fábrica | `2` |

As cinco aceitam qualquer nível desde 2026-09-08, e chegaram lá por caminhos
diferentes. O Angular oferecia só `h2` e `h3` e ganhou os seis por decisão da
dona; o vanilla não oferecia nenhum — `createElement('h2')` cravado — e ganhou
`titleLevel`, na mesma forma que `createPopoverTitle` e `createCardTitle` já
tinham.

**Por que isso importa**: `heading-order` do axe reprova salto de nível, e o
painel não sabe de que profundidade da página foi aberto — um diálogo disparado
de dentro de uma seção já em `h3` precisa sair em `h4`. O que ainda falta é a
story que exercita isso; está no `FIXES-NEEDED.md`, porque hoje o portão está
verde por não perguntar.

## 8. Acessibilidade

**Atributos**: `role="alertdialog"`, `aria-labelledby` sempre presente (o título),
`aria-describedby` só quando há descrição.

**Teclado**: Tab e Shift+Tab circulam entre Cancelar e Ação; Enter e Espaço ativam
o botão focado; Escape fecha sem executar a ação.

**O que NÃO se faz, de propósito:**

- não se fecha por clique no véu (D1);
- não se põe um X no canto (D2);
- não se dá foco inicial à ação (D3).

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | o diálogo abre | `{ component: "alert_dialog", label, location }` |
| `dialog_confirm` | a ação é executada | idem |
| `dialog_close` | fecha sem executar | idem, com o motivo |

O `component` é `alert_dialog` — mesma família de eventos do Dialog e do Sheet,
com a peça identificada no payload.

## 10. Reconstruir do zero

Ordem: folha → primitivo → cabeçalho e rodapé → mídia → stories → docs page.

- **As três decisões de saída andam juntas** (D1, D2, D3): sem clique-fora, com
  Escape, foco inicial no Cancelar. Implementar duas das três produz um diálogo
  que engana.
- **A descrição é opcional, e o Vue precisa de cuidado** (D4): a reka gera o id
  sempre, então o wrapper tem de registrar a descrição em vez de deixar o
  `aria-describedby` apontar para o vazio.
- **As keyframes vêm de `dialog.css`** — não duplique.
- **O alinhamento do cabeçalho depende de `:has()`** (D6), não de classe.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, mídia, decisões de saída | `docs/shared/styles/nds/alert-dialog.css` |
| keyframes de entrada e saída | `docs/shared/styles/nds/dialog.css` |
| texto, props, critérios de teste | `docs/shared/content/alert-dialog/translations.json` |
| desenho e anotações | Figma, página `AlertDialog` (componente `212:3`) |
| portões determinísticos | `node scripts/audit.mjs alert-dialog --json` |
