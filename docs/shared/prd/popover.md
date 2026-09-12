# PRD — Popover

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

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
| C1 | Abre no clique do gatilho | play de `Open`, nas cinco |
| C2 | Ao abrir, o foco ENTRA no painel: primeiro focável, ou o próprio painel quando não há nenhum | `testes.functional.item1` |
| C3 | O foco NÃO fica preso: Tab a partir do último focável SAI do painel e segue a ordem da página | — (controle negativo é comportamento de navegador; anotado para quando a suíte for autorizada) |
| C4 | `Escape` fecha e devolve o foco ao gatilho | `testes.functional.item2` |
| C5 | Clique fora fecha | `testes.functional.item3` |
| C6 | O painel SEMPRE tem nome acessível — `aria-labelledby` quando há título visível, `aria-label` quando o conteúdo é livre | `testes.accessibility.item5` + regra `aria-dialog-name` do axe |
| C7 | No modo padrão o painel NÃO recebe `aria-modal` — nem como `"false"` | asserção de ausência, nas cinco |
| C8 | `modal: true` liga três coisas JUNTAS: foco preso, rolagem travada, `aria-modal="true"` | story `Modal`, nas cinco |
| C9 | Sem espaço no `side` pedido, o painel vira para o lado oposto (auto-flip) | story `SideTop` |
| C10 | Renderiza em portal no `body`; fechado, não existe no DOM | `notes.item3` |
| C11 | Nenhuma região viva: o painel não é anúncio, é alcançado | inspeção — nenhuma regra de axe cobre ausência de `aria-live` |

## 3. Decisões fixadas

A tabela existe para que reverter custe uma leitura. Reverter é permitido; fazer
sem saber, não.

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

### D2 · `modal` é entregue nas cinco, e liga três coisas juntas

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
**Regra que fica**: o popover é superfície pequena e o corpo dele tem um tamanho
só, com header ou sem.

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

## 4. Anatomia

```
popover                       (raiz — só estado, sem caixa própria)
└── popover-trigger           o gatilho; aria-expanded + aria-haspopup="dialog"
    └── popover-positioner    a lib põe no lugar; o painel ocupa fluxo normal dentro dele
        └── popover-content   role="dialog" · a caixa
            ├── popover-header        ESTRUTURA — coluna com gap próprio
            │   ├── popover-title        h*, peso medium
            │   └── popover-description  p, --muted-foreground
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

Props compartilhadas — mesmo nome e mesmo padrão nas cinco:

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `modal` | boolean | `false` |
| `side` | `top \| right \| bottom \| left` | `bottom` |
| `align` | `start \| center \| end` | `center` |
| `sideOffset` | number | `4` |

### Divergências de forma, registradas e não "alinhadas"

Forma de API não tem fonte de verdade — cada lib tem a sua.

| stack | como difere |
|---|---|
| vanilla | fábrica: `createPopover({ trigger, content, … })` devolve `{ open, close, toggle, setOpen }` — verbos em inglês. Sub-fábricas `createPopoverHeader/Title/Description`; `createPopoverTitle` aceita `level` |
| vanilla, angular | recebem o nome acessível por opção/`input` (`ariaLabel`); nas outras três é atributo no elemento |
| angular | `modal` não é booleano na lib: o `radix-ng` aceita a string `'trap-focus'`, e o wrapper traduz |
| svelte | a lib não tem `modal`; o mecanismo é `trapFocus` + `preventScroll` no Content |

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Popover`, `PopoverClose`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` |
| vue | `Popover`, `PopoverAnchor`, `PopoverClose`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` |
| svelte | `Popover`, `PopoverClose`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverPortal`, `PopoverTitle`, `PopoverTrigger` |
| vanilla | `createPopover`, `createPopoverDescription`, `createPopoverHeader`, `createPopoverTitle` — e o controle de fechar, que aqui é uma MARCA e não uma fábrica: `data-slot="popover-close"` em qualquer elemento do painel, com delegação na raiz |
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
o único com `level` (padrão `h4`, porque o painel é `role="dialog"` e o
`aria-labelledby` procura um cabeçalho antes de cair no nome do gatilho); no
Angular o seletor é `[ndsPopoverTitle]` **sem elemento**, então a tag é escolha
de quem escreve, sem os dois níveis fixos que dialog, sheet, drawer e
alert-dialog impõem.

## 8. Acessibilidade

**Atributos.** Painel: `role="dialog"`, mais `aria-labelledby` **ou** `aria-label`
(C6), `aria-describedby` quando há descrição, e `aria-modal="true"` só no modo
modal. Gatilho: `aria-expanded`, `aria-haspopup="dialog"`, e `aria-controls` só
com o painel montado (D8).

**Teclado.** Tab percorre os focáveis do painel e, a partir do último, SAI e segue
a ordem da página — no modo modal volta ao primeiro. Shift+Tab espelha. Escape
fecha e devolve o foco ao gatilho. Enter e Espaço ativam o gatilho.

**O que NÃO se faz, de propósito:**

- não se anuncia `aria-modal="false"` — atributo que anuncia o que não existe já
  custou caro nesta casa (o `aria-label` DESCARTADO em drawer e sheet, por estar
  num `div` sem papel);
- não se usa região viva: o painel não é anúncio, ele é alcançado;
- não se prende o foco por padrão — ver D1.

**Movimento reduzido**: o painel para sob `prefers-reduced-motion`, e quem o
para é a camada de TOKEN — a folha declara duração só por `var(--duration-*)`, e
`docs/shared/tokens/motion.css` zera a escada inteira sob a preferência. O
mecanismo, incluindo por que o bloco `@media` da própria folha não é o que
segura, está por extenso em `hover-card.md` §8.

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

**A peça de fechar tem duas formas, e a diferença é de framework, não de
contrato**: no svelte e no angular ela é componente/diretiva que MARCA um botão
de quem compõe (`PopoverClose`, `button[ndsPopoverClose]`); no vanilla é a marca
direta, `data-slot="popover-close"`, com delegação na raiz — e não uma
sub-fábrica, porque o conteúdo do painel é montado ANTES de `createPopover()`
existir, então uma `createPopoverClose()` não teria em que popover chamar
`close()`. É a mesma escolha que o Dialog e o Sheet desta stack fizeram em
2026-09-11 (`PATCHES.md#vanilla-overlay-close-api`).

**Até 2026-09-12 o `close-button` era inalcançável em três das cinco.** react,
vue e vanilla declaravam a palavra no tipo e não tinham como produzi-la; o
sintoma que a dona viu foi concreto — na story do vanilla com botões no painel, o
"Cancelar" não fechava nada, enquanto o mesmo botão no Angular fechava. E este
PRD afirmava, na mesma página, que a família "não expõe um `Popover.Close`" (§3) e
que o controle "existe no react, no svelte e no angular" (§9): duas linhas
erradas em sentidos opostos, e nenhuma delas sobre o vanilla, que é a referência.
| `api` | fechado por código — é aqui que cai "salvou e fechou" |

**Duas diferenças deliberadas em relação ao drawer**, e as duas vêm de o popover
ser não-modal:

- **`trigger-press` vai para `overlay`, não para `api`.** O drawer o manda para
  `api` porque lá o gatilho fica coberto pelo véu e só código fecha por ele;
  aqui o gatilho continua clicável, e clicar de novo é vontade de quem usa.
- **O padrão é `api`, não `close-button`.** Os formulários do popover fecham POR
  CÓDIGO ao salvar; com o padrão do drawer, "concluiu" chegaria ao relatório
  como "apertou o botão de fechar" — apagando o sinal que justifica o campo
  existir, que é desistiu × concluiu.

**Como cada stack chega ao motivo**, porque só duas o recebem pronto:

| stack | caminho |
|---|---|
| react, angular | a lib entrega o motivo cru; `popoverCloseReason`, exportada do primitivo, traduz |
| vanilla | a fábrica conhece todos os caminhos e o passa em `onOpenChange(open, reason)` |
| vue, svelte | a lib NÃO publica o motivo; o painel, o gatilho e o botão de fechar o ANOTAM pelo contexto, e a raiz o entrega junto com a mudança de estado |

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
  fábrica, e não há animação de entrada.

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

**As 54 chaves `nav` saíram do conteúdo em 2026-09-12.** As páginas do vue e do
svelte liam o conteúdo, e por isso "When to Use" e "Cuándo Usar" apareciam aqui
onde as outras três diziam "Usage" e "Cuándo usar".

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas. A palavra própria
do componente vive no TÍTULO da seção. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

