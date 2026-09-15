# PRD — Command

> **Estado descrito**: 2026-09-12, conferido linha por linha contra as cinco
> stacks (§12). **Revisão serial fechada em** 2026-09-10 (`00fa34458`, pipeline
> `fix` — ver §12).
>
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto. Quando
> uma linha muda, ela se move para o histórico com a nova data e a nova medição,
> em vez de ser reescrita por cima.
>
> **Até 2026-09-12 este cabeçalho trazia o aviso "⚠ Escrito ANTES da revisão
> serial deste componente"** — dois dias depois de a revisão fechar, e na linha
> seguinte à que já citava a pipeline `fix` que a executou.

## 1. Identidade

Paleta de comandos: **campo de busca no topo, lista filtrável embaixo**. É o
terceiro contrato de teclado da família, e o que o define é onde o foco mora.

| componente | quem tem o foco | o que a letra digitada faz |
|---|---|---|
| DropdownMenu | o item (foco do DOM anda item a item) | typeahead, com `preventDefault` |
| Popover | o conteúdo | vira texto no campo |
| **Command** | **o campo, sempre** | vira texto, e a lista filtra |

O item ativo é apontado por `aria-activedescendant`, e nunca recebe foco do DOM.
É essa escolha que permite ter lista navegável **e** campo de texto na mesma
superfície — o que nem o menu nem o popover conseguem.

**A superfície não tem borda nem sombra próprias**: ela ocupa 100% da caixa em
que vive. Quem dá moldura é o Dialog (paleta aberta por atalho) ou o container
que a hospeda.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | O filtro mantém `aria-selected` e o papel de opção em cada item; o que sai do filtro deixa a lista | `accessibility.item1` |
| C2 | Setas movem o destaque; Enter seleciona o item em destaque | `accessibility.keyboard.arrowDown/enter` |
| C3 | `Escape` fecha o Dialog ou Popover que hospeda e devolve o foco ao gatilho; sem hospedeiro (uso inline), o foco fica no campo e a busca não muda | `accessibility.keyboard.escape` |
| C4 | Tab move o foco entre elementos FORA da paleta — a lista não é percorrida por Tab: não é parada de Tab (sem `tabindex`, ou `-1` onde a lib o põe), e o clique nela não tira o foco do campo | `accessibility.keyboard.tab` |
| C5 | O atalho exibido no item é só visual: registrar a tecla é da aplicação, e o texto do atalho entra no nome do comando | `accessibility.item2` |
| C6 | Dentro do Dialog, título e descrição ficam em `sr-only` e precisam de valores descritivos | `accessibility.item3` |
| C7 | O campo de busca não tem altura fixa | ver D5 |
| C8 | As setas param nas pontas da lista — a de baixo no último item não volta ao primeiro | story `WithDisabledItems` |
| C9 | O filtro compara a busca com o valor e o rótulo do item, nunca com o texto do atalho — **menos no angular, que compara só o rótulo** (§7, "C9 no angular está pela metade") | story `WithShortcuts` ("ctrl" → nenhum resultado) |
| C10 | A lista se chama pelo placeholder do campo | story `Playground` |
| C11 | O separador some quando um dos lados fica sem item (react e svelte o tiram em qualquer busca — padrão da lib, aceito) | stories `Playground` e `WithGroups` ("badge") |
| C12 | O campo inline não rouba o foco ao montar; só a paleta aberta num Dialog foca o campo sozinha | story `Playground` |

## 3. Decisões fixadas

### D1 · O item nunca recebe foco do DOM

**Estado**: quem mantém o foco é o campo de busca; o item ativo é apontado por
`aria-activedescendant`.
**Consequência que decide o desenho do anel**: `:focus-visible` **não dispara
nunca** no item, então o gatilho do anel tem de ser o mesmo atributo que a lib
move com as setas — `aria-selected` / `data-selected`.
**O preço, e ele é honesto**: o anel aparece também ao pousar o ponteiro. O item
marcado É o que o Enter vai ativar, venha a marcação de onde vier.
**O conteúdo contradizia esta decisão até 2026-09-12**: o `testes.accessibility.item4`
prometia, nos três idiomas, que "itens desabilitados não recebem foco na navegação
por teclado" — aqui NENHUM item recebe foco, e o que o desabilitado não recebe é o
DESTAQUE. Frase que descreve o comportamento de um vizinho (o menu, onde o item é
focável de verdade) e passa por verdade porque ninguém lê os dois lados juntos.

### D2 · O anel é INTERNO e em `--accent-foreground`

**Medição, nas duas metades** — a mesma do DropdownMenu, e por isso vale conferir
os dois juntos quando um mudar:

- **por que não `--ring`**: o anel é desenhado sobre o preenchimento de accent, e
  no escuro do tema default os dois têm praticamente a mesma luminância —
  **1,38:1**. O anel sumiria justamente no modo em que o problema é maior.
  `--accent-foreground` é, por definição, o que se lê sobre o accent: **4,66:1**
  no pior dos seis pares de tema e modo, contra os 3:1 da WCAG 1.4.11;
- **por que interno**: quem consome pode pôr o item direto na lista, sem grupo
  (só a fábrica do vanilla sempre embrulha), e a lista **não tem padding** e
  recorta (`overflow-y: auto`, `overflow-x: hidden`) — anel externo some nas
  laterais e nos itens das pontas. Dentro de um grupo, os 4px de padding dele até
  comportariam o anel. As stories e as docs pages usam sempre grupo, com ou sem
  cabeçalho; o anel interno é o que não depende disso.

### D3 · O item selecionado é `--accent` a 10%

**Estado**: 10% aqui; **20%** no item destacado do DropdownMenu.
**Mesmo token, pesos diferentes**, e as duas folhas dizem isso separadamente. Não
unifique sem medir os dois casos.

### D4 · Texto secundário sobre item selecionado é `--accent-foreground` a 85%

**Medição**: `--muted-foreground` sobre o preenchimento de accent mede **2,64:1**,
e o axe reprovou **neste componente**. 85% é o PISO: a 80% a razão cai para
4,34:1.

### D5 · O campo de busca NÃO tem altura fixa

**Estado**: altura é resultado de `padding-block` mais `line-height`.
**Medição**: era `height: 2.5rem`, que travava o campo em 40px — aumentar a fonte
do navegador cortava o texto da busca em vez de fazer a paleta crescer (WCAG
1.4.4, Resize Text 200%). É a mesma regra que vale para `.nds-input`.

### D6 · `display: flex` do item VENCE o `hidden` do navegador

**Estado**: o item declara `display: flex`, que é regra de AUTOR e vence o
`display: none` que o agente de usuário dá ao atributo `hidden`. Por isso existe
uma regra explícita para `[hidden]`.
**Sem ela**: o item que o filtro descartou continua na tela, e a lib que liga
`hidden` — é o que o primitivo de autocomplete faz — parece não funcionar.

### D7 · O tique e o atalho nunca aparecem juntos

**Estado**: `:has([data-slot="command-shortcut"])` esconde o tique quando o item
carrega atalho.
**Por quê**: os dois disputam a mesma borda direita. Ligar os dois desenha algo
que o navegador não vai mostrar.

### D8 · O separador é `--border`

**Estado**: `--border` aqui; **`--muted`** no DropdownMenu. Dois menus, dois
tokens. Sem margem: nas cinco stacks o separador é filho da LISTA, que não tem
padding, e o traço já cruza a lista de ponta a ponta (ver o histórico).

### D9 · Dentro do Dialog, `translate` — nunca `transform`

**Estado**: `.nds-command-dialog-content` fixa `top: 33%` e `translate: -50% 0`,
com `padding: 0`.
**Medição**: o `.nds-dialog-content` centraliza com a propriedade individual
`translate: -50% -50%`. `transform` é OUTRA propriedade, e as duas **compõem** em
vez de uma vencer — o painel saía deslocado -100% na horizontal, quase inteiro
para fora da tela pela esquerda. Usando a mesma propriedade, esta regra
sobrescreve (o `command.css` carrega depois do `dialog.css`) e sobra só o que se
queria: centro na horizontal, 33% do topo.
**Vale para as cinco stacks** — nenhuma escapava.

### D10 · O raio do item é raio aninhado

**Estado**: `--radius-sm`, que é `--radius` (**14px**) menos **4px**: 10px. O
inset que o raio aninhado desconta é o padding do grupo (`--spacing-1`, 4px).
**Os 4px do token são LITERAIS** — a declaração é
`--radius-sm: max(0px, calc(var(--radius) - 4px))`, em `docs/shared/tokens/tokens.css` —, e não `--spacing-1`: hoje os
dois coincidem, e mudar um não muda o outro — os cantos derivam em silêncio.
(Esta linha já citou `tokens.css:222`; a declaração estava na 236 em 2026-09-12
e na 250 em 2026-09-15 — número de linha em documento é referência que envelhece
sozinha.)

### D11 · O primeiro item fica em destaque sozinho

**Estado**: ao abrir e a cada busca, o primeiro item HABILITADO fica em
destaque — digitar e apertar Enter executa. Depois disso, setas e ponteiro.
**Decisão da dona, 2026-09-10.** Antes, cada lib fazia de um jeito: cmdk e bits
destacavam ao montar e a cada busca; a reka, só depois de digitar; vanilla e
angular nunca, e Enter sem seta não fazia nada. É o que as paletas de referência
fazem, e é o que o cmdk e o bits já faziam.

## 4. Anatomia

```
command                       flex column, 100%×100%, overflow hidden
├── command-input-wrapper      ícone de busca + campo; borda inferior
│   ├── [ícone]                  16px, 50% de opacidade
│   └── command-input            sem altura fixa (D5)
├── command-list               teto de 300px, rola · role de listbox
│   ├── command-group          padding de 4px — é ele que dá o raio aninhado (D10)
│   │   ├── command-group-heading
│   │   └── command-item        role de opção · aria-selected
│   │       ├── [ícone]
│   │       ├── [rótulo]
│   │       ├── command-shortcut    exclui o tique (D7)
│   │       └── command-item-check  tique à direita
│   └── command-separator      filho da lista, de ponta a ponta (D8)
└── command-empty              IRMÃO da lista: região viva do aviso de vazio
```

**Até 2026-09-12 esta árvore punha o `command-empty` DENTRO da lista.** Ele é
IRMÃO dela nas cinco stacks, e o `command.css` diz isso por escrito no bloco de
abertura: `role="status"` não é filho permitido de `role="listbox"` — só `option`
e `group` são —, e o axe reprova por `aria-required-children`. O nó fica montado
o tempo todo (região viva criada na hora não anuncia nada) e o que entra e sai é
a CLASSE e o texto; sem a classe ele segue na árvore de acessibilidade com
altura zero, que é o oposto de `display: none`. É também a única região viva do
componente.

Os nomes da árvore são os das classes `.nds-command-*`. O `data-slot` não existe
em todo nó em todas as stacks — o invólucro do campo e o cabeçalho de grupo
divergem, ver §7, inconsistência 1 — e `command-item-check` é só classe nas
cinco.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/command.css`.

| propriedade | valor | token |
|---|---|---|
| superfície | — | `--popover` |
| texto | — | `--popover-foreground` |
| raio da paleta | — | `--radius` |
| padding lateral do campo | 12px | `--spacing-3` |
| padding vertical do campo | 8px | `--spacing-2` |
| ícone do campo | 16px, 50% de opacidade, respiro de 8px | `--spacing-4` e `--spacing-2` |
| borda inferior do campo | 1px | `--border` |
| placeholder | — | `--muted-foreground` |
| teto da lista | 300px | **literal** (`18.75rem`) |
| padding do grupo | 4px | `--spacing-1` |
| texto do grupo | — | `--foreground` |
| cabeçalho de grupo | 12px, peso médio, respiro de 8px lateral e 6px vertical | `--text-control-sm`, `--spacing-2` e `--spacing-1-5`, cor `--muted-foreground` |
| padding do item | 8px lateral, 6px vertical | `--spacing-2` e `--spacing-1-5` |
| gap do item | 8px | `--spacing-2` |
| raio do item | — | `--radius-sm` — ver D10 |
| tamanho de texto | 14px | `--text-control` |
| item selecionado | accent a 10% | `--accent` — ver D3 |
| texto do item selecionado | — | `--accent-foreground` |
| anel do item | 2px interno | `--accent-foreground` — ver D2 |
| ícone do item | 16px | `--spacing-4` |
| transição do item | fundo e cor | `--duration-fast` — ver §8 |
| atalho do item | 12px, espaçamento de 0.1em | `--text-control-sm`, cor `--muted-foreground`; sobre item destacado, `--accent-foreground` a 85% — ver D4 |
| aviso de vazio | respiro de 24px em cima e 24px embaixo, texto centralizado | `--spacing-6`, cor `--muted-foreground` |
| separador | 1px | `--border` — ver D8 |
| item desabilitado | 50% de opacidade | — |

**Até 2026-09-12 a linha do aviso de vazio dizia "padding de 24px,
centralizado".** A folha declara `padding-block: var(--spacing-6)` e
`text-align: center`: não há padding lateral nenhum, e os 24px são de cima e de
baixo — é por isso que a classe que entra e sai custa 48px de altura, que é o
vão que ela deixaria embaixo da lista cheia. Na mesma data entraram as linhas
que a tabela não tinha: o texto do grupo (`--foreground`, e é ele que dá a cor
base do item), o respiro do cabeçalho de grupo, a transição do item e o atalho.

**Sem borda, sem sombra e sem camada próprias**: quem hospeda resolve. A folha
não declara camada nem degrau de elevação; dentro do Dialog, a paleta herda a
elevação `xl` dele (regra de elevação por tipo de superfície, 2026-09-10).
Conferido de novo em 2026-09-12, depois do nascimento do degrau `xs` e da
tokenização das 16 sombras cravadas: a folha desta paleta continua sem uma única
ocorrência de token de elevação, e o degrau `xl` que o `dialog.css` lê segue
sendo o único que a paleta vê. A tabela acima também fecha com a folha nos dois
sentidos (`node scripts/tabela-tokens.mjs command`: zero linhas sem lastro, zero
tokens do componente ausentes das tabelas das cinco docs pages).

A folha também não declara classe de nenhum outro componente — o bloco
`.nds-combobox-*` que morava no fim dela saiu em 2026-09-10 (ver o histórico), e
o portão `seletor_em_duas_folhas` reprova a volta.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Item padrão | — | sem preenchimento |
| Item em destaque | ao abrir e a cada busca, no primeiro habilitado (D11); depois, seta ou ponteiro | accent a 10%, texto `--accent-foreground`, anel interno — é o que o Enter ativa |
| Item desabilitado | `aria-disabled` ou `data-disabled` | 50% de opacidade, sem ponteiro nem teclado |
| Item filtrado para fora | filtro | sai da lista: desmontado em quatro stacks; no angular fica com `hidden`, e aí depende da regra de D6 |
| Item marcado | `data-checked` | tique à direita, salvo se houver atalho (D7) |
| Vazio | filtro sem resultado (no vue, só com busca digitada — ver §7) | o aviso aparece embaixo da lista |

**Até 2026-09-12 a linha do item em destaque dizia só "seta ou ponteiro"** —
deixava de fora o destaque automático do D11, que é justamente o estado em que a
paleta ABRE. E a do vazio dizia que o aviso "ocupa a lista": ele é irmão dela
(§4), aparece embaixo, e a lista some por não ter mais item nenhum.

## 7. API

| prop | o que faz |
|---|---|
| `commandFilter` | filtro customizado: recebe o valor do item e a busca e decide se o item fica. A assinatura é da stack — número (0 esconde) no react e no svelte, booleano no angular; vue e vanilla não expõem a prop |
| `commandValue` | valor controlado do item em destaque — **só no react e no svelte** com esse sentido; ver a divergência de API abaixo |
| `commandOnValueChange` | callback ao mudar o destaque — mesma ressalva do `commandValue` |
| `inputPlaceholder` | placeholder do campo, e o nome acessível do campo E da lista (C10) |
| `itemValue` | valor único do item, usado pelo filtro |
| `itemOnSelect` | callback ao selecionar por clique ou Enter |
| `itemDisabled` | desabilita o item |
| `checked` | marca o comando como escolhido: vira `data-checked`, e o tique acende à direita — salvo se o item tiver atalho (D7). Sem valor a prop não emite atributo nenhum: comando que não representa escolha não declara estado de escolha, nem `false`. Existe nas cinco — no vanilla como campo do item na lista, não como prop |
| `loopFocus` | ligado, a seta passa do último comando ao primeiro; desligado — o padrão — as setas param nas pontas (C8). O NOME é do angular, que declara a prop no próprio `NdsCommand` porque o padrão do primitivo é laçar; no react e no svelte o mesmo interruptor é o `loop` da lib, que já nasce desligado; vue e vanilla não expõem nenhum |
| `reset()` | **só no vanilla**, e é um verbo na raiz devolvida pela fábrica, não uma prop: limpa a busca e redesenha, o que devolve o destaque ao primeiro habilitado e a lista ao topo. É o que cumpre a metade "a cada abertura" do D11 — a fábrica não sabe quando o hospedeiro abre, então quem monta a paleta num Dialog o chama no `onOpenChange(true)`. Nas outras quatro o conteúdo desmonta ao fechar e começa do zero sozinho |
| `dialogTitle` | título do Dialog hospedeiro, em `sr-only` |
| `dialogDescription` | descrição do Dialog hospedeiro, em `sr-only` |
| `dialogShowCloseButton` | exibe o X do Dialog; padrão `false` no `CommandDialog` (react, vue, svelte). Vanilla e angular compõem com o Dialog, cujo padrão é `true` — a paleta passa `false` explicitamente |

### Divergência de forma, registrada

**`commandValue` e `commandOnValueChange` NÃO querem dizer a mesma coisa nas
cinco, e aqui não há fonte de verdade** — é divergência de API de framework, que
a regra da casa manda registrar em vez de alinhar. Medido em 2026-09-12, na raiz
de cada stack:

| stack | o que a prop da raiz controla |
|---|---|
| react | o item em DESTAQUE (`value`/`onValueChange` do cmdk) |
| svelte | o item em DESTAQUE (`value` do `Command.Root`, ligável) |
| vue | o item ESCOLHIDO — é o `modelValue` do `ListboxRoot` da reka, e o destaque mora em `highlightedElement`, que não é prop |
| angular | o TEXTO DA BUSCA — no autocomplete do radix-ng o `value` da raiz É o valor do campo |
| vanilla | não existe: a fábrica não tem valor controlado, e a busca se zera por `reset()` |

Consequência prática para quem lê a linha da tabela: no vue e no angular, passar
`commandValue` não move destaque nenhum. **Até 2026-09-12 a tabela de API
apresentava as duas props como se valessem igual nas cinco.**

**C9 no angular está pela metade, e é defeito de código, não de texto.** O
`NdsCommand` repassa o `filter` do primitivo e não instala filtro próprio, e o
padrão do radix-ng compara a busca com `item.textValue()` e só com ele
(`radix-ng-primitives-combobox.mjs`, `contains(item.textValue(), query)`) — o
`value` do item fica de fora. O rótulo casa porque `textValue` nasce do texto do
elemento, e o atalho não entra nele porque o `NdsCommandShortcut` carrega o
atributo `rdxAutocompleteItemIndicator`, que o primitivo descarta ao montar esse
texto. Ou seja: a metade do atalho está cumprida, a metade do valor não. O
defeito é LATENTE nas stories, porque nenhum `value` delas é um id que o rótulo
não contenha — `value="novo"` para "Novo arquivo" casa pelo rótulo. O react e o
svelte precisaram de trabalho justamente para isso (ver abaixo); o angular ainda
não o tem.

O `cmdk` gera o cabeçalho de grupo com o atributo `[cmdk-group-heading]`, não com
uma classe — por isso a folha estiliza o cabeçalho **por atributo** além da
classe. Não é preferência: é o que a lib emite.

**Atalhos de estilo vim, desligados.** O cmdk e o bits ligam por padrão
Ctrl+N/J/P/K para mover o destaque. Na docs page isso colidia com o atalho da
paleta: no inline do react e do svelte, Ctrl+K subia o destaque E abria a paleta
ao mesmo tempo. As duas stacks desligam (`vimBindings={false}`); as outras três
nunca tiveram.

**Grupo sem cabeçalho não se anuncia como grupo.** Só o vanilla nunca põe o
papel; reka, cmdk, bits e radix-ng põem `role="group"` no nó dos itens, com ou sem
cabeçalho. O vue o anula junto com o `aria-labelledby`, passando `null` no
`v-bind` do `ListboxGroup` (`CommandGroup.vue`); react tira o papel num efeito de
layout depois de montar (e o devolve se o cabeçalho chegar), svelte desenha o nó
pelo snippet `child` sem ele, angular o condiciona ao `heading`. (Até 2026-09-15
esta linha dizia que "vanilla e vue nunca põem o papel" — no vue quem o põe é a
lib, e é o componente que o tira.)
Grupo anônimo seria um "grupo" sem nome lido a cada item.

**C9 no react e no svelte precisa de ajuda.** cmdk e bits filtram só pelo
`value` (e `keywords`) quando ele existe, e com `value` de id "arq" não achava
"Novo arquivo". No react, o `CommandItem` passa o RÓTULO — o texto dos filhos sem
o `CommandShortcut` — como palavra-chave ao cmdk. No svelte isso não funciona: o
bits 2.19 registra as `keywords` na primeira rodada do item, antes de o nó
existir, e não as regrava depois (`command.svelte.js`, `CommandItemState` e
`registerValue`). Lá o rótulo entra no FILTRO da raiz, lido de um registro que
cada item alimenta com o próprio nó (`command-context.ts`), somado às `keywords`
de quem consome. Limite medido e documentado no arquivo: item que nasce escondido
por uma busca inicial que só o rótulo casaria não tem de onde ler até a busca
mudar — nenhuma story ou docs page cai nisso.

**O ponteiro que sai da lista**: no vue e no angular o destaque é APAGADO, e o
Enter não faz nada até a próxima busca ou seta; no react, no svelte e no vanilla
o último item apontado FICA. A divisão é de três contra dois, e a referência está
na maioria: o `command.ts` do vanilla não tem `mouseleave` nem `pointerleave`
nenhum, e quem apaga são os ouvintes das duas libs — `onPointerleave: onLeave` no
`ListboxRoot` da reka, que zera `highlightedElement`, e o `onPointerLeave` do
`RdxAutocompleteItem`, que chama `clearHighlight()` quando o ponteiro sai da
lista (ele só corre porque `highlightItemOnHover` nasce `true` no primitivo). No
cmdk e no bits não existe ouvinte de saída.

**Até 2026-09-12 esta linha omitia o vanilla** e deixava a divisão parecer "as
duas libs que apagam contra as duas que mantêm", sem a referência dentro da
conta. Segue aceito como divergência de lib — o D11 fala de abrir e de buscar, e
nenhum texto das docs promete o que acontece aqui —, mas agora com o lado certo
nomeado: quem divergiu do vanilla foram o vue e o angular.

**A busca depois da escolha: três zeram, duas mantêm.** Vanilla (`selectItem`
chama `reset()`), vue (`onSelect` escreve `filterState.search = ''`) e angular (o
`aoMudarValor` veta a escrita do rótulo no campo e faz `value.set('')`) devolvem
o campo ao vazio, e com ele a lista inteira e o destaque no primeiro comando.
React e svelte deixam a busca como estava, que é o padrão do cmdk e do bits. Nas
três que zeram isso é decisão registrada no código — o campo não pode virar o
nome do comando que acabou de rodar —; nas duas que não, é o padrão da lib.
Registrado, não alinhado: a decisão de uniformizar é da dona, e a diferença só é
visível no uso INLINE, porque a paleta dentro do Dialog desmonta ao fechar nas
quatro stacks com lib (no vanilla é o `reset()` que faz esse papel — ver §7).

**A ordem da lista filtrada: duas reordenam, três mantêm.** No react e no svelte
a busca REORDENA — o cmdk reordena itens e grupos por pontuação (`sort` no estado
da raiz), e o `#sort()` do bits faz o mesmo, com os grupos na pontuação do melhor
item deles. No vue, no vanilla e no angular a ordem do documento é preservada: o
filtro só decide quem fica (a pontuação da reka é 1 ou 0, o vanilla redesenha na
ordem original e o radix-ng percorre os itens registrados). Isso muda QUAL é o
"primeiro habilitado" do D11 depois de digitar: nas duas que reordenam é o mais
relevante, nas três que mantêm é o primeiro que sobrou na ordem da tela.
Divergência de lib, não alinhada — as duas leituras são defensáveis, e nenhum
texto das docs promete uma delas.

**O aviso de vazio do vue exige busca digitada.** O `CommandEmpty` do vue
condiciona a `!!filterState.search && filtered.count === 0`; nas outras quatro a
condição é só a contagem zero (react e svelte leem `filtered.count` da lib,
vanilla conta os filtrados, angular lê `visibleCount()`). A diferença aparece num
caso só: paleta montada SEM comando nenhum e sem busca — as quatro anunciam
"nenhum resultado", o vue fica calado. O único lugar do repositório em que isso
acontece é a story de carregamento do svelte, que é a única stack com peça de
carregamento (ver "Peças, por stack"): lá a lista nasce vazia, e o aviso aparece
ao lado do indicador. O `command.svelte` defende a escolha por escrito — a
contagem nasce em 0 justamente para a paleta sem comando se declarar vazia.

**Home e End**: react, vue e svelte movem o destaque para as pontas (vem das
libs — no bits, `kbd.HOME`/`kbd.END` no `command.svelte.js`); vanilla e angular
não. No angular é condição explícita da lib: o primitivo só trata as duas teclas
em modo GRADE, e fora dela as deixa para o cursor de texto do campo. Aceito como
divergência de lib — o padrão ARIA de
listbox trata as duas teclas como opcionais, e nenhum texto das docs as promete.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator`, `CommandShortcut` |
| vue | `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator`, `CommandShortcut` |
| svelte | `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandLinkItem`, `CommandList`, `CommandLoading`, `CommandSeparator`, `CommandShortcut` |
| vanilla | `createCommand` |
| angular | `div[ndsCommandEmpty]`, `div[ndsCommandGroup]`, `div[ndsCommandItem]`, `div[ndsCommandList]`, `div[ndsCommandSeparator]`, `input[ndsCommandInput]`, `nds-command`, `span[ndsCommandShortcut]`, mais a constante de conveniência `NDS_COMMAND` com as oito e o tipo `CommandSelectDetails` |

O índice do svelte também reexporta as formas curtas — `Dialog`, `Empty`, `Group`, `Input`, `Item`, `LinkItem`, `List`, `Loading`, `Root`, `Separator`, `Shortcut` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

Este componente **não tem título de cabeçalho**, então não há seletor `h2[…]`
nem `h3[…]` aqui — a nota de nível de cabeçalho vale para dialog, sheet, drawer
e alert-dialog, que são os que nomeiam o painel com um cabeçalho.

### Inconsistências entre stacks, medidas em 2026-09-15

Lidas nos cinco primitivos, nas vinte árvores de story, nas cinco docs pages, nos
cinco `command.source.ts` e na fonte instalada das libs (cmdk 1.1.1, bits-ui
2.19.0, reka-ui 2.10.4, @radix-ng/primitives 1.1.2). Não entra aqui o que esta
§7 já registra acima (valor controlado, ponteiro que sai, busca depois da
escolha, reordenação, vazio do vue, Home/End, C9 no angular). Os caminhos são
relativos a `src/components/ui/` de cada stack, salvo quando dito.
`node scripts/audit.mjs command --json` devolveu **zero violações** nesta data:
nenhum item abaixo é visto por portão.

1. **`data-slot` do invólucro do campo e do cabeçalho de grupo.** Invólucro:
   `data-slot="command-input-wrapper"` no react (`command.tsx:185`), no vue
   (`command/CommandInput.vue:102`) e no svelte (`command/command-input.svelte:39`);
   só a classe no vanilla (`command.ts:284-285`) e no angular (`command.ts:189`).
   Cabeçalho: `data-slot="command-group-heading"` só no vue
   (`command/CommandGroup.vue:56`); classe sem `data-slot` no vanilla
   (`command.ts:428-429`), no svelte (`command/command-group.svelte:55-56`) e no
   angular (`command.ts:655`); o react não tem nem a classe, só o atributo
   `[cmdk-group-heading]` da lib (já registrado acima). Maioria (3) marca o
   invólucro, e a referência não; no cabeçalho a maioria (4) não usa `data-slot`,
   como o vanilla.
2. **O que "filtrar por texto" quer dizer.** Três regras. Vanilla: trecho, sem
   distinguir maiúsculas e **distinguindo acento** (`command.ts:399-400`). Vue e
   angular: trecho, sem distinguir maiúsculas nem acento — `useFilter({ sensitivity:
   'base' })` (`command/Command.vue:31`) e o `Intl.Collator` de `sensitivity: 'base'`
   do radix-ng (`radix-ng-primitives-core.mjs:3983-3998`, chamado em
   `radix-ng-primitives-combobox.mjs:142`). React e svelte: pontuação APROXIMADA
   do cmdk e do bits, que casa letras em ordem mesmo sem serem vizinhas
   (`compute-command-score.js`, `SCORE_CHARACTER_JUMP`; o svelte a chama em
   `command/command.svelte:50`) e só baixa a caixa, sem tirar acento
   (`formatInput`, `compute-command-score.js:120-122`). Na prática, "btn" acha
   "Button" só no react e no svelte, e "acoes" acha "Ações" só no vue e no
   angular. Sem maioria nos dois eixos, e o conteúdo, em português, só diz "filtro
   por texto" — decisão da dona.
3. **Enter durante composição de IME.** Vue, react, svelte e angular não executam
   o comando com a composição aberta: `isComposing` na reka
   (`reka-ui/dist/Listbox/ListboxRoot.js:165`), `isComposing || keyCode === 229` no
   cmdk (`cmdk/dist/index.mjs`) e no bits (`command.svelte.js:935`), `composing ||
   isComposing` no radix-ng (`radix-ng-primitives-autocomplete.mjs:1014` e `:1054`),
   e o `stopAtEdge` do angular também solta a tecla (`command.ts:365`). O vanilla
   trata `Enter` e as setas sem olhar composição (`command.ts:531-542`). Maioria
   (4) guarda; a referência não, e nenhuma story das cinco exercita composição.
4. **Onde o separador aparece.** No vanilla a fábrica desenha um traço entre
   CADA par de grupos na tela (`command.ts:420`), e a entrada `{ type:
   'separator' }` só quebra o bloco (`command.ts:395-397`): a `WithGroups` do
   vanilla não declara separador e afirma um divisor
   (`command-variants.stories.ts:88`). Nas outras quatro o traço existe só onde
   quem consome escreve `CommandSeparator`/`ndsCommandSeparator`. Consequência: no
   vanilla não se desenha dois grupos seguidos sem traço. Divergência de API —
   registrar, não alinhar.
5. **O que a escolha entrega.** Vanilla: `onSelect(value: string)`
   (`command.ts:188`). React: `onSelect(value: string)` do cmdk
   (`cmdk/dist/index.d.ts:77`). Svelte: `onSelect: () => void` do bits
   (`bits-ui/dist/bits/command/types.d.ts:118`) — o valor chega por closure
   (`command/CommandInlineStory.svelte:58`). Vue: o evento `select` da reka, com
   `preventDefault` (`command/CommandItem.vue:30` e `:98-108`). Angular: `{ value,
   label }`, por item e na raiz (`command.ts:119-124`, `:224`, `:742`). Divergência
   de API — registrar, não alinhar.
6. **`CommandDialog` com ou sem raiz dentro.** No vue e no svelte o diálogo já
   embrulha a paleta (`command/CommandDialog.vue:42`,
   `command/command-dialog.svelte:49`); no react ele repassa os filhos direto
   (`command.tsx:161`), e quem consome escreve `<Command>` dentro
   (`command-compositions.stories.tsx:445`). Vanilla e angular não têm a peça.
   Divergência de API — registrar, não alinhar.
7. **Nome acessível do campo.** Vanilla, vue e angular escrevem `aria-label` com o
   placeholder (`command.ts:297`, `command/CommandInput.vue:118`, `command.ts:471`),
   e o react o entrega ao rótulo oculto do cmdk (`command.tsx:116`). O svelte não
   escreve nome: o `aria-labelledby` do bits aponta o `<label>` oculto da lib
   (`command.svelte.js:1112`), cujo texto é a prop `label` com padrão `""`
   (`bits-ui/dist/bits/command/components/command.svelte:21` e `:124-126`), que o
   `command/command.svelte` não preenche — o nome só sai do placeholder por
   fallback. A story também não o cobra: o `Playground` do svelte afirma o nome da
   LISTA e não o do campo (`command/command.stories.ts:141-154`), contra
   `toHaveAccessibleName` no react (`command.stories.tsx:172`) e `aria-label` no
   vue (`:177`), no vanilla (`:166`) e no angular (`:171`). Os textos de reserva
   também divergem: "Buscar"/"Resultados" no vanilla (`command.ts:297`, `:307`) e
   no vue (`CommandInput.vue:118`, `CommandList.vue:88`), só "Resultados" no
   svelte (`command-list.svelte:41`), nenhum no react e no angular. Maioria (4)
   nomeia o campo explicitamente, como o vanilla.
8. **Controles do `Playground`.** Vanilla, vue e angular: `placeholder`,
   `emptyMessage`, `showGroups` (`command.stories.ts:31-58`,
   `command/command.stories.ts:43-70`, `command.stories.ts:29-56`). Svelte:
   `placeholder`, `emptyMessage`, `loop`, `shouldFilter`
   (`command/command.stories.ts:34-67`). React: `loop`, `shouldFilter`, sem texto
   nenhum (`command.stories.tsx:36-60`). O espião se chama `onSelect` no vanilla e
   no vue e `onItemSelect` nas outras três. Maioria (3): o conjunto do vanilla.
9. **Asserções que existem numa stack e faltam noutra.** Os quatro arquivos de
   story têm os mesmos nomes de export nas cinco; o svelte tem mais `WithLinkItem`
   e `LoadingState`, das peças que só ele tem. Dentro deles:
   - *grupo sem cabeçalho não tem papel de grupo* (`queryAllByRole('group')` com
     zero): react (`command-compositions.stories.tsx:123`,
     `command-states.stories.tsx:208`), svelte (`command-compositions.stories.ts:103`,
     `command-states.stories.ts:95`), angular (`command-compositions.stories.ts:196`,
     `command.stories.ts:220`), vue (`command-compositions.stories.ts:123`). O
     vanilla não cobra — só afirma que o CABEÇALHO não tem papel
     (`command.stories.ts:188`);
   - *clicar num comando não tira o foco do campo*: react
     (`command.stories.tsx:397`), vue (`:385`), svelte (`:378`); vanilla
     (`command.stories.ts:377-386`) e angular (`command.stories.ts:434-447`) não
     afirmam o foco;
   - *depois de uma busca, o destaque pula o desabilitado* (D11): react
     (`command-compositions.stories.tsx:320`), svelte (`command-states.stories.ts:223`),
     vanilla (`command-states.stories.ts:221`, `command-compositions.stories.ts:273`),
     angular (`command-states.stories.ts:240`); o vue não tem;
   - *C9, metade do rótulo* ("arq" acha "Novo arquivo"): só react
     (`command-compositions.stories.tsx:228`) e svelte
     (`command-compositions.stories.ts:181`). A metade do VALOR — buscar um `value`
     que o rótulo não contém — não é cobrada em stack nenhuma, e é por isso que o
     defeito do angular segue latente;
   - *o gatilho da paleta anuncia o diálogo* (`aria-haspopup`): react
     (`command-compositions.stories.tsx:511`), svelte (`:338`), angular (`:424`); o vue
     só afirma `aria-expanded` no passo do Escape (`:413`), e o vanilla nada —
     embora a fábrica do Dialog escreva os dois (`dialog.ts:256`);
   - *reabrir a paleta começa do zero* (D11 "a cada abertura"): só vanilla
     (`command-compositions.stories.ts:450`); *o primeiro comando já em destaque
     com a paleta aberta*: só angular (`command-compositions.stories.ts:442`).
   Maioria nos três primeiros: a referência cobra menos que as outras.
10. **O estado "Carregando" é das cinco docs pages e de uma stack.** O conteúdo
    publica `states.loading` (`docs/shared/content/command/translations.json:155-159`,
    nos três idiomas), e só o svelte tem a peça (`command/command-loading.svelte`) e
    a story (`command-states.stories.ts:353`). As outras quatro não têm peça, story
    nem prop para esse estado. E a peça do svelte herda do bits `aria-label="Loading..."`
    em inglês (`command.svelte.js:1226`). Decisão da dona: tirar a linha do
    conteúdo ou dar o estado às cinco.
11. **Docs page e analytics.** A chave do grupo é tipada como união
    `'components' | 'utils'` no react (`docs/CommandDocs.tsx:116`), no vue
    (`docs/CommandDocs.vue:220`), no svelte (`docs/CommandDocs.svelte:140`) e no
    vanilla (`docs/CommandDocs.ts:105`); o angular a busca num mapa por valor e cai
    em `''` quando não acha (`docs/CommandDocs.ts:930`), o que emitiria
    `group: ""`. O `componentSlug` do container da demonstração só é passado no
    svelte (`docs/CommandDocs.svelte:360`), onde é informativo. Tipos de evento e os
    call sites de `command_palette_open` são iguais nas cinco. Maioria (4): o
    vanilla.
12. **Construtores de snippet.** O mesmo exemplo tem nomes diferentes:
    `EmptyState` é `commandEmptyStateSource` no react (`command.source.ts:153`) e no
    angular (`:241`), `commandEmptySource` no vue (`command/command.source.ts:164`) e
    `commandNoResultsSource` no svelte (`command/command.source.ts:213`);
    `CheckedItem` é `commandItemCheckedSource` em react, vue e svelte e
    `commandCheckedItemSource` no angular (`:273`); o `Playground` é `commandSource`
    em quatro e `commandPlaygroundSource` no angular (`:188`). O vanilla usa
    opções da fábrica (`commandSourceWith`, `command.source.ts:166`), e o angular tem
    ainda `commandDemoInlineSource`/`commandDemoPaletteSource` (`:423`, `:432`).
    O teste que cobra que todo export é conhecido existe só no react
    (`command.source.test.ts:34`) e no svelte (`command/command.source.test.ts:102`).
    Divergência de forma — registrar, não alinhar.

> **PENDÊNCIA · 2026-09-15** — C9 pela metade no angular: o filtro padrão do radix-ng compara só `textValue()`, e buscar um `value` que o rótulo não contém não acha o comando; nenhuma story das cinco cobra essa metade (inconsistência 9).
> **Fecha quando**: o `NdsCommand` compara a busca também com o `value` do item, e uma story nas cinco busca um `value` ausente do rótulo e acha o comando.

> **PENDÊNCIA · 2026-09-15** — as inconsistências 1, 3, 7, 9 e 11 acima, que têm maioria e lado certo medidos, estão abertas no código.
> **Fecha quando**: cada uma está alinhada nas cinco stacks ou declarada nesta §7 como divergência de forma, com a premissa conferida.

> **PENDÊNCIA · 2026-09-15** — duas decisões da dona: a regra do filtro (inconsistência 2: trecho × aproximada, com ou sem acento) e o estado "Carregando" que o conteúdo publica e só o svelte implementa (inconsistência 10).
> **Fecha quando**: a dona decidir, e a decisão entrar como D numerada na §3 com o código das cinco seguindo-a.

## 8. Acessibilidade

**Atributos**: o campo mantém o foco e aponta o item ativo por
`aria-activedescendant`; cada item carrega papel de opção e `aria-selected`.

**Teclado**: setas movem o destaque, Enter seleciona, Escape fecha o hospedeiro e
devolve o foco, Tab percorre o que está FORA da paleta.

**O que NÃO se faz, de propósito:**

- não se dá foco de DOM ao item (D1);
- não se usa `:focus-visible` como gatilho de estilo de item — ele nunca dispara
  aqui;
- não se confia no atalho exibido para registrar a tecla (C5).

**Movimento reduzido**: o painel para sob `prefers-reduced-motion`, e quem o
para é a camada de TOKEN — a folha declara duração só por `var(--duration-*)`, e
`docs/shared/tokens/motion.css` zera a escada inteira sob a preferência. O
mecanismo, incluindo por que o bloco `@media` da própria folha não é o que
segura, está por extenso em `hover-card.md` §8.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `command_item_select` | item selecionado por clique ou Enter | `{ component: "command", label, group, pattern, location }` |
| `command_palette_open` | a paleta abre, por botão ou por atalho | `{ component: "command", trigger: "keyboard" \| "button", location }` |

`pattern` separa as duas montagens — `inline` e `palette` — e é o que permite ler
a mesma seleção em contextos diferentes sem misturar as séries. `label` é o
VALOR do item e `group` a chave estável do grupo, nunca o texto traduzido.

`component` e `location` são obrigatórios no tipo dos dois eventos, nos cinco
`src/lib/analytics.ts`; `location` é a seção da docs page de onde o gesto saiu.

**Até 2026-09-12 esta linha dizia "como os outros oito overlays os mandam", e a
categoria não é uniforme.** Medido nos cinco `analytics.ts` em 2026-09-12:
`location` é OBRIGATÓRIO em `dialog_open`/`dialog_close` (Dialog, AlertDialog,
Sheet), em `dropdown_menu_open`/`_close` e nos dois do Command; é OPCIONAL em
`drawer_open`/`_close`, `popover_open`/`_close`, `hover_card_open`/`_close` e
`tooltip_view`. Ou seja: quatro dos nove painéis da categoria mandam, cinco
deixam escolher. O `component` também não é igual: em `dialog_*`, `dropdown_*`,
`drawer_*` e nos dois do Command é união de literais, e em `popover_*`,
`hover_card_*` e `tooltip_view` é `string` solta. O Command está no grupo mais
estrito por decisão da dona (2026-09-10), e não por seguir a categoria — que
nisto não tem um padrão só.

**Colisão de nome com a categoria, registrada**: o `command_palette_open` usa o
campo `trigger` para dizer COMO a paleta abriu (`"keyboard"` ou `"button"`),
enquanto a guideline de overlay reserva `trigger_id` para o id ESTÁVEL do gatilho
— dois campos de nome quase igual e papel diferente na mesma família, e os dois
ainda de pé hoje nas cinco stacks. Ler as duas séries juntas no GA4 exige saber
disso: em `dialog_*`, `drawer_*`, `popover_open`, `hover_card_open` e
`tooltip_view`, `trigger_id` responde "qual gatilho"; aqui, `trigger` responde
"por qual caminho". A paleta não manda o id do gatilho em campo nenhum.

**Ctrl+K nas cinco docs pages.** A demonstração da paleta exibe a dica do
atalho, então a página responde a ela: o ouvinte vive enquanto a página está
montada, só ABRE (nunca alterna) e emite `trigger: "keyboard"`. Dica que a
página não honra é uma promessa falsa na frente de quem está aprendendo o
componente.

**A paleta não emite evento de FECHAMENTO, e isso é decisão.** Escolher um item
já emite `command_item_select`; o fechamento que vem logo atrás é consequência
dele, e um evento próprio contaria o mesmo gesto duas vezes. O Dialog hospedeiro
do vanilla emite `dialog_open`/`dialog_close` quando a página os fia — a paleta
da docs page **não** fia `onClose`, de propósito.

Isso importa para ler a mudança de 2026-09-12: até ali a paleta se fechava
disparando um clique FALSO no véu do próprio diálogo
(`document.querySelector('[data-slot="dialog-overlay"]')?.click()`), na docs page
e na story de composição do vanilla. Agora ela chama `close()` na fábrica, que é
o caminho de verdade e informa o motivo `api` — "o programa recolheu o painel
depois de executar o comando". **Nenhum valor de analytics mudou**, porque não
havia `onClose` escutando; o que mudou foi o caminho, e com ele três defeitos
silenciosos: o seletor pegava o véu do PRIMEIRO diálogo do documento e não o
desta paleta, o gesto encenado não tinha autor, e a próxima página que fiasse
`onClose` herdaria `overlay` para um fechamento que nunca foi de véu. No mesmo
dia o Ctrl+K deixou de disparar um `MouseEvent` sintético no gatilho — chama
`open()`, e a guarda "só ABRE" pergunta `isOpen()` à fábrica em vez de espelhar
o estado dela numa variável de página.


## 10. Reconstruir do zero

Ordem: folha → paleta → campo → lista, grupo e item → vazio e separador →
hospedeiro (Dialog) → stories → docs page.

- **O foco mora no campo** (D1). Toda a navegação é consequência disso, inclusive
  o gatilho do anel.
- **A regra para `[hidden]` não é opcional** (D6): sem ela o filtro parece
  quebrado, e o defeito é da folha, não da lib.
- **Dentro do Dialog, use `translate`** (D9) — `transform` compõe com o
  centramento do Dialog e joga a paleta para fora da tela.
- **O campo não pode ter altura fixa** (D5).

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, filtro, anel, hospedagem no Dialog | `docs/shared/styles/nds/command.css` |
| centramento que esta folha sobrescreve | `docs/shared/styles/nds/dialog.css` |
| texto, props, critérios de teste | `docs/shared/content/command/translations.json` |
| desenho e anotações | Figma, página `Command` (componente `702:8`) |
| portões determinísticos | `node scripts/audit.mjs command --json` |
| código do painel Code | `command.source.ts` (só construtores de snippet) — em `ui/command/` no vue e no svelte, solto em `ui/` no react, no vanilla e no angular. Os andaimes que as stories dividem moram no `command.fixtures.ts` ao lado, que existe em QUATRO stacks: o react não tem, porque os auxiliares das stories dele são constantes de seta de uma linha (`commandByValue`, repetida em `command-compositions` e `command-states`), e o portão `fixture_duplicada_entre_stories` só casa declaração `function` com corpo normalizado de 80 caracteres ou mais (`auditFixtureDuplicada`). Não é exceção declarada, é o alcance da regra (até 2026-09-15 esta célula dizia "exceção declarada"). A varredura `source-snippets.test.ts` de cada stack cobra a fronteira |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**Até 2026-09-12 a linha do painel Code dava um caminho só,
`ui/command/command.source.ts`, e dizia que o `command.fixtures.ts` existe "por
stack".** O caminho com pasta vale para o vue e o svelte; nas outras três o
arquivo é irmão do primitivo, em `ui/`. E o `fixtures` existe em quatro, não em
cinco.

**As 54 chaves `nav` saíram do conteúdo em 2026-09-12.** Aqui elas não
produziam sintoma — nenhuma das cinco páginas deste slug lia o conteúdo para
montar o menu —, e é exatamente por isso que valia removê-las: bloco duplicado
que ninguém lê é o que a próxima docs page copia sem saber, e foi assim que 79
dos 85 conteúdos passaram a declarar um menu.

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
"Tokens", "Componentes Relacionados" contra "Relacionados". Nenhum título deste slug divergia por decisão — os quinze são deriva de escrita, do tipo "Critérios de Teste" contra "Testes". O `h2` agora
nasce do id que a própria seção declara, então divergir deixou de ser possível
em vez de passar a ser proibido. Portões: `titulo_de_secao_no_conteudo`,
`titulo_de_secao_pedido_ao_conteudo` e `titulo_passado_ao_container` — o
terceiro existe porque no Angular um `[title]` esquecido **não** reprova no
`ngc` (é atributo global do HTML) e viraria tooltip silencioso no cabeçalho.



## 12. Histórico

**2026-09-12 · o documento foi lido contra as cinco stacks, e onze afirmações
não fechavam.** Nenhuma delas era decisão nova: é o que a revisão do Command
(00fa34458) escreveu antes da rodada de Overlay e o que ela nunca tinha medido
peça por peça. O que mudou, na ordem das seções:

- §4 punha o `command-empty` DENTRO da lista. Ele é irmão dela nas cinco e no
  comentário do `command.css`, por `aria-required-children`;
- §5 dizia "padding de 24px, centralizado" no aviso de vazio — a folha declara só
  `padding-block`. Faltavam quatro linhas: texto do grupo, respiro do cabeçalho de
  grupo, transição do item e atalho;
- §6 descrevia o destaque como "seta ou ponteiro", sem o destaque automático do
  D11, e punha o aviso de vazio dentro da lista;
- §7 apresentava `commandValue`/`commandOnValueChange` como se valessem igual nas
  cinco (o vue controla o item ESCOLHIDO, o angular o TEXTO DA BUSCA, o vanilla não
  tem), não tinha `checked`, `loopFocus` nem `reset()`, e a linha do ponteiro que
  sai da lista omitia o vanilla — a divisão é de três que mantêm o destaque
  (react, svelte, vanilla) contra dois que apagam (vue, angular);
- §7 ganhou três divergências que ninguém tinha registrado: a busca zerada depois
  da escolha (vanilla, vue e angular zeram; react e svelte não), a reordenação por
  relevância (só react e svelte, e ela muda qual é o "primeiro habilitado" do D11)
  e o aviso de vazio do vue, que exige busca digitada;
- §9 dizia que `component` e `location` são obrigatórios "como os outros oito
  overlays os mandam" — em `drawer_*`, `popover_*`, `hover_card_*` e
  `tooltip_view` o `location` é opcional, então quatro dos nove mandam e cinco
  não. E a colisão `trigger` × `trigger_id` passou a estar escrita;
- §11 dava um caminho de `command.source.ts` que só vale para duas stacks, e
  cobrava `command.fixtures.ts` de cinco quando são quatro.

Aberto no CÓDIGO, medido nesta passagem e não corrigido aqui porque este
documento não edita código: **C9 está pela metade no angular** (o filtro do
radix-ng compara só `textValue()`, e o `value` do item fica de fora — §7). A §2 e
a §7 descrevem o estado real enquanto isso não fecha. Desde 2026-09-15 é
PENDÊNCIA formal, no fim da §7.

**2026-09-10 · a varredura do painel Code reprovava no svelte, e ninguém a rodava.** A
rodada que fez as cinco cumprirem o mesmo contrato deixou o `command.source.ts` do
svelte exportando 17 listas e duas funções que não eram construtores de snippet,
e a `source-snippets.test.ts` fechou com 8 falhas. A suíte por slug
(`npm test -- command`) não a alcança: o filtro não casa com o nome do arquivo
da varredura. As listas foram para o `command.fixtures.ts`, o `commandInlineSource`
ganhou padrão, e a saída de cada construtor ficou byte a byte igual.

**2026-09-10 · o bloco `.nds-combobox-*` saiu do `command.css`** — fechava a
pendência aberta no mesmo dia. Oito regras de uma arquitetura anterior do
Combobox, importadas DEPOIS do `combobox.css` (linhas 62 e 63 do `index.css`), e
por isso vencendo a folha do próprio Combobox em toda propriedade repetida.
A pendência lia o caso como "valor duplicado"; a medição achou dois defeitos
visíveis, com a marcação real de cada stack contra as folhas reais:

- o aviso de "nenhum resultado" saía `display: none` em **quatro das cinco**
  stacks (vanilla, vue, svelte e angular — a regra só o mostrava sob um
  `[data-empty]` ANCESTRAL, e só a base-ui marca o popup assim). Em vue e angular
  isso calava também a região viva que existe para anunciá-lo;
- a lista com 30 opções media 998px de conteúdo em 288px de caixa, com
  `overflow: hidden`: a roda do mouse deixava `scrollTop` em 0, e da nona opção
  em diante nada se alcançava pelo ponteiro.

Depois: aviso visível nas cinco (64px, os 24px de respiro que o `combobox.css`
pede) e a lista rolando (`scrollTop` 400 com a mesma roda). O teto passou a ser
a altura disponível que a lib publica, com `18rem` de reserva — a mesma cadeia do
`select.css` e do `dropdown-menu.css`; o `18rem` cravado era sobra, não decisão.
Nenhuma regra do bloco precisava ficar: o viewport não é usado por stack
nenhuma, `[data-visible]` não é escrito por ninguém, e o ícone do gatilho já é
medido por `.nds-combobox-icon`, que as cinco usam.

Por que nada reprovou: as dez asserções do Combobox sobre o vazio eram
`toHaveTextContent`, que passa com o elemento escondido. Ganharam
`toBeVisible()`, e o mecanismo ganhou o portão `seletor_em_duas_folhas`
(seletor idêntico em duas folhas; 4 achados com o bloco replantado, 0 sem ele).
Na mesma varredura, seis utilitários repetidos entre `typography.css`/`colors.css`
e `utilities.css` saíram da cópia que nunca valia — mudança zero por construção.

**2026-09-10 · afirmações que as cinco stacks seguiam e a folha desmentia**
(Check 14 da pipeline):

- D2 dizia que o anel é interno porque "a lista tem `padding: 4px`". A lista não
  tem padding; o motivo real é o item poder morar fora de grupo.
- D8 dizia que o separador "rasga o padding do grupo" com margem de −4px. Nas
  cinco ele é filho da lista, sem padding a rasgar; a margem saiu (o traço já
  cruzava a lista, recortado pelo `overflow-x: hidden` — mudança zero).
- D10 dizia `--radius` (10). É 14px; 10px é o `--radius-sm`.
- O item desabilitado declarava `cursor: not-allowed` junto de
  `pointer-events: none`: o cursor nunca aparecia, e sustentava o texto "cursor
  não permitido" das docs. Saiu da folha e do texto.
- "Filtro fuzzy" em seis chaves do conteúdo: vanilla, vue e angular filtram por
  trecho. Passou a "filtro por texto".

**2026-09-10 · fechou a pendência do `command_palette_open` no vanilla** (aberta
em 2026-09-09: a página anunciava o evento e nunca o emitia, e não havia paleta
que abrisse). O `CommandDocs.ts` ganhou a paleta real num Dialog — gatilho
outline com o `kbd` dentro, título e descrição em `sr-only` —, o Ctrl+K da
página e o evento nas duas aberturas (`trigger: "button"` / `"keyboard"`,
`location: "docs_demo"`). O atalho abre o Dialog por um clique que não borbulha,
para o rastreamento automático da demonstração não contá-lo como clique de
alguém.

**2026-09-10 · os primitivos passaram a cumprir o mesmo contrato** (C8–C12
nasceram aqui, cada um com story que o cobra). O que cada stack mudou, e como:

- **as cinco**: a lista cancela `mousedown`, e o clique num item — inclusive
  desabilitado, inclusive cabeçalho — não tira o foco do campo (D1). Antes, o
  clique em item desabilitado mandava o foco para o `body` no vanilla (fora do
  modal, dentro do Dialog); no react ia para a lista (`tabIndex={-1}` do cmdk);
  no vue, para o próprio item; no svelte iria para o `body` assim que o
  contorno do `role` tirou o `tabindex` da raiz;
- **vanilla**: a lista deixou de ser parada de Tab (`tabindex="0"`); Escape no
  uso inline não faz mais `blur` — o foco fica e a busca não muda;
- **react**: a marca de escolhido só em item marcável (reservava 16px em todos);
  a lista se chama pelo placeholder (era "Suggestions", em inglês, do cmdk);
- **vue**: o ponteiro move o destaque (`highlightOnHover` estava desligado); o
  campo inline não rouba foco; o filtro casa com rótulo e valor, não com o
  `textContent` que incluía o atalho; o separador some com um lado vazio. E dois
  defeitos que a medição não tinha visto: o Vue converte prop booleana ausente em
  `false`, e todo item ganhava a marca invisível de 16px — o mesmo defeito do
  react, por outro caminho; e grupo sem cabeçalho quebrava;
- **svelte**: o bits injeta `role="application"` e `tabindex=-1` na raiz e não
  deixa sobrescrever; a raiz agora é desenhada pelo snippet `child`, sem os dois;
- **angular**: `loopFocus` é próprio do `NdsCommand`, padrão `false`, com a seta
  barrada em captura nas pontas (a lib não oferece mudar o padrão dela); o atalho
  sai do filtro pelo atributo `rdxAutocompleteItemIndicator`, que o radix-ng
  descarta ao montar o texto do item — **seletor interno da lib**, guardado pelas
  stories `WithShortcuts` e `CommandPalette`; o separador some por `hidden`.

**2026-09-10 · analytics, por decisão da dona**: `component` e `location` entram
nos dois eventos (a assimetria medida em 2026-09-09 deixou de ser "não
decidida"); `combobox` sai de `pattern`, porque nenhuma stack monta o Combobox
sobre o Command e o valor não podia ser emitido; o Ctrl+K passa a valer nas cinco
docs pages.
