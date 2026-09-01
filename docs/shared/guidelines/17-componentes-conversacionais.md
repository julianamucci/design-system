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
| `token-budget.ts` *(existe)* | Fração usada, limiar de aviso, repartição por origem — três peças de medição desenham o mesmo número. Importa `TokenUsage` de `chat-protocol.ts`, nunca o redeclara: aquele é o vocabulário, este é a conta |
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

### 4.1 O override troca o NOME, e só

Quando a API de uma stack diverge — retorno vira evento, prop vira `output()` —,
o override na docs page cobre **o nome da linha**, e o **tipo** quando o tipo
declarado daquela stack é de fato outro. **A descrição nunca.**

Sobre o tipo, siga o precedente da SUA stack, que já está fixado e difere entre
elas de propósito: no Angular, `AgentStatusDocs` e `ComposerContextDocs`
sobrescrevem para `OutputEmitterRef<T>`, que é o tipo do membro; no Vue,
`AgentStatusDocs` mantém o tipo compartilhado, porque o que quem consome escreve
é um manipulador `(valor) => void` — a forma de DECLARAÇÃO do emit é do autor do
componente e não pertence à tabela.

A descrição, porque ela já é neutra de API por regra — e se você sentir vontade
de sobrescrevê-la, é sinal de que o texto compartilhado nomeia a API de alguma
stack. **O conserto é lá, não aqui.** Isso já custou caro: no `form`, quatro
stacks sobrescreviam a mesma frase porque o texto compartilhado dizia
`createFormField`; e no `tool-group`, uma descrição sobrescrita em três idiomas
só acrescentava a palavra "Evento" ao texto compartilhado, que a coluna do nome
já dizia.

Regra prática: **se a mesma frase aparece sobrescrita em mais de uma stack, o
defeito está no compartilhado.**

### 4.2 Peça que mora num encaixe NÃO vira prop de quem a hospeda

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

### 5.1 Já desenhado — vira story ou composição, folha nova nenhuma (42)

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
| `agent-card` | `card` + `item` (identidade, e uma linha por habilidade) + `badge` + `connection-state`. Veio da família 2 — ver 5.3 |
| `tool-timeline` | `tool-group` aberto — as chamadas já chegam na ordem em que aconteceram — com `agent-status` acima (o rótulo que muda enquanto corre, e o relógio) e `.nds-cluster` de `.nds-badge` para as estatísticas de arquivo. Veio da família 2 — ver 5.3 |
| `code-runner` | `code-block` (o trecho, sempre visível, com a linguagem no rótulo do cabeçalho) + `terminal-block` (a saída pré-formatada, o cursor e como terminou) + `agent-status` (o relógio e o botão de executar, que é o `start` de `AgentStatusIntent`). Pede **uma opção** `actions?: HTMLElement[]` no cabeçalho do `code-block`, onde `.nds-code-block-actions` já é a fila — nem classe nova, nem folha nova. Veio da família 2 — ver 5.3 |
| `reasoning-effort` | `toggle-group` `type: 'single'` para escolher o nível — que é CONTROLE, e o catálogo já tem outro escrevendo o mesmo campo — mais `context-display` na forma `bar` para o gasto contra o teto do nível escolhido, que é token contra teto como as irmãs. Veio da família 5 — ver 5.3 |
| `logos` | **fora** — marca registrada. Vira espaço para `HTMLElement` |

### 5.2 As sete famílias novas (78)

Construir **por família**, não por slug. Dentro de uma família as peças dividem
geometria, estados, tokens e — o que mais importa — a folha. Construir slug a
slug produz 83 folhas e nenhum sistema.

| Família | Folha | Peças | O eixo comum |
|---|---|---|---|
| **1. Composer** | `composer.css` | `composer`, `composer-attachments`, `composer-context`, `composer-model-picker`, `composer-trigger-popover` (absorve `composer-mentions` e `composer-slash-commands` — ver 5.3), `composer-voice`, `mobile-composer`, `quote`, `draft-restore`, `edit-message`, `message-queue` (13 no catálogo, **11 componentes**) | Uma superfície de entrada com um trilho de controles. Tudo pende de `textarea` + `popover` ancorado ao cursor. Primitivo: `composer-trigger.ts` |
| **2. Execução do agente** | `agent-run.css` | `agent-status` (absorve `stopped-run`, que é `RunStatus` `stopped` — ver 5.3), `thinking-indicator`, `agent-plan` (absorve `todo-list` — mesmo desenho, mesmos estados, mesmo vocabulário), `job-progress`, `subagent-list`, `tool-group` (absorve `tool-error`, que é `ToolCallState` `failed`), `terminal-block`, `computer-use`, `background-inbox`, `connection-state`, `schedule-card`, `checkpoint-history`, `agent-handoff`, `elicitation-form`, `guardrail-notice`, `approval-card` (absorve `permission-grant` — mesma API, ver 5.3) (20 no catálogo — `agent-card`, `tool-timeline` e `code-runner` saíram para a 5.1, ver 5.3 —, **16 componentes** até aqui) | Todas respondem "o que está acontecendo, há quanto tempo, e o que eu posso fazer a respeito". Estados de `RunStatus` e `ToolCallState`; base em `collapsible`, `progress`, `badge` |
| **3. Evidência e procedência** | `evidencia.css` | `inline-citation`, `document-reference`, `retrieval-chunks`, `confidence-marker`, `web-search`, `research-report`, `memory-chips`, `speaker-identity`, `mcp-server-panel` (9) | Em que a resposta se apoia. Todas carregam `Citation`. Base em `hover-card`, `popover`, `badge` |
| **4. Resposta estruturada** | `resposta-estruturada.css` | `spec-sheet`, `comparison-card`, `score-breakdown`, `recommendation-card`, `timeline`, `file-tree`, `flow-graph`, `trace-waterfall`, `activity-graph`, `heat-graph`, `code-diff`, `reviewable-diff`, `image-generation`, `diagram`, `mermaid-diagram`, `math-block`, `map-answer`, `web-preview`, `artifact-card`, `canvas-split` (20) | A forma com que o modelo responde quando não é texto. Base em `card`, `table`, `chart`. Primitivo: `diff-hunks.ts`. **Atenção às dependências — §6** |
| **5. Medição** | `medicao.css` | `context-display`, `context-breakdown`, `cost-meter`, `message-timing`, `quota-banner` (5 — `reasoning-effort` saiu para a 5.1, ver 5.3) | O mesmo número em formas diferentes — anel, barra, texto, repartição — e, sem teto, só texto. Primitivo: `token-budget.ts`, para as que têm denominador; `message-timing` mede TEMPO, não tem teto e por isso não lê conta nenhuma — a triagem dele foi refeita ao construir, confirmou o slug, e o porquê está no bloco "Tempo de uma resposta" da folha. O eixo é o que se MEDE: quem ESCOLHE quanto esforço aplicar não mede nada, e por isso não é desta família |
| **6. Navegação da conversa** | `conversa-nav.css` | `message-branches`, `regenerate-menu`, `conversation-search`, `thread-search`, `thread-list`, `thread-list-sidebar`, `shared-conversation`, `onboarding` (8) | Achar e trocar de lugar sem perder o seu. Base em `sidebar`, `command`, `pagination`, `stepper.css` |
| **7. Voz** | `voz.css` | `orb`, `voice-conversation`, `read-aloud` (3) | Áudio ao vivo, com estado de conexão e legenda. Base em `media-player`. **Sensível a `prefers-reduced-motion`** |

### 5.3 A triagem se corrige DURANTE a construção, e a correção se escreve

A conta de 5.1 e 5.2 foi feita lendo o catálogo. Construir revela o que ler não
mostra, e quando revelar, **o número muda aqui** — contagem que não acompanha o
que existe vira meta, e meta faz criar peça para bater número.

**Quarta correção, e a primeira que sai de uma peça JÁ CONSTRUÍDA**:
`permission-grant` é `approval-card`. A API que o `approval-card` fechou é
pergunta + alcance em pares de termo e valor + espaço de controles + evento da
escolha, e **sem máquina de estados nenhuma** — a folha removeu todo eixo de
estado. Uma concessão de permissão pede exatamente isso: "permitir o acesso à
câmera?", com o alcance dizendo a quê, e dois controles.

O que poderia distingui-las — se a permissão vale para as próximas, o que
"sempre permitir" abrange — é justamente o que a §7 mantém do lado de fora. Uma
peça separada teria a mesma marcação, o mesmo vocabulário (nenhum) e a mesma
docs page, com outro título.

Fica como a §5.3 prescreve: **reversível**. Se ao construir alguma peça vizinha
aparecer diferença de desenho, estado ou vocabulário, `permission-grant`
desdobra de volta aqui, com o motivo.

**Quinta correção, e a primeira que atravessa de 5.2 para 5.1**: `agent-card`
não é peça, é composição — e por isso a contagem das duas tabelas muda junto,
82 → 81 e 38 → 39.

A fonte descreve a identidade que um agente remoto apresenta antes de se falar
com ele: nome, versão, fornecedor, um parágrafo, uma linha por habilidade,
endereço, modelo, e um botão de conectar. E ela mesma diz de que a carta é
feita: superfície `paper` na raiz, `mono` na versão, no endereço e no modelo,
`field` no nome da habilidade e no estado conectado — na origem, `agent-card`
JÁ É composição de superfícies compartilhadas, e não um desenho próprio.

Os três testes desta seção, todos negativos:

- **Desenho, não.** Montada inteira, a carta não deixa buraco — que é
  exatamente o que a 5.1 manda verificar. `.nds-card` dá a superfície e as
  cinco partes (o distintivo de versão entra por `.nds-card-action`, que o
  cabeçalho já posiciona com `:has()`); `.nds-item` dá a identidade e cada
  linha de habilidade, porque mídia + título + descrição É a linha de
  habilidade; `.nds-item-group` empilha as linhas; `.nds-badge`,
  `.nds-font-mono`, `.nds-truncate` e `.nds-spacer-start` fecham o rodapé.
  Nenhuma classe nova, nenhuma nomeada como faltando.
- **Estado, não.** `connected` é um booleano, e `ConnectionState` já modela os
  três. O mapeamento é exato, não aproximado: ligado não oferece ação — a fonte
  desenha o botão desabilitado, que é a mesma decisão que a folha já escreveu
  ("sobre uma ligação que está funcionando não há o que fazer aqui") —, e
  desligado oferece "Conectar", que é `labels.action.disconnected`. Um booleano
  aqui seria o vocabulário que existe com um estado a menos, e o que se perderia
  é `reconnecting`, que é justamente o estado que a carta não sabe desenhar.
- **Vocabulário, não.** `AgentSkill` é `{ name, description }`: rótulo e uma
  linha de explicação, que é o título e a descrição de `.nds-item`. Tipo novo
  para isso não é vocabulário de conversa, é uma linha de lista com nome
  próprio.

E há um teste a mais, que é da família e não da peça: **ela não responde ao
eixo**. As 22 restantes dizem o que está acontecendo, há quanto tempo, e o que
fazer a respeito; nesta não está acontecendo nada e não há duração nenhuma. Era
a única das 23 sem `RunStatus` e sem `ToolCallState`. Vale comparar com
`approval-card`, que também não tem máquina de estados e mesmo assim ficou: ele
é o OUTRO LADO de `ToolCallState` `pending`, e é essa amarra que o segura na
família. `agent-card` não tem amarra nenhuma.

Some a isso que a §1 tira dela justamente o que teria de mais próprio: a marca
do modelo não entra no repositório, e vira espaço para `HTMLElement`. Depois
que o logotipo sai, o que resta é um nome, um parágrafo, uma lista, duas cadeias
monoespaçadas e um botão.

**Reversível**, como as outras quatro: se ao construir `subagent-list` ou
`agent-handoff` aparecer identidade de agente com desenho, estado ou vocabulário
próprios, `agent-card` desdobra de volta para a 5.2, com o motivo.

**Sexta correção, e a segunda que atravessa de 5.2 para 5.1**: `tool-timeline`
é `tool-group` aberto — e as duas contagens mudam junto, 81 → 80 e 39 → 40.

O que a fonte descreve, lido inteiro antes de decidir: um botão de abrir com
dois rótulos (um em repouso, um que cintila enquanto corre), um painel com uma
linha por passo — ícone, verbo, etiqueta — e uma faixa de estatísticas de
arquivo ao pé. Os tipos são `TimelineStep { verb, chip, icon }` e
`TimelineStat { file, added?, removed? }`, mais `visibleSteps: number` e
`streaming: boolean`.

**A LINHA DO TEMPO NÃO TEM TEMPO**, e é essa medida que decide todo o resto. Não
há carimbo, não há duração, não há relógio: o único eixo temporal da peça é a
ORDEM DO ARRANJO. Quem carrega `durationMs` na fonte é o `tool-group` DELA, não
esta. Então a pergunta que parecia a difícil — o que ela mostra é tempo
ABSOLUTO, que é dado do produto e chega escrito como o relógio do estado da
execução, ou ORDEM, que a lista já dá pela posição? — nem chega a ser feita: a
fonte não mostra nem um nem outro, e `ToolGroupOptions.calls` já está
documentado como "na ordem em que aconteceram". O grupo JÁ É cronológico.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a linha do tempo não deixa buraco.
  `.nds-tool-group` dá a caixa: `<details>`, resumo com rótulo e `<ol>` de
  linhas — que é literalmente a "vertical trace" da fonte, cuja anatomia não tem
  trilho, nem ponto, nem conector, só linhas empilhadas. O rótulo que troca
  enquanto corre é `.nds-agent-status-label`, que já muda com `RunStatus` e já
  traz o relógio ao lado, no bloco irmão desta folha. A faixa de estatísticas é
  `.nds-cluster[data-spacing="xs"]` de `.nds-badge nds-badge-success` /
  `nds-badge-destructive`, com `.nds-font-mono` e `.nds-truncate` no caminho do
  arquivo. Nenhuma classe nova, nenhuma nomeada como faltando.

  O ícone por linha é o único traço que a composição não reproduz, e é decisão,
  não esquecimento: ele repete em desenho o verbo que está do lado, e a decisão
  4 do grupo já trocou codificação icônica por PALAVRA em `.nds-badge`. Ícone
  que repete a palavra vizinha é a duplicação que aquela decisão removeu.
- **Estado, não.** `TimelineStep` não tem estado NENHUM — é a única entrada da
  família cujas linhas não carregam `ToolCallState`. O que sobra é
  `streaming: boolean`, e ele é `RunStatus` `running` achatado num booleano,
  perdendo `stopped`, `failed` e `complete`: exatamente o defeito de
  `connected: boolean` do `agent-card`, na mesma folha e pelo mesmo motivo.
  `visibleSteps` não é estado, é FATIA — e a §2 já a entrega a quem consome, que
  passa `steps.slice(0, n)`, porque o componente desenha o que RECEBE. É a
  mesma leitura que a 5.1 já fez em `streaming-text`, `loading-state` e
  `number-ticker`: revelação é animação e é recorte, não é peça.
- **Vocabulário, não.** `TimelineStep { verb, chip, icon }` é `ChatToolCall` com
  um campo A MENOS: `verb` é `name`, `chip` é `detail`, e `icon` é espaço de
  `HTMLElement` pela §1 — na fonte ele é um `LucideIcon`, que é referência de
  componente React, justamente o que não porta. `TimelineStat` é vocabulário de
  verdade, e é o único da peça — mas não é desta família: `{ file, added,
  removed }` é o cabeçalho de um diff, e a casa dele é `diff-hunks.ts`, com
  `code-diff` e `reviewable-diff`, na família 4. Escrevê-lo agora em
  `agent-run.css` seria decidir a folha da 4 de dentro da 2, contra a ordem que
  a §5.2 fixou e pelo motivo que ela dá.

E o teste da família, que é o quarto: ela responde ao eixo, e responde
exatamente o que o `tool-group` já responde. É aí que ela difere do
`agent-card`, que saiu da família por não responder a eixo nenhum — esta
continua sendo sobre a execução, e por isso não vira cartão nem coisa nova:
vira story de composição da peça que já diz o que o agente fez, aberta em vez
de recolhida.

**Reversível**, como as outras cinco: se ao construir `computer-use` aparecer
sequência de passos com desenho, estado ou vocabulário próprios — um trilho de
verdade, um carimbo que chegue como DADO, um estado por passo que
`ToolCallState` não modele —, `tool-timeline` desdobra de volta para a 5.2, com
o motivo. `code-runner` era a outra verificação prevista aqui, e já foi feita: a
fonte dele não tem passo nenhum — tem um trecho, um estado e linhas de saída —,
então não desdobra nada. Ver a sétima correção, logo abaixo.

**Sétima correção, e a terceira que atravessa de 5.2 para 5.1**: `code-runner`
é `code-block` + `terminal-block` — e as duas contagens mudam junto, 80 → 79 e
40 → 41.

O que a fonte descreve, lido inteiro antes de decidir: um cabeçalho com a
linguagem, um distintivo de duração e um botão de executar que vira roda
enquanto corre; o trecho de código, SEMPRE visível; e um bloco de saída que só
monta depois que o estado deixa `idle`. Os tipos são `state: RunState`
(`"idle" | "running" | "ok" | "error"`), `output: readonly string[]`,
`language`, `code`, `durationMs` e `onRun`.

**A METADE MAIOR DA FONTE É RUNTIME**, e é ela que dá o nome à peça: registrar
uma entrada `"human"` no toolkit, deixar a chamada aberta até que alguém aperte
o botão, chamar `addResult` uma vez, rodar `runInSandbox`. Nada disso porta
(§1), e aqui a §2 é literal — um executor que executasse traria exatamente o
runtime que esta família existe para não ter. O que sobra na forma standalone,
que é a única que se lê ("Como ler a fonte", §1), é um componente controlado de
sete props, e cinco delas já têm dono nesta folha.

Os três testes, todos negativos:

- **Desenho, não.** Montado inteiro, o executor não deixa buraco — e a fonte
  mesma já diz de que ele é feito: o bloco de saída rola pelo par
  `codeScroll`/`codeSurface` de `surfaces.tsx`, e ela acrescenta que
  reapontar esses tokens "restila este e todo outro elemento que rola saída
  pré-formatada do mesmo jeito". É superfície COMPARTILHADA declarada na
  origem, que foi o que a quinta correção leu em `agent-card`. As duas metades
  já estão desenhadas aqui: o trecho sempre visível é `.nds-code-block-root` —
  cabeçalho com rótulo (`.nds-code-block-title`, onde a linguagem entra), caixa
  que rola nos dois eixos com `tabindex="0"` e `lang="en"`, e ainda realce por
  gramática, que a fonte nem tem; a saída é `.nds-terminal-block-output` —
  `<pre>` monoespaçado, `role="group"` nomeado pelo que rodou, `tabindex="0"`,
  `white-space: pre` e `overscroll-behavior: contain` —, com
  `.nds-terminal-block-cursor` enquanto corre, que é o caret piscando da fonte
  (decisão 4), e `.nds-terminal-block-result` dizendo como terminou. O
  distintivo de duração é `.nds-agent-status-elapsed`, o relógio que já mora
  nesta folha e já sai do que é lido em voz (regra 9 da §8). O botão de executar
  é `button` dentro de `.nds-code-block-actions`, que o cabeçalho já encosta à
  direita com `margin-inline-start: auto`.

  Há UM buraco, e ele é de OPÇÃO, não de classe: `createCodeBlock` monta a fila
  de ações por dentro e só põe o copiar nela. A composição pede
  `actions?: HTMLElement[]` no cabeçalho do `code-block` — a classe, o
  espaçamento e o encaixe já existem, e é o mesmo contrato de espaço que a §2
  fixou para a família inteira. Uma opção numa fábrica que já tem a fila; nem
  classe nova, nem folha nova. É o que a 5.1 manda nomear, e está nomeado lá.

  Dois traços da fonte a composição não reproduz, os dois por decisão já
  escrita. A entrada escalonada das linhas a 80 ms é revelação, e revelação é
  animação e recorte, não peça — mesma leitura que a 5.1 já fez em
  `streaming-text`, `loading-state` e `number-ticker`, e mesma razão pela qual
  a decisão 10 do bloco de terminal recusou o degradê das linhas antigas. E a
  saída em vermelho quando quebra é cor sozinha carregando estado, que a decisão
  5 já trocou pela PALAVRA (WCAG 1.4.1).
- **Estado, não.** `RunState` é `RunStatus` com uma palavra A MENOS, e o
  mapeamento é exato: `idle` é `idle`, `running` é `running`, `ok` é `complete`,
  `error` é `failed`. O que se perde é `stopped` — e não há lugar pior para
  perdê-lo. O bloco de terminal já escreveu que `stopped` é "o mais literal dos
  cinco: é o Ctrl-C, que é interrupção de pessoa e não falha da máquina"; um
  trecho de código que roda é a coisa mais interrompível desta família, e a
  fonte simplesmente não desenha a execução interrompida. É o mesmo defeito de
  `streaming: boolean` no `tool-timeline` e de `connected: boolean` no
  `agent-card`: vocabulário achatado, na mesma folha e pelo mesmo motivo.

  E a regra de visibilidade que a fonte pendura no estado — a saída só monta
  quando sai de `idle` — já está escrita aqui, e mais fina: a caixa existe
  quando há linha OU quando corre, porque comando que terminou sem escrever nada
  é caso real, e caixa vazia com parada de tabulação dentro é dar foco a lugar
  nenhum (decisão 3). Em `ok` sem saída a fonte monta a caixa vazia; a decisão
  daqui não.
- **Vocabulário, não.** Nenhum tipo novo, e não por aproximação: `code` e
  `language` são `CodeBlockOptions.code` e `.language`, mesmo nome e mesmo
  sentido; `output: readonly string[]` é `TerminalBlockOptions.lines`, mesmo
  tipo e mesma regra de que quem fatia é quem consome; `onRun` é
  `onAction('start')` do estado da execução, cujo `AgentStatusIntent` já cobre
  retomar e refazer de propósito, porque a diferença entre os dois é política de
  produto. Só `durationMs` parece próprio, e é o contrário: é a forma que esta
  folha JÁ REJEITOU — a duração chega em `elapsed`, string já escrita, porque
  formato de duração é decisão de idioma e um componente que o formatasse
  decidiria idioma em cinco lugares.

E o teste da família, que é o quarto: ela responde ao eixo — o que está
acontecendo, há quanto tempo, e o que eu posso fazer a respeito — e responde com
as três peças que já o respondem, uma para cada terço da pergunta. É a mesma
leitura da sexta correção, e a diferença para `agent-card` continua sendo esta:
`code-runner` não sai por não pertencer à família, sai por já estar construído
dentro dela.

**Reversível**, como as outras seis: se ao construir `computer-use` aparecer
execução com controle PRÓPRIO — um botão que só faça sentido preso ao trecho, um
estado que `RunStatus` não modele, vocabulário de execução que `code-block` e
`terminal-block` não deem —, `code-runner` desdobra de volta para a 5.2, com o
motivo.

**Oitava correção, e a quarta que atravessa de 5.2 para 5.1**: `reasoning-effort`
é `toggle-group` + `context-display` — e as duas contagens mudam junto, 79 → 78
e 41 → 42. É a primeira correção que sai de uma família que não é a 2, e a
primeira em que a entrada se parte em DUAS metades com donos diferentes.

O que a fonte descreve, lida inteira antes de decidir — e ela abre dizendo as
duas coisas na mesma linha: "o quanto pensar, e quanto desse orçamento a
execução gastou de fato". Os tipos são `EffortLevel { key, label, budget }`,
`selectedKey: string`, `spent: number` e `onSelect: (key) => void`. A anatomia é
um cabeçalho com o rótulo e "gasto / orçamento", uma fileira com um botão por
nível e `aria-pressed` no ativo, e uma faixa de preenchimento cuja largura é
`spent` sobre o `budget` do nível casado, recortada entre 0 e 100%.

**A PRÓPRIA FONTE DECLARA A COSTURA**, e é ela que decide todo o resto:
"selecionar um nível e ler quanto aquilo custou são duas preocupações
separadas — a primeira é um registro, a segunda é dado de uso do adaptador".
Não é uma peça com duas partes; são duas peças encostadas, e a fonte diz qual é
qual.

A primeira pergunta da triagem tem, então, resposta escrita na origem: **a
metade que dá nome à entrada é CONTROLE, e não medição.** `onSelect` mais um
botão por nível com `aria-pressed` é um segmentado de escolha única, e o DS tem
`toggle-group` `type: 'single'` fechado nas cinco — com `role="toolbar"`,
navegação por seta e o `aria-pressed` que a fonte pede, que vem do `toggle`. E
não é semelhança de desenho: o catálogo tem OUTRA entrada escrevendo o mesmo
campo. A fonte diz, no exemplo, que o seletor de modelo
(`/elements/model-selector`, já na 5.1) grava `config.reasoningEffort` "pelo
controle de esforço dele", e que montar os dois de uma vez registra dois
provedores do mesmo campo — "mantenha só um ligado". Uma entrada que o próprio
catálogo manda não montar ao lado da outra não é uma segunda peça; é a mesma
decisão em dois lugares. Aqui esse lugar já existe e já fechou nas cinco:
`composer-model-picker`, que é o controle do trilho que diz quem responde, e
cujo docblock já escreveu que ele não troca de modelo — avisa e devolve o
controle.

A segunda pergunta — se a metade que mede tem GRANDEZA — tem resposta sim, e é
ela que fecha o caso em vez de abrir. `spent` é `reasoningTokens` e `budget` é
um número de tokens por faixa: é token contra teto, que é a conta de
`token-budget.ts` e que três peças desta folha já leem. Se "esforço" fosse só um
rótulo ordinal — baixo, médio, alto — sem número por trás, a resposta seria
`badge` e não medidor; como tem número, a resposta é a peça de medição que já
desenha exatamente esse número. **Ordinal sem grandeza vira etiqueta; ordinal
com grandeza vira o medidor que já existe** — nos dois caminhos não sobra peça
nova.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a peça não deixa buraco. A raiz é
  `.nds-stack[data-spacing="sm"]` — a fonte declara `flex flex-col gap-2.5`, que
  é a pilha e nada mais. O segmentado é `.nds-toggle-group` com
  `type: 'single'`, e aqui vale a leitura da quinta correção, porque a fonte
  mesma diz de que ele é feito: "a trilha do segmentado usa a superfície `field`
  compartilhada, e as contagens usam o token `mono`, os dois de `surfaces.tsx`".
  Superfície compartilhada declarada na origem. O cabeçalho com o rótulo e
  "gasto / orçamento" mais a faixa de preenchimento são
  `.nds-context-display[data-form="bar"]` inteiro, e com uma parte a mais em vez
  de a menos: título em `.nds-sr-only`, valor em texto, detalhe ligando gasto e
  teto, trilho `.nds-context-display-bar` com o preenchimento lendo
  `--nds-context-used` por herança, e a palavra do nível em `.nds-badge`.
  Nenhuma classe nova, nenhuma nomeada como faltando.

  O único ponto em que fonte e folha DISCORDAM é ponto em que a folha já está
  mais fina: com `selectedKey` sem nível correspondente, a fonte resolve o
  orçamento para 0 e deixa a faixa recolhida em 0% — que é exatamente o desenho
  que a decisão 5 desta folha proíbe, porque trilho vazio lê como "não gastou
  nada" quando o que se sabe é "não se sabe quanto cabe". `spentFraction` já
  devolve `null` para teto zero, e sem fração a peça não monta medidor nenhum. A
  composição não herda o defeito da fonte.
- **Estado, não.** E aqui o sinal mais barato desta seção NÃO apareceu: não há
  booleano de estado nem união com uma palavra a menos, porque não há máquina de
  estados nenhuma. `selectedKey: string` não descreve o mundo — é o valor
  escolhido de um grupo de escolha única, que `toggle-group` já carrega em
  `defaultValue`, `onValueChange` e `setValue`, e o `setValue` que NÃO dispara o
  evento é justamente o que faz o segmentado espelhar uma escolha vinda de fora,
  que é o caso desta peça quando o esforço registrado volta aplicado. `spent` e
  `budget` não são estado: são a medição e o teto, o par de números soltos que
  `spentFraction` e `remainingUnits` já recebem.
- **Vocabulário, não.** `EffortLevel { key, label, budget }` é dois vocabulários
  existentes grudados: `key` e `label` são `value` e `label` de
  `ToggleGroupItem`, mesmo par e mesmo sentido; `budget` é o teto que
  `TokenUsage.limit` e o segundo par de `token-budget.ts` já recebem. E a fonte
  diz, sem que seja preciso deduzir, que este campo não é vocabulário de
  conversa: "`budget` não tem contrapartida em runtime: é um fato sobre as SUAS
  faixas de esforço, então fica definido pela aplicação de qualquer jeito".
  Tabela de faixas da aplicação não é protocolo, é dado de produto — e a §2 já o
  entrega a quem monta.

E o teste da família, que é o quarto: **ela responde a DOIS eixos, e a nenhum
inteiro.** O eixo da 5 é o mesmo número em formas diferentes; metade desta
entrada não é número em forma nenhuma — é uma escolha, que é o eixo do trilho do
composer. A outra metade é número, e é o número que `context-display` já
desenha, com outro teto. Vale comparar com `message-timing`, que passou por esta
mesma pergunta no sentido contrário e FICOU: lá a peça media uma grandeza que
nenhuma irmã media, e não tinha dono. Aqui as duas metades têm dono, e são dois
donos diferentes.

Some a isso o que a §1 tira, como já tirou de `agent-card`: a metade maior do
"Getting started" da fonte é registrar `config.reasoningEffort` no
`modelContext`, e o próprio texto avisa que o registro só vale para a execução
SEGUINTE. Isso é runtime, não porta, e a §2 é literal a respeito — um controle
que registrasse o esforço traria de volta exatamente o runtime que esta família
existe para não ter. Depois que o registro sai, o que resta é um segmentado
controlado e uma barra de fração.

**Reversível**, como as outras sete: se ao construir a família 3 ou a 4 aparecer
orçamento de raciocínio com desenho, estado ou vocabulário próprios — um nível
que MUDE o que o medidor significa em vez de só trocar o denominador, um estado
que a fração não modele, uma grandeza que `token-budget.ts` não receba —,
`reasoning-effort` desdobra de volta para a 5.2, com o motivo. E há um segundo
gatilho, deste lado: se `composer-model-picker` ganhar o controle de esforço que
a fonte descreve e ele pedir desenho próprio, a metade de controle vira variante
DELE — e continua não sendo peça da 5.

Duas correções da família 2 já saem da leitura do vocabulário, antes de
construir, e por isso entram aqui de saída: **`stopped-run` é `RunStatus`
`stopped`** e **`tool-error` é `ToolCallState` `failed`**. Os dois estados já
existem em `chat-protocol.ts`, com o critério de existirem escrito no docblock —
`stopped` desenha diferente de `failed` porque um oferece continuar e o outro
tentar de novo. Estado que o vocabulário já modela não vira componente; vira
story de estado e linha na tabela de quem o mostra.

Primeira correção, medida ao fechar a família 1: `composer-mentions` e
`composer-slash-commands` **não são componentes**. São as duas configurações do
`composer-trigger-popover`, que nasceu com as duas: a descrição dele já diz
"menções, comandos, e qualquer outra lista ancorada no que está sendo escrito",
e as stories de variante chamam-se `Mentions` e `Commands`. Dar slug próprio a
cada uma criaria duas docs pages para um componente com dois ajustes — que é
exatamente o que 5.1 existe para evitar.

### O sinal mais barato de que uma entrada vai colapsar

Apareceu três vezes, sempre igual, e por isso vira critério: **booleano onde
este vocabulário já tem cinco palavras.**

| entrada | o que a fonte declara | o que ela perde |
|---|---|---|
| `agent-card` | `connected: boolean` | `reconnecting` |
| `tool-timeline` | `streaming: boolean` | `stopped`, `failed`, `complete` |
| `code-runner` | `RunState = idle\|running\|ok\|error` | `stopped` |

Nas três, o achatamento não é economia — é sinal de que a entrada foi desenhada
para uma tela só, sem o vocabulário que a família já tem. E as três colapsaram
pelos testes normais; o booleano só chegou antes.

O caso do `code-runner` é o mais claro, porque o que ele perde é o pior possível:
`stopped` é o Ctrl-C, e um trecho de código que roda é a coisa mais
interrompível desta família. Uma entrada que não sabe modelar a própria
interrupção não é uma peça — é uma foto de uma peça.

**E o contrário, medido na oitava correção**: `reasoning-effort` não tem
booleano, não tem união encolhida e não tem máquina de estados nenhuma — o sinal
ficou MUDO, e a entrada colapsou pelos três testes do mesmo jeito. A ausência de
sinal não é aprovação; é ausência de sinal. Lá o que previa era outra coisa, e
está no mesmo lugar: os tipos declaravam um `onSelect`, e retorno de escolha é a
assinatura de um controle, não de uma medição.

**Como usar**: ao ler a fonte, olhe os tipos ANTES da anatomia. Um booleano de
estado, ou uma união com uma palavra a menos que `RunStatus`/`ToolCallState`,
manda aplicar os três testes com atenção — não decide sozinho, mas prevê.

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
