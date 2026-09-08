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
| C1 | O título é obrigatório e vincula `aria-labelledby` automaticamente | `accessibility.item1` |
| C2 | A descrição é opcional; quando existe, vincula `aria-describedby` | `accessibility.item2` |
| C3 | O foco fica preso: Tab e Shift+Tab circulam dentro do painel | `accessibility.item3` |
| C4 | `Escape` fecha quando `dismissible` | `accessibility.item4` |
| C5 | O arraste dispensa o painel, e é EXTRA de ponteiro — nunca o único caminho | `accessibility.item5` |
| C6 | Painel e véu param de animar sob `prefers-reduced-motion` | `accessibility.item6` |
| C7 | O corpo rolável entra na ordem de tabulação e recebe `role="group"` quando nomeado | `accessibility.item7` |
| C8 | O rodapé põe o primário à direita no horizontal e em cima no empilhamento | `04-padroes-design-sistema.md` §Alinhamento de Grupos de Botões |

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

### D7 · O painel não tem sombra

**Estado**: `drawer.css` não declara `box-shadow` em lugar nenhum.
**Por quê**: o painel encosta na borda da tela e quem o separa do fundo é o véu.
**Cuidado ao desenhar**: é diferente do Sheet, que tem fio de 1px mais elevação.

### D8 · `touch-action: none` é o que faz o gesto existir

**Estado**: declarado no painel.
**Medição**: sem isso o navegador trata o movimento como rolagem da página e nunca
entrega os `pointermove` ao painel. As três stacks que rodam lib de gesto já
recebiam a declaração da própria lib; na folha ela é do design system, e é o que
permite às outras duas rodarem o gesto que implementam em casa.

**Nota de 2026-09-08**: esta linha dizia que o valor era "o da lib, LIDO na folha
que ela injeta". Descrever o próprio contrato como cópia do de uma dependência
convida a tratá-lo como emprestado — foi assim que o atributo de direção passou
anos chamando-se `data-vaul-drawer-direction` na folha que as CINCO leem (ver
D-do-atributo). O valor é `none` porque é o único que entrega `pointermove` ao
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
sob movimento reduzido. O arraste em si não é animação: é o painel acompanhando o
ponteiro, e não há o que reduzir enquanto o dedo está na tela.

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
| superfície | — | `--background` |
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
| camada | — | `--z-modal` |

**Sem sombra** (D7).

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

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla, angular | motor de ponteiro PRÓPRIO, que escreve `[data-swiping]` (D9); do compartilhado vêm só os limiares e as funções que decidem |
| svelte | `shouldScaleBackground` e `activeSnapPoint` chegaram a ser expostos contra o que o comentário compartilhado afirma, e foram recolhidos em `3807596f8` |
| angular | consulta `[ndsDrawerClose]` para o foco inicial, porque host binding disputa `data-slot` (D12) |

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

## 9. Analytics

| evento | quando | payload documentado |
|---|---|---|
| `drawer_open` | o painel abre | `{ component: "drawer", label, location }` |
| `drawer_close` | o painel fecha | idem |

**Duas pendências medidas em 2026-09-07, e ficam registradas porque a revisão não
as fechou:**

1. a prosa de `analytics.description` manda o `label` levar o **título do
   drawer** — texto traduzido, que divide o mesmo evento em um valor por idioma
   no GA4. É a mesma correção que hover-card e dropdown-menu já receberam;
2. dos cinco, **só o Angular dispara** o evento, e ele manda `label: direction`,
   que é valor estável. As outras quatro anunciam os eventos e não os emitem.

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
| regra do par de botões | `docs/shared/guidelines/04-padroes-design-sistema.md` |
| texto, props, critérios de teste | `docs/shared/content/drawer/translations.json` |
| desenho e anotações | Figma, página `Drawer` (conjunto `698:116`) |
| portões determinísticos | `node scripts/audit.mjs drawer --json` |
