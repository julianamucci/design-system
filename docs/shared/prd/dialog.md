# PRD — Dialog

> **Estado descrito**: 2026-09-15, conferido contra o código das cinco stacks.
> **Revisão serial fechada em** 2026-09-10 (`1a6ca4fbb`); as rodadas de
> CATEGORIA de 2026-09-11 e 2026-09-12 passaram por aqui depois.
>
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Modal centralizado sobre um véu translúcido, que **interrompe a página**: toma o
foco, trava a rolagem e se anuncia como diálogo modal.

| vizinho | diferença que decide |
|---|---|
| AlertDialog | é irmão, com outra decisão de saída: clique no véu não fecha e não há botão no canto — a escolha tem de ser explícita |
| Sheet | também modal, mas encosta na borda da tela em vez de nascer no centro |
| Popover | não interrompe: fica ao lado da página |

As duas folhas — esta e a do AlertDialog — são irmãs de verdade: `alert-dialog.css`
reusa as keyframes `nds-dialog-fade-in` / `-fade-out` declaradas aqui.

## 2. Contrato de comportamento

A coluna "texto" é a chave de `docs/shared/content/dialog/translations.json` que
publica o contrato; a coluna "portão" é a story que o AFIRMA, medida em
2026-09-15 nas cinco stacks. Onde o portão não cobre as cinco, a linha diz quais.

| # | o contrato | texto | portão |
|---|---|---|---|
| C1 | `role="dialog"` com `aria-modal="true"` | `accessibility.item1` | `Playground` nas cinco; react, vue e angular só afirmam `aria-modal` com `modal` ligado, e react e vue afirmam também a AUSÊNCIA com `modal=false` |
| C2 | Nome e descrição saem do título e da descrição, automaticamente | `accessibility.item2` | `Playground`, `Variants/Default` e `Variants/HeadingH3` pela fixture de cada stack — a do angular não confere o nome (inconsistência 16) |
| C3 | O foco fica preso; o foco inicial vai ao primeiro focável | `accessibility.item3` | `Playground` nas cinco (Tab e Shift+Tab) |
| C4 | Ao fechar, o foco volta ao gatilho | `accessibility.item4` | `Playground` (Escape, véu e X) e `Compositions/MediaPreview` nas cinco |
| C5 | `Escape` e clique no véu fecham, **sem** disparar ações do rodapé; a rolagem é restaurada | `accessibility.item5` | fechar: `Playground` nas cinco; rolagem restaurada: **só o vanilla** afirma (inconsistência 13) |
| C6 | O botão de fechar tem nome acessível para leitor de tela | `accessibility.item6` | `Variants/NoFooter` e `Compositions/MediaPreview` nas cinco |
| C7 | Corpo mais alto que o painel precisa de `tabindex="0"`, `role="group"` e `aria-label` juntos | docblock da folha | `Variants/WithScrollContent` nas cinco afirma `tabindex` e nome; **nenhuma** afirma o `role="group"` |

## 3. Decisões fixadas

### D1 · A superfície é `--popover`, e o Dialog está sozinho entre QUATRO painéis modais

**Estado**: painel em `--popover` / `--popover-foreground`.

**Medição de 2026-09-09**, lendo a declaração de cada folha:

| folha | superfície do painel |
|---|---|
| `dialog.css` | `--popover` |
| `sheet.css` | `--background` |
| `alert-dialog.css` | `--background` |
| `drawer.css` | `--background` |

São **quatro**, e o Dialog é o único fora do consenso. **Nenhuma** lê `--card`.
Reconferido em 2026-09-15 nas quatro folhas: `sheet.css:107`,
`alert-dialog.css:74` e `drawer.css:69` declaram `--background`; `dialog.css:78`,
`--popover`. A tabela nomeia as quatro de propósito — uma contagem anterior dizia
"três" e sobreviveu à entrada do Drawer, porque afirmação sobre os vizinhos não
passa por este arquivo quando um deles muda.

**O registro é ESTE arquivo, e a guideline aponta para cá.** A regra da categoria
mora em `docs/shared/guidelines/18-overlay.md` §Superfície: a tabela de lá nomeia
nove classes (onze componentes — a do DropdownMenu serve também ContextMenu e
Menubar) com o par de tokens de cada uma, diz que **nenhuma lê `--card`** e manda
a divergência dos quatro painéis modais para esta D1.

**Enquanto a divergência existir**, o que vale é a regra estrutural: a classe do
painel resolve a superfície, e ninguém pinta fundo por fora. A revisão serial
passou (2026-09-10) sem mexer no degrau de superfície, então a decisão segue
**aberta** — e fechá-la é escolha da dona, não de rodada de conferência.

### D2 · O rodapé É a aresta de baixo do painel

**Estado**: `margin-inline` e `margin-bottom` negativos de `--spacing-4` cancelam
exatamente o padding do painel; o rodapé recebe o padding de volta e pinta
`--muted` a 50% com borda superior.
**Consequência no raio**: a aresta do rodapé e a do painel são a mesma linha —
na regra de raio aninhado (`Rᵢ = Rₑ − E`) isso é `E = 0`, e o rodapé repete o raio
do painel em vez de descontar. Não é o caso do `.nds-card-nested`, que existe para
quem está dentro **com** afastamento.
**Medição**: era `0.75rem` cravado, e divergia do painel nas **doze** combinações
de tema × modo × largura — 24px de painel contra 12 de rodapé no `default`, 28
contra 12 no `warm`, e rodapé arredondado dentro de um painel de quinas retas no
`cold`, que declara `--radius-card: 0`.

### D3 · O raio muda a 40rem, e o rodapé acompanha

**Estado**: abaixo de 40rem o painel é reto (`--radius-none`); a partir daí assume
`--radius-card`. O rodapé segue o painel no mesmo ponto de corte.
**Cuidado ao desenhar**: nenhum eixo de variante cobre isso, e frame de Figma não
expressa consulta de mídia.

### D4 · O fio de 1px é SOMBRA, não borda

**Estado**: `box-shadow: 0 0 0 1px hsl(var(--foreground) / 0.1), var(--elevation-xl)`.
**Elevação `xl` desde 2026-09-10** — era `lg`. Regra da categoria fixada pela dona: card `sm` · flutuante interativo `md` · flutuante passivo `lg` · modal e drawer `xl`.
**Consequência**: é traço de fora, sem ocupar espaço no layout. No Figma isso é
contorno externo de 1px, não borda.
**Contraste**: o Sheet usa um fio equivalente, mas **literal** — preto a 5%, sem
token. Os dois não são o mesmo valor.
**Conferido em 2026-09-12, depois da tokenização de elevação**: `aaa9ea44c` fez
16 sombras cravadas passarem a ler token e criou o degrau `--elevation-xs`, e
nenhuma das duas coisas alcança esta folha — ela já lia `--elevation-xl`, e o `xs`
é fio de relevo de controle que continua no plano da página, não superfície que
paira: folha modal nenhuma o lê. O degrau daqui continua `xl`, e o portão que o
cobra é `elevacao_fora_do_mapa`.

### D5 · Nenhum véu desfoca o fundo

**Estado**: sem `backdrop-filter`. Nenhuma folha modal tem.

**Histórico**: até 2026-09-08 este era o único overlay com
`backdrop-filter: blur(4px)`, dentro de `@supports`. A medição que o acompanhava
já dizia o suficiente contra ele — sob um véu de `--overlay / 0.8` o desfoque
quase não aparece —, e a justificativa que restava era o movimento do que está
atrás, não o contraste. Retirado por decisão de produto: custo de pintura em
toda abertura por um efeito que a própria folha declarava invisível.

**O que isso ensina sobre decisão registrada**: a linha ficou de pé por meses
com a medição que a derrubava escrita ao lado. Registrar a dúvida não é o mesmo
que resolvê-la — decisão marcada como frágil precisa de data de revisão, senão
o registro honesto vira álibi para a manter.

### D6 · Clique no véu FECHA — e é aqui que os irmãos se separam

**Estado**: fecha. No AlertDialog, não.
**Por quê**: lá a decisão é crítica e exige escolha explícita; aqui o diálogo é
um passo, não um compromisso. `Escape` fecha nos dois.

### D7 · Há UMA saída para conteúdo longo: o corpo rola

**Estado**: `-body-scroll`. O painel fica centralizado e fixo, o cabeçalho e o
rodapé param, e o corpo ganha `max-block-size: 60vh`.

**A segunda rota foi RETIRADA em 2026-09-08**. Era o par `-overlay-scroll` +
`-content-scroll`: o painel inteiro entrava no fluxo do véu, que virava grid com
`overflow-y: auto`, e a PÁGINA é que rolava. Duas razões para não existir —
um modal que rola junto com a página desfaz a própria promessa de interromper;
e duas saídas opostas para o mesmo problema obrigam cada tela a escolher entre
elas sem critério, que é como divergência entra num design system.

A remoção é do recurso, não da story: sai a prop `scroll`, saem as classes, sai
`DialogScrollContent` do Vue e o ramo do overlay no Svelte. Sistema que ainda
permite a rota errada não a proibiu — só deixou de demonstrá-la.

**Por que `max-block-size` e não `height`**: o limite é teto, então painel curto
continua do tamanho do conteúdo. E a medida é relativa à janela, logo cresce com
o zoom do navegador (WCAG 1.4.4).
**O trio obrigatório do corpo rolável**: `tabindex="0"`, `role="group"` e
`aria-label`, juntos. Caixa que rola é parada de teclado (WCAG 2.1.1), parada de
teclado precisa de papel, e nome em elemento sem papel é atributo proibido. É
`group` e não `region` porque marco aninhado num diálogo já nomeado não
acrescenta navegação — mesma decisão registrada em `sheet.css`.

### D8 · O gap do cabeçalho vem do composto, não da base

**Estado**: a folha base declara `--spacing-1-5` (`dialog.css:94`) e um segundo
bloco, mais abaixo, sobrescreve para `--spacing-2` (`dialog.css:249-251`). O
seletor do segundo bloco é o mesmo `.nds-dialog-header`, sem condição, então vale
nas cinco stacks — inclusive no vanilla, que não é "composto".
**Consequência**: ao ler a folha, o segundo valor é o que vale. O alinhamento NÃO
muda com ele: o cabeçalho é centralizado abaixo de 40rem e alinhado à esquerda a
partir daí (`dialog.css:95-102`). O comentário do segundo bloco ("Header do
composite React não é centralizado") descreve o contrário do que a folha faz —
até 2026-09-15 esta D8 o repetia, dizendo "alinhado à esquerda".

### D9 · No rodapé, o primário é o ÚLTIMO do DOM — e é a folha que inverte

**Estado**: `.nds-dialog-footer` é `column-reverse` empilhado e `row` +
`justify-content: flex-end` a partir de 40rem. As duas leituras saem da MESMA
ordem de DOM: secundários primeiro, primário por último. Empilhado o primário
sobe ao topo; deitado ele vai para a direita.

**Por que o inverso do que parece**: escrever o primário por último é
contraintuitivo, e por isso o defeito é reincidente. Medido em 2026-09-07 nas
cinco stacks: as quatro que oferecem o `showCloseButton` do Footer renderizavam o
botão DEPOIS dos filhos, o que o punha na posição do primário; e a story do
vanilla montava `[Voltar, Continuar, Fechar]`, deixando o primário no MEIO com
um `ghost` acima dele.

**O que guardava o defeito**: quatro textos afirmavam "abaixo das ações" — as
duas chaves do conteúdo compartilhado, o docblock do `NdsDialogFooter` e a
linha da tabela de API (§7). Quem conferisse pela leitura encontraria acordo
entre documento e documento; o desacordo estava com a folha, que nenhum dos
quatro cita. É o mesmo mecanismo do drawer, onde um teste verde afirmava a
inversão.

**Nenhum compilador alcança isto**, e nenhuma suíte que asserte por papel
tampouco: a ordem só existe como posição entre irmãos. O portão é ler o DOM.

### D10 · O rodapé fica DENTRO do `<form>`, e é isso que faz o Enter funcionar

**Estado**: em diálogo de formulário, o `<form>` envolve o corpo **e** o rodapé.
A ação primária é `type="submit"` e fica dentro dele.

**Por que não é detalhe de arrumação**: `type="submit"` fora do `<form>` é um
botão inerte — não submete, e o Enter num campo não dispara nada. O botão
continua clicável e com a aparência certa, então nada na tela denuncia.

**Quarta ocorrência desta classe na campanha**, e o caminho dela diz muito: no
`sheet` do Angular o botão de confirmar do perfil estava fora do form; na story
`WithForm` do `dialog` do Angular o arquivo inteiro não tinha um `<form>`
sequer; e a mesma coisa vivia em `anatomy.structureCode` de react, vue e svelte
— que é conteúdo COMPARTILHADO, a chave mais copiada que o componente tem.
Corrigido em 2026-09-07 nas quatro pontas.

**E não fechou nas cinco.** Medido em 2026-09-15: as stories `Variants/WithForm`
(`dialog-variants.stories.ts:178-193`) e `Compositions/ProfileEdit`
(`dialog-compositions.stories.ts:100-119`) do **vue** fecham o `<form>` antes do
`<DialogFooter>`, com o `Button type="submit"` dentro do rodapé — o submit órfão
desta decisão, vivo em duas stories. Nenhuma asserção o pega ali: o vue não lê
`button.form` em story nenhuma (inconsistência 14).

**O que nenhum portão vê**: `<form>` presente e submit fora dele é HTML válido,
compila nas cinco e passa em qualquer asserção por papel ou por texto. O que
denuncia é ler `button.form` — vazio quando o botão está órfão. Hoje quem lê é
`WithForm` no svelte, no vanilla e no angular, e `ProfileEdit` só no vanilla.

### D11 · O cenário das duas composições sem consenso é o do Vanilla

**Estado**: `CustomCloseInFooter` mostra o guia — "Abrir guia" / "Próximos
passos" / rodapé de três botões `[Fechar (ghost), Voltar (outline), Continuar
(primária)]`. `NoFooter` mostra "Sobre este recurso", só título e descrição.
Ambos vivem em `demonstration.labels` do conteúdo compartilhado, nos três
idiomas.

**Por que precisou de decisão, e não de medição**: `CustomCloseInFooter`
renderizava QUATRO cenários diferentes nas cinco stacks — perfil no react,
"Próximos passos" no vanilla, "Configurações de notificação" no vue, convite ao
time no svelte —, e `NoFooter` discordava entre "Sobre este produto", "Sobre
este recurso" e "Saiba mais". Onde nem duas stacks concordam não existe maioria
a que alinhar: a regra "o vanilla é a referência" resolve divergência de markup
e comportamento, mas qual HISTÓRIA a demo conta é escolha de produto. Decidido
pela dona em 2026-09-08, a favor do vanilla.

**O que deixou isso passar tanto tempo**: `demonstration_labels_divergent` só
aponta quem foge da MAIORIA e emudecia sem ela — ver a nota da regra em
`scripts/audit.mjs`. Divergência máxima produzia zero achados. O
`demonstration_labels_sem_consenso` cobre esse caso, e em 2026-09-15
`node scripts/audit.mjs dialog --json` não acusa nada neste slug.

**Conferido em 2026-09-15**: as duas stories usam as mesmas chaves nas cinco
stacks (`guideTrigger`, `guideTitle`, `guideDescription`, `guideBody`, `close`,
`back`, `continueAction`; `aboutTitle`, `aboutDescription`, `aboutBody`). A
mesma regra NÃO alcançou outras stories do arquivo — `ConfirmEmail` conta duas
histórias diferentes e `WithForm`, `WithCloseButtonHidden` e `ProfileEdit` cravam
literais em algumas stacks (inconsistência 19).

**Consequência para quem for montar demo nova**: rótulo de cenário nasce no
conteúdo compartilhado, nunca cravado numa stack. `demonstration.labels` tinha
SEIS chaves para uma página de dez cenários — foi essa escassez que levou cada
stack a inventar a sua.

## 4. Anatomia

```
dialog                        raiz com elemento SÓ no vanilla e no angular (inconsistência 3)
└── dialog-trigger
dialog-overlay                véu, sem desfoque (D5) — irmão do painel, no body
dialog-content                role="dialog" · aria-modal="true" · centralizado por translate
├── dialog-header             coluna
│   ├── dialog-title
│   └── dialog-description
├── dialog-body               sem estilo próprio — peça só no vanilla e no angular (inconsistência 4)
├── dialog-footer             É a aresta de baixo do painel (D2)
└── dialog-close              absoluto, canto superior direito
```

**O corpo não tem estilo próprio**, e a folha diz isso por escrito: o consumidor
define padding e espaçamento do conteúdo.

**O botão de fechar tem duas formas**, e a divisão NÃO é "vanilla contra as
quatro com lib". Medido em 2026-09-15: o vanilla (`dialog.ts:356-375`) e o
angular (`dialog.ts:276-291`) montam um `<button>` puro com `.nds-dialog-close` e
o SVG escrito à mão; react (`dialog.tsx:144-156`), vue
(`DialogContent.vue:62-75`) e svelte (`dialog-content.svelte:73-80`) compõem o
`Button` ghost `icon-sm` do design system e usam só `.nds-dialog-close-position`.
Nas cinco o rótulo vai em `.nds-sr-only`. A folha traz as duas regras, com
afastamentos diferentes — ver §5. Até 2026-09-15 este parágrafo contava o angular
entre as compostas.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/dialog.css`.

| propriedade | valor | token |
|---|---|---|
| véu | 80% de opacidade, **sem desfoque** | `--overlay` — ver D5 |
| superfície | — | `--popover` — ver D1 |
| texto | — | `--popover-foreground` |
| largura | `100% − 32px`, teto de 512px | `--spacing-8` na folga; teto **literal** (`32rem`) |
| padding | 16px | `--spacing-4` |
| gap do painel | 16px | `--spacing-4` |
| raio | reto abaixo de 40rem, depois card | `--radius-none` e `--radius-card` — ver D3 |
| fio + elevação | 1px a 10% + xl | `--foreground` e `--elevation-xl` — ver D4 |
| gap do cabeçalho | 6px na base, 8px no composto | `--spacing-1-5` e `--spacing-2` — ver D8 |
| título | 16px, peso médio, entrelinha 1 | `--text-control-lg`, `--font-weight-medium`, cor `--foreground` |
| descrição | 14px, entrelinha 1.5 | `--text-control`, cor `--muted-foreground` |
| rodapé | fundo a 50%, borda superior, padding 16px, gap 8px | `--muted`, `--border`, `--spacing-4`, `--spacing-2` |
| botão de fechar (forma do vanilla) | canto a 16px, raio `--radius-xs`, padding `--spacing-1`, opacidade 0.7 | `--spacing-4` no canto |
| botão de fechar (forma composta) | só posicionamento: canto a 8px | `--spacing-2` — `.nds-dialog-close-position` |
| anel de foco do fechar | halo 2px + anel 5px | `--background` e `--ring` |
| corpo rolável | teto de 60vh, respiro lateral | `--spacing-2` |
| camadas | — | `--z-modal-backdrop` e `--z-modal` |

**O canto do botão de fechar tem DOIS valores**: `.nds-dialog-close`, afastado
16px, é a forma do vanilla e do angular; `.nds-dialog-close-position`, afastado
8px, é a de react, vue e svelte (§4). Por que os dois números diferem não está
escrito em lugar nenhum da folha — o botão composto traz padding próprio, e o
afastamento menor é compatível com compensá-lo, mas isso é leitura, não medição:
se a diferença óptica importa, ela se mede em tela, e não aqui.

**Animação**: entrada com fade e zoom (`--duration-base`, `--ease-entrance`),
casando `[data-open]` ou `[data-state="open"]` (`dialog.css:230-238`); saída mais
rápida (`--duration-fast`, `--ease-exit`), casando **só** `[data-closed]`
(`dialog.css:240-246`). Por isso a saída só roda onde a lib escreve
`data-closed` — react e angular. Vue e svelte fecham com `data-state="closed"`,
que nenhuma regra de saída casa, e o vanilla remove o painel no mesmo quadro em
que marca `closed` (`dialog.ts:411-422`, decisão escrita no docblock, linhas
66-69). Ver inconsistência 5. O comentário do véu em `dialog.css:59` ("entrada
instantânea — anima só a saída") contradiz as regras de entrada da mesma folha.
Sob `prefers-reduced-motion` as duas animações param — ver §8.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial, ou `open=false` | só o gatilho na tela; o painel não está no DOM — não é painel escondido |
| Opening | de fechado para aberto | `data-state="open"` (vanilla, vue, svelte, angular) ou `data-open` (react, angular): o véu aparece e o painel cresce a partir de 95% |
| Open | gatilho, ou `open=true` | véu semitransparente, foco preso, rolagem da página travada |
| Closing | de aberto para fechado | `data-closed`: o painel encolhe e o véu some, em `--duration-fast` — **só em react e angular**; nas outras três o painel sai sem animação (§5) |
| WithCloseButtonHidden | o `showCloseButton` do Content desligado | sem X no canto; a saída fica sendo Escape, clique no véu ou ação do rodapé |

**Entrada e saída são estados SEPARADOS**, e não um `Transitioning` só — foi o
conteúdo compartilhado que os separou, e eles não são simétricos: a entrada usa
`--duration-base` com `--ease-entrance`, a saída `--duration-fast` com
`--ease-exit`. Sob `prefers-reduced-motion` as duas param.

O foco dentro do painel não é estado do Dialog: o anel é do elemento focado, e
no botão de fechar ele tem as duas camadas descritas na §5.

## 7. API

| prop | o que faz | onde existe |
|---|---|---|
| `open` | estado controlado | react, vue (`v-model:open`), svelte (`bind:open`), angular (`[(open)]`); no vanilla é VERBO — `open()`, `close()`, `isOpen()` |
| `defaultOpen` | estado inicial não controlado | react, vue, angular. **Não** existe no svelte (a raiz do bits só tem `open` bindável) nem no vanilla |
| `onOpenChange` | callback com o novo estado | react, svelte, vanilla, angular (`(openChange)`); no vue é o evento `update:open` |
| `modal` | modalidade (trava de rolagem, `inert` e `aria-modal`) | react, vue, angular; **não** existe no svelte nem no vanilla, que são sempre modais |
| `showCloseButton` **do Content** | exibe o X no canto do painel — padrão `true` | as cinco (no vanilla, opção da fábrica) |
| `showCloseButton` **do Footer** | exibe um botão de fechar dentro do rodapé, como ação TERCIÁRIA — variante `ghost`, primeiro no DOM (D9). Padrão `false` | react, vue, svelte, angular |
| `closeLabel` | rótulo do botão de fechar: no Content é o nome de leitor de tela do X, no Footer é o texto visível. Padrão `'Fechar'` em cada uma | as cinco no Content; no Footer, as quatro que têm a peça |
| `className` / `class` | classes `.nds-*` adicionais | `className` no react, `class` em vue, svelte e vanilla, atributo do host no angular |

**São duas props com o MESMO nome, em peças diferentes.** React, vue, svelte e
angular declaram `showCloseButton` no Content (padrão `true`) e outro
`showCloseButton` no Footer (padrão `false`); o vanilla tem um só, em
`DialogOptions`, porque ali o rodapé é a opção `footer`, que recebe os botões
**já montados** por quem compõe — não há peça de rodapé para pendurar um botão
de fechar próprio (D9). Os nomes longos `showCloseButtonContent` e
`showCloseButtonFooter` não são props de stack nenhuma: são as CHAVES do conteúdo compartilhado
(`props.table.showCloseButtonContent` e `.showCloseButtonFooter` em
`docs/shared/content/dialog/translations.json`), que precisam ser distintas
porque a tabela da docs page é plana e as duas linhas moram na mesma lista. Chave
de conteúdo vestida de nome de prop leva quem lê a escrever uma prop que nenhuma
stack aceita — e `tsc` não reprova o que ninguém escreveu ainda.

`closeLabel` existe nas cinco desde 2026-09-08, com o mesmo default (`'Fechar'`).
Antes o literal ficava cravado DENTRO do primitivo, e quem consumisse em outro
idioma tinha de reescrever o componente. A passagem de 2026-09-07 declarou
"regularizado nas cinco" tendo tocado três stacks e contado o angular, que já
tinha — o vanilla, que não tinha, só entrou no dia seguinte. A prop existir não
garante que a docs page a use: a do vanilla não passa `closeLabel`
(inconsistência 23).

**Conferidos junto, e os três estão certos**: o `sheet.ts` do vanilla já tinha
`closeLabel`; o `drawer` não gera botão de fechar em stack nenhuma — delega a
quem compõe, por `data-slot="drawer-close"` —, e o `alert-dialog` não tem botão
de canto por decisão (D2 do PRD dele).

Os dois `showCloseButton` são independentes: o do Content é o X do canto, o do
Footer é uma ação no rodapé. Ligar um não liga o outro, e nada impede os dois
ligados ao mesmo tempo — é a composição que decide.

**E o vanilla ganhou `open()`/`isOpen()` em 2026-09-12** (`efdf144cd`), com
`trigger` passando a ser OPCIONAL: `DialogElement` é
`DestroyableElement & { open(), close(), isOpen() }`. O que isso aposentou foi o
gatilho escondido — `<button>` com `.nds-sr-only`, `tabindex="-1"` e
`aria-hidden="true"`, clicado por código só para a fábrica ter um alvo —, que
estava na story `Controlled` deste componente e no snippet que o painel Code
publica. O registro por extenso, com o `toggle()` que ficou fora de propósito e a
guarda de reentrância, está na §7 do [`sheet.md`](sheet.md), que é onde a mesma
passagem foi medida. Portão: `gatilho_escondido_clicado`.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` |
| vue | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogTitle`, `DialogTrigger` |
| svelte | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` |
| vanilla | `createDialog` (devolve `DialogElement = DestroyableElement & { open(), close(), isOpen() }`; `trigger` é opcional) |
| angular | `button[ndsDialogClose]`, `button[ndsDialogTrigger]`, `div[ndsDialogBody]`, `div[ndsDialogContent]`, `div[ndsDialogFooter]`, `div[ndsDialogHeader]`, `div[ndsDialogOverlay]`, `div[ndsDialog]`, `h1[ndsDialogTitle]` … `h6[ndsDialogTitle]` (os seis), `ng-template[ndsDialogPortal]`, `p[ndsDialogDescription]` |

O índice do svelte também reexporta as formas curtas — `Close`, `Content`, `Description`, `Footer`, `Header`, `Overlay`, `Portal`, `Root`, `Title`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

**A peça que diz por que o painel fechou também é do componente**, e desde
2026-09-12 as cinco a têm ao lado do primitivo. Antes disso, três stacks deduziam
o motivo DENTRO da docs page, onde a dedução não tinha teste e cada página fazia
à sua maneira:

| stack | peça | forma | exportada por | como se marca a confirmação |
|---|---|---|---|---|
| react | `ui/dialog-close-reason.ts` | traduz — a base-ui publica o motivo em `eventDetails.reason` | o próprio arquivo; `dialog.tsx` **não** a reexporta | `markConfirmation()`, estado de módulo consumido na leitura seguinte |
| angular | `ui/dialog-close-reason.ts` | traduz — o radix-ng publica `RdxDialogOpenChangeReason`, que tem oito palavras contra as nossas quatro; o mesmo arquivo traz `alertDialogCloseReason` | reexportada por `dialog.ts:467` | parâmetro `hints.confirmed` |
| vanilla | a própria fábrica, em `onClose(reason)` | sabe de primeira mão: é ela que fecha | `DialogCloseReason` em `dialog.ts:77` | `close()` informa `api` |
| vue | `ui/dialog/dialog.close-reason.ts` | OBSERVA o gesto: a reka-ui não publica motivo | `index.ts:10-17`, com `createDialogCloseWatch` e `DIALOG_CLOSE_SLOT` | gesto `confirm` anotado por quem chama |
| svelte | `ui/dialog/close-reason.ts` | observa o gesto: a bits-ui também não publica | `index.ts:15-21`, com `createDialogCloseWatch` | `markConfirmation()` do objeto devolvido |

Quem marca a CONFIRMAÇÃO é a página — é ela que sabe que a pessoa decidiu —, e a
marca vence o motivo da lib, porque a ação e o cancelar são as duas partes de
fechar e a lib entrega a mesma palavra para as duas. O que saiu da página foi a
tradução. Portão: `motivo_sintetizado_na_docs_page`. **A marca existe nas cinco e
só duas páginas a chamam** — ver inconsistência 24.

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

### Inconsistências entre stacks, medidas em 2026-09-15

Medidas arquivo a arquivo no primitivo, nas quatro stories, nas fixtures, nos
testes de motivo e de snippet, e na docs page das cinco stacks. Caminhos curtos:
`ui/` é `src/components/ui/` (vue e svelte em `ui/dialog/`), `docs/` é
`src/components/docs/`. "var", "st" e "comp" são os arquivos
`dialog-variants`, `dialog-states` e `dialog-compositions.stories`.

**Markup e comportamento do primitivo**

1. **Forma do X do canto.** vanilla `ui/dialog.ts:356-375` e angular
   `ui/dialog.ts:276-291`: `<button class="nds-dialog-close">` com SVG à mão,
   afastado 16px. react `ui/dialog.tsx:144-156`, vue `DialogContent.vue:62-75`,
   svelte `dialog-content.svelte:73-80`: `Button` ghost `icon-sm` +
   `.nds-dialog-close-position`, afastado 8px. Maioria (3): composta; a
   referência (vanilla) e o angular usam a forma pura. A maioria não inclui a
   referência — decisão da dona.
2. **`data-slot="dialog-close"` nos fechadores que não são o X.** O contrato do
   vanilla é que todo `[data-slot="dialog-close"]` dentro do painel fecha
   (`ui/dialog.ts:311-314`), e o vue reusa o seletor para observar o motivo
   (`DIALOG_CLOSE_SLOT`, `dialog.close-reason.ts:83`). O fechar do rodapé
   (`showCloseButton` do Footer) leva o slot só no vue (`DialogFooter.vue:60-68`);
   não leva em react (`ui/dialog.tsx:221-225`), svelte
   (`dialog-footer.svelte:62-66`) nem angular (`ui/dialog.ts:424`). A peça avulsa
   de fechar leva o slot em react (`ui/dialog.tsx:94-96`), vue
   (`DialogClose.vue:10`) e svelte (`dialog-close.svelte:11`), e não no angular
   (`NdsDialogClose`, `ui/dialog.ts:457-462`, que declara o motivo: disputa de
   host binding com o `NdsButton`). Maioria (3) sem slot no fechar do rodapé;
   a referência pede o slot.
3. **Elemento raiz `data-slot="dialog"`.** Existe no vanilla (`<div>` em volta do
   gatilho, `ui/dialog.ts:249-259`) e no angular (`div[ndsDialog]`,
   `ui/dialog.ts:106-119`). React (`ui/dialog.tsx:61`) e vue (`Dialog.vue:33`)
   passam o atributo a uma raiz de lib que não renderiza elemento; o svelte nem
   o declara (`dialog.svelte:40`). Divergência de lib (raiz sem elemento) —
   registrar, não alinhar.
4. **`dialog-body` como peça.** Vanilla cria o corpo (`ui/dialog.ts:338-341`) e
   angular tem `div[ndsDialogBody]` (`ui/dialog.ts:370-378`); react, vue e svelte
   não têm peça, e cada story ou docs page escreve `class="nds-dialog-body"` à mão
   — ou esquece: o corpo rolável da docs page do vanilla sai com
   `nds-dialog-body-scroll` sem `nds-dialog-body` (`docs/DialogDocs.ts:649`).
   Maioria (3) sem peça; referência e angular com. Decisão da dona.
5. **Atributo de estado e animação de saída.** `data-state` no vanilla
   (`ui/dialog.ts:277,295`), vue (reka `DialogContentImpl.js:86`), svelte (bits
   `dialog.svelte.js:90`) e angular (escrito pelo wrapper, `ui/dialog.ts:201,257`,
   além do `data-open`/`data-closed` da lib); o react só tem
   `data-open`/`data-closed` (base-ui `utils/popupStateMapping.js`). A folha anima a
   saída só em `[data-closed]` (`dialog.css:240-246`), então a SAÍDA anima em
   react e angular e não anima em vue, svelte e vanilla (este remove no mesmo
   quadro, `ui/dialog.ts:411-422`, por decisão escrita em 66-69). Maioria (3),
   com a referência: sem animação de saída — contra o que o conteúdo publica em
   `states.closing`. Decisão da dona.
6. **Tag do título e da descrição no svelte.** O bits renderiza `<div
   role="heading" aria-level>` no título e `<div>` na descrição
   (`bits-ui/dist/bits/dialog/components/dialog-title.svelte:33`,
   `dialog-description.svelte:31`). As outras quatro saem `h2` e `p` (base-ui
   `DialogTitle.js:30` e `DialogDescription.js:30`; reka `DialogTitle.js:17` e
   `DialogDescription.js:17`; vanilla `ui/dialog.ts:323,330`; angular por seletor,
   `ui/dialog.ts:338,353`). O título tem saída pelo snippet `child` (acima); a
   descrição não usa esse recurso em ponto nenhum. Maioria (4): `p`.
7. **Nome de fallback em inglês no vue.** `DialogContent.vue:57` escreve
   `aria-label: 'Dialog'` quando `$attrs['aria-labelledby']` falta — e ele sempre
   falta, porque a reka liga `aria-labelledby` pelo contexto e não pelos atributos
   de quem consome. É a premissa medida e RETIRADA no AlertDialog do vue em
   2026-09-10 (`PATCHES.md`, `#vue-alert-dialog-fallback-label`). Nenhuma das
   outras quatro emite nome de fallback. Maioria (4), com a referência: sem.
8. **Modalidade e estado inicial.** `modal` existe em react (`ui/dialog.tsx:56-63`,
   e o `aria-modal` segue o modo em 139), vue (`DialogContent.vue:48-49`) e angular
   (`ui/dialog.ts:112`); svelte emite `aria-modal="true"` sempre (bits
   `dialog.svelte.js:266`) sem prop, e vanilla sempre (`ui/dialog.ts:291`) sem
   opção. `disablePointerDismissal` é input exposto só no angular
   (`ui/dialog.ts:112`) e prop repassada à base-ui no react. `defaultOpen` falta no
   svelte (a raiz do bits só tem `open` bindável) e no vanilla (verbos). Divergência
   de API — registrar, não alinhar (tabela da §7).
9. **Forma da peça de motivo.** React marca a confirmação por estado de módulo
   (`dialog-close-reason.ts:26-30`), angular por parâmetro `hints.confirmed`
   (`dialog-close-reason.ts:66-70`), vue por gesto `confirm` anotado por quem chama
   (`dialog.close-reason.ts:44-49`), svelte por objeto com `markConfirmation()` e
   precedência do ÚLTIMO gesto (`close-reason.ts:107-132`). Só o svelte acrescenta
   prop ao primitivo para isso — `onClosePress` no Content e no Footer
   (`dialog-content.svelte:37`, `dialog-footer.svelte:28`). Divergência de API
   imposta pela lib — registrar, não alinhar.
10. **Escape com dois painéis abertos.** O vanilla pendura um `keydown` no
    DOCUMENTO por instância (`ui/dialog.ts:394`, tratado em 432-437), então um
    Escape fecha TODOS os painéis abertos de uma vez. As quatro libs fecham só o de
    cima (react `ui/dialog.tsx:17-18`, `escapeKey: isTopmost`; angular
    `ui/dialog.ts:40-41`; reka e bits por camada de escape). Maioria (4): só o do
    topo; a referência diverge. Nenhuma story monta painel aninhado.
11. **Lista de focáveis do vanilla.** `getFocusable` (`ui/dialog.ts:199`) filtra
    `button:not([disabled])`, mas não `textarea`, `input` nem `select`
    desabilitados — o foco inicial e o laço do Tab podem mirar um campo que não
    recebe foco. As libs usam a própria noção de tabulável. Maioria (4).

**Stories e asserções**

12. **`States/Controlled` não tem a mesma forma.** Sem gatilho, aberto por botão
    externo: react (`st:296-314`), vue (`st:333-385`) e vanilla (`st:265-292`,
    por `open()`, afirmando que a fábrica não monta gatilho). Com gatilho e
    `open` ligado: svelte (`st:182-207`) e angular (`st:236-254`). Só o vue
    afirma motivos (`[escape, close-button, api]`), só o angular afirma o retorno
    do foco, e o svelte não tem espião de estado. Maioria (3), com a referência:
    sem gatilho.
13. **Rolagem travada e resto da página inerte.** `body` com `overflow: hidden`
    e restaurado ao fechar só no `Playground` do vanilla (`dialog.stories.ts:197,232`)
    — a metade "a rolagem é restaurada" da C5 não tem portão em quatro stacks.
    `inert`/`aria-hidden` fora do painel só em react (`dialog.stories.tsx:167`) e
    vue (`dialog.stories.ts:185`). Movimento reduzido: nenhuma das cinco.
14. **D10 no vue e `button.form`.** O vue põe o rodapé FORA do `<form>` em
    `WithForm` (`var:178-193`) e `ProfileEdit` (`comp:100-119`). `submit.form ===
    form` é afirmado em `WithForm` no svelte (`var:166`), vanilla (`var:254`) e
    angular (`var:209`), e em `ProfileEdit` só no vanilla (`comp:133`); react e vue
    não o afirmam em story nenhuma. Maioria (3), com a referência: rodapé dentro
    do form e `button.form` afirmado.
15. **Motivo de fechamento afirmado em story.** svelte `Playground`
    (`dialog.stories.ts:178,191,203,218`), vanilla `Playground`
    (`dialog.stories.ts:223,240,252,272,275-283`) e vue `Controlled`. React e
    angular não afirmam motivo em story nenhuma — só no teste unitário. Nos
    testes unitários, o angular cobre `swipe` (`dialog-close-reason.test.ts:9-22`)
    e o react não (`dialog-close-reason.test.ts:9-21`); o vanilla não tem teste
    unitário de motivo, só as stories e a `ListenerCleanup`.
16. **Asserções que faltam em uma ou duas stacks.** `aria-expanded` falta no
    `Playground` do react; `data-state` só é afirmado no `Playground` e na `Open`
    de vue, vanilla e angular; `role="dialog"` falta na `Open` do svelte e do
    angular (`st:103-112`, `st:137-145`), e o angular também não afirma
    `aria-modal` nem nome ali; a fixture do angular não confere nome acessível
    (`dialog.fixtures.ts:160-171`) e a do vanilla confere por classe, não por
    `data-slot` (`dialog.fixtures.ts:116,120`); o Cancelar do `Playground` do
    vanilla não confere o retorno do foco. `States/ListenerCleanup` existe só no
    vanilla (`st:305-361`) — mecânica de fábrica sem par nas libs, a declarar.
    `parameters.actions.disable` falta no meta de `comp` do react e em todos os
    metas do angular (só a `HeadingH3` o põe, `var:553`).
17. **D9 afirmada com granularidades diferentes.** Em `CustomCloseInFooter`,
    contagem de três botões só em react (`var:497`) e svelte (`var:354`); variante
    `ghost` do fechar em react, svelte e angular; variante do Voltar só em react e
    svelte; o vue confere só a ordem dos textos (`var:467`). Em `Default`, as cinco
    conferem só que o primário é o último.
18. **Cancelar inerte na story do vanilla.** `Compositions/ProfileEdit` monta o
    rodapé à mão dentro do form (`comp:84-86`) sem `data-slot="dialog-close"` no
    Cancelar, e a fábrica só fecha por esse slot (`ui/dialog.ts:311-314`). Nas
    outras quatro o Cancelar é a peça de fechar da lib. Nenhum passo clica nele.
19. **Cenário e literais das stories.** `ConfirmEmail` conta duas histórias:
    texto informativo com `maria@exemplo.com` em react, vanilla e angular; campo
    de e-mail com rótulo literal em vue e svelte. `WithForm`: `samplePersonName`
    em react e svelte; literais em vue (`var:176-187`, "Juliana Mucci"), vanilla
    ("Maria Souza") e angular (`var:161,165`, "Ana Ribeiro"). `WithCloseButtonHidden`:
    cenário próprio cravado no vue (`st:207-218`) e no vanilla (`st:169-171`).
    `ProfileEdit`: campos literais no vue e no vanilla. `WithScrollContent`: gatilho
    literal no react (`var:239`) e no vanilla (`var:303,307`). Maioria em cada
    caso: chaves do conteúdo compartilhado.

**Docs page**

20. **Botões da docs page do vanilla que fecham ou não fecham ao contrário das
    outras quatro.** Em `custom-close-in-footer` o Voltar entra como `cancelLabel`
    e recebe `data-slot="dialog-close"` (`docs/DialogDocs.ts:121-125,754`), então
    FECHA e relata `close-button`; nas outras quatro o Voltar não fecha. Em
    `scroll-content` o Recusar não leva o slot (`docs/DialogDocs.ts:665-668`) e não
    faz nada; nas outras quatro é a peça de fechar.
21. **Literais onde a maioria lê chave.** Gatilho da rolagem: "Ver termos" no
    react (`docs/DialogDocs.tsx:827`), "Ler termos" no vanilla
    (`docs/DialogDocs.ts:643`). Gatilho destrutivo "Remover" no react (919) e ação
    destrutiva "Remover" no vanilla (712). Cancelar do `pair1-dont` "Não" no react
    (701). Ação do `pair2-dont` "Excluir" no react (755) e no vanilla (471).
    Descrições do Do & Don't literais no vue e no vanilla. Gatilho de
    `confirm-email`: `confirmEmailTitle` em vue, svelte e angular,
    `confirmEmailAction` em react e vanilla; descrição e corpo literais nas quatro
    e chave de override no angular. Gatilho de `media-preview` em três redações.
    A tabela de props do vanilla tem descrições literais em português
    (`docs/DialogDocs.ts:986-1017`).
22. **Estrutura da página.** `variants.note` não é passado no react. O angular
    cria OITO chaves de override que não existem no conteúdo compartilhado
    (`docs/DialogDocs.ts:78-127`: `confirmEmailDescription`, `confirmEmailBody`,
    `coverAlt`, `import.withScroll`, `props.table.modal`, `closeLabel`,
    `escapeKeyDown`, `pointerDownOutside`), omite `notes.tip1`/`tip3`
    (1457-1458), é o único a renderizar `aria.*`, `screenReader.*` e as descrições
    de `testes`, não passa `breadcrumb` ao SEO e não mostra o "quando usar" de
    `confirmEmail` (1191-1197). O texto do override `props.table.closeLabel` do
    react difere do de vue, svelte e angular; o vanilla não tem override. Tabela de
    props: o vue não tem a linha `children` na raiz, o vanilla não tem `closeLabel`
    nem o `showCloseButton` do Footer, o angular acrescenta `modal`,
    `escapeKeyDown` e `pointerDownOutside`. Ordem do teclado: Escape primeiro em
    react, vanilla e angular; por último em vue e svelte.
23. **`closeLabel` na docs page.** React, vue, svelte e angular passam
    `demonstration.labels.close` ao X; a docs page do vanilla não passa `closeLabel`
    a nenhum `createDialog`, e o X sai "Fechar" em inglês e espanhol. Maioria (4).
24. **A ação primária fecha o painel, e quem marca a confirmação.** Nas docs
    pages de react (`docs/DialogDocs.tsx:227`), vue (`docs/DialogDocs.vue:673`),
    svelte (`docs/DialogDocs.svelte:417`) e vanilla (`docs/DialogDocs.ts:127-136`)
    a primária NÃO é peça de fechar — só dispara o evento de confirmação
    (`dialog_confirm` desde 2026-09-16; era `dialog_action`). Na demonstração do
    angular ela é `ndsDialogClose type="submit"` (`docs/DialogDocs.ts:847`) e marca
    `confirmed` antes (1074), saindo `api`. A marca: react tem `markConfirmation()`
    sem call site; svelte idem (`close-reason.ts:122`); vue anota `confirm`
    (`docs/DialogDocs.vue:237`) sem efeito, pois nada fecha pela primária. Nas
    stories a primária fecha no `Playground` do vanilla e na `Controlled` do vue.
    Maioria (4), com a referência: na docs page a primária não fecha. Decisão da
    dona.
25. **Momento do evento de confirmação na prévia com formulário** (`dialog_confirm`
    desde 2026-09-16; era `dialog_action`). No `submit` do form
    em react (`docs/DialogDocs.tsx:250`) e vue (`docs/DialogDocs.vue:947`); no
    clique do botão em svelte (`docs/DialogDocs.svelte:700`), vanilla
    (`docs/DialogDocs.ts:229-241`) e angular (`docs/DialogDocs.ts:569`). Maioria
    (3), com a referência: clique. Decisão da dona (o `submit` conta também o Enter
    que a D10 existe para garantir).
26. **Demonstração.** O react monta dois painéis (`docs/DialogDocs.tsx:506-530`);
    as outras quatro, um. O gatilho é `outline` em react, vanilla e angular e
    `default` em vue e svelte. Só o angular monta a demonstração com `<form>` e
    campos, com valores literais (`docs/DialogDocs.ts:986-987`). Maioria (4), com a
    referência: um painel, sem form.
27. **Snippet do painel Code que não bate com a prévia.** No react a variante
    `withScrollContent` não tem `code` (`docs/DialogDocs.tsx:816-879`); no vue as
    variantes de rolagem e destrutiva publicam `codeDefault`
    (`docs/DialogDocs.vue:410,412`). Svelte, vanilla e angular publicam o snippet
    da própria variante.

**Construtores de snippet**

28. **Conjunto e nomes dos construtores.** O react não tem construtor de
    `ConfirmEmail`; o svelte não tem os de `Open`, `WithCloseButtonHidden` e
    `Controlled`; o vanilla tem construtores genéricos por opção
    (`dialogSnippet`, `dialogSourceWith`). Os nomes misturam idiomas: react
    `dialogPerfilSource`, `dialogWithMidiaSource`; vue e svelte
    `dialogConfirmarEmailSource`, `dialogEditarPerfilSource`,
    `dialogPreviaDeMidiaSource`; angular em inglês (`dialogConfirmEmailSource`,
    `dialogProfileEditSource`, `dialogMediaPreviewSource`). A varredura "todo
    construtor exportado entra no teste" existe dentro do próprio
    `dialog.source.test.ts` só no vue (298) e no angular (272). Nome de export é
    API de framework — registrar; o conjunto faltante não é.

### Pendências

Não havia pendência no formato fixo neste arquivo antes de 2026-09-15.

> **PENDÊNCIA · 2026-09-15** — o vue ainda tem o submit órfão da D10 em `Variants/WithForm` e `Compositions/ProfileEdit`, e react e vue não afirmam `button.form` em story nenhuma (inconsistência 14).
> **Fecha quando**: nas duas stories do vue o `DialogFooter` está dentro do `<form>`, e a `WithForm` de react e vue afirma `submit.form === form`.

> **PENDÊNCIA · 2026-09-15** — botões da referência que fecham ou não fecham ao contrário das outras quatro: Voltar que fecha e Recusar inerte na docs page do vanilla, Cancelar inerte na `ProfileEdit` do vanilla (inconsistências 18 e 20).
> **Fecha quando**: o Voltar de `custom-close-in-footer` não leva `data-slot="dialog-close"`, e o Recusar de `scroll-content` e o Cancelar da `ProfileEdit` levam.

> **PENDÊNCIA · 2026-09-15** — `DialogContent.vue` emite `aria-label="Dialog"` em inglês em todo painel, pela premissa já refutada no AlertDialog (inconsistência 7).
> **Fecha quando**: `DialogContent.vue` não escreve `aria-label` de fallback.

> **PENDÊNCIA · 2026-09-15** — a C5 ("a rolagem é restaurada") só tem portão no vanilla, e a C7 não tem portão para `role="group"` em stack nenhuma (inconsistência 13).
> **Fecha quando**: o `Playground` das cinco afirma `overflow` travado e restaurado, e a `WithScrollContent` das cinco afirma `role="group"`.

> **PENDÊNCIA · 2026-09-15** — três alinhamentos em que a maioria não inclui a referência, ou em que a referência contradiz o conteúdo publicado: forma do X do canto (1), peça `dialog-body` (4) e animação de saída (5).
> **Fecha quando**: a dona decide cada uma e a decisão entra como D na §3.

> **PENDÊNCIA · 2026-09-15** — no vanilla um Escape fecha todos os painéis abertos, e a lista de focáveis aceita campo desabilitado (inconsistências 10 e 11).
> **Fecha quando**: `ui/dialog.ts` do vanilla só fecha o painel do topo no Escape e filtra `textarea`, `input` e `select` desabilitados.

> **PENDÊNCIA · 2026-09-15** — fechar pela ação primária e o momento do evento de
> confirmação diferem entre as docs pages, e a marca de confirmação existe sem call
> site em react e svelte (inconsistências 24 e 25).
> **Fecha quando**: a dona decide se a primária fecha na docs page e se a ação conta
> no clique ou no `submit`, e as cinco páginas seguem a decisão.
> **Conferida em 2026-09-16: continua aberta, e uma metade dela ANDOU.** A
> unificação do evento (§9) trocou o NOME — `dialog_action` virou `dialog_confirm`
> nas cinco — e não resolveu o momento: o disparo segue no `submit` em react e vue e
> no clique nas outras três. No Sheet, a passagem da mesma data decidiu que a
> primária FECHA nas cinco docs pages; aqui a decisão continua sendo a oposta
> (maioria e referência: não fecha), e as duas convivem porque o Sheet é painel de
> formulário e o Dialog nem sempre. E o `markConfirmation()` do react deixou de
> estar sem call site — o Sheet passou a chamá-lo —, então o que sobra desta
> pendência é o Dialog.

> **PENDÊNCIA · 2026-09-15** — docs pages divergentes em conteúdo: literais onde a maioria lê chave, `closeLabel` ausente no vanilla, segundo painel na demonstração do react, snippets que não batem com a prévia no react e no vue, overrides do angular sem chave compartilhada (inconsistências 21, 22, 23, 26 e 27).
> **Fecha quando**: as cinco docs pages leem as mesmas chaves para cada prévia, montam um painel na demonstração e publicam o snippet da própria variante.

## 8. Acessibilidade

**Atributos**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` e
`aria-describedby` automáticos a partir do título e da descrição.

**Teclado**: Tab e Shift+Tab circulam dentro do painel; Escape fecha sem executar
ação do rodapé; ao fechar, o foco volta ao gatilho.

**O que NÃO se faz:**

- não se dispara ação do rodapé no Escape nem no clique do véu — fechar não é
  confirmar;
- não se deixa o corpo rolável sem o trio de atributos (D7).

**Movimento reduzido** — a §5 e a §6 dizem que a entrada e a saída param, e há
DUAS portas fazendo isso. A camada de token: a folha declara duração só por
`var(--duration-*)`, e `docs/shared/tokens/motion.css:102` zera a escada inteira
sob a preferência (mecanismo por extenso em `hover-card.md` §8). E a própria
folha: `dialog.css:293-298` declara `animation: none` no véu e no painel sob
`prefers-reduced-motion`. Nenhuma story das cinco stacks afirma o movimento
reduzido.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `dialog_open` | abre por gatilho ou estado controlado | `{ component: "dialog", trigger_id, location }` |
| `dialog_close` | fecha | `{ component: "dialog", trigger_id, location, reason }` |
| `dialog_confirm` | clique na ação primária do rodapé | `{ component: "dialog", trigger_id, action, location }` |

**`dialog_action` foi APOSENTADO em 2026-09-16, por decisão da dona**, e o
terceiro evento deste componente passou a ser o `dialog_confirm` que o Sheet e o
AlertDialog já usavam. Os dois respondiam à mesma pergunta de produto — a ação
primária do rodapé foi executada — com nomes e formatos diferentes, em
componentes que deliberadamente COMPARTILHAM `dialog_open` e `dialog_close`.
O tipo saiu das cinco `analytics.ts`, as cinco docs pages passaram a disparar
`dialog_confirm`, a tabela do conteúdo compartilhado publica o formato novo, e o
catálogo de fundamentos tem uma linha só, cobrindo AlertDialog, Dialog e Sheet.

**O que a unificação mudou no payload**: o `action_label` do evento antigo virou
`action`, e entrou o `trigger_id` — que o `dialog_action` era o único dos três a
não levar. O valor do `action` continua sendo id estável, nunca texto traduzido
(`save`, `ok`, `delete`, `remove`, `continue`, `confirm-email` nas prévias da
página), e o `trigger_id` é o MESMO do `dialog_open` que precedeu a confirmação
na mesma prévia — é ele que liga as duas pontas da série no GA4, coisa que antes
não dava para fazer.

**O momento do disparo não era o mesmo nas cinco** na prévia com formulário — no
`submit` do form em react e vue, no clique do botão em svelte, vanilla e angular
(inconsistência 25).

O Sheet e o AlertDialog emitem os MESMOS eventos, com `component: "sheet"` e
`component: "alert-dialog"` — as peças respondem à mesma pergunta de produto, e
separar as séries esconderia isso. **O campo de quem abriu é `trigger_id` nos
três** (e no `drawer_*`), por decisão da dona em 2026-09-10: até ali o
AlertDialog, o Sheet e o Drawer mandavam o mesmo id estável sob `label`, e esta
linha defendia a divisão dizendo que o lado do Sheet "não é identificador de
gatilho". É: nas demonstrações cada gatilho abre um lado, e o lado é o id dele.
Regra da categoria em `18-overlay.md` §Analytics.

**`reason` é obrigatório, com as quatro palavras da família** — `escape`,
`overlay`, `close-button` e `api`, as mesmas do `drawer_close` e do
`popover_close` (`18-overlay.md` §Analytics). `api` é "fechou por decisão de
dentro": a ação que confirma, ou o fechamento por código.

Até 2026-09-10 este evento dizia `action` onde o drawer e o popover diziam
`api`, e nem era um tipo só: o React aceitava seis palavras (`action`, `user` e
`unknown` além das três comuns), React, Vue e Svelte deixavam o campo opcional,
e o Dialog e o AlertDialog do Vue e do Svelte não mandavam motivo nenhum — a lib
deles não publica, e a docs page não o deduzia. A dona decidiu por `api`, e as
cinco passaram a mandar o campo nos três componentes que usam este evento. Onde
a lib não publica motivo (vue, svelte), a peça de motivo ao lado do primitivo
(§7) observa `Escape`, clique fora, foco que escapa e o clique em controle de
fechar, e a docs page só repassa a palavra. Portão: `reason_vocabulario_divergente`.

**Desmontar não é fechar** (2026-09-12). Sair da página com o painel aberto —
troca de story, desmonte de docs page, troca de idioma, que refaz as seções —
tirava o painel chamando o mesmo caminho de fechamento, e o relatório recebia um
`dialog_close` com `api`: a MESMA palavra de quem confirmou a ação, portanto
indistinguível dela no GA4. Valia para o Dialog e para o AlertDialog do vanilla;
o Sheet e o Drawer já desmontavam calados. Hoje o desmonte remove o painel e
avisa só `onOpenChange(false)`, que descreve estado e não gesto. Portão:
`desmonte_emite_fechamento`, que resolve um salto de chamada — nenhum desses
callbacks de limpeza contém a palavra `onClose`, todos chamam uma função local,
e por isso a primeira versão do portão, que procurava a palavra, achava zero com
três fábricas defeituosas.

**MUDANÇA DE CONTRATO, 2026-09-12: o "Fechar" próprio do rodapé relata
`close-button`, e não mais `overlay`.** A variante `customCloseInFooter` da docs
page do vanilla montava um botão de fechar que, ao ser clicado, subia até o
painel, achava o véu irmão e CLICAVA nele. Fechava, mas relatava um gesto de véu
para um clique que foi de botão, e na série do GA4 aquela dispensa contava junto
com quem clicou fora do painel para sair. O botão passa a levar
`data-slot="dialog-close"` — o caminho que a própria página ENSINA no snippet ao
lado, e que a delegação do painel escuta desde 2026-09-11. Mesma raiz que o
clique falso no véu das duas paletas de comando, retirado no mesmo dia: aquelas
não escutavam `onClose`, então nenhum evento mudou de valor ali.

**Desde 2026-09-10 quem cobra o campo é o TIPO.** Nas cinco `analytics.ts`,
`dialog_open`, `dialog_close` e `dialog_confirm` exigem `trigger_id` e proíbem
`label` (`label?: never`), e `location` é obrigatório no abrir e no fechar — o
`dialog_confirm` entra nessa lista porque é o terceiro evento da FAMÍLIA — desde
2026-09-16 o Dialog também o dispara, no lugar do aposentado `dialog_action`, que
está
fora dela: nas cinco ele é `{ component: string; action_label: string;
location?: string }` — sem `trigger_id`, sem a guarda `label?: never` e com o
`component` aberto em `string` em vez da união de três palavras. Medido em
2026-09-12; o aperto é decisão da dona, e as cinco declarações mudam juntas. O
primeiro desenho foi uma união discriminada pelo `component` — `dialog` com
`trigger_id`, `alert-dialog` e `sheet` com `label` —, e ela durou o mesmo dia:
com a unificação não há mais o que discriminar. Até ali os dois campos eram
opcionais, e um dia depois da decisão abaixo o
Dialog de quatro stacks ainda mandava `label` — no Angular com os valores
`par1_do`/`par2_dont`. Nenhum portão via: o tipo aceitava tudo. Plantada a
união, o `npm run build` reprovou exatamente esses pontos, e mais um
`component` alargado para `string` no AlertDialog do vanilla.

**Os ids da página, iguais nas cinco** — um por prévia, e toda prévia viva rastreia:

| prévia | `trigger_id` | `location` |
|---|---|---|
| demonstração | `default` | `docs_demo` |
| Do & Don't, par 1 e par 2 | `do-dont-pair1-do` · `do-dont-pair1-dont` · `do-dont-pair2-do` · `do-dont-pair2-dont` | `docs_do_dont` |
| Variantes | `basic` · `with-form` · `scroll-content` · `no-footer` · `destructive` · `custom-close-in-footer` · `confirm-email` | `docs_variantes` |
| Composições | `profile-edit` · `media-preview` | `docs_composicoes` |

Reconferido em 2026-09-15: ids e `location` iguais nas cinco. A única prévia a
mais é do react, que monta um SEGUNDO painel na demonstração com
`trigger_id: with-form` e `location: docs_demo` (`DialogDocs.tsx:524-530`) —
inconsistência 26. **Para ler a série histórica**: antes de 2026-09-10 a prévia de
fechar próprio mandava `scroll-content`, então a série `scroll-content` anterior
a essa data é a do guia com "Fechar" próprio, não a de rolagem.

**O campo passou de `label` a `trigger_id` em 2026-09-09**, por decisão da dona,
e junto foi um defeito de dados que o nome escondia. No vanilla o payload mandava
`label: opts.triggerLabel`, e `triggerLabel` vinha de
`t('demonstration.labels.triggerLabel')`: **texto traduzido**, em cinco pontos —
o mesmo evento virava três valores no GA4, um por idioma, e a série não juntava.

O `i18n_text_in_payload` não pegava porque lê a chamada de tradução DENTRO do
payload e é cego a indireção de uma variável; o ponto cego já estava documentado
no `audit.mjs`, e este foi o caso que mostrou o que ele custa. A correção deu à
factory um `demoId` estável por demo (`default`, `basic`, `destructive`,
`with-form`, `do-dont-pair1-do`…) e um `actionId` para o `action_label`. Medida a
extensão do mesmo defeito nas cinco stacks: 8 pontos, em 2 arquivos — este e o
`CardDocs.tsx` do React, corrigido junto.

## 10. Reconstruir do zero

Ordem: folha → primitivo → cabeçalho, corpo e rodapé → botão de fechar → stories
→ docs page.

- **O rodapé precisa das margens negativas** (D2). Sem elas ele não é a aresta do
  painel, e o raio passa a ser outro problema.
- **O raio muda por consulta de mídia** (D3), então cabeçalho e rodapé são
  sub-componentes com eixo de layout, e o raio não é coberto por eixo nenhum.
- **As keyframes moram nesta folha** e o AlertDialog as consome — mover ou
  renomear quebra o irmão.
- **`translate`, nunca `transform`** para centralizar: as duas propriedades
  COMPÕEM em vez de uma vencer, e é isso que o `command` explora para reposicionar
  a paleta.
- **No vanilla, o ícone de fechar é montado nó a nó** (`createElementNS`), e não
  por `innerHTML` com a string do SVG: é a regra de XSS da casa
  (`09-seguranca-xss.md`, portão que varre `.innerHTML =` no vanilla), e o que
  a protege é o dia em que o ícone vier do conteúdo em vez de um literal. No
  angular o SVG também é escrito à mão, mas no template do `NdsDialogContent`
  (`dialog.ts:277-289`), onde não há `innerHTML`; em react, vue e svelte o ícone
  vem do `lucide`, e a pergunta não se coloca.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, rodapé, raio, rolagem | `docs/shared/styles/nds/dialog.css` |
| texto, props, critérios de teste | `docs/shared/content/dialog/translations.json` |
| regras globais da família | `docs/shared/guidelines/18-overlay.md` |
| desenho e anotações | Figma, página `Dialog` (componente `692:53`) |
| portões determinísticos | `node scripts/audit.mjs dialog --json` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 57 chaves `nav` saíram do conteúdo em 2026-09-12.** O menu deste slug
dizia "Estados" no react, no vanilla e no angular e "Configurações" no vue e no
svelte, que liam o conteúdo — cinco rótulos divergentes contando `nav.usage`
nos dois idiomas estrangeiros. O título da seção continua vindo do conteúdo.

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas — e desde a mesma
data o TÍTULO da seção é a mesma frase, derivada do mesmo lugar. A linha abaixo
registra por quê. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

**As 48 chaves de título de seção saíram do conteúdo em 2026-09-12**, e
**21 delas diziam palavra diferente da do item de menu que salta para a
seção** — "Quando e Como Usar" contra "Quando Usar", "Design Tokens" contra
"Tokens", "Componentes Relacionados" contra "Relacionados". Aqui isso inclui "Configurações" no lugar de "Estados" e "Composições Disponíveis" numa seção cujo menu dizia outra palavra. O `h2` agora
nasce do id que a própria seção declara, então divergir deixou de ser possível
em vez de passar a ser proibido. Portões: `titulo_de_secao_no_conteudo`,
`titulo_de_secao_pedido_ao_conteudo` e `titulo_passado_ao_container` — o
terceiro existe porque no Angular um `[title]` esquecido **não** reprova no
`ngc` (é atributo global do HTML) e viraria tooltip silencioso no cabeçalho.


