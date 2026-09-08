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
esta família não expõe um `Popover.Close`; o que ele entrega é trava de rolagem e
backdrop interno. A referência da implementação é a `reka-ui`, que entrega
inteiro sozinha.
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

**A sombra é `md`**, não a `xl` do Tooltip e do HoverCard: é um painel mais baixo
na pilha, e a folha diz isso.

**Animação**: só a SAÍDA anima (`data-ending-style`: opacidade e `scale(0.95)`,
`--duration-fast`). A entrada aparece direto, para evitar corrida entre
`opacity: 0` do estado inicial e checagens síncronas de visibilidade.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | conteúdo desmontado — não é painel escondido |
| Open | clique no gatilho | montado; foco no primeiro focável |
| Controlled | `open` vem de fora | o painel não guarda estado próprio; abrir e fechar passam pelo consumidor, avisado a cada mudança |
| Modal | `modal` ativo | foco preso, rolagem travada, `aria-modal="true"` — ver D2 |
| Transitioning | saída | o painel fica montado até a transição terminar |
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
| react | `Popover`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` |
| vue | `Popover`, `PopoverAnchor`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` |
| svelte | `Popover`, `PopoverClose`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverPortal`, `PopoverTitle`, `PopoverTrigger` |
| vanilla | `createPopover`, `createPopoverDescription`, `createPopoverHeader`, `createPopoverTitle` |
| angular | `[ndsPopoverDescription]`, `[ndsPopoverTitle]`, `button[ndsPopoverClose]`, `button[ndsPopoverTrigger]`, `div[ndsPopoverHeader]`, `div[ndsPopover]`, `ng-template[ndsPopoverContent]` |

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

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `popover_open` | o painel abre | `{ component: "popover", trigger_label, location }` |
| `popover_close` | o painel fecha | `{ component: "popover", reason?, location }` |

**`trigger_label` é id estável em kebab-case**, igual nas cinco stacks, nunca o
texto traduzido — traduzido, o mesmo evento vira três valores no GA4 e a série
não junta. `location` diz de qual seção o exemplo saiu; a demonstração herda
`docs_demo` e as demais seções se nomeiam.

**`reason` é opcional por medição, não por descuido**: o `base-ui` publica o
motivo real (`outside-press`, `escape-key`, `focus-out`…) e ele vai no payload; a
`reka-ui` não publica motivo, e ali o campo SAI. Ausente é honesto; inventado
contamina a série — havia um `"user"` cravado no react, e ele foi removido.

## 10. Reconstruir do zero

Ordem: folha → primitivo da stack → sub-partes → stories → docs page.

**Armadilha de cada stack**, todas medidas:

- **react (`base-ui`)** — `modal` sozinho não prende foco: `focusManagerModal =
  modal !== false && hasClosePart`, e `hasClosePart` conta os `Popover.Close`
  renderizados dentro do painel. Esta família não expõe um.
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
