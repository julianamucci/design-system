# Componentes para interface conversacional — proposta

Documento para avaliar **antes de qualquer código**. Se aprovado, vira o
contrato que os cinco dev-agents consomem, no lugar de
`.pipeline-context/<slug>.md`.

Estado: **três decisões fechadas**, implementação do primeiro componente autorizada.

| decisão | resolvida |
|---|---|
| 01 parser | **mdast** para renderizar; Tiptap markdown fica para o compositor — ver a análise abaixo |
| 02 categoria | **categoria nova** |
| 05 escopo | **`markdown` sozinho** na primeira rodada |

Seguem abertas a 03 (onde o compositor mora) e a 04 (Enter envia ou quebra
linha), e nenhuma das duas bloqueia o `markdown`.

---

## Por que não adotar uma biblioteca

Quatro das cinco bibliotecas MIT de chat que existem hoje são **React only**
(assistant-ui, @llamaindex/chat-ui, simple-ai, react-chat-ui). Adotar qualquer
uma delas daria chat no React e reimplementação nas outras quatro — a
divergência que este repositório passou meses eliminando.

A quinta, **Deep Chat**, é web component e roda nas cinco. Ela cai no outro
problema: traz o próprio estilo. Componente que se desenha sozinho não lê
`--accent`, não responde à toolbar de tema, não conhece densidade nem a escala
tipográfica, e não passa pelas sondas de contraste. Seria um quinto vocabulário
visual dentro de um sistema que gastou quatro commits para que dois tokens não
colidissem.

O precedente já está escrito no repositório. O cabeçalho de
`docs/shared/primitives/code-highlight.ts` explica por que existe um tokenizador
próprio em vez de Shiki ou Prism, com quatro razões que valem palavra por
palavra aqui:

1. **tema** — lib de highlight traz paleta fixa, e adaptá-la significa
   sobrescrever tudo de qualquer jeito;
2. **paridade** — TS puro compartilhado produz o mesmo resultado nas cinco, e
   não há como divergirem;
3. **segurança** — a saída é DADO estruturado, não string de HTML: nenhum
   `innerHTML`, nenhuma superfície de XSS a sanitizar;
4. **zero dependência nova** em cinco `package.json`.

A razão 3 pesa mais aqui do que pesou lá. Num chat, o HTML vem de um **modelo**,
que é entrada não confiável por definição.

## O que se empresta, então

O mesmo corte do media player: **a superfície é nossa, o motor é emprestado.**

| camada | decisão |
|---|---|
| parser de markdown | **emprestado** — devolve árvore, não HTML |
| renderização da árvore | **nossa** — nós próprios, classes `.nds-*`, por stack |
| protocolo de streaming | **emprestado**, se o backend precisar |
| estado da conversa, foco, rolagem, acessibilidade | **nosso** |

---

## Inventário: o que já existe

Medido no repositório. Para uma interface conversacional, quase tudo está
pronto:

`avatar` · `card` · `textarea` · `editor` (Tiptap, com barra) · `code-block`
(tokenizador próprio, temático) · `scroll-area` · `skeleton` · `collapsible` ·
`badge` · `separator` · `command` (serve a `/comandos` e menções) ·
`toast`/`sonner` · `tooltip` · `kbd` · `progress` · `dropdown-menu` · `dialog`

E duas dependências **já instaladas** que resolvem as partes caras:

- **`@tanstack/virtual-core`** — hoje só o `data-table` usa. É o que segura uma
  conversa de mil mensagens sem travar a rolagem.
- **`dompurify`** — o sanitizador da casa, já com a convenção de chamada no call
  site (guideline 09).

**A única lacuna de dependência é markdown.** Nenhuma das cinco stacks tem
parser.

---

## Os três componentes

Três slugs, e a ordem importa: o primeiro é pré-requisito dos outros dois e tem
valor sozinho.

### 1. `markdown` — Display

Renderiza markdown a partir da ÁRVORE, com nós próprios. Sem `innerHTML`.

| entrada | tipo | nota |
|---|---|---|
| `content` | `string` | o markdown cru |
| `streaming` | `boolean` | muda a política de reparse — ver abaixo |
| `allow` | lista de nós permitidos | o que NÃO está na lista não renderiza |
| `onLinkClick` | callback | quem consome decide se link externo abre |

Reusa `code-block` para blocos de código — o tokenizador já existe e já é
temático. Tabela reusa `table`. Nada disso é escrito de novo.

**Vale fora do chat**: documentação, notas, qualquer texto vindo de conteúdo.
Por isso é slug próprio, e por isso é o primeiro: pode ser construído e validado
sem nenhuma decisão de chat.

### 2. `chat-thread` — Display

A superfície da conversa.

| peça | o que é |
|---|---|
| `Thread` | lista virtualizada, com ancoragem de rolagem no fim |
| `Message` | variantes por papel: `user`, `assistant`, `system` |
| `MessageContent` | consome `markdown` |
| `ToolCall` | colapsável, com estado (chamando, pronto, falhou) |
| `Reasoning` | colapsável, fechado por padrão |
| `Sources` | citações, numeradas e ligadas ao trecho |
| `MessageActions` | copiar, refazer, polegar — aparecem no hover E no foco |

### 3. `prompt-input` — Formulário

O compositor.

| peça | o que é |
|---|---|
| `PromptInput` | campo que cresce com o texto, sem altura fixa |
| envio | Enter envia, Shift+Enter quebra linha — **configurável**, ver decisões |
| `StopButton` | substitui o enviar enquanto está gerando |
| `Suggestions` | sugestões de partida, some ao primeiro envio |
| `Attachments` | lista de anexos com remover |

---

## As decisões de acessibilidade, e por que elas vêm antes do código

Nenhuma das bibliotecas avaliadas acerta as três. Duas delas este repositório já
aprendeu em outro componente.

### Texto em streaming NÃO é live region

O media player traz a lição no CSS, sobre o relógio: *"NÃO é região viva: um
leitor de tela anunciando o tempo a cada segundo torna o player inutilizável."*

Token a token é o mesmo defeito, multiplicado por cem. A política:

- a área de streaming é `aria-busy="true"` enquanto gera, e **não** `aria-live`;
- quando a mensagem termina, ela é anunciada **uma vez, inteira**, por uma região
  educada fora do fluxo;
- quem quiser acompanhar em tempo real usa o modo de leitura do próprio leitor de
  tela, que é feito para isso.

### O foco não pode ser roubado pela chegada de conteúdo

Mensagem nova não move o foco. Quem está lendo uma resposta antiga continua onde
está. A rolagem só acompanha o fim **se já estava no fim** — e há um botão de
"ir para o fim" quando não está.

### Ação que só aparece no hover é ação que não existe para o teclado

`MessageActions` aparece no `:hover` **e** no `:focus-within`, e os botões ficam
na ordem de foco em qualquer estado. É o mesmo defeito da barra que some em tela
cheia, corrigido no media player na semana passada.

---

## O problema que o parser não resolve, e que o contrato precisa resolver

Enquanto os tokens chegam, o markdown está **sintaticamente incompleto**: uma
cerca de código aberta e não fechada, um link com `[` sem `]`, uma tabela pela
metade. Reparsear a cada token é caro e faz a estrutura piscar — o bloco vira
parágrafo e volta a ser bloco a cada chegada.

Nenhuma das bibliotecas pesquisadas trata disso. A proposta:

- durante o streaming, reparse com **débito** (a cada ~80ms, não a cada token);
- construções incompletas na ÚLTIMA folha da árvore renderizam como texto cru até
  fecharem — nunca como estrutura provisória;
- o reparse final, ao terminar, é o único que vale para o DOM definitivo.

Isto tem de estar no contrato porque é onde a implementação vai divergir entre as
cinco se não estiver escrito.

---

## A rota Tiptap, medida

O Tiptap já está nas cinco stacks, em `3.30.5`, e o `editor` do design system já
tem `editable: false`. A pergunta era legítima: por que trazer um parser novo se
o que temos já sabe markdown?

Medido no repositório e no registro:

| | Tiptap markdown | mdast |
|---|---|---|
| já na árvore | `@tiptap/core` 3.30.5, nas cinco | nada |
| dependência nova | `marked` — **também traz uma** | remark/micromark |
| caminho | markdown → tokens → **JSON do Tiptap** → nós | markdown → **mdast** → nós |
| transformações | 2 | 1 |
| runtime | exige instância de `Editor` | função pura |
| maturidade | *early release*, pela própria doc | base do unified |

Três medições decidiram:

**`MarkdownManager` não é exportado.** Ele aparece só num comentário do
`index.d.ts`. O que o core expõe é a superfície para ESCREVER extensão —
`createBlockMarkdownSpec`, `parseMarkdown` no spec —, e ela é consumida por um
`Editor`. Não existe `parse(markdown)` avulso: para chegar ao JSON, instancia-se
o editor, e com ele vem o ProseMirror. São **11,4 MB em disco** entre `@tiptap` e
`prosemirror` — motor de edição para exibir texto.

**O tokenizador é o `marked` de qualquer jeito.** O core referencia
`markedjs/marked/src/Tokens.ts` e declara `markdownTokenizer?` como ponto de
extensão, mas `@tiptap/core` tem **zero dependências** e o `marked` não está
instalado. A rota Tiptap também traz pacote novo — e ainda acrescenta uma segunda
transformação para um formato desenhado para EDITAR (marcas como array em nó de
texto), não para renderizar.

**A própria documentação avisa** que a extensão é early release, "sujeita a mudar
ou com casos de borda ainda não suportados". Para a fundação de um design system,
isso é risco.

E o `@tiptap/static-renderer` (3.30.5, MIT) não resgata: o `generateHTML` devolve
**string**, o que reintroduz `innerHTML` — exatamente o que a razão 3 evita.

### Onde a rota Tiptap VENCE, e é onde ela fica

No **compositor**. Markdown de ida e volta é precisamente para isso que a
extensão existe, e o editor já está montado ali com `editable` pronto. Quando o
`prompt-input` chegar, é essa a rota — não o mdast.

E o editor sem barra funciona hoje, sem dependência nenhuma, para uma **página de
documentação**: um documento, uma instância. Numa thread de duzentas mensagens
seriam duzentas instâncias de editor. Certa para um caso, errada para o outro.

---

## Decisões que são suas

Cinco, e nenhuma eu deveria tomar sozinho.

**1. Qual parser.** ✅ **RESOLVIDA — mdast.** A rota Tiptap foi medida e está
na seção acima: ela também traz dependência, acrescenta uma transformação e exige
o ProseMirror em runtime. Fica reservada para o compositor.

**2. Categoria nova ou reuso.** ✅ **RESOLVIDA — categoria nova.** O corpus
passa de oito para nove. Nome proposto: **Conversação**. Ela descreve
`chat-thread`, `prompt-input` e o que vier depois; o `markdown` é o membro
atípico, porque serve também a documentação — mas separá-lo em Display
fragmentaria a família que ele existe para servir, e a barra lateral é por onde
se navega. Entra em `sidebar-labels.ts` nos três idiomas.

**3. Onde o compositor mora.** `textarea` que cresce, ou o `editor` (Tiptap) já
pronto? O editor traz barra de formatação, imagens e tabelas — mais do que um
prompt precisa, e mais peso. Recomendo `textarea`, com o editor como composição
opcional documentada.

**4. Enter envia ou quebra linha.** As duas convenções existem e as duas irritam
metade das pessoas. Recomendo prop `submitOn: 'enter' | 'modEnter'` com padrão
`enter`, porque é o que a maioria das interfaces de chat faz — e a alternativa
fica documentada, não escondida.

**5. Escopo da primeira rodada.** ✅ **RESOLVIDA — `markdown` sozinho.**


---

## O que NÃO está nesta proposta

Dito em voz alta para não virar promessa por omissão:

- **camada de streaming/protocolo.** O AI SDK da Vercel tem pacotes para React,
  Vue e Svelte, mas **não confirmei a licença** — o repositório não a declara na
  página inicial. E ela só é necessária se o backend não expuser SSE simples;
- **edição e ramificação de mensagem** (editar um turno e regerar dali);
- **anexos com upload de verdade** — a lista de anexos entra, o transporte não;
- **voz**, entrada ou saída;
- **persistência** de conversa.

Cada um desses é rodada própria, e nenhum bloqueia os três componentes acima.
