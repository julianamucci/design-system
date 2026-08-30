# 17. Componentes conversacionais — reconstruir o catálogo nas cinco stacks

Esta guideline cobre a superfície de conversa com um modelo: a thread, a entrada,
o que o agente mostra enquanto trabalha, a evidência em que a resposta se apoia e
as formas estruturadas com que ele responde.

A referência de desenho é o catálogo **Elements** do assistant-ui
(`https://www.assistant-ui.com/elements`), **120 peças**, MIT,
`Copyright (c) 2025 AgentbaseAI Inc.`. Ele só existe em React, e é justamente por
isso que precisa de uma guideline antes de virar código: portar 120 peças presas
a um runtime, uma a uma, cinco vezes, sem contrato comum, produz 600 arquivos e
nenhum sistema.

O que já está de pé aqui: **`chat-thread`** (folha, primitivo compartilhado de
rolagem, conteúdo trilíngue, stack de referência vanilla). Ele é o primeiro membro
desta família e o modelo de tudo o que segue — leia `docs/shared/styles/nds/chat-thread.css`
inteiro antes de escrever a segunda peça.

---

## 1. O que se pega da fonte, e o que não

**Pega-se**: o desenho, a anatomia, a máquina de estados, os nomes dos estados e
a decisão de produto que cada peça já resolveu (o que uma "aprovação" mostra, o
que um "stopped run" preserva). Isso é o caro, e é o que a licença MIT libera.

**Não se pega**:

| O quê | Por quê |
|---|---|
| Código React, JSX, `data-slot`, Tailwind | O DS desenha com `.nds-*` em folha compartilhada. Copiar markup React traz resíduo de lib para dentro das cinco stacks — o erro que a migração `.nds-*` desfez |
| Os primitivos `@assistant-ui/react` (`MessagePrimitive`, `ActionBarPrimitive`, `useThread`) | O DS não tem runtime de conversa, e não vai ter. Ver §2 |
| **`logos`** — as marcas SVG de OpenAI, Anthropic e Google | MIT licencia o *código*, não a **marca registrada**. Nenhuma das três entra no repositório. A peça vira um espaço: quem consome passa o `HTMLElement` da marca, como `avatar` já faz na mensagem |
| O texto em inglês | Conteúdo é trilíngue e vive em `translations.json`. Ver `05-tom-de-voz.md` |

**Atribuição**: cada folha `.nds-*` desta família abre com uma linha creditando o
desenho ao assistant-ui e citando a licença. Uma linha, no cabeçalho da folha,
onde já moram as decisões — não um `NOTICE` solto que ninguém lê.

### Como ler a fonte

Toda página do catálogo responde em markdown com o sufixo `.md`:
`https://www.assistant-ui.com/elements/<slug>.md`. É de lá que sai a anatomia
exata, os estados e a lista de props — **e é por isso que esta guideline não
repete 120 fichas**. O que a fonte não sabe, e só esta guideline pode dizer, é
com quais primitivos do Nortear cada peça se monta e qual folha ela divide. Isso
está na §5.

Ao ler uma página, **use sempre a forma "standalone"**, nunca a "with runtime".
As duas estão documentadas lado a lado, e a standalone já é o que precisamos: um
componente controlado, sem estado interno, com props explícitas. A conversão de
runtime para standalone é o trabalho mais caro do porte, e o assistant-ui já o
fez.

---

## 2. A regra que faz 120 peças de runtime caberem num DS sem runtime

> **O componente desenha o que recebe. Ele não sabe o que os estados significam.**

É a mesma decisão já registrada no `chat-thread.css` a respeito da aprovação de
ferramenta, promovida agora a regra da família inteira. Um `approval-card` que
soubesse o que "recusar" faz traria política de produto junto, e política
envelhece por produto, não por sistema. Um `connection-state` que reconectasse
sozinho traria transporte. Um `thread-list` que buscasse conversas traria
persistência.

Consequências práticas, todas verificáveis:

- Nenhum componente desta família faz `fetch`, abre `WebSocket`, lê
  `localStorage` ou agenda `setInterval` de relógio de negócio.
- Estado que descreve o mundo (conectado, gerando, gastou tanto) entra por prop
  e sai por evento. Estado que descreve só o desenho (disclosure aberto, aba
  ativa) pode ser interno.
- Ação é **espaço**, não política: `actions?: HTMLElement[]` — o contrato que
  `chat-thread` já usa para as ações da mensagem e para os controles de
  aprovação. Toda peça que pergunta algo a uma pessoa usa esse mesmo contrato.
- Toda peça é **controlável**: se tem `open`, tem `onOpenChange`. Sem isso a
  demonstração das docs pages não consegue fotografar o estado.

**Divergência de API entre stacks não é defeito** (`11-consistencia-cross-stack.md`):
o nome da prop pode diferir; o desenho, os estados e o nome acessível, não.

---

## 3. A fundação compartilhada — antes da segunda peça, não depois

`chat-thread` deixou uma dívida pequena e de juros altos: o vocabulário
(`ChatRole`, `ToolCallState`, `ChatToolCall`, `ChatSource`) mora em
`nortear-design-system-vanilla/src/components/ui/chat-thread.ts`, e já foi
duplicado uma vez em `docs/shared/primitives/chat-examples.ts` como
`ChatExampleRole`. Com uma stack só, isso não custa nada. Com cinco stacks e
mais uma dúzia de peças que falam de "mensagem", "parte" e "chamada de
ferramenta", vira cinco vocabulários divergentes — exatamente o defeito que
`chat-scroll.ts` foi criado para evitar, e pelo mesmo motivo.

**Primeira tarefa desta família, antes de qualquer componente novo:**

### 3.1 `docs/shared/primitives/chat-protocol.ts` — o vocabulário

Só tipos e constantes. Sem framework, sem DOM. Move os tipos que hoje estão no
vanilla e passa a ser a origem única de:

| Conceito | Onde aparece |
|---|---|
| `ChatRole` | mensagem, par, identidade do falante, transcrição |
| `MessagePart` — `text` \| `tool` \| `reasoning` \| `source` \| `file` \| `image` \| `chart` | mensagem, resposta estruturada, todas as peças de evidência |
| `RunStatus` — `idle` \| `running` \| `stopped` \| `complete` \| `failed` | thread, status do agente, indicador de digitação, execução parada, fila |
| `ToolCallState` — `pending` \| `running` \| `done` \| `failed` | chamada, grupo, falha, linha do tempo, aprovação |
| `TokenUsage` — entrada/saída/total/limite | anel de contexto, repartição, medidor de custo, faixa de cota |
| `Citation` — fonte, trecho, âncora | citação em linha, referência a documento, trechos de recuperação, marcador de confiança |
| `Attachment` — nome, tipo, tamanho, progresso, estado | anexos do composer, parte de arquivo, parte de imagem |

Um estado só existe se **muda o desenho**. `pending` é separado de `running`
porque um espera por uma pessoa e o outro pela máquina — parecem iguais na tela e
são opostos. Esse é o critério; aplique-o a cada estado novo antes de aceitá-lo.

### 3.2 Decisão compartilhada mora em primitivo, não em cinco `if`

`chat-scroll.ts` é o modelo: o que é **máquina** (decidir se está no fim, contar
o não lido) é compartilhado e testável sem navegador; o que é **DOM** (ler
`scrollTop`, chamar `scrollTo`) é de cada stack. Toda regra desta família que
caiba em duas frases e renda cinco implementações vai para um primitivo:

| Primitivo previsto | Decisão que ele guarda |
|---|---|
| `chat-scroll.ts` *(existe)* | Acompanhar o fim, contar o não lido |
| `chat-protocol.ts` | O vocabulário (§3.1) |
| `composer-trigger.ts` | Caractere gatilho (`@`, `/`), recorte do termo, filtro, âncora do cursor — a mesma máquina serve menções, comandos e qualquer picker futuro |
| `token-budget.ts` | Fração usada, limiar de aviso, repartição por origem — três peças de medição desenham o mesmo número |
| `stream-reveal.ts` | Quantas palavras já apareceram, qual é a mais nova — texto em streaming, revelação de imagem, ticker |
| `diff-hunks.ts` | Partir um diff unificado em blocos, e o estado por bloco (manter/descartar) — `code-diff` e `reviewable-diff` compartilham |

Nenhum deles importa framework. Todos ganham teste de nó (`*.test.ts` no
vanilla, como `chat-scroll.test.ts`), e é esse teste que segura a regra.

### 3.3 Exemplos de demonstração são compartilhados

`chat-examples.ts` já estabelece o padrão e o motivo: se cada stack escreve a
própria conversa de exemplo, as cinco stories deixam de fotografar a mesma tela e
a divergência só aparece no Chromatic, como diferença de layout que ninguém
consegue atribuir a nada. Toda peça desta família que precise de dados de exemplo
os põe em `docs/shared/primitives/<familia>-examples.ts`, sem i18n — o que é
traduzido são os **rótulos** da interface, não a fala.

---

## 4. O que uma peça precisa para existir nas cinco

Seis artefatos, nesta ordem. A ordem importa: cada um é a entrada do seguinte.

| # | Artefato | Onde | Regra |
|---|---|---|---|
| 1 | Folha `.nds-*` | `docs/shared/styles/nds/<familia>.css` | **Uma folha por família, não por slug.** O desenho de verdade. Cabeçalho com árvore ASCII da estrutura, as decisões de a11y, os tokens usados e a atribuição MIT |
| 2 | Primitivo compartilhado | `docs/shared/primitives/*.ts` | Só se houver decisão que renda cinco `if`. Sem framework, sem DOM, com teste |
| 3 | Conteúdo trilíngue | `docs/shared/content/<slug>/translations.json` | 20 chaves de topo, como toda docs page. Texto descritivo neutro de API; snippets em `*Code` com variante por stack |
| 4 | Implementação de referência | `nortear-design-system-vanilla/src/components/ui/<slug>.ts` | **Vanilla é a fonte de verdade** (`11-consistencia-cross-stack.md`). Nenhuma outra stack começa antes desta fechar |
| 5 | Stories + docs page | vanilla | Playground, variantes, estados, composições + `<Slug>Docs.ts`. `parameters.controls.disable: true` onde não há `argTypes` |
| 6 | As outras quatro stacks | react, vue, svelte, angular | Alinham ao vanilla em markup, classes e comportamento. Divergência só de API de framework, e registrada |

Registro obrigatório: a folha entra em `docs/shared/styles/nds/index.css`; o slug
entra no `storySort` de `.storybook/preview.ts` das cinco; a docs page usa
`useSeoEffect` e `useTranslation`. Sem isso `scripts/audit.mjs <slug>` reprova.

**Só a etapa 6 paraleliza**, e em até três agentes de navegador (regra de escopo
de verificação no `CLAUDE.md` raiz). As etapas 1–5 são seriais por construção:
são a definição de "o que é essa peça".

**Correção medida ao construir a família 1**: as etapas 1 e 2 também não
paralelizam ENTRE PEÇAS, e por um motivo mecânico. A folha é uma por família e
o protocolo é um só, então duas peças escritas ao mesmo tempo colidem nos dois
arquivos. O que funciona é separar por natureza: os artefatos compartilhados
(folha, vocabulário, registro) saem em série, num commit próprio, e só então as
peças que dependem deles seguem em paralelo — porque aí cada uma toca apenas os
seus arquivos.

### 4.1 Peça que mora num encaixe NÃO vira prop de quem a hospeda

O composer aceita `railStart`, e é por ali que `composer-model-picker` e
`composer-voice` entram. Nenhum dos dois é prop do composer, e isso é decisão,
não atalho: uma prop por controle faria o composer crescer para sempre, e o
controle deixaria de servir a quem não tem campo de texto.

A consequência prática vale para as sete famílias: **peça que se encaixa é peça
autônoma**, e o teste é perguntar se ela faz sentido montada sozinha. Se fizer,
ela não toca o arquivo do hospedeiro — o que, de quebra, é o que permite
construí-la em paralelo com as irmãs.

O contrário também tem caso legítimo: `composer-context`, `composer-attachments`
e `quote` SÃO props do composer, porque desenham dentro da moldura do campo e
participam da descrição acessível dele. A pergunta que separa os dois grupos é
se a peça vive na moldura ou no trilho.

---

## 5. Triagem do catálogo — as 120

Nem toda entrada do catálogo é um componente novo aqui. O DS já tem 55 primitivos
e 70 folhas; boa parte das 120 é **composição do que existe**, e tratá-las como
componentes novos duplicaria `command`, `dialog`, `data-table` e `chart` com outro
nome. As tabelas abaixo cobrem as 120 entradas, cada uma exatamente uma vez.

### 5.1 Já desenhado — vira story ou composição, folha nova nenhuma (38)

Estas entram como **stories de composição** e seções de docs page das peças que já
existem. Se ao montar aparecer um buraco, o conserto é uma classe `.nds-*` que
falta, nomeada — nunca uma folha nova.

| Entrada do catálogo | Com o que se monta aqui |
|---|---|
| `thread` | `chat-thread` |
| `message-pair` | `chat-thread` — uma story |
| `streaming-text` | `chat-thread`, `streaming: true` + `aria-busy` |
| `scroll-anchor` | `chat-thread` + `chat-scroll` (o botão "ir para o fim") |
| `message-actions` | `chat-thread`, `.nds-chat-message-actions` + `button` |
| `reasoning` | `chat-thread`, `.nds-chat-reasoning` |
| `tool-call` | `chat-thread`, `.nds-chat-tool-call` |
| `tool-fallback` | `chat-thread` — é o estado default do `tool-call`, sem peça própria |
| `sources` | `chat-thread`, `.nds-chat-sources` |
| `chat-panel` | `chat-thread` + composer (família 1) — story de composição |
| `chart` | `chart` (pontos chegando um a um = estado, não componente) |
| `data-table` | `data-table` |
| `markdown-text` | `markdown` |
| `syntax-highlighter` · `shiki-highlighter` | `code-block` + `code-highlight.ts`. **Não** entra dependência nova de realce |
| `tooltip-icon-button` | `button` ícone + `tooltip` |
| `command-palette` | `command` |
| `model-selector` | `command` / `combobox` com agrupamento |
| `settings-panel` | `form` |
| `assistant-sidebar` | `sidebar` + `resizable` |
| `assistant-modal` · `launcher-bubble` | `dialog` / `sheet` + `popover` |
| `empty-state` | `empty.css` + `button` |
| `error-state` | `alert` variante destrutiva + ação de repetir |
| `feedback-dialog` | `dialog` + `form` + `radio-group` + `textarea` |
| `prompt-library` | `command` + `dialog` |
| `mcp-config` | `dialog` + `form` + `badge` |
| `day-separator` | `separator` + `tooltip` |
| `follow-up-suggestions` | lista de `button` / `pill.css` |
| `loading-state` | `skeleton`; a matriz animada é regra de `13-animacao.md` |
| `typing-indicator` | três pontos, dentro da folha do `chat-thread` |
| `number-ticker` | animação de dígito, não componente — `13-animacao.md` |
| `file` | `item.css` + ícone lucide por tipo + `button` de baixar |
| `image` | `aspect-ratio` + `skeleton` + `dialog` para tela cheia |
| `attachment` | composição de `file` e `image` dentro do composer |
| `directive-text` | `markdown` + `badge` em linha |
| `generative-ui` | não é peça: é a regra de que resposta estruturada usa os primitivos do DS |
| `logos` | **fora** — marca registrada. Vira espaço para `HTMLElement` |

### 5.2 As sete famílias novas (82)

Construir **por família**, não por slug. Dentro de uma família as peças dividem
geometria, estados, tokens e — o que mais importa — a folha. Construir slug a
slug produz 83 folhas e nenhum sistema.

| Família | Folha | Peças | O eixo comum |
|---|---|---|---|
| **1. Composer** | `composer.css` | `composer`, `composer-attachments`, `composer-context`, `composer-model-picker`, `composer-trigger-popover` (absorve `composer-mentions` e `composer-slash-commands` — ver 5.3), `composer-voice`, `mobile-composer`, `quote`, `draft-restore`, `edit-message`, `message-queue` (13 no catálogo, **11 componentes**) | Uma superfície de entrada com um trilho de controles. Tudo pende de `textarea` + `popover` ancorado ao cursor. Primitivo: `composer-trigger.ts` |
| **2. Execução do agente** | `agent-run.css` | `agent-status`, `thinking-indicator`, `agent-plan`, `todo-list`, `job-progress`, `subagent-list`, `tool-group`, `tool-error`, `tool-timeline`, `terminal-block`, `code-runner`, `computer-use`, `background-inbox`, `connection-state`, `stopped-run`, `schedule-card`, `checkpoint-history`, `agent-handoff`, `agent-card`, `permission-grant`, `elicitation-form`, `guardrail-notice`, `approval-card` (23) | Todas respondem "o que está acontecendo, há quanto tempo, e o que eu posso fazer a respeito". Estados de `RunStatus` e `ToolCallState`; base em `collapsible`, `progress`, `badge` |
| **3. Evidência e procedência** | `evidencia.css` | `inline-citation`, `document-reference`, `retrieval-chunks`, `confidence-marker`, `web-search`, `research-report`, `memory-chips`, `speaker-identity`, `mcp-server-panel` (9) | Em que a resposta se apoia. Todas carregam `Citation`. Base em `hover-card`, `popover`, `badge` |
| **4. Resposta estruturada** | `resposta-estruturada.css` | `spec-sheet`, `comparison-card`, `score-breakdown`, `recommendation-card`, `timeline`, `file-tree`, `flow-graph`, `trace-waterfall`, `activity-graph`, `heat-graph`, `code-diff`, `reviewable-diff`, `image-generation`, `diagram`, `mermaid-diagram`, `math-block`, `map-answer`, `web-preview`, `artifact-card`, `canvas-split` (20) | A forma com que o modelo responde quando não é texto. Base em `card`, `table`, `chart`. Primitivo: `diff-hunks.ts`. **Atenção às dependências — §6** |
| **5. Medição** | `medicao.css` | `context-display`, `context-breakdown`, `cost-meter`, `message-timing`, `quota-banner`, `reasoning-effort` (6) | O mesmo número em quatro formas (anel, barra, texto, repartição). Primitivo: `token-budget.ts`. Base em `progress` |
| **6. Navegação da conversa** | `conversa-nav.css` | `message-branches`, `regenerate-menu`, `conversation-search`, `thread-search`, `thread-list`, `thread-list-sidebar`, `shared-conversation`, `onboarding` (8) | Achar e trocar de lugar sem perder o seu. Base em `sidebar`, `command`, `pagination`, `stepper.css` |
| **7. Voz** | `voz.css` | `orb`, `voice-conversation`, `read-aloud` (3) | Áudio ao vivo, com estado de conexão e legenda. Base em `media-player`. **Sensível a `prefers-reduced-motion`** |

### 5.3 A triagem se corrige DURANTE a construção, e a correção se escreve

A conta de 5.1 e 5.2 foi feita lendo o catálogo. Construir revela o que ler não
mostra, e quando revelar, **o número muda aqui** — contagem que não acompanha o
que existe vira meta, e meta faz criar peça para bater número.

Primeira correção, medida ao fechar a família 1: `composer-mentions` e
`composer-slash-commands` **não são componentes**. São as duas configurações do
`composer-trigger-popover`, que nasceu com as duas: a descrição dele já diz
"menções, comandos, e qualquer outra lista ancorada no que está sendo escrito",
e as stories de variante chamam-se `Mentions` e `Commands`. Dar slug próprio a
cada uma criaria duas docs pages para um componente com dois ajustes — que é
exatamente o que 5.1 existe para evitar.

O critério, para as seis famílias que faltam: **uma entrada do catálogo vira
slug quando tem desenho, estado ou vocabulário próprios.** Se a diferença cabe
num argumento do que já existe, ela é variante — vira story e linha na tabela,
não peça. Ao decidir isso durante a construção, corrija a tabela de 5.2 no
mesmo passo; não anote para depois.

E o contrário também vale: peça que na leitura parecia uma e ao construir
mostrou ser duas se DESDOBRA aqui, com o motivo.

Ordem entre famílias — a que evita retrabalho:
**3.1 fundação → 1 composer → 2 execução → 5 medição → 3 evidência → 4 resposta
estruturada → 6 navegação → 7 voz.**
O composer primeiro porque fecha o ciclo com o `chat-thread` que já existe (dá
para usar o produto ao fim da família 1); execução e medição em seguida porque
são as que mais reaproveitam `chat-protocol.ts` e endurecem o vocabulário
enquanto ele é barato de mudar; resposta estruturada por último entre as grandes
porque é a que traz dependência externa, e dependência decidida cedo demais é
decidida sem informação.

---

## 6. Dependências novas — decidir antes, não durante

Quatro peças da família 4 pedem biblioteca que o repositório não tem. Nenhuma
entra sem decisão explícita da dona, e três têm saída sem dependência:

| Peça | Dependência natural | Saída sem dependência |
|---|---|---|
| `mermaid-diagram` | `mermaid` (~600 kB) | O consumidor passa o SVG já renderizado; o componente desenha a moldura, o zoom e o modo de tela cheia |
| `math-block` | `katex` (~280 kB + fontes) | Idem — a peça é a moldura e o passo a passo, não o renderizador |
| `map-answer` | `maplibre-gl` (~800 kB) | Idem, e aqui a saída é a melhor: mapa embutido carrega telha de terceiro, o que é decisão de privacidade além de peso |
| `diagram` | nenhuma | Já é assim na fonte: "you hand it the rendered graphic" |

**A saída é a regra, e a dependência é a exceção**: `10-performance.md` mede o
bundle das docs pages, e um DS que embute três renderizadores para desenhar três
molduras paga o peso em toda página que importa a folha. `flow-graph`,
`trace-waterfall`, `activity-graph` e `heat-graph` se desenham com SVG e CSS
próprios — não puxe biblioteca de gráfico para eles; `chart` já cobre o que era
para ser gráfico.

---

## 7. Onde o desenho para e o produto começa

Peças desta família fazem perguntas com consequência: aprovar uma ferramenta,
conceder uma permissão, descartar réplicas ao editar um turno, voltar a um
checkpoint. **O DS desenha a pergunta e o espaço da resposta. Ele não decide o
que a resposta significa.**

O que o componente fornece: o texto da pergunta, o alcance do que se está
aprovando, o `HTMLElement[]` dos controles, e o evento que diz qual foi
escolhido.

O que o componente **não** fornece: o que acontece ao recusar, se há campo de
motivo, se a escolha vale para as próximas, o que "sempre permitir" abrange.

Vale para `approval-card`, `permission-grant`, `guardrail-notice`,
`elicitation-form`, `edit-message` e `checkpoint-history`. Se ao especificar uma
delas a resposta depender de política, **pergunte à dona na hora** — não anote
para depois (regra de zero pendências por componente).

---

## 8. Acessibilidade — as regras que se repetem em dezenas de peças

Especificadas uma vez aqui porque valem para a família inteira. Cada peça herda
todas; `01-acessibilidade.md` continua valendo por cima.

1. **Texto em geração não vai para região viva.** Nada de `role="log"` ou
   `aria-live` no container que recebe streaming: o leitor de tela anuncia a cada
   trecho e a leitura fica impossível. Enquanto gera, o elemento é
   `aria-busy="true"`; ao terminar, o texto é escrito **uma vez** num anunciador
   `aria-live="polite"` separado. Vale para thread, indicador de digitação, status
   do agente, terminal, relatório, busca na web, ticker — tudo que se escreve
   sozinho.
2. **Conteúdo novo não move o foco**, e a rolagem só acompanha o fim se já estava
   no fim (`chat-scroll.ts`).
3. **Ação que só existe no `:hover` não existe para o teclado.** Ações aparecem no
   `:hover` **e** no `:focus-within`, e permanecem na ordem de foco em qualquer
   estado — por isso somem por `opacity`, nunca por `display` ou `visibility`.
4. **Estado nunca é só cor.** `running` / `done` / `failed`, adição e remoção num
   diff, nível de confiança, célula quente num heat map: sempre acompanhados de
   ícone, texto ou padrão. Vale para as sete famílias, e é o defeito mais provável
   da 4 (WCAG 1.4.1).
5. **Disclosure é `<details>`/`<summary>` ou botão com `aria-expanded`** — nunca
   `div` com `onclick`. Chamada de ferramenta, grupo, raciocínio, bloco de diff,
   repartição de contexto.
6. **Uma só camada rola**, e ela tem nome e `tabindex="0"` (axe
   `scrollable-region-focusable`). Thread, lista de conversas, terminal, árvore de
   arquivos, waterfall.
7. **Nome acessível é o nome, não o ícone.** Botão de copiar, regenerar, mudo,
   remover anexo, aprovar — todos com rótulo textual, iguais nas cinco
   (`scripts/paridade-nome-acessivel.mjs`).
8. **`prefers-reduced-motion` desliga a animação contínua**, não a transição de
   estado: orb pulsando, onda de voz, cursor da tela, revelação palavra a palavra,
   shimmer de "gerando". Ver `13-animacao.md`.
9. **Cronômetro ao vivo não é anunciado.** "há 12s" que se atualiza é
   `aria-hidden`; o que o leitor recebe é o estado ("gerando"), com a duração
   anunciada uma vez ao terminar.
10. **Alvo de toque ≥ 24 px** (WCAG 2.5.8) — chip de menção, controle de bloco de
    diff, ação em linha na mensagem. É onde esta família mais escorrega.

---

## 9. Tokens e desenho

- Sem altura fixa em nada que carregue texto (`12-tokenizacao-dimensoes.md`).
  Vale com força aqui: bolha de mensagem, pill de status e chip de menção crescem
  com a fonte do navegador.
- Sem valor de design em `style` inline. Se faltar utilitária, **diga qual** —
  não desenhe o valor.
- Em container colorido, texto corrido é `--foreground`. Ícone e título podem
  carregar a cor semântica; descrição, não. Vale para toda a família 2, que é
  quase inteira feita de containers de estado.
- Contraste não pode depender de tema nem de modo: as peças de medição e o heat
  map desenham com opacidade sobre `--muted`, e opacidade baixa some no escuro.
  Toda escala de intensidade se verifica nos dois modos, em todos os temas
  (`docs/shared/testing/cor.ts`).
- Tokens novos, nenhum. As sete folhas usam o que os 42 tokens de tema já dão. Se
  uma cor parecer faltar, ela quase sempre é `--muted` com borda, e não um token
  novo — token novo obriga `16-novo-tema.md` inteiro, em todos os temas.

---

## 10. Verificação

Aplique a regra de escopo do `CLAUDE.md` raiz — rode o portão que veria **este**
defeito:

| O que mudou | O que rodar |
|---|---|
| Primitivo compartilhado novo em `docs/shared/primitives/` | Os **cinco builds** (resolução de módulo) + o teste do próprio primitivo |
| Folha `.nds-*` da família | As stories que usam a classe, nas cinco |
| `translations.json` | `node scripts/audit.mjs <slug> --json` |
| Um componente `ui/<slug>` numa stack | Build da stack + a suíte **daquele slug** |
| Binding de template Angular | `npm run build` (`ngc --noEmit`) — só ele type-checka isso |

Por peça, antes de fechar: `scripts/audit.mjs <slug>`,
`scripts/paridade-nome-acessivel.mjs <slug>`, `scripts/tabela-tokens.mjs <slug>`,
e `audit-translation-literals.mjs --only cobertura` depois do lote.

Ao escrever teste de estado que chega com atraso (streaming, revelação, conexão),
**nada de `waitFor` que mexa no DOM** — resolva token e monte sonda antes, uma
vez, e espere por relógio. A armadilha é latente e derruba o arquivo inteiro sem
reportar falha.

---

## 11. O que entregar por peça

1. A entrada na folha da família, com a árvore ASCII no cabeçalho e a atribuição.
2. O primitivo compartilhado, se houver decisão que renda cinco `if`, com teste.
3. `translations.json` trilíngue, texto neutro de API, snippets com variante por
   stack.
4. Vanilla: componente, stories (playground, variantes, estados, composições),
   docs page com `useSeoEffect`.
5. As outras quatro alinhadas ao vanilla; divergência só de API de framework, e
   registrada.
6. Zero pendências: tudo o que se soube da peça nesta passada foi resolvido nas
   cinco, ou perguntado à dona na hora.
