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
| `ComputerStep` — verbo, alvo, ponto na tela | tela do computador. O único tipo daqui que carrega GEOMETRIA; ver a nona correção da 5.3 |

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

### 5.1 Já desenhado — vira story ou composição, folha nova nenhuma (49)

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
| `guardrail-notice` | `alert` na variante `warning` — o escudo âmbar entra na coluna que `:has(> svg)` abre, o título é `.nds-alert-title`, a explicação é o `<p>` de `.nds-alert-description`, que a fonte também desenha sempre — mais `.nds-badge` no encaixe `.nds-alert-action`, que o alerta já encosta no fim da linha do cabeçalho com `:has()`, para a etiqueta da política; e as alternativas são `follow-up-suggestions`, que a própria fonte chama de "próximos pedidos sugeridos" e que esta tabela já resolveu em lista de `button` / `pill.css`. Irmã de `error-state` na origem, e a diferença que a fonte reivindica contra ele é a variante. Veio da família 2 — ver 5.3 |
| `subagent-list` | `.nds-item-group` de `job-progress` — uma linha por trabalhador. `.nds-item` `.nds-item-outline` dá a superfície de cada cartão; dentro dela `job-progress` leva o nome (`.nds-job-progress-label`), a PALAVRA do estado e a barra do sistema com nome acessível; `.nds-item-actions` leva o modelo em `.nds-badge` com `.nds-font-mono`. A lista é plana na fonte, e o agregado dela é ENTRADA, não leitura. Veio da família 2 — ver 5.3 |
| `agent-handoff` | `.nds-stack` com três partes: a linha da passagem é `.nds-cluster[data-spacing="xs"]` de dois `.nds-badge` com a seta do lucide entre eles, decorativa, e a relação em `.nds-sr-only`; a palavra do estado é `agent-status`, que traz `RunStatus` inteiro no lugar do booleano da fonte; o motivo é a descrição de `.nds-item`, e o que foi levado junto é `.nds-item-group` de linhas com `.nds-font-mono` e `.nds-truncate`. Veio da família 2 — ver 5.3 |
| `edit-message` | `composer` com `value` — o texto de antes chega pela mesma prop por onde um rascunho volta ao campo — mais `railStart` para o controle de cancelar e uma frase a mais em `.nds-composer-hint`, que é a DESCRIÇÃO do campo e por isso chega antes da tecla de envio, e não depois. A bolha em repouso é a mensagem do `chat-thread` com o controle de editar em `actions` (`.nds-chat-message-actions`), como `message-actions` acima nesta tabela; trocar uma forma pela outra é montagem de quem consome. Quantas réplicas o envio descarta é dado de produto (§7) e entra na frase como `{max}` já entra. Pede **uma opção** `railEnd?: HTMLElement[]` no trilho do `composer`, onde `.nds-composer-rail-end` já é a fila — nem classe nova, nem folha nova. Veio da família 1 — ver 5.3 |
| `mobile-composer` | `composer` com `submitOn: 'modifier'` — o modo do toque, que o docblock do campo já nomeia — e `rows: 1`, mais `railStart` para anexar e para `composer-voice`, que ESCREVE por quem fala em vez de desenhar um microfone parado; e a fileira de atalhos acima é `follow-up-suggestions`, que esta tabela já resolveu em lista de `button` / `pill.css`. A linha que a fonte troca por "return to send" é `.nds-composer-hint`, que já diz qual tecla envia em CADA modo — e no toque a tecla certa não é essa. O que muda no telefone é AMBIENTE, e esta família já respondeu ambiente uma vez com consulta de mídia dentro do bloco que existe (`@media (hover: none)` no `chat-thread`): alvo de toque maior é `min-inline-size`/`min-block-size` no trilho sob `@media (pointer: coarse)`, e a área segura é de quem ENCOSTA a barra no fim da tela — `chat-panel`, nesta mesma tabela —, porque `.nds-composer` não tem `position` nenhum. **Falta uma utilitária, e está nomeada**: nada em `docs/shared/styles/` declara `env(safe-area-inset-bottom)`. Veio da família 1 — ver 5.3 |
| `document-reference` | `.nds-item` `.nds-item-outline` como cartão, e dentro dele duas partes que já existem. O cabeçalho é `.nds-item-media` `.nds-item-media-icon` com o ícone lucide de arquivo, `.nds-item-title` com o nome do documento e `.nds-item-description` com a medida ("N páginas · M citadas"), que é ENTRADA e não leitura — a própria fonte diz que o total de páginas não é conferido contra as âncoras. As citações são `.nds-item-group` de `<button class="nds-item">`: o lugar dentro da fonte em `.nds-badge` com `.nds-font-mono`, o trecho em `<q>` — as aspas vêm do navegador, como na citação em linha —, e a corrente marcada por `aria-current`, que é PALAVRA e não só fundo. O documento é um `ChatSource` escrito UMA vez e cada linha é uma `Citation` que o compartilha: é a decisão do docblock de `Citation` desenhada, não uma peça. **Faltam duas utilitárias, e estão nomeadas**: `.nds-item-media-icon` não tem a variante com o quadrado tingido que `.nds-empty-media-icon` já declara em `empty.css`, e `.nds-item` não tem regra para `[aria-current]`, que `.nds-pagination-link` já tem para `[aria-current="page"]`. Veio da família 3 — ver 5.3 |
| `background-inbox` | `.nds-card` com `.nds-item-group` de `agent-status` — uma linha por execução. `.nds-card-header` leva o título e a contagem em `.nds-badge` com `.nds-font-mono` dentro de `.nds-card-action`, o mesmo encaixe do distintivo de versão; `.nds-card-content` recebe a lista, e cada `.nds-item` `.nds-item-outline` `data-size="sm"` leva o título em `.nds-item-title`, que já corta em uma linha, o resumo em `.nds-item-description` e, em `.nds-item-actions`, o `agent-status` inteiro — a PALAVRA do estado, o relógio já escrito e a ação que muda com ele, que são as três partes do eixo da família. Sem execução nenhuma, `empty.css`. A contagem do cabeçalho é conta sobre `RunStatus`, do tamanho de `isRunFinished`, e a casa dela é `chat-protocol.ts` no dia em que uma peça precisar dela — agregado que é leitura rende função, não desenho. Veio da família 2 — ver 5.3 |
| `logos` | **fora** — marca registrada. Vira espaço para `HTMLElement` |

### 5.2 As sete famílias novas (71)

Construir **por família**, não por slug. Dentro de uma família as peças dividem
geometria, estados, tokens e — o que mais importa — a folha. Construir slug a
slug produz 83 folhas e nenhum sistema.

| Família | Folha | Peças | O eixo comum |
|---|---|---|---|
| **1. Composer** | `composer.css` | `composer`, `composer-attachments`, `composer-context`, `composer-model-picker`, `composer-trigger-popover` (absorve `composer-mentions` e `composer-slash-commands` — ver 5.3), `composer-voice`, `quote`, `draft-restore`, `message-queue` (11 no catálogo — `edit-message` e `mobile-composer` saíram para a 5.1, ver 5.3 —, **9 componentes**, e a família está FECHADA) | Uma superfície de entrada com um trilho de controles. Tudo pende de `textarea` + `popover` ancorado ao cursor. Primitivo: `composer-trigger.ts` |
| **2. Execução do agente** | `agent-run.css` | `agent-status` (absorve `stopped-run`, que é `RunStatus` `stopped` — ver 5.3), `thinking-indicator`, `agent-plan` (absorve `todo-list` — mesmo desenho, mesmos estados, mesmo vocabulário), `job-progress`, `tool-group` (absorve `tool-error`, que é `ToolCallState` `failed`), `terminal-block`, `computer-use`, `connection-state`, `schedule-card`, `checkpoint-history`, `elicitation-form`, `approval-card` (absorve `permission-grant` — mesma API, ver 5.3) (16 no catálogo — `agent-card`, `tool-timeline`, `code-runner`, `guardrail-notice`, `subagent-list`, `agent-handoff` e `background-inbox` saíram para a 5.1, ver 5.3 —, **12 componentes** até aqui) | Todas respondem "o que está acontecendo, há quanto tempo, e o que eu posso fazer a respeito". Estados de `RunStatus` e `ToolCallState`; base em `collapsible`, `progress`, `badge` |
| **3. Evidência e procedência** | `evidencia.css` | `inline-citation`, `retrieval-chunks`, `confidence-marker`, `web-search`, `research-report`, `memory-chips`, `speaker-identity`, `mcp-server-panel` (8 no catálogo — `document-reference` saiu para a 5.1, ver 5.3 —, **8 componentes**) | Em que a resposta se apoia. Todas carregam `Citation`. Base em `hover-card`, `popover`, `badge` |
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

**VERIFICADO nas duas, e não desdobra**: `subagent-list` foi triada na décima
primeira correção e `agent-handoff` na décima segunda, que é a última verificação
prevista aqui. Na primeira a identidade de agente é `{ name, model }` — duas
cadeias de texto, sem estado e sem desenho próprio —, e o modelo cai onde esta
correção já o havia posto, em `.nds-font-mono`. Na segunda ela é `from` e `to`:
duas cadeias soltas, sem sequer um campo ao lado. O que muda de aparência lá não
é a identidade, é a PASSAGEM. Com as duas cláusulas respondidas, `agent-card`
fica na 5.1.

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

**VERIFICADO, e não desdobra**: `computer-use` foi construída na nona
correção. A sequência dela é desenhada no espaço de coordenadas da TELA, e não
numa lista — não há trilho, não há carimbo e não há estado por passo. Uma lista
vertical de passos continua sendo `tool-group` aberto.

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

**VERIFICADO, e não desdobra**: `computer-use` foi construída na nona
correção, e não tem botão nenhum, nem estado por passo, nem saída. O que ela
acrescenta é ESPAÇO, e não execução.

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

**Nona correção, e a primeira que NÃO mexe em contagem nenhuma**:
`computer-use` SOBREVIVE à triagem. Sobreviver também é correção, e é ela que
fecha as três reversibilidades que apontavam para cá.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia: uma
moldura de navegador com pontos de janela e endereço; um quadro com a tela por
baixo, o rastro e o cursor por cima; e um rodapé com verbo, alvo e "n de total",
que só existe quando há passo. Os tipos são `ComputerUse { url, steps,
activeIndex: number, children, className }` e `ComputerStep { id, action, target,
x, y }`, com o rastro sendo as duas marcas anteriores mais a ativa, e
`activeIndex` preso ao alcance. A metade de runtime é uma ferramenta `computer`
que quem consome define, agrupada por `MessagePrimitive.GroupedParts` — nada
disso porta (§1), e nada disso é preciso: a forma standalone é um componente
controlado de cinco props.

**O sinal do booleano NÃO apareceu**, e a ausência dele informa. Não há booleano
e não há união de estado nenhuma: o passo não carrega estado, e o que existe é
um índice. As três entradas que colapsaram ACHATARAM um vocabulário que já
existia; esta não disputa com ele — acrescenta um eixo que ele nunca teve.

Os três testes, e o primeiro é POSITIVO, o primeiro em quatro leituras:

- **Desenho, SIM.** Montada com o que existe, a tela deixa buraco — e o buraco
  não é uma classe, é um SISTEMA DE COORDENADAS. As irmãs desta folha desenham
  listas e linhas, em que a posição de cada item é consequência da ordem; aqui a
  posição é DADO, e nada no design system põe dado em coordenada sobre uma
  superfície que ele não conhece. O que compõe, compõe mesmo: a legenda é
  aglomerado de palavras, e a barra de endereço é `.nds-font-mono` com
  `.nds-truncate`. O que não compõe é a marca sobre a tela.

  E a FONTE DIZ ISSO DELA MESMA, ao contrário do que a quinta e a sétima
  correções leram nas suas. Lá a origem declarava as próprias partes como
  superfícies compartilhadas (`paper`, `field`, `mono`; `codeScroll`/`codeSurface`,
  com a observação de que reapontá-las "restila todo outro elemento que rola
  saída"). Aqui ela declara o contrário: os pontos de janela e a cor do cursor
  são classes utilitárias literais *no próprio elemento*, e restilá-los exige
  editar as cadeias de classe do componente. Origem que não tem superfície
  compartilhada para oferecer é origem que desenhou algo próprio.
- **Estado, não** — e desta vez isso não decide nada, porque o critério é uma
  DISJUNÇÃO: basta um dos três. O passo não tem estado, e o estado da sessão é
  `RunStatus`, que já tem dono nesta folha. Vale registrar o que a peça faz com
  ele: recebe as cinco palavras e pergunta UMA coisa — ainda corre? —, que
  decide `aria-busy` e se a marca ativa pulsa. Isso não é o achatamento que esta
  seção condena: aquele critério é sobre a ENTRADA, e o que ele condena é a
  informação se perder ali. Aqui ela entra inteira, vinda do mesmo `RunStatus`
  que alimenta o estado da execução logo acima na tela; um booleano na
  assinatura obrigaria quem consome a traduzir cinco palavras em duas no ponto
  da chamada, que é exatamente onde a perda aconteceria.
- **Vocabulário, SIM.** `ComputerStep` tem `action` e `target`, que rimam com o
  nome e o detalhe de `ChatToolCall` — mas tem `x` e `y`, e esses não têm par em
  nada que o vocabulário descreva. É a diferença para `TimelineStat`, que era
  vocabulário de verdade e mesmo assim não entrou: aquele tinha OUTRA CASA
  (`diff-hunks.ts`, na família 4), e um ponto numa tela não tem — ele só existe
  onde há tela. Vai para `chat-protocol.ts` pelo precedente de `PlanStep` e
  `JobCount`: o critério daquele arquivo nunca foi "é conversa", é ser a origem
  única do que cinco stacks reescreveriam.

E o teste da família, que é o quarto: ela responde ao eixo, e responde "o que
está acontecendo" da maneira mais literal que a família tem — mostrando. Não
tem duração e não tem ação, como `tool-timeline` não tinha; a diferença é que
aquela respondia com o desenho que outra peça já tinha, e esta responde com um
que ninguém tem.

**O que a §1 tira dela NÃO a esvazia**, e é aqui que ela se separa de
`agent-card`. A captura de tela vira ESPAÇO — `screen: HTMLElement`, como o
logotipo de modelo virou —, porque tela de sistema real traz marca registrada e
conteúdo de terceiro. Mas no `agent-card` o logotipo era o que a peça tinha de
mais próprio, e sem ele sobrava composição; aqui a imagem nunca foi o desenho:
o desenho é o que vai EM VOLTA e POR CIMA dela. Tirar a captura tira o
conteúdo, não a peça. Escrito na folha como decisão, e não herdado: o texto
alternativo é de quem passa o elemento, VAZIO quando a legenda ao lado já diz o
que está acontecendo — descrever a tela de outro produto ou repete a legenda ou
narra o que não é desta peça —, e obrigatório quando a tela carrega o que a
legenda não diz.

**As três reversibilidades que apontavam para cá, respondidas:**

- **`code-runner` (sétima) CONFIRMA, não desdobra.** A condição era execução com
  controle PRÓPRIO: um botão preso ao trecho, um estado que `RunStatus` não
  modele, vocabulário de execução que `code-block` e `terminal-block` não deem.
  `computer-use` não tem botão nenhum, não tem estado por passo, não tem linha
  de saída nem código de saída. O que ela acrescenta é ESPAÇO — onde na tela —,
  e não EXECUÇÃO — o que rodou e como terminou. São eixos diferentes, e é por
  isso que uma sobrevive sem levar a outra junto: a superfície nova desta peça
  não é uma superfície de execução.
- **`tool-timeline` (sexta) CONFIRMA.** A condição era sequência de passos com
  trilho de verdade, carimbo que chegue como DADO, ou estado por passo que
  `ToolCallState` não modele. Nenhum dos três aparece: não há carimbo, não há
  estado, e a sequência daqui é desenhada no espaço de coordenadas da TELA, não
  numa lista. Uma lista vertical de passos continua sendo `tool-group` aberto.
- **`agent-card` (quinta) e `permission-grant` (quarta) não são tocadas**: nada
  aqui é identidade de agente nem pergunta com consequência.

Contagens: nada muda. A 5.1 fica onde a oitava correção a deixou, em **42**,
e a 5.2 em **78**; a família 2 continua com **16 componentes**. Somam 120.
(Números desta correção, não os de hoje: a décima os moveu — ver adiante.)

**Décima correção, e a quinta que atravessa de 5.2 para 5.1**: `guardrail-notice`
é `alert` `warning` + `follow-up-suggestions` — e as duas contagens mudam junto,
78 → 77 e 42 → 43. É a primeira em que a peça se parte entre duas entradas que
JÁ ESTÃO na 5.1, e não entre uma da 5.1 e um primitivo.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia: `title`,
`explanation`, `policy`, `alternatives: readonly string[]` e
`onPick: (alternative: string) => void`. Cinco entradas, quatro delas cadeia de
texto. A anatomia é uma linha de cabeçalho com escudo, título e etiqueta da
política; um parágrafo de explicação, SEMPRE desenhado; e um terceiro bloco com
o rótulo "tente em vez disso" e um botão por alternativa, **omitido inteiro**
quando a lista vem vazia — "the notice then ends after the explanation
paragraph", diz a fonte, e é ela mesma quem marca a costura.

**A EXECUÇÃO JÁ TERMINOU**, e é essa medida que decide todo o resto. A metade de
runtime da fonte não detecta nada acontecendo: ela lê o estado FINAL da mensagem
— `type === "incomplete"` com `reason === "content-filter"` — e o `onPick`
"envia o texto como uma nova mensagem de quem pergunta e começa uma execução com
ela, igual ao que aconteceria se a pessoa tivesse digitado e enviado". Nada está
pendurado esperando resposta. Quem lê pode ignorar o aviso inteiro, escrever
outra coisa, e o produto fica exatamente no estado em que estava.

**A primeira pergunta da triagem tem, então, resposta na fonte: é AVISO, não é
pergunta.** Uma pergunta espera pela resposta; esta não espera por nada. É
justamente o contrário do cartão de autorização, cuja região viva existe porque
"sem ele, NADA MAIS ACONTECE" — um impasse dos dois lados, com a máquina parada.
Aqui não há impasse: escolher uma alternativa não desbloqueia turno nenhum,
ABRE um turno novo. E `onPick` devolvendo a cadeia escolhida não é o evento da
escolha do cartão, que diz qual controle respondeu à pergunta que estava de pé;
é o texto do próximo pedido.

A segunda pergunta — o que resta de próprio depois da §7 — tem resposta na fonte
também, e escrita: título, explicação e alternativas "is content your app
supplies; the runtime only tells you that the stop happened". O que a barreira
bloqueou, se dá para insistir, o que a alternativa oferece em troca: tudo
política de produto, tudo do lado de fora pela §7. E a `policy` é o caso mais
literal de todos — é uma cadeia de produto (`"content-filter"`, `"policy"`)
mostrada como etiqueta curta. Tirada a política e tirado o runtime, sobra uma
caixa de atenção com ícone, título, parágrafo, etiqueta e uma fileira de botões.

Os três testes, todos negativos:

- **Desenho, não.** Montado inteiro, o aviso não deixa buraco — e a fonte mesma
  já diz de que ele é feito, como a quinta e a sétima correções leram nas suas:
  a raiz é "a superfície `paper` compartilhada", e o tom âmbar do escudo e o
  `mono` da etiqueta "vêm os dois de `surfaces.tsx`". Superfície compartilhada
  declarada na origem — o oposto exato do que a nona correção leu em
  `computer-use`, que declarava classe utilitária literal no próprio elemento.

  As duas metades já estão desenhadas aqui. A caixa é `.nds-alert` na variante
  `nds-alert-warning`, e o âmbar não é semelhança: a variante existe, é a cor de
  atenção do sistema, e a fonte separa a si mesma de `error-state` exatamente
  por ser parada de política e não erro de transporte — enquanto `error-state`,
  que já está nesta tabela, é o mesmo alerta na variante destrutiva. **A
  diferença que a fonte reivindica contra a irmã é um argumento do que já
  existe**, que é o critério desta seção, palavra por palavra. `:has(> svg)`
  abre a coluna do escudo e o pinta com a cor da variante; `.nds-alert-title`
  leva o título — em `--foreground`, porque a folha já mediu que 14px semibold
  em cor semântica reprova os 4.5:1; `.nds-alert-description` leva a explicação
  em `<p>` de margem zerada, e é uma grade feita para empilhar os filhos com
  afastamento constante, então o rótulo e a fileira de botões entram nela sem
  regra nova. A etiqueta da política é `.nds-badge` dentro de
  `.nds-alert-action`, que o alerta já posiciona no fim da linha do cabeçalho
  com `:has()` — o MESMO encaixe que a quinta correção leu em `.nds-card-action`
  para o distintivo de versão. As alternativas são `follow-up-suggestions`, que
  não é peça a inventar: é entrada do catálogo já resolvida nesta tabela em
  lista de `button` / `pill.css`, e a fonte chama as suas de "próximos pedidos
  sugeridos", que é a definição daquela. Nenhuma classe nova, nenhuma nomeada
  como faltando.

  Um traço da fonte a composição não reproduz, e por decisão já escrita: ela
  desenha os botões A PARTIR das cadeias, e ainda os desenha quando não há
  `onPick`, inertes. A §2 dá o espaço em vez do controle — `HTMLElement[]`,
  como o cartão de autorização e a conversa —, e botão que não faz nada é
  parada de tabulação sem destino, que é a mesma decisão 3 do bloco de terminal
  ("caixa vazia com parada de tabulação dentro é dar foco a lugar nenhum"). A
  composição não herda o defeito da fonte.
- **Estado, não** — e aqui o sinal ficou MUDO pela terceira vez. Não há booleano
  de estado, não há união encolhida, não há máquina de estados nenhuma: a peça
  não RECEBE estado. O único estado da fonte está na mensagem, não no
  componente, e é a união de encerramento (`cancelled`, `length`, `error`,
  `other`, `content-filter`) que a §1 já deixa do lado de fora com o resto do
  runtime — "standalone você decide quando mostrar", diz a fonte.

  E pela terceira vez o que informa é PARA ONDE a ausência leva. No
  `reasoning-effort` ela expunha um `onSelect`, que é assinatura de controle e
  tinha dono; no `computer-use` ela expunha um PONTO, que era eixo que este
  vocabulário nunca teve. Aqui ela expõe um `onPick` que devolve a cadeia
  escolhida para virar a próxima mensagem — assinatura de sugestão de
  continuação, e o dono dela é `follow-up-suggestions`, na 5.1. Mesma forma do
  `reasoning-effort`: a ausência de estado descobriu uma chamada de volta cujo
  dono já existe.
- **Vocabulário, não.** Nenhum tipo novo, e a fonte nem declara um: são quatro
  cadeias soltas e um arranjo de cadeias. `alternatives: readonly string[]` é a
  mesma forma e a mesma regra de `TerminalBlockOptions.lines`, que a sétima
  correção já leu — arranjo de cadeias, e quem fatia é quem consome. `policy`
  não é vocabulário nem por engano: é dado de produto, e a §7 o entrega a quem
  monta, como a oitava correção fez com a tabela de faixas de esforço. É a
  distância inteira para `computer-use`, que sobreviveu por ter `x` e `y` sem
  par em lugar nenhum.

E o teste da família, que é o quarto — e este é o mais forte dos quatro, porque
é NEGATIVO: **ela não responde ao eixo.** As demais dizem o que está
acontecendo, há quanto tempo, e o que fazer a respeito. Aqui não está
acontecendo nada — a execução terminou —, não há duração nenhuma, e o que se
oferece não age sobre o que aconteceu: começa outra coisa. `tool-timeline` e
`computer-use` também não tinham duração, mas as duas eram sobre uma execução em
CURSO; esta é sobre uma que parou.

Vale a comparação que a quinta correção montou e que aqui se fecha do outro
lado. `approval-card` também não tem máquina de estados e mesmo assim ficou na
família: ele é o OUTRO LADO de `ToolCallState` `pending`, e é essa amarra que o
segura — há uma chamada de pé, esperando. `agent-card` saiu por não ter amarra
nenhuma. Esta não tem amarra nenhuma **pelo motivo oposto ao dele**: lá nada
tinha começado, aqui tudo já acabou. Nos dois extremos do eixo, o que sobra não
é peça desta família.

Some a isso o que a §1 tira, como tirou de `agent-card`: a metade que dá nome à
entrada — reconhecer a parada de política pelo `reason` da mensagem — é runtime,
não porta, e a §2 é literal a respeito. Um aviso que soubesse RECONHECER a
barreira traria de volta exatamente o runtime que esta família existe para não
ter.

**Reversível**, como as outras oito: se ao construir `elicitation-form` ou
`checkpoint-history` aparecer recusa com desenho, estado ou vocabulário próprios
— uma parada que chegue como DADO em vez de decisão de quem monta, um estado de
recusa que `RunStatus` não modele, alternativa que seja resposta a uma pergunta
de pé em vez de próximo pedido —, `guardrail-notice` desdobra de volta para a
5.2, com o motivo. E há um segundo gatilho, deste lado: se `follow-up-suggestions`
pedir desenho próprio ao ser montada, a metade das alternativas vira variante
DELA — e continua não sendo peça da 2.

Contagens, somadas família a família: 1 tem 13, 2 tem 19, 3 tem 9, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 3 — **77** na 5.2. A 5.1 vai a **43** (40 linhas, e duas
delas carregam duas entradas). Somam 120. A família 2 fica com **15
componentes**.

**Décima primeira correção, e a sexta que atravessa de 5.2 para 5.1**:
`subagent-list` é `.nds-item-group` de `job-progress` — e as duas contagens
mudam junto, 77 → 76 e 43 → 44. É a primeira em que a entrada colapsa numa peça
da PRÓPRIA família 2, já construída, repetida numa lista.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`agents: readonly SubagentItem[]`, `completedCount: number`,
`progress: readonly number[]`, `showSummary: boolean`, `summaryAgent:
SubagentItem` — e `SubagentItem` é `{ name, model }`. Chamada de volta, NENHUMA:
é a primeira entrada triada que não devolve nada a quem monta. A anatomia é uma
pilha de cartões, um por trabalhador, cada um com ícone de concluído ou roda, o
nome, o modelo e uma barra; mais um cartão de síntese no fim quando
`showSummary`. A metade de runtime junta várias chamadas de despacho de um mesmo
turno numa lista só — não porta (§1) —, e a forma standalone, que é a única que
se lê, já é um componente controlado.

**O SINAL MAIS BARATO DISPAROU, e mais alto que nas três da tabela.** Ali o
achatamento era um booleano ou uma união com uma palavra a menos; aqui o estado
por trabalhador nem chega a ser um campo: é `i < completedCount`, uma POSIÇÃO no
arranjo. Duas palavras onde `RunStatus` tem cinco, e as três que se perdem são
`idle`, `stopped` e `failed` — quem ainda não começou desenha igual a quem corre,
e quem quebrou desenha igual aos dois. A própria fonte escreve a amarra que o
achatamento cria: termine-os em ordem "para que os vistos caiam nos cartões
certos". Trabalhador que fecha em segundo não tem como ser desenhado concluído.
E a faixa de runtime dela achata de novo, do outro lado: das quatro palavras do
estado da chamada ela lê só a de concluído, e joga "requer ação" e "incompleto"
no mesmo balde do que ainda corre — que é exatamente onde moram parado e falhou.

Antes dos três testes, as duas perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **Hierarquia é desenho próprio? NÃO HÁ HIERARQUIA.** A raiz é uma caixa, os
  cartões são irmãos dentro dela, e o de síntese é mais um irmão no fim. Nenhum
  aninhamento, nenhum vínculo de quem chamou quem — quem despachou foi o turno,
  e o turno está por fora da peça. Fosse árvore, seria estrutura que lista plana
  não tem, e aí valeria discutir desenho próprio; é lista plana, e lista plana é
  o que `.nds-item-group` já é.
- **O agregado é vocabulário próprio? ELE NEM É DESENHADO.** `completedCount` é
  ENTRADA — decide qual cartão leva visto —, e não leitura: não há "3 de 5
  terminaram" em parte nenhuma da anatomia. E se houvesse, contar quantos de um
  `RunStatus[]` acabaram é conta sobre o vocabulário, do mesmo tamanho de
  `isRunFinished`, `canWithdraw` e `isStepFinished`, e a casa dela seria
  `chat-protocol.ts`. Conta não é peça — e esta entrada nem conta é.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a pilha não deixa buraco — e a fonte mesma
  já diz de que ela é feita, pela quarta vez nesta seção: cada cartão usa "a
  superfície `paper` compartilhada" e o token `mono` no rótulo do modelo, e
  reapontá-los em `surfaces.tsx` "restila todos os cartões daqui junto com todo
  outro elemento construído sobre eles". Superfície compartilhada declarada na
  origem — a mesma leitura da quinta, da sétima e da décima correções, e o
  oposto exato do que a nona leu em `computer-use`.

  A composição é a lista: `.nds-item-group` empilha, como já empilhava as linhas
  de habilidade na quinta correção; cada `.nds-item` `.nds-item-outline`
  `data-size="sm"` é a superfície de um cartão; `.nds-item-content` recebe um
  `job-progress` inteiro, que traz as três partes que importam — o nome em
  `.nds-job-progress-label`, a PALAVRA do estado em `.nds-job-progress-status` e
  a barra do design system com `role="progressbar"` e o nome do trabalhador como
  nome acessível —; e `.nds-item-actions` recebe o modelo em `.nds-badge` com
  `.nds-font-mono`, que é onde a quinta correção já havia posto o modelo de um
  agente. O cartão de síntese é mais uma linha da mesma forma. Nenhuma classe
  nova, nenhuma nomeada como faltando.

  Dois traços a composição não reproduz, os dois por decisão já escrita. O ícone
  de visto ou roda em cada cartão é codificação icônica de estado, e a decisão 2
  do andamento de trabalho longo já trocou isso pela PALAVRA (WCAG 1.4.1) — pelo
  mesmo motivo pelo qual a sexta correção recusou o ícone que repetia o verbo ao
  lado. E a altura mínima da raiz, que a fonte põe para a tela não pular quando
  o cartão de síntese aparece, guarda espaço para uma linha que quem monta pode
  não passar: a aparição é animação (`13-animacao.md`), e reservar altura para
  uma ausência é desenhar o que não está lá.

  Onde fonte e composição DISCORDAM, a composição está mais fina, como na
  oitava correção. O `progress[i]` da fonte é porcentagem sem denominador, e ela
  mesma admite por quê: com runtime, o estado da chamada "só distingue correndo
  de concluído", então a barra vale 0 ou 100 e uma porcentagem viva "precisa do
  seu próprio canal". Aqui o número chega como `JobCount` — quantas de quantas
  —, e quando não se sabe de quantas `jobProgressValue` devolve a barra
  indeterminada em vez de um zero que se lê como "acabou de começar". Onde só há
  porcentagem, ela é `{ done, total: 100 }`, e a conta ao lado é decorativa por
  decisão 3 daquele bloco.
- **Estado, não.** É o parágrafo do sinal, e ele decide sozinho: dois estados
  posicionais contra os cinco de `RunStatus`, com `idle`, `stopped` e `failed`
  perdidos. Vale medir o tamanho da perda contra a irmã em que a peça colapsa:
  `job-progress` existe justamente porque parado oferece retomar e falhado
  oferece tentar de novo, e um despacho de trabalhadores paralelos é das coisas
  mais interrompíveis desta família — a mesma frase que a sétima correção
  escreveu sobre `code-runner`, e pela mesma razão. `showSummary: boolean` não
  salva o caso: não é estado, é visibilidade, e a fonte reconhece o preço num
  parágrafo próprio — "esta versão não tem como marcar a própria síntese como
  concluída, só mostrá-la ou escondê-la". A composição não tem esse limite,
  porque a linha de síntese é uma linha como as outras e carrega as cinco
  palavras.
- **Vocabulário, não.** `SubagentItem { name, model }` são duas cadeias de
  texto: `name` é `JobProgressOptions.label`, mesmo sentido e mesmo papel de nome
  acessível da barra; `model` é dado de produto, e a quinta correção já julgou o
  modelo de um agente como `.nds-font-mono`, depois de a §1 tirar dali a única
  coisa que teria desenho próprio — a marca. `progress: readonly number[]`
  alinhado por índice com `agents` é a mesma forma e a mesma regra de
  `TerminalBlockOptions.lines` e das alternativas do aviso: arranjo de valores
  soltos, e quem fatia é quem consome. `completedCount` não é vocabulário, é a
  codificação posicional que `RunStatus` por linha substitui exatamente. É a
  distância inteira para `computer-use`, que sobreviveu por ter `x` e `y` sem par
  em lugar nenhum.

E o teste da família, que é o quarto: **ela responde ao eixo, e responde com a
peça desta folha que já o responde.** Diz o que está acontecendo — por
trabalhador, e com cinco palavras em vez de duas; não diz há quanto tempo, como
`tool-timeline` e `computer-use` também não diziam; e não oferece ação nenhuma,
porque não tem chamada de volta nenhuma, ao passo que `job-progress` já oferece
parar, retomar e tentar de novo. É a mesma leitura da sexta e da sétima
correções, e a diferença para `agent-card` continua sendo esta: `subagent-list`
não sai por não pertencer à família, sai por já estar construída dentro dela —
uma vez, e a lista é a repetição.

E há um traço a mais, que é da lista e não da peça: **repetir não é desenhar.**
Uma peça existir no plural não a torna uma segunda peça; se torna, `agent-plan`
teria uma irmã chamada "lista de passos". O que faria uma lista virar desenho é
o que a lista acrescenta sobre os itens — aninhamento, agregado lido, ordenação
que muda o sentido —, e nenhum dos três está aqui.

**Reversível**, como as outras nove: se ao construir `agent-handoff`,
`background-inbox` ou `checkpoint-history` aparecer trabalho paralelo com desenho,
estado ou vocabulário próprios — aninhamento de verdade, dizendo quem despachou
quem; um estado por trabalhador que `RunStatus` não modele; ou um agregado que
seja LEITURA em vez de entrada —, `subagent-list` desdobra de volta para a 5.2,
com o motivo. E há um segundo gatilho, deste lado: se `job-progress` precisar de
desenho próprio para viver em lista — e não só do `.nds-item-group` que já
empilha —, a lista vira variante DELE, e continua não sendo peça.

Contagens, somadas família a família: 1 tem 13, 2 tem 18, 3 tem 9, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 3 — **76** na 5.2. A 5.1 vai a **44** (42 linhas, e duas
delas carregam duas entradas). Somam 120. A família 2 fica com **14
componentes**, e as sete somam 70. (A décima correção escreveu "40 linhas" ao
chegar a 43; eram 41. O total estava certo, a contagem de linhas não — e é o
tipo de erro que só aparece quando alguém soma de novo, que é por isso que esta
seção manda somar família a família. Números desta correção, não os de hoje: a
décima segunda os moveu — ver adiante.)

**Décima segunda correção, e a sétima que atravessa de 5.2 para 5.1**:
`agent-handoff` é `.nds-cluster` de `.nds-badge` + `agent-status` + `.nds-item`
— e as duas contagens mudam junto, 76 → 75 e 44 → 45. É a segunda das duas
verificações que a quinta correção marcou, e com ela aquela cláusula fecha.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia: `from`,
`to`, `reason`, `carried: readonly string[]` e `settled: boolean`. Cinco
entradas — três cadeias de texto, um arranjo de cadeias e um booleano. Chamada
de volta, NENHUMA: é a segunda entrada triada que não devolve nada a quem monta,
depois da lista de trabalhadores. E é a primeira sem metade de runtime alguma —
a fonte documenta só a forma standalone e diz dela que é apresentacional de
ponta a ponta, que quem monta decide quando a passagem acontece e fornece todos
os campos. A anatomia é uma linha com a etiqueta de quem tinha o controle, uma
seta e a etiqueta de quem passa a ter; um parágrafo com o motivo; e um terceiro
bloco com uma linha por item levado, **omitido inteiro** quando o arranjo vem
vazio — passe um arranjo vazio "para não desenhar seção nenhuma", diz a fonte, e
é a mesma costura que a décima leu no aviso.

**O SINAL MAIS BARATO DISPAROU pela quinta vez, e desta vez o achatamento não
tem PALAVRA do outro lado.** Contando desenhos DISTINTOS em vez de campos
declarados, que é como a décima primeira mandou contar, `settled` sabe fazer
dois: em trânsito, com a seta e a etiqueta de destino tingidas; assentado, com a
etiqueta de origem esmaecida, a seta neutra e o destino em etiqueta cheia. Dois
contra os cinco de `RunStatus`, e os três que se perdem são `idle` — a passagem
anunciada e ainda não começada —, `stopped` — a passagem cancelada, com o
controle voltando — e `failed` — o destino que não assumiu. É pior que nas
outras quatro por um motivo que se mede: lá o estado achatado ao menos ia parar
numa palavra, e aqui os dois desenhos se distinguem **só por cor e opacidade**,
que é exatamente o que a regra 4 da §8 proíbe (WCAG 1.4.1) e o que a decisão 2
do estado da execução, nesta mesma folha, já trocou pela palavra. A própria
fonte escreve o preço numa linha: `settled` "só controla estilo".

Antes dos três testes, as duas perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **É EVENTO ou é PEÇA? É evento, e a fonte o diz na primeira linha:** a
  passagem "marca o MOMENTO em que o controle passa de um agente para outro".
  Momento não tem duração, não tem ação e não tem estado que ande sozinho — e é
  por isso que esta entrada não tem relógio, não tem chamada de volta e não tem
  máquina de estados, enquanto as irmãs da família têm as três. Onde o momento é
  desenhado é §7, e quem monta o põe no fio: o `chat-thread` já desenha o papel
  `system` como "um aviso no meio do fluxo, não uma fala", centralizado, sem
  retrato e sem bolha. Vale ser exato sobre o alcance disso — o conteúdo daquela
  mensagem é Markdown, então ela não HOSPEDA a linha de etiquetas; o que ela dá
  é o LUGAR, e lugar não é desenho. A composição é um bloco irmão, posto no fio
  por quem monta.
- **A transição tem desenho próprio? A seta é ORDEM, não coordenada.** Duas
  etiquetas com um glifo entre elas é o que o `.nds-cluster` já descreve na
  própria documentação — "toolbars, tags, breadcrumbs, grupos de botões" — e o
  que o `breadcrumb` já desenha item a item. Aqui está a distância inteira para
  `computer-use`, que sobreviveu na nona correção: lá a posição era DADO num
  espaço contínuo que nada no design system conhece; aqui a direção é a ordem de
  dois vizinhos, que a posição no arranjo já dá. É a mesma medida da sexta
  correção — "o único eixo temporal da peça é a ORDEM DO ARRANJO" — e a mesma
  resposta. E se houvesse estado da própria passagem, pedido e aceito e recusado,
  aí sim haveria o que medir contra o vocabulário; não há: há `settled`.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a passagem não deixa buraco — e a fonte
  mesma já diz de que ela é feita, pela quinta vez nesta seção: a etiqueta de
  origem "usa sempre a superfície `field` compartilhada", a de destino passa à
  mesma superfície depois de assentar, e o rótulo do que foi levado usa o token
  `mono`. Superfície compartilhada declarada na origem — a mesma leitura da
  quinta, da sétima, da décima e da décima primeira correções, e o oposto exato
  do que a nona leu em `computer-use`.

  A composição são três partes empilhadas em `.nds-stack[data-spacing="sm"]`,
  que é a raiz que a oitava correção já leu para uma pilha e nada mais. A linha
  da passagem é `.nds-cluster[data-spacing="xs"]` com `.nds-badge` de cada lado
  e o ícone do lucide entre eles, `aria-hidden`, com a relação em `.nds-sr-only`
  — seta é glifo, e glifo não chega a quem ouve (regra 7 da §8, WCAG 1.1.1). A
  palavra do estado é `agent-status` inteiro, que já traz `RunStatus`, o ponto
  decorativo, o relógio já escrito quando há um, e a ação que muda com o estado.
  O motivo é `.nds-item-description` sob `.nds-item-title`, porque título mais
  uma linha de explicação É a linha de item — a mesma leitura que a quinta
  correção fez de `AgentSkill`. E o que foi levado junto é `.nds-item-group` de
  `.nds-item` `data-size="sm"`, com `.nds-font-mono` e `.nds-truncate` no
  identificador técnico, que é onde a quinta e a décima primeira correções já
  puseram cadeia técnica de agente. Nenhuma classe nova, nenhuma nomeada como
  faltando.

  Dois traços a composição não reproduz, os dois por decisão já escrita. A
  transição de meio segundo entre os dois desenhos é animação
  (`13-animacao.md`), e a 5.1 já leu revelação como animação em
  `streaming-text`, `loading-state` e `number-ticker`. E a distinção por cor e
  opacidade é a codificação que a regra 4 da §8 troca pela palavra — a
  composição não herda o defeito da fonte, e desta vez o defeito é de
  acessibilidade, não de fineza.
- **Estado, não.** É o parágrafo do sinal, e ele decide sozinho: dois desenhos
  contra os cinco de `RunStatus`, com `idle`, `stopped` e `failed` perdidos.
  Vale medir o tamanho da perda contra a irmã em que a peça colapsa: o estado da
  execução existe justamente porque parado oferece continuar e falhado oferece
  tentar de novo, e uma passagem de controle é das coisas mais interrompíveis
  desta família — quem entrega pode desistir, e quem recebe pode recusar. A
  fonte não desenha nem uma nem outra. É a mesma frase que a sétima correção
  escreveu sobre `code-runner` e a décima primeira sobre a lista de
  trabalhadores, e pela mesma razão.
- **Vocabulário, não.** Nenhum tipo novo, e a fonte nem declara um — são quatro
  cadeias soltas, um arranjo de cadeias e um booleano, que é a mesma forma que a
  décima leu no aviso. `from` e `to` são o nome de um agente em cadeia de texto,
  e a quinta correção já julgou identidade de agente depois de a §1 tirar dali a
  única coisa que teria desenho próprio, a marca; a décima primeira repetiu o
  julgamento com `{ name, model }`. `reason` é a descrição de `.nds-item`.
  `carried: readonly string[]` é a mesma forma e a mesma regra de
  `TerminalBlockOptions.lines`, das alternativas do aviso e do arranjo de
  progresso da lista: arranjo de cadeias, e quem fatia é quem consome. `settled`
  não é vocabulário, é `RunStatus` achatado. É a distância inteira para
  `computer-use`, que sobreviveu por ter `x` e `y` sem par em lugar nenhum.

E o teste da família, que é o quarto: **ela responde a um terço do eixo, e
responde com a peça desta folha que já o responde inteiro.** Diz o que está
acontecendo — o controle mudou de mãos —, e é isso que o estado da execução diz,
com cinco palavras em vez de dois estilos; não diz há quanto tempo, como
`tool-timeline`, `computer-use` e `subagent-list` também não diziam; e não
oferece ação nenhuma, porque não tem chamada de volta nenhuma, ao passo que o
estado da execução já oferece parar, continuar e tentar de novo. É a mesma
leitura da sexta, da sétima e da décima primeira, e a diferença para
`agent-card` continua sendo esta: `agent-handoff` não sai por não pertencer à
família, sai por já estar construída dentro dela.

E vale o traço que a décima primeira nomeou, porque aqui ele aparece no
singular: **repetir não é desenhar, e emparelhar também não.** Duas etiquetas
lado a lado não são uma segunda peça de identidade; se fossem, o estado da
ligação teria uma irmã chamada "par de ligações". O que faria um par virar
desenho é o que o par acrescenta sobre os itens — um vínculo que a ordem não
descreva, um estado da relação que os itens não tenham —, e nenhum dos dois está
aqui: a relação é a ordem, e o estado é da execução.

**As reversibilidades que apontavam para cá, respondidas:**

- **`agent-card` (quinta) CONFIRMA, e a cláusula dele fecha.** A condição era
  identidade de agente com desenho, estado ou vocabulário próprios. Aqui a
  identidade são duas cadeias soltas, sem campo ao lado, sem estado e sem
  desenho além da etiqueta — menos ainda do que os `{ name, model }` da décima
  primeira. O que muda de aparência não é a identidade, é a passagem, e o que
  ela muda é cor e opacidade. As duas verificações previstas confirmaram, e
  `agent-card` fica na 5.1.
- **`subagent-list` (décima primeira) CONFIRMA.** A condição era trabalho
  paralelo com aninhamento de verdade, estado por trabalhador que `RunStatus`
  não modele, ou agregado que seja LEITURA. Não há trabalho paralelo nenhum
  nesta: a passagem é sequencial e tem exatamente dois lados, um que larga e um
  que pega. Nem aninhamento, nem agregado, nem estado por lado.
- **`permission-grant` (quarta) e `guardrail-notice` (décima) não são
  tocadas**: nada aqui é pergunta com consequência nem recusa de política.

**Reversível**, como as outras onze: se ao construir `background-inbox` ou
`checkpoint-history` aparecer troca de controle com desenho, estado ou
vocabulário próprios — uma passagem que chegue com estado que `RunStatus` não
modele, um encadeamento de mais de dois lados que a ordem do arranjo não
descreva, ou o que foi levado chegando como VOCABULÁRIO em vez de cadeia solta
—, `agent-handoff` desdobra de volta para a 5.2, com o motivo. E há um segundo
gatilho, deste lado: se `agent-status` precisar de desenho próprio para dizer
que o estado é de uma PASSAGEM e não de uma execução, a linha das etiquetas vira
variante DELE — e continua não sendo peça.

Contagens, somadas família a família: 1 tem 13, 2 tem 17, 3 tem 9, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 3 — **75** na 5.2. A 5.1 vai a **45** (43 linhas contadas
no arquivo, e duas delas carregam duas entradas). Somam 120. A família 2 fica
com **13 componentes**, e as sete somam 69.

**Décima terceira correção, e a segunda em que a peça SOBREVIVE**:
`inline-citation` abre a família 3 e não colapsa. **Nenhuma contagem muda** — a
5.1 fica em **45**, a 5.2 em **75**, a família 3 nos seus **9**. Somando as
sete: 11 + 13 + 9 + 20 + 5 + 8 + 3 = **69 componentes**; 45 + 75 = **120
entradas**. (Números desta correção, não os de hoje: a décima quarta os moveu —
ver adiante.)

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`Source { domain, title, snippet }` e `InlineCitation { sources, openIndex:
number | null, onOpenIndexChange, className }`. A anatomia é um **parágrafo
FIXO** com dois pontos de ancoragem, e a fonte diz por que: o runtime "não tem
ligação posicional entre uma marca e um deslocamento dentro do texto em
streaming". Então ela entrega um espécime e manda editar a frase no arquivo
instalado — "the paragraph text is written directly into the source, not passed
as a prop".

**O SINAL FICOU MUDO PELA QUARTA VEZ**, e desta vez a sub-regra do sinal mudo
não decide: a assinatura que sobrou é `onOpenIndexChange`, que é ABERTURA — o
par que a §2 exige de toda peça desta família ("se tem `open`, tem
`onOpenChange`"). É a diferença para `onSelect` e `onPick`: aqueles eram a
assinatura de UM tipo de peça e por isso apontavam um dono; este a família
inteira tem, e ele não aponta ninguém. Quem decidiu foram os três testes.

Duas perguntas tinham de ser respondidas antes de qualquer desenho, porque o DS
já tem `hover-card`, `popover`, `badge` e `tooltip` — **isto é mais do que um
cartão de ponteiro com título e link?**

1. **Ela vive DENTRO de texto corrido**, e isso é geometria própria: assentar na
   linha de base sem esticar a entrelinha, não se separar da palavra anterior na
   quebra de linha, e ainda assim oferecer 24 px de alvo de toque. As três
   exigências brigam entre si, e é exatamente onde a regra 10 da §8 diz que esta
   família mais escorrega.
2. **Toque não tem `hover`.** Uma citação que só abrisse ao ponteiro é invisível
   em telefone, e a regra 3 da §8 é literal a respeito.

Os três testes, e o primeiro é POSITIVO — o segundo em treze leituras:

- **Desenho, SIM.** Montada com o que existe, a marca deixa buraco, e o buraco
  não é uma classe: é a GEOMETRIA DE UM ELEMENTO QUE INTERROMPE UM PARÁGRAFO.
  As irmãs desta base desenham caixas, onde a altura é livre porque não há linha
  de texto em volta; aqui a altura da marca é limitada pela caixa de linha do
  parágrafo, e o alvo de toque tem de crescer FORA do fluxo para não esticar a
  entrelinha em toda linha que cite alguma coisa. Nada no design system põe uma
  parada de toque de 24 px dentro de uma linha de 20 px sem mexer no parágrafo.

  E o comportamento diverge no mesmo lugar. O cartão de ponteiro desta base abre
  por `mouseenter` **e por `focus`**, com 600 ms, e nasce `role="dialog"` — papel
  que exige nome acessível, que ele tira do texto do gatilho. Com um gatilho cujo
  texto é "1", o resultado é um diálogo chamado "1". Percorrer com Tab uma frase
  de cinco citações abriria cinco painéis, um por parada. A peça abre por
  CLIQUE — o caminho que serve a toque, teclado e ponteiro de uma vez —, é um
  botão com `aria-expanded`, e não abre por foco.

  O que COMPÕE, compõe mesmo, e está escrito na folha: a caixa É
  `.nds-popover-content`, que é a superfície flutuante compartilhada — e a fonte
  declara a dela do mesmo jeito ("a marca e a prévia leem a superfície
  `floating` compartilhada"), que foi o sinal lido na quinta, na sétima e na
  décima correções. A diferença é que lá a origem declarava compartilhado
  TAMBÉM o que a peça tinha de próprio, e aqui ela não tem o que oferecer para a
  marca dentro da frase: a fonte não menciona superfície nenhuma para ela, porque
  no React ela é uma cadeia de classes literal no elemento.
- **Estado, não.** Não há máquina de estados: o que existe é disclosure, que a §2
  já autoriza a ser interno e a §2 já obriga a ser controlável.
- **Vocabulário, não — e aqui a ausência é a NOTÍCIA.** `Citation` e `ChatSource`
  descrevem a entrada inteira, e descrevem MELHOR. `Source { domain, title,
  snippet }` guarda o trecho DENTRO da fonte, que é o defeito que o docblock de
  `Citation` já tinha nomeado ao fundar a família: a mesma fonte apoia
  afirmações diferentes com trechos diferentes, e o documento apareceria três
  vezes na lista de fontes de um turno. E `domain` é o endereço achatado em
  cadeia de exibição — perde o `url`, que é o que faz uma procedência ser
  verificável. **Caber no vocabulário sem sobra é sinal de que a fundação está
  certa, e não de que a peça colapsa**: `approval-card` também não tem
  vocabulário próprio e ficou.

E o teste da família, que é o quarto: ela responde ao eixo — em que a resposta
se apoia — do jeito mais direto que a família tem, apontando a fonte de UMA
afirmação em vez das fontes de um turno.

**O QUE A PEÇA CORRIGE NA FONTE**, e as duas correções são parte da entrega:

- **A peça é a MARCA, e não o parágrafo.** Um componente cujo texto mora no
  arquivo instalado não é componente, é espécime — e o design system não pode
  ficar dono do texto da resposta, que é do modelo e é desenhado pelo Markdown ou
  pela conversa. Vale aqui a §4.2 palavra por palavra: peça que se encaixa é peça
  autônoma, e a marca faz sentido montada sozinha dentro de qualquer frase. A
  numeração, que na fonte é a posição no arranjo, passa a chegar de fora, porque
  é CONTEÚDO — é ela que liga a frase à lista de fontes — e porque marcas irmãs
  podem nem estar no mesmo parágrafo.
- **`openIndex: number | null` vira `open`/`onOpenChange` por marca.** Um índice
  único é a conveniência de um espécime que só sabe ancorar duas marcas — a
  própria fonte diz que índices além de 0 e 1 "não têm onde se prender" —, e ele
  não endereça marca que não seja posição de arranjo. Exclusão mútua é decisão de
  quem monta a página, e a §2 já a entrega a ele; a story de composição mostra as
  quatro linhas que isso custa.

**Reversível**, como as outras doze: se ao construir `document-reference` ou
`retrieval-chunks` a marca dentro do texto aparecer sem geometria própria — uma
prévia que caiba num cartão de ponteiro, sem alvo de toque em conflito com a
entrelinha, e sem o caminho de abertura por clique —, `inline-citation` colapsa
para a 5.1, com o motivo.

**Décima quarta correção, e a oitava que atravessa de 5.2 para 5.1**:
`edit-message` é `composer` com `value` + `chat-thread` com `actions` — e as duas
contagens mudam junto, 75 → 74 e 45 → 46. É a primeira que sai da família 1, e a
primeira em que a entrada colapsa na peça que DÁ NOME à família.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia: `value:
string`, `discardedReplies: number`, `editing: boolean`, `onValueChange`,
`onSave`, `onCancel`, `onStartEdit` e `className`. Oito entradas, quatro delas
chamadas de volta, e nenhum tipo declarado. A anatomia são duas formas no mesmo
lugar: em repouso, a bolha enviada dentro de um `<button>`; editando, um
`<textarea>`, uma linha dizendo quantas réplicas o envio descarta — **omitida
inteira** quando o número é zero, que é a mesma costura que a décima leu no aviso
e a décima segunda na passagem — e uma fileira com Cancelar e Enviar.

**O QUE A FONTE CHAMA DE DESCARTE NÃO DESCARTA NADA**, e é essa medida que decide
todo o resto. Ela mesma escreve: com runtime, enviar a edição acrescenta a
reescrita como IRMÃ da original sob o mesmo pai, a original e tudo abaixo dela
continuam na história da thread, alcançáveis pelo seletor de ramo, e "nada é de
fato descartado, só deixa de ser o ramo que está mostrado". O número não é
consequência que a peça conheça: é contagem que quem monta faz sobre a própria
transcrição, e a fonte manda fazê-la assim — passe "a contagem que corresponda ao
que o SEU aplicativo de fato faz com um reenvio; alguns realmente apagam". A §7 é
literal a respeito, e esta entrada está listada lá: o que acontece com as
réplicas é política de produto, e o desenho para antes disso.

Antes dos três testes, as duas perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **O que a edição ACRESCENTA ao campo? Três argumentos, e nenhum é desenho.** O
  texto de antes é `value` — e não por analogia: o docblock do campo já escreveu
  que `setValue` "é por aqui que um rascunho volta", porque `draft-restore`, na
  mesma família, existe para devolver texto ao campo. Cancelar é um controle no
  trilho, que é o espaço que a §4.2 fixou e que o campo já expõe. E o aviso é uma
  frase a mais na dica. Trocar a bolha pela moldura é MONTAGEM, e a §2 já a
  entrega a quem consome — o componente desenha o que recebe, e `draft-restore`
  já escreveu que tirar a peça da tela depois da resposta é de quem monta.

  Vale o traço que a décima primeira nomeou, porque aqui ele aparece na forma
  mais barata de todas: **pré-carregar não é desenhar.** Um campo que abre com
  texto dentro é `value`, e se isso bastasse para criar peça, cada origem de
  texto que cai no campo teria a sua — o rascunho recuperado, a mensagem retirada
  da fila, o comando escolhido no seletor.

- **O que sobra de próprio depois da §7? A frase do aviso — e a frase tem dono.**
  Tirada a política, sobra uma linha de texto que diz o que o botão de enviar vai
  fazer. Isso é exatamente o que a decisão 2 da folha desta família define como
  dica: "`Enter envia` é comportamento, e quem não vê a tela precisa saber disso
  ANTES de apertar Enter — por isso ela entra em `aria-describedby`". "Enviar
  descarta duas respostas" é a mesma classe de informação, no mesmo momento, para
  a mesma tecla. E o número entra nela como `{max}` já entra:
  `.nds-composer-hint` é a única linha desta família que já recebe um número de
  fora e o costura numa frase estática.

  A cláusula inversa, que era a que podia salvar a peça, também não salva: se o
  produto quiser um aviso mais alto que uma linha de dica, `alert` na variante
  `warning` já o cobre, e a décima correção já mediu esse encaixe inteiro para
  `guardrail-notice` — escudo por `:has(> svg)`, título em `.nds-alert-title`,
  explicação em `.nds-alert-description`. `approval-card` NÃO cobre, e é bom
  dizer por quê: ele é uma pergunta com a máquina parada dos dois lados, "sem
  ele, NADA MAIS ACONTECE". Aqui nada está de pé — quem edita já está editando, e
  pode fechar o campo e seguir. Nos dois caminhos a resposta é peça que já
  existe.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a edição não deixa buraco — e a fonte mesma
  já diz de que ela é feita, pela sexta vez nesta seção, e desta vez na forma
  mais forte: a superfície `field` de `surfaces.tsx` "é a única superfície que
  qualquer um dos dois estados usa". Não é uma parte declarada compartilhada, são
  TODAS. É a leitura da quinta, da sétima, da décima, da décima primeira e da
  décima segunda correções, e o oposto exato do que a nona leu em `computer-use`.
  E a coincidência de nome não é coincidência: a moldura daqui chama-se
  `.nds-composer-field`, e a folha já escreveu que ela é do CONJUNTO e não do
  campo — moldura, fundo e anel de foco no `:focus-within`, que é o que a fonte
  desenha nos dois estados.

  As duas formas já estão desenhadas aqui. A moldura editando é `createComposer`
  inteiro: `.nds-composer-field` com o `<textarea>` sem borda própria,
  `.nds-composer-rail` com começo e fim, `.nds-composer-counter` quando há teto, e
  `.nds-composer-hint` embaixo. `rows` já é contagem de linha, então o campo
  cresce com a fonte do navegador e não tem altura fixa — a regra 1 da §9
  atendida pela peça que já a atende. A bolha em repouso é a mensagem do
  `chat-thread` com o controle de editar em `actions`, que é o encaixe
  `.nds-chat-message-actions` — e `message-actions` já está nesta mesma tabela,
  resolvido nele. Nenhuma classe nova, nenhuma nomeada como faltando.

  Há UM buraco, e ele é de OPÇÃO, não de classe, como o da sétima correção:
  `createComposer` monta o fim do trilho por dentro, com o contador e o envio, e
  só o começo recebe controle de fora. Cancelar cabe hoje em `railStart`, e a
  composição monta assim sem mudança nenhuma; reproduzir a adjacência da fonte —
  os dois controles juntos no fim — pede uma opção `railEnd?: HTMLElement[]`,
  onde `.nds-composer-rail-end` já é a fila, já tem o espaçamento e já encosta à
  direita com `margin-inline-start: auto`. É o mesmo contrato de espaço que a §2
  fixou para a família, na mesma forma que o `actions?: HTMLElement[]` que a
  sétima correção nomeou para o `code-block`. É o que a 5.1 manda nomear, e está
  nomeado lá.

  Um traço da fonte a composição não reproduz, e por decisão já escrita: a bolha
  inteira dentro de um `<button>`. Nome acessível é o nome, não o conteúdo (regra
  7 da §8), e um botão cujo nome é o texto da mensagem muda de nome a cada
  mensagem; pior, mensagem tem ligação e trecho selecionável dentro, e controle
  aninhado em controle não tem como ser alcançado por teclado. A própria fonte
  não faz isso na sua faixa de runtime, onde o gatilho é um botão de ícone com
  nome acessível DENTRO da bolha — que é o encaixe de `actions`. A composição
  segue a metade da fonte que está certa.

  E onde fonte e composição DISCORDAM, a composição está mais fina, como na
  oitava e na décima primeira: lá o aviso é um `<div>` solto entre o campo e os
  botões, que quem lê por audição só encontra se sair do campo e varrer a tela;
  aqui ele é a descrição do campo, e chega no foco — antes da tecla, que é o
  momento em que ele serve para alguma coisa.

- **Estado, não** — e aqui o sinal ficou MUDO pela quinta vez. `editing: boolean`
  é o único booleano da fonte e não achata vocabulário nenhum: não há palavra de
  conversa para "editando", nem em `RunStatus` nem em `ToolCallState`. É
  disclosure — duas formas no mesmo lugar —, que a §2 autoriza a ser interno e
  obriga a ser controlável, e é a mesma leitura que a décima terceira fez em
  `inline-citation`. A tabela do sinal não ganha linha. `discardedReplies` também
  não é estado: é um número que chega escrito numa frase, como `{max}` chega na
  dica.

  E pela quinta vez o que informa é PARA ONDE a ausência leva — só que desta vez
  ela leva a DOIS lugares, e é a primeira entrada em que a sub-regra fala pela
  metade. `onStartEdit` e `onCancel` são o par de abrir e fechar que a §2 exige
  de TODA peça desta família, e por isso não apontam dono nenhum: é o limite que
  a décima terceira mediu em `onOpenIndexChange`. Mas `onValueChange` e `onSave`
  apontam um, e apontam o mais específico que houve até aqui — são `onInput` e
  `onSubmit` de `ComposerOptions`, mesmo nome, mesmo sentido e mesma regra de que
  limpar o campo é de quem consome. Assinatura de campo de texto é assinatura de
  UM tipo de peça, e o dono dela já está construído, nesta família. Onde sobra
  mais de uma chamada de volta, leia cada uma: as que a família inteira tem ficam
  caladas, e basta UMA que nomeie dono.

- **Vocabulário, não.** Nenhum tipo novo, e a fonte nem declara um — são duas
  cadeias de texto contando `className`, um número, um booleano e quatro chamadas
  de volta, que é a forma mais rala das treze leituras. `value` é
  `ComposerOptions.value`, mesmo nome e mesmo sentido. `discardedReplies` é dado
  de produto, e a §7 o entrega a quem monta, como a oitava correção fez com a
  tabela de faixas de esforço e a décima com a etiqueta de política — e este é o
  caso mais explícito dos três, porque a fonte escreve com todas as letras que a
  contagem depende do que o aplicativo faz. `editing` é disclosure. É a distância
  inteira para `computer-use`, que sobreviveu por ter `x` e `y` sem par em lugar
  nenhum; aqui todo campo tem par, e quase todos têm par na mesma folha.

E o teste da família, que é o quarto: **ela responde ao eixo, e responde com a
peça que É o eixo.** O eixo da 1 é uma superfície de entrada com um trilho de
controles, e tudo pende de `textarea`; esta entrada é essa superfície, com texto
dentro. É a mesma leitura da sexta, da sétima, da décima primeira e da décima
segunda, e a diferença para `agent-card` continua sendo esta: `edit-message` não
sai por não pertencer à família, sai por já estar construída dentro dela — só que
desta vez não numa irmã, e sim na peça de que a família tomou o nome.

**Reversível**, como as outras treze: se ao construir `mobile-composer` — a última
que falta na família — aparecer edição com desenho, estado ou vocabulário
próprios — uma moldura que só exista para editar, um estado da edição que a troca
de forma não modele, ou o descarte chegando como VOCABULÁRIO em vez de número de
produto —, `edit-message` desdobra de volta para a 5.2, com o motivo. E há um
segundo gatilho, deste lado: se o campo precisar de desenho próprio para dizer
que está reescrevendo um turno em vez de escrever um novo — e não só do `value`,
do `railStart` e da dica —, a edição vira variante DELE, e continua não sendo
peça.

Contagens, somadas família a família: 1 tem 12, 2 tem 17, 3 tem 9, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 3 — **74** na 5.2. A 5.1 vai a **46** (44 linhas contadas
no arquivo, e duas delas carregam duas entradas). Somam 120. A família 1 fica com
**10 componentes**, e as sete somam 68. (Números desta correção, não os de hoje:
a décima quinta os moveu — ver adiante.)

**Décima quinta correção, e a nona que atravessa de 5.2 para 5.1**:
`mobile-composer` é o `composer` respondendo ao espaço que tem — e as duas
contagens mudam junto, 74 → 73 e 46 → 47. É a segunda a sair da família 1, e com
ela **a família 1 fecha**: era a última entrada que faltava, e a triagem a
dissolveu em vez de construí-la.

O que a fonte descreve, lida crua e pelos TIPOS antes da anatomia: `value:
string`, `keyboardOpen: boolean`, `running: boolean`, `actions: readonly
string[]`, `onAction`, `onAttach`, `onValueChange`, `onSend`, `onStop`,
`onFocus` e `className`. Onze entradas, CINCO delas chamadas de volta — mais que
em qualquer das catorze leituras anteriores — e, como nas três últimas, nenhum
tipo declarado. A anatomia é uma raiz com três filhos: a fileira de atalhos,
retirada inteira quando o teclado está de pé; uma linha com anexar, campo e
enviar; e, no fim, ou um puxador decorativo ou a frase "return to send", nunca
os dois.

**O TELEFONE NÃO É UM DESENHO, É UM AMBIENTE — e a fonte entrega o ambiente de
fora.** É essa medida que decide todo o resto. O único campo que faz desta peça
uma peça de telefone é `keyboardOpen`, e a fonte escreve que ele "tem de vir de
fora, tipicamente do foco e do desfoque do campo ou de um ouvinte de
`visualViewport`, porque nenhum estado de runtime acompanha se um teclado de
tela está de pé". O componente não sabe do teclado: ele recebe um booleano que
quem monta calculou. E o que esse booleano comuta são três coisas, todas com
dono — montar ou não a fileira de atalhos, que a §2 já entrega a quem consome;
trocar um respiro embaixo, que é área segura de quem encosta a barra no fim da
tela; e trocar um puxador decorativo pela frase da dica, que é a dica.

Antes dos três testes, as três perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **O campo já responde ao espaço que tem? JÁ, e está medido.** `.nds-composer`
  é `flex` em coluna com `width: 100%` — não há largura em pixel, não há
  `min-inline-size` de moldura, então a barra é do tamanho do que a hospeda. O
  campo não tem altura fixa: o piso é `rows`, que é contagem de LINHA e por isso
  acompanha a fonte do navegador (WCAG 1.4.4), e o teto é `40vh`, que é a tela e
  não um número. E a tecla certa do toque já existe e já é nominal:
  `submitOn: 'modifier'`, cujo docblock foi escrito exatamente sobre este caso —
  "no teclado virtual o Enter é a tecla de quebrar linha, e um composer que envia
  ali manda mensagem pela metade a cada tentativa de fazer parágrafo". A fonte
  vai para o outro lado e escreve "return to send"; ela PODE, porque o campo dela
  é de uma linha só e ali o Enter não quebra nada. É a mesma troca, vista dos
  dois lados — e a nossa é a que preserva o parágrafo.

- **O que muda no telefone é DESENHO ou é AMBIENTE? É ambiente, e esta família
  já respondeu ambiente uma vez, com uma REGRA no bloco que existe.** O
  precedente está construído e é do primeiro membro: `chat-thread.css` resolve
  "sem ponteiro não existe hover" com `@media (hover: none)` dentro do próprio
  bloco das ações da mensagem, e não com uma segunda peça chamada "mensagem de
  telefone". Alvo de toque maior é a mesma forma: `min-inline-size` e
  `min-block-size` maiores no trilho sob `@media (pointer: coarse)`, na regra que
  a decisão 5 da folha já escreveu para os 24 px da WCAG 2.5.8. Uma peça separada
  para isso duplicaria a moldura, o campo, a dica e o contador — quatro coisas —
  para trocar duas medidas.

  Uma utilitária falta de verdade, e por isso está NOMEADA na 5.1 em vez de
  desenhada: nada em `docs/shared/styles/` declara `env(safe-area-inset-bottom)`.
  Mas ela não é do composer, e a razão é mecânica: `.nds-composer` não declara
  `position` nenhum, nunca esteve preso ao fim da tela, e quem o encosta lá é
  `chat-panel`, que esta mesma tabela já resolveu. Respiro contra o indicador de
  início é de quem DOCA, como o teclado é de quem OUVE o `visualViewport`.

- **E o inverso — a fonte mostra algo que o campo não sabe fazer?** Medido antes
  de decidir, porque era o caminho que salvaria a peça, e os três candidatos
  falham: **gaveta que sobe, não há** — a raiz não tem `position`, nem
  transformação, nem animação, nem estado de aberta e fechada; o "bottom sheet"
  está na frase de abertura da fonte, não na anatomia dela. **Barra presa ao
  teclado, não há** — a própria fonte tira o teclado do componente e o entrega a
  um ouvinte de quem monta, que é o oposto de prender-se a ele. **Trilho que
  vira menu, não há** — o trilho são dois botões ladeando o campo, e a fileira de
  atalhos é um bloco irmão acima, que é `follow-up-suggestions`.

  Sobra UMA diferença geométrica de verdade, e ela tem causa: o trilho da fonte
  fica AO LADO do campo, e o nosso fica embaixo. Ela vem da mesma frase em que a
  fonte se explica — "o elemento standalone desenha um `<input>` de uma linha; a
  composição com runtime desenha um `<textarea>` que cresce, **que é a mesma
  troca que todo composer do catálogo faz**". A linha horizontal é consequência
  de um campo de uma linha, e não desenho próprio: com o campo de uma linha, os
  controles cabem ao lado; com um campo que cresce, eles ficariam presos ao lado
  de uma caixa que sobe. Recusada a troca — e ela é recusada em toda a família,
  pela fonte inclusive —, a linha horizontal deixa de ter motivo. E a fonte
  declara a troca como sendo de TODO composer do catálogo, não desta entrada:
  diferença que a origem atribui à categoria inteira não distingue um membro
  dela.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a barra de telefone não deixa buraco de
  desenho — e a fonte mesma já diz de que ela é feita, pela sétima vez nesta
  seção e desta vez sobre TODAS as partes de uma vez: "anexar, campo e as
  superfícies dos atalhos leem todos o token `field` compartilhado, e o botão de
  enviar lê `inkButton`, de modo que reapontar esses dois cobre a barra
  inteira".
  Duas superfícies compartilhadas cobrindo a barra inteira, declaradas na origem
  — é a leitura da quinta, da sétima, da décima, da décima primeira, da décima
  segunda e da décima quarta correções, e o oposto exato do que a nona leu em
  `computer-use`. Some-se que os atalhos são, na faixa de runtime,
  `ThreadPrimitive.Suggestion`, que a fonte declara ser "o mesmo primitivo que o
  balão de lançamento usa para os seus pedidos iniciais" — e o balão de
  lançamento já está na 5.1. É a primeira vez que a origem declara uma parte
  compartilhada com OUTRA ENTRADA do catálogo, e não só com a folha de
  superfícies.

  A composição está inteira: `.nds-composer-field` com o `<textarea>` sem borda
  própria e o anel no `:focus-within`, `.nds-composer-rail` com começo e fim,
  `.nds-composer-hint` embaixo, e `railStart` levando anexar e o ditado.
  `follow-up-suggestions` é a fileira acima, e quem a monta ou não é quem
  consome — que é o que `keyboardOpen` faz na fonte. Nenhuma classe nova.

  Três traços a composição não reproduz, os três por decisão já escrita. O
  **puxador** é um `<span>` `aria-hidden` de 4 px por 7 rem: desenha a alça de um
  gesto de arrastar que a peça não implementa, e afordância desenhada sem
  destino é a mesma decisão 3 do bloco de terminal ("caixa vazia com parada de
  tabulação dentro é dar foco a lugar nenhum"), um degrau abaixo — aqui nem
  parada de tabulação há, só a promessa. O **microfone** é o traço mais caro de
  todos: a fonte o desenha quando o campo está vazio e escreve, ela mesma, que
  ele é "puramente apresentacional — nada aqui inicia ditado". Nesta família
  existe `composer-voice`, que recebe `VoiceState` — três palavras, `idle`,
  `recording`, `transcribing` — e avisa quando alguém pediu para começar ou
  parar. Trocar uma peça que dita por um ícone que não dita é regressão, não
  porte. E a **troca de forma do botão** por ícone de quadrado é a decisão 3 da
  folha vista de novo: aqui o botão troca de NOME, não só de ícone.

  Onde fonte e composição DISCORDAM, a composição está mais fina, como na
  oitava, na décima primeira e na décima quarta: lá anexar e cada atalho ficam
  desabilitados apenas por a chamada de volta não ter sido passada — e a fonte
  avisa que nenhum deles reage a `running` ou a `value`, "de modo que barrá-los
  durante uma execução é responsabilidade de quem chama". A §2 dá o ESPAÇO em
  vez do controle, e quem põe o elemento no `railStart` põe também o estado
  dele.

- **Estado, não** — e aqui o sinal mais barato disparou pela SEXTA vez, mas com
  o desfecho invertido: `running: boolean` não é achatamento, é IDENTIDADE.
  Todas as cinco vezes anteriores o booleano perdia palavras que o vocabulário
  desta casa tinha; aqui a peça que É o dono desta superfície declara exatamente
  o mesmo booleano, com o mesmo nome — `ComposerElement.setRunning(boolean)`,
  `data-state="idle|running"` — e pelo motivo já escrito: o campo pergunta UMA
  coisa ao estado da execução, dá para enviar ou é hora de interromper, e não
  precisa das outras quatro palavras para responder. Declarar o mesmo booleano
  que o dono declara não é uma peça nova: é a mesma peça.

  `keyboardOpen` também não é estado desta família. Não achata vocabulário
  nenhum — não há palavra de conversa para "teclado de pé" —, e não é disclosure
  como `editing` e `openIndex` eram: é um fato sobre o APARELHO, medido fora e
  passado para dentro. E a §2 o reprova onde ele mais importa: toda peça desta
  família é controlável, quem tem `open` tem `onOpenChange`; esta tem `onFocus`
  para abrir e **nada** para fechar, e a fonte admite o buraco — "fechá-lo de
  novo fica com você, já que o elemento não tem chamada de volta de desfoque".
  Metade de um par que a família exige inteiro.

  E as CINCO chamadas de volta são o parágrafo mais alto que a sub-regra do
  sinal mudo já teve, porque quatro delas nomeiam dono e o dono é o mesmo:
  `onValueChange` é `onInput`, `onSend` é `onSubmit`, `onStop` é `onStop` —
  mesmo nome, mesma letra —, e `onAttach` é o controle que entra pelo
  `railStart` (§4.2). `onAction` devolve a cadeia escolhida para virar a próxima
  mensagem, que é `onPick` do aviso, cujo dono a décima correção já nomeou em
  `follow-up-suggestions`. Sobra `onFocus`, que não é assinatura de peça
  nenhuma: é um evento do DOM do campo.

- **Vocabulário, não.** Nenhum tipo novo, e a fonte nem declara um — são duas
  cadeias, dois booleanos, um arranjo de cadeias e cinco chamadas de volta, a
  mesma forma rala que a décima, a décima segunda e a décima quarta leram.
  `value` é `ComposerOptions.value`. `actions: readonly string[]` é a mesma forma
  e a mesma regra de `TerminalBlockOptions.lines`, das alternativas do aviso, do
  `carried` da passagem e do arranjo de progresso da lista: arranjo de cadeias,
  e quem fatia é quem consome. `keyboardOpen` é ambiente, e ambiente é o que a
  §7 entrega a quem monta, como a política, a tabela de faixas e a contagem de
  réplicas. É a distância inteira para `computer-use`, que sobreviveu por ter `x`
  e `y` sem par em lugar nenhum: aqui não há sequer um campo sem par.

E o teste da família, que é o quarto: **ela responde ao eixo, e responde com a
peça que É o eixo — pela segunda vez, e agora sem nem trocar de conteúdo.** Em
`edit-message` a superfície era a mesma com o texto de antes dentro; aqui é a
mesma com MENOS dentro: sem seletor de gatilho, sem contador, sem fila de
anexos, sem contexto, sem citação. Uma peça que é outra com partes a menos não é
uma segunda peça — e vale o traço que a décima primeira e a décima segunda
nomearam, no terceiro formato em que ele aparece: **repetir não é desenhar,
emparelhar não é desenhar, e ESTREITAR também não.** Se estreitar bastasse, cada
largura de tela teria a sua peça.

**A reversibilidade da décima quarta, respondida:**

- **`edit-message` CONFIRMA, e não desdobra.** A condição era: ao construir
  `mobile-composer`, aparecer edição com desenho, estado ou vocabulário próprios
  — uma moldura que só exista para editar, um estado da edição que a troca de
  forma não modele, ou o descarte chegando como vocabulário. Nenhum dos três
  aparece, e não por pouco: **esta fonte não tem edição nenhuma.** Não há texto
  anterior, não há cancelar, não há aviso de descarte, não há `editing`. O
  `value` daqui é rascunho corrente, não turno reescrito. O segundo gatilho —
  que o campo pedisse desenho próprio para dizer que reescreve um turno — também
  fica mudo pelo mesmo motivo.

  Vale ser exato sobre o MECANISMO, porque a cláusula dizia "ao construir" e
  esta peça não será construída: a verificação se faz pela LEITURA da fonte, e
  ela responde inteira. A cláusula perguntava o que APARECERIA; a resposta é que
  não aparece nada, e não aparece porque a última entrada da família não é sobre
  editar. Ficasse aberta à espera de uma construção que a triagem acabou de
  cancelar, seria pendência eterna por formalidade — e a §5.3 existe para o
  contrário disso.

**Reversível**, como as outras catorze: se ao construir `thread-list-sidebar`
(família 6) ou `voice-conversation` (família 7) — as duas superfícies que
sobraram no catálogo em que o telefone muda algo — aparecer superfície de toque
com desenho, estado ou vocabulário próprios: uma barra que se PRENDA ao teclado
por conta própria, um estado do aparelho que consulta de mídia não alcance, ou
geometria de telefone que não caiba numa regra do bloco que já existe —,
`mobile-composer` desdobra de volta para a 5.2, com o motivo. E há um segundo
gatilho, deste lado: se o `composer` precisar de desenho próprio para o toque —
e não só de `submitOn: 'modifier'`, de `rows`, do `railStart` e de uma consulta
de mídia —, a versão de telefone vira variante DELE, e continua não sendo peça.

Contagens, somadas família a família: 1 tem 11, 2 tem 17, 3 tem 9, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 3 — **73** na 5.2. A 5.1 vai a **47** (45 linhas contadas
no arquivo, e duas delas carregam duas entradas). Somam 120. A família 1 fecha
com **9 componentes**, e as sete somam 67. (Números desta correção,
não os de hoje: a décima sexta os moveu — ver adiante.)

**Décima sexta correção, e a décima que atravessa de 5.2 para 5.1**:
`document-reference` é o `ChatSource` de um turno com as suas `Citation`
listadas — e as duas contagens mudam junto, 73 → 72 e 47 → 48. É a primeira a
sair da família 3, e a primeira que sai de uma família cuja peça de abertura
acabou de SOBREVIVER. As duas leituras são a mesma medida vista dos dois lados,
e por isso esta correção responde a reversibilidade da décima terceira antes de
qualquer outra coisa.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`DocumentReference { title: string, pages: number, anchors: readonly
DocumentAnchor[], activePage: number, onJump?: (page: number) => void,
className }` e `DocumentAnchor { page: number, quote: string }`. Seis entradas,
UMA delas chamada de volta — a menor colheita de chamadas de volta em dezesseis
leituras — e, pela quarta seguida, nenhum tipo de estado declarado. A anatomia é
um cartão com duas partes: um cabeçalho com ícone de arquivo num quadrado
tingido, o nome do documento e uma linha de medida ("N páginas · M citadas");
abaixo, uma fila de botões, um por âncora, com o rótulo da página acima do
trecho citado.

**A CAIXA FORA DA FRASE NÃO TEM GEOMETRIA, e é essa medida que decide todo o
resto.** A frase que fez `inline-citation` sobreviver está escrita na décima
terceira correção e na folha, e ela nomeia OS DOIS lados da linha: "as irmãs
desta base desenham caixas, onde a altura é livre porque não há linha de texto
em volta". `document-reference` é a irmã. Cada uma das suas partes é uma caixa
de altura livre, empilhada, com espaço de sobra em volta — cabeçalho, fila,
linha. Nenhuma das três exigências que brigavam entre si na marca aparece aqui:
não há linha de base para assentar, não há entrelinha para esticar, não há
quebra de linha que possa separar a peça da palavra anterior, e o alvo de toque
de 24 px sai de graça de qualquer linha de lista com respiro. A pergunta da
décima terceira — isto é mais do que um cartão de ponteiro com título e link? —
vira, aqui, isto é mais do que uma linha de lista com título e descrição? E não
é.

**A SEGUNDA MEDIDA É O VOCABULÁRIO, e ele não é só ausente: é ESTREITADO.** As
três entradas da fonte se traduzem uma a uma, e as três perdem no caminho:

- `quote` é `excerpt`, renomeado.
- `page: number` é `anchor?: string` ESTREITADO. A cadeia está no vocabulário
  porque o lugar dentro de uma fonte é página, âncora ou intervalo de linhas —
  um número só sabe ser página. E, pior que o alcance, o número obriga o
  componente a FORMATAR o rótulo ("p. 4"), que é decisão de locale: é exatamente
  o que a família decidiu não fazer quando fixou que valor formatado chega como
  cadeia.
- `title: string` + `pages: number` é `ChatSource` sem o `url`. O endereço não
  está achatado como o `domain` que a décima terceira reprovou em `Source`: ele
  simplesmente NÃO EXISTE. Um cartão de procedência sem endereço é procedência
  que ninguém pode conferir, e a segunda regra da folha desta família — endereço
  de fonte é dado de terceiro, e `isSafeUrl` no ponto em que ele encosta no DOM
  — fica sem objeto.

Montada com o vocabulário certo, a peça é `ChatSource` escrito uma vez e
`Citation[]` que o compartilham. **Caber no vocabulário sem sobra não decide
nada** — foi assim com `approval-card` e com `inline-citation`, e as duas
ficaram. Mas aqui não é caber: é a fonte tendo escrito uma versão mais pobre do
que o vocabulário já tem, e a peça consertada virando o desenho literal da
decisão que o docblock de `Citation` já registrou.

**E a irmã não construída fecha o cerco.** `retrieval-chunks`, da mesma família,
declara `RetrievalChunk { id, source, locator, score, text }` — fonte, lugar,
pontuação e trecho — e desenha exatamente a mesma fila: uma linha por trecho,
com o lugar em monoespaçado e o trecho embaixo. `document-reference` é essa fila
ESTREITADA a uma fonte só e sem a pontuação, com a consulta retirada de cima.
Vale o traço que a décima primeira, a décima segunda e a décima quinta nomearam,
agora nos três formatos de uma vez: **repetir não é desenhar, emparelhar não é
desenhar, e estreitar também não.**

Os três testes, e nenhum passa:

- **Desenho, não.** Cabeçalho é `.nds-item` com `.nds-item-media-icon`,
  `.nds-item-title` e `.nds-item-description`; a fila é `.nds-item-group`; cada
  citação é um `<button class="nds-item">` com o lugar em `.nds-badge`
  `.nds-font-mono` e o trecho em `<q>`. Dois buracos aparecem ao montar, e os
  dois são classe que falta e não folha nova — estão nomeados na linha da 5.1: o
  quadrado tingido atrás do ícone, que `.nds-empty-media-icon` já declara em
  `empty.css` e que `.nds-item-media-icon` não tem; e o fundo da linha corrente,
  que `.nds-pagination-link[aria-current="page"]` já declara e que `.nds-item`
  não tem.
- **Estado, não, e não há sequer disclosure.** A fonte não declara união nenhuma
  e `DocumentAnchor` não carrega estado. O que existe é uma linha CORRENTE, que
  é seleção — o mesmo `aria-current` que `pagination`, `breadcrumb` e a barra
  lateral já usam. Seleção não é máquina de estados, e nenhuma palavra de
  `RunStatus` ou de `ToolCallState` toca esta peça.
- **Vocabulário, não** — pelas três perdas medidas acima.

E o teste da família, que é o quarto: ela responde ao eixo — em que a resposta se
apoia — juntando duas respostas que a família já dá. O documento é a linha da
lista de fontes da conversa; cada citação é o corpo da caixa da marca em linha,
sem o endereço e sem o título, que subiram para o cabeçalho porque são os mesmos
em todas. Agrupar por fonte é a decisão do `Citation` ficando visível, e ela já
governa a folha desde a primeira linha do cabeçalho. **Uma peça cujo desenho é a
decisão da fundação desenhada não é uma peça: é a prova de que a fundação está
certa.**

**A reversibilidade da décima terceira, respondida:**

- **`inline-citation` CONFIRMA, e não desdobra.** A condição era: ao construir
  `document-reference` ou `retrieval-chunks`, a marca dentro do texto aparecer
  sem geometria própria — uma prévia que coubesse num cartão de ponteiro, sem
  alvo de toque em conflito com a entrelinha, e sem o caminho de abertura por
  clique. Nenhuma das três aparece, e o motivo é o oposto do temido: esta fonte
  **não tem marca nenhuma dentro de texto**. Não há parágrafo, não há âncora
  numa frase, não há ponteiro, não há abertura. O que ela tem é um cartão que
  mora ao lado da resposta, e a única coisa que ele empresta da marca é o
  conteúdo da caixa — que é `Citation`, e portanto da fundação, não da peça. A
  décima terceira mediu que a marca tem geometria que as caixas não têm; esta
  mede que as caixas não a têm mesmo, o que é a mesma frase lida do outro lado.

  Vale ser exato sobre o MECANISMO, porque a cláusula dizia "ao construir" e
  esta peça não será construída — mesma situação da décima quarta, e mesma
  resposta: a verificação se faz pela LEITURA da fonte, e ela responde inteira.
  Fica de pé a metade da cláusula que menciona `retrieval-chunks`, que ainda
  será construída.

**Reversível**, como as outras quinze: se ao construir `retrieval-chunks` ou
`research-report` — as duas peças da família 3 que também desenham fila de
trechos — aparecer fila de citações com desenho, estado ou vocabulário próprios:
uma linha que não caiba num `.nds-item` sem regra nova além das duas nomeadas,
um estado por citação que a seleção não modele, ou o lugar dentro da fonte
pedindo tipo que `Citation.anchor` não dê —, `document-reference` desdobra de
volta para a 5.2, com o motivo. E há um segundo gatilho, deste lado: se
`retrieval-chunks` pedir desenho próprio para a fila e a linha dela couber num
`.nds-item`, então quem desenha a fila é ela, e esta linha da 5.1 passa a
apontá-la em vez de apontar `item.css`.

Contagens, somadas família a família: 1 tem 11, 2 tem 17, 3 tem 8, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 3 — **72** na 5.2. A 5.1 vai a **48** (46 linhas contadas
no arquivo, e duas delas carregam duas entradas). Somam 120. A família 3 fica
com **8 componentes**, e as sete somam 66.

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

**Décima sétima correção, e a décima primeira que atravessa de 5.2 para 5.1**:
`background-inbox` é `.nds-card` com `.nds-item-group` de `agent-status` — e as
duas contagens mudam junto, 72 → 71 e 48 → 49. É a segunda que colapsa numa peça
da PRÓPRIA família 2 já construída, repetida numa lista, e a primeira em que a
FONTE declara a entrada como projeção do estado de outra.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`BackgroundRun { id, title, state: "running" | "ready" | "failed", elapsed:
string, summary }`, e no componente `runs: readonly BackgroundRun[]`,
`onCollect: (id: string) => void` e `className`. Três entradas no componente,
cinco campos na linha, UMA chamada de volta. A anatomia é um cabeçalho com uma
contagem e uma pilha de linhas: cada linha é um botão — desabilitado enquanto
corre, clicável em `ready` e em `failed` —, com o título cortado, o `summary`
como segunda linha só quando existe, e o tempo alinhado à direita. A contagem lê
`"{ready} ready"` quando há ao menos uma pronta, e `"{running} in flight"` caso
contrário. Com o arranjo vazio o cabeçalho continua desenhado, com "0 in
flight", e nenhuma linha segue.

**A FONTE CHAMA A PEÇA DE PROJEÇÃO**, e é essa medida que decide todo o resto. A
faixa de runtime dela não descreve subsistema nenhum: a lista de conversas "já
acompanha quais continuam ativas, então a caixa é uma pequena PROJEÇÃO daquele
estado, e não um subsistema à parte". Projeção de uma lista que já existe,
desenhada como uma segunda lista, é o caso que a décima primeira e a décima
quinta correções já nomearam pelos dois lados: **repetir não é desenhar, e
estreitar também não.**

Antes dos três testes, as três perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **É uma LISTA de `agent-status`, ou é outra coisa? É a lista, e campo por
  campo.** O estado da execução já diz em que pé está uma execução — a PALAVRA
  de `RunStatus` —, há quanto tempo — o relógio já escrito, que sai do que é
  lido em voz — e o que fazer a respeito — a ação que muda com o estado. São as
  três partes da linha da fonte, e são as três partes do eixo da família. O que
  sobra da linha é o título e o resumo, que são o título e a descrição de
  `.nds-item`: a mesma leitura que a quinta correção fez de `AgentSkill` e a
  décima segunda do motivo da passagem.
- **O que a caixa ACRESCENTA sobre os itens? Uma contagem, e ela é LEITURA** —
  que é exatamente a cláusula que a décima primeira deixou apontada para cá. A
  resposta está escrita lá, e é a mesma: contar quantas de um `RunStatus[]`
  estão num estado é conta sobre o vocabulário, do tamanho de `isRunFinished`,
  de `hasKnownTotal` e de `jobProgressValue`, e a casa dela é
  `chat-protocol.ts`. **Agregado que é leitura rende uma função, não um
  desenho** — e desenhado ele é um número em `.nds-badge` com `.nds-font-mono`,
  dentro do `.nds-card-action` que a quinta correção já leu para o distintivo de
  versão e a décima para a etiqueta de política. Nenhuma peça construída precisa
  da conta hoje, então nada entra no vocabulário agora; o que fica é a casa,
  nomeada.
- **E as outras três coisas que uma caixa de entrada poderia ter — não-lido,
  agrupamento, ordenação —, mais o ponto de entrada? Nenhuma das quatro está na
  fonte.** Não-lido é `ready`, que é `complete` mais um fato de produto: se quem
  lê já foi buscar. Quem tira a linha da caixa depois de `onCollect` é quem
  monta — a fonte não marca nada, não notifica e não reordena, e a §7 é literal
  a respeito. Agrupamento não há: as linhas são irmãs. Ordenação é ENTRADA — as
  linhas chegam "na ordem" —, a mesma regra de `ToolGroupOptions.calls` que a
  sexta correção já leu. E ponto de entrada não há nenhum: não há gatilho, não
  há painel flutuante e não há distintivo sobre um lançador. **Tirada a
  política, o que sobra é uma lista** — que é o aviso que a §7 dá antes de se
  olhar para esta entrada.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a caixa não deixa buraco — e a fonte mesma
  já diz de que ela é feita, pela oitava vez nesta seção: a raiz "usa a
  superfície `paper` compartilhada", e a contagem do cabeçalho, o resumo de cada
  linha e o tempo decorrido "usam `mono`". Superfície compartilhada declarada na
  origem — a leitura da quinta, da sétima, da décima, da décima primeira, da
  décima segunda, da décima quarta e da décima quinta correções, e o oposto
  exato do que a nona leu em `computer-use`.

  A composição é a caixa mais a lista. `.nds-card` dá a superfície de papel;
  `.nds-card-header` leva o título e a contagem em `.nds-badge` com
  `.nds-font-mono` dentro de `.nds-card-action`, que o cabeçalho já encosta no
  fim da linha com `:has()`. `.nds-card-content` recebe o `.nds-item-group`, que
  empilha como já empilhava os trabalhadores da décima primeira e o que foi
  levado na décima segunda. Cada linha é `.nds-item` `.nds-item-outline`
  `data-size="sm"`: `.nds-item-content` com `.nds-item-title` — que já corta em
  uma linha, e é literalmente o rótulo cortado da fonte — e
  `.nds-item-description` com o resumo, só quando existe; `.nds-item-actions`
  recebe o `agent-status` inteiro, que é onde a décima primeira já pusera a peça
  de estado de cada linha. Sem execução nenhuma, `empty.css`, que esta tabela já
  resolveu em `empty-state`. Nenhuma classe nova, nenhuma nomeada como faltando.

  Um traço a composição não reproduz, e por decisão já escrita: **a linha
  inteira dentro de um `<button>`.** É o mesmo defeito que a décima quarta
  recusou na bolha da mensagem — nome acessível é o nome, não o conteúdo (regra
  7 da §8) —, e aqui ele é pior por um motivo que se mede: a linha carrega o
  relógio, e a regra 9 da §8 tira o relógio do que é lido em voz justamente
  porque ele se reescreve. Um botão cujo nome acessível é o conteúdo da linha põe
  o relógio de volta no nome, e o nome do botão passa a mudar sozinho a cada
  segundo. O controle é `.nds-agent-status-action`, que já é botão, já tem
  rótulo textual dizendo o que faz e já tem o alvo de toque de 24 px (WCAG
  2.5.8).

  Onde fonte e composição DISCORDAM, a composição está mais fina, como na
  oitava, na décima primeira, na décima quarta e na décima quinta — e aqui em
  dois lugares. O primeiro é a linha que corre: a fonte desenha um botão
  desabilitado, e `AgentStatusLabels.action` é `Partial` de propósito, com
  "estado sem entrada não oferece ação" escrito no docblock, então a linha que
  corre simplesmente não oferece o controle em vez de desenhar um que não faz
  nada — a decisão 3 do bloco de terminal, a mesma que a décima leu nas
  alternativas inertes. O segundo é a contagem: ela soma `ready` OU `running`, e
  nunca `failed`, então uma caixa com três execuções quebradas e mais nada lê "0
  in flight". O cabeçalho herda o achatamento da linha, e a composição não herda
  nenhum dos dois.

- **Estado, não.** É o parágrafo do sinal, e ele decide sozinho: **o sinal mais
  barato disparou pela sexta vez como achatamento.** `"running" | "ready" |
  "failed"` são três palavras onde `RunStatus` tem cinco, e `ready` é `complete`
  com outro nome. Perdem-se `idle` e `stopped`, e nenhuma das duas é perda
  pequena aqui. `idle` é a execução enfileirada e ainda não começada, e não há
  na família lugar em que ela apareça mais do que numa caixa de trabalho que
  ficou correndo sozinho; `stopped` é o que a sétima correção chamou de o mais
  literal dos cinco, e trabalho que corre longe de quem o pediu é das coisas
  mais interrompíveis desta família — a mesma frase que a sétima escreveu sobre
  `code-runner`, a décima primeira sobre a lista de trabalhadores e a décima
  segunda sobre a passagem, e pela mesma razão. Vale medir a perda contra a irmã
  em que a peça colapsa: o estado da execução existe justamente porque parado
  oferece continuar e falhado oferece tentar de novo, que são duas ações
  diferentes, e a fonte só sabe abrir.

- **Vocabulário, não.** Nenhum tipo novo que este já não descreva. `id` é
  endereço de linha, e `ChatToolCall.id` e `PlanStep.id` já o declaram com o
  mesmo docblock — atualizar o certo quando dois têm o mesmo texto. `title` é
  `.nds-item-title`. `state` é `RunStatus` achatado. `summary` é
  `.nds-item-description`, como o motivo da passagem e a linha de habilidade.
  `runs: readonly BackgroundRun[]` é arranjo, e quem fatia e ordena é quem
  consome — a mesma forma e a mesma regra de `TerminalBlockOptions.lines`, das
  alternativas do aviso, do `carried` da passagem e do arranjo de progresso da
  lista. E `elapsed` é o campo mais forte dos cinco, porque nele a fonte
  CONCORDA com a folha: cadeia já escrita, mesmo nome, mesmo tipo e mesma regra
  da decisão 3 do bloco do estado da execução — "formato de duração é decisão de
  idioma". É o contrário exato do `durationMs` que a sétima correção teve de
  recusar, e a leitura é a mesma nos dois sentidos: **campo que chega na forma
  que esta folha já fixou é campo que já tem dono.**

  A chamada de volta não muda nada, e vale registrar por quê: `onCollect(id)`
  devolve o endereço da linha em que se clicou, que é o `onAction` do estado da
  execução com o id da linha por fora — a lista sabe qual linha é qual porque é
  ela que as monta. Não é assinatura de um tipo de peça que aponte outro dono:
  aponta o mesmo.

  Um ponto merece ser escrito, porque a próxima porta vai tropeçar nele: as
  cinco stacks deixam `complete` FORA dos rótulos de ação, e o docblock diz por
  quê — "sobre uma resposta pronta não há o que fazer aqui", que é verdade
  embaixo de uma resposta e falso numa caixa, onde a execução pronta é
  justamente a que se abre. Não falta nada para isso: `AgentStatusLabels.action`
  é `Partial<Record<RunStatus, string>>` e já aceita a entrada, e a intenção que
  sai é `start`, que o docblock de `AgentStatusIntent` já define como política de
  produto — "retomar e refazer" ali, "abrir" aqui, e quem monta sabe qual linha
  montou. O que muda é o rótulo que a composição passa, e passar rótulo é
  montagem.

E o teste da família, que é o quarto: **ela responde ao eixo inteiro, e responde
com a peça desta folha que o responde inteiro.** Diz o que está acontecendo, há
quanto tempo e o que fazer a respeito — as três partes, o que nem
`tool-timeline`, nem `computer-use`, nem `subagent-list`, nem `agent-handoff`
faziam —, e as três já estão no estado da execução. É a mesma leitura da sexta,
da sétima, da décima primeira e da décima segunda, e a diferença para
`agent-card` continua sendo esta: `background-inbox` não sai por não pertencer à
família, sai por já estar construída dentro dela.

Some a isso o que a §1 tira, como tirou das outras: a metade que dá nome à
entrada — saber quais execuções continuaram correndo depois que alguém olhou
para outro lado — é projeção de estado de runtime, e a §2 é literal a respeito.
Depois que a projeção sai, o que resta é um arranjo que quem monta passa.

**E uma leitura que NÃO se decide daqui**: a fonte projeta a caixa do estado da
lista de conversas, e `thread-list` é da família 6. Se ao construir aquela
família a caixa reaparecer como um filtro DELA, o lugar da correção é lá —
decidir a folha da 6 de dentro da 2 é o que a sexta correção recusou fazer com
`TimelineStat`.

**As duas reversibilidades que apontavam para cá, respondidas:**

- **`subagent-list` (décima primeira) CONFIRMA, e a cláusula do agregado fecha.**
  A condição era trabalho paralelo com aninhamento de verdade, um estado por
  trabalhador que `RunStatus` não modele, ou um agregado que fosse LEITURA em vez
  de entrada. O agregado apareceu, e apareceu como leitura — mas apareceu
  exatamente na forma que aquela correção previu: uma conta sobre `RunStatus`,
  do tamanho de `isRunFinished`, cuja casa é `chat-protocol.ts` e cujo desenho é
  um número num distintivo. **Conta não é peça, e agregado lido não é desenho
  próprio.** Aninhamento não há — as linhas são irmãs, e quem despachou está fora
  da caixa —, e o estado por linha é `RunStatus` achatado, que é aquém do
  vocabulário e não além dele. `subagent-list` fica na 5.1.
- **`agent-handoff` (décima segunda) CONFIRMA.** A condição era troca de controle
  com desenho, estado ou vocabulário próprios. Não há troca de controle nenhuma
  aqui: não há `from`, não há `to` e não há dois lados — há n linhas que não
  entregam nada uma à outra.

**Reversível**, como as outras dezesseis: se ao construir `schedule-card`,
`checkpoint-history` ou `elicitation-form` aparecer trabalho em segundo plano com
desenho, estado ou vocabulário próprios — um ponto de entrada que saia da
conversa e peça desenho, um estado por execução que `RunStatus` não modele, ou
não-lido chegando como VOCABULÁRIO em vez de decisão de quem monta —,
`background-inbox` desdobra de volta para a 5.2, com o motivo. E há um segundo
gatilho, deste lado: se `agent-status` precisar de desenho próprio para viver em
lista — e não só do `.nds-item-group` que já empilha —, a caixa vira variante
DELE, e continua não sendo peça.

Contagens, somadas família a família: 1 tem 11, 2 tem 16, 3 tem 8, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 3 — **71** na 5.2. A 5.1 vai a **49** (47 linhas contadas
no arquivo, e duas delas carregam duas entradas). Somam 120. A família 2 fica
com **12 componentes**, e as sete somam 65.

### O sinal mais barato de que uma entrada vai colapsar

Apareceu sete vezes: **seis** como achatamento, sempre igual, e uma — a do
`mobile-composer` — pelo avesso, que fecha a sub-regra. Por isso vira critério:
**booleano onde este vocabulário já tem cinco palavras.**

| entrada | o que a fonte declara | o que ela perde |
|---|---|---|
| `agent-card` | `connected: boolean` | `reconnecting` |
| `tool-timeline` | `streaming: boolean` | `stopped`, `failed`, `complete` |
| `code-runner` | `RunState = idle\|running\|ok\|error` | `stopped` |
| `subagent-list` | `i < completedCount` — nem campo é | `idle`, `stopped`, `failed` |
| `agent-handoff` | `settled: boolean` — e os dois desenhos diferem só em cor e opacidade | `idle`, `stopped`, `failed` |
| `background-inbox` | `state = running\|ready\|failed` — e `ready` é `complete` renomeada | `idle`, `stopped` |

Nas seis, o achatamento não é economia — é sinal de que a entrada foi
desenhada para uma tela só, sem o vocabulário que a família já tem. E as seis
colapsaram pelos testes normais; o booleano só chegou antes.

**A quarta é o limite da forma**, medida na décima primeira correção, e vale
guardá-la porque o sinal pode vir sem campo nenhum: lá o estado por item não é
um booleano declarado, é uma comparação com um contador — quem está antes do
corte desenha concluído, quem está depois desenha correndo. Achatar para dois
sem escrever o tipo é achatar do mesmo jeito, e ainda amarra o desenho à ORDEM
do arranjo: a própria fonte manda terminar os itens em ordem "para que os vistos
caiam nos cartões certos". Ao ler os tipos, conte quantos desenhos DISTINTOS a
peça sabe fazer, não quantas palavras ela declara.

**A quinta é o pior dos cinco quanto ao que resta**, medida na décima segunda
correção: nas outras quatro os desenhos achatados ainda chegavam a uma palavra —
"em andamento", "concluído" —, e nesta os dois se separam só por cor e opacidade.
Achatar cinco estados em dois já custa informação; achatá-los em dois que a regra
4 da §8 não deixa desenhar assim custa a informação inteira para quem não
enxerga a diferença de cor. Quando o achatamento e a codificação por cor
aparecem juntos, o que a fonte tem não é um estado pequeno: é nenhum.

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

**E o sinal mudo com o desfecho INVERSO, medido na nona correção**:
`computer-use` também não declara booleano nem união de estado nenhuma —
`ComputerStep` não tem estado, e o que existe é `activeIndex: number` —, e essa
sobreviveu. As duas leituras juntas fecham o que a de cima já dizia pela metade:
**o sinal mudo não prevê nada, nem para um lado nem para o outro.** Quem decide
continuam sendo os três testes, e o que separa estes dois casos é onde a
ausência de estado leva. No `reasoning-effort` ela expunha um `onSelect`, que é
assinatura de controle e por isso tinha dono; aqui ela expõe um PONTO, que é um
eixo que este vocabulário nunca teve. Achatar um vocabulário existente é sinal;
não tocar nele não é sinal de nada.

**Terceiro sinal mudo, medido na décima correção**, e ele fecha a sub-regra:
`guardrail-notice` não declara estado NENHUM — a peça não recebe estado, e a
única união da fonte está na mensagem, fora dela. Colapsou. Com três leituras
mudas e dois desfechos, o que a ausência de estado faz é **empurrar a decisão
para a assinatura que sobrou no lugar dela**, e aí valem os três testes de
sempre: `onSelect` e `onPick` são chamadas de volta cujo dono já existia, e as
duas entradas colapsaram; `activeIndex` sobre um par de coordenadas era eixo sem
dono, e aquela sobreviveu. Não é um quarto teste — é onde olhar quando o sinal
não fala.

**Quarto sinal mudo, medido na décima terceira correção**, e ele marca o LIMITE
da sub-regra: `inline-citation` não declara estado nenhum — o que existe é
disclosure —, e a assinatura que sobrou no lugar dele é `onOpenIndexChange`.
Sobreviveu. A diferença para os três anteriores é que essa chamada de volta
**não é de um tipo de peça**: abrir e fechar é o par que a §2 exige de TODA peça
desta família, então ele não aponta dono nenhum. `onSelect` e `onPick` apontavam
um; `activeIndex` sobre um par de coordenadas era eixo sem dono; este não aponta
e não é eixo. Onde a assinatura que sobrou é a que a família inteira já tem, a
sub-regra fica calada também, e quem decide são os três testes sozinhos.

**Quinto sinal mudo, medido na décima quarta correção**, e é o primeiro em que a
sub-regra fala PELA METADE: `edit-message` declara um booleano — `editing` — que
não achata vocabulário nenhum, porque não há palavra de conversa para "editando";
é disclosure, como no caso anterior. Colapsou. E o que sobrou no lugar do estado
foram QUATRO chamadas de volta, não uma: `onStartEdit` e `onCancel` são o par de
abrir e fechar que a família inteira tem, e ficam calados pelo limite que a
décima terceira mediu; `onValueChange` e `onSave` são `onInput` e `onSubmit` de
um campo de texto, que é assinatura de UM tipo de peça e nomeia um dono
construído. Onde sobra mais de uma, leia cada uma: as da família ficam caladas, e
basta UMA que nomeie dono para a sub-regra falar.

**Sexta aparição do sinal, medida na décima quinta correção, e a primeira em que
o booleano NÃO é achatamento**: `mobile-composer` declara `running: boolean`, e
a peça em que ela colapsa declara o MESMO booleano, com o mesmo nome
(`setRunning`, `data-state="idle|running"`). Nas cinco da tabela o booleano
perdia palavras que este vocabulário tem; aqui não se perde nada, porque o dono
da superfície já decidiu perguntar uma coisa só ao estado da execução — dá para
enviar, ou é hora de interromper. A leitura muda de sentido junto: **booleano
igual ao do dono não é uma peça pequena, é a mesma peça.** Antes de contar o que
o booleano perde, veja se quem o declara não é justamente quem já o declarava —
e, se for, o sinal parou de prever colapso e passou a mostrá-lo.

E o segundo booleano dela, `keyboardOpen`, é o caso novo do outro lado: não
achata vocabulário, não é disclosure, e não descreve a conversa — descreve o
APARELHO. Estado de ambiente entra pela §7 como dado de produto entra, e o teste
que o pega é o da §2: se abre e não fecha — `onFocus` sem par de desfoque, como
a própria fonte admite —, não é estado desta família; é uma leitura que quem
monta faz do navegador.

**Sexto sinal mudo, medido na décima sexta correção**, e o primeiro em que a
ausência de estado esconde um ESTREITAMENTO: `document-reference` não declara
união nenhuma, e a assinatura que sobra no lugar dela é `onJump` — escolha de um
item numa fila, a terceira chamada de volta de escolha depois de `onSelect` e
`onPick`, e a terceira a nomear um dono que já existe. A sub-regra fala, e fala
do mesmo jeito das duas anteriores.

O que esta leitura acrescenta ao instrumento é uma **sexta forma do sinal, que
não estava na tabela: tipo mais estreito que o do vocabulário.**
`DocumentAnchor.page` é `number` onde `Citation.anchor` é `string`, e a cadeia
está lá porque o lugar dentro de uma fonte é página, âncora ou intervalo de
linhas. Estreitar o campo custa duas coisas de uma vez: os lugares que não são
página, e o rótulo — um número obriga o componente a escrever "p. 4", e formatar
é decisão de locale, que esta família tira do componente por regra. As cinco da
tabela achatavam UNIÃO DE ESTADOS; esta achata um CAMPO, e o efeito é o mesmo.
Ao ler os tipos, conte também os valores que o tipo deixa de poder expressar, e
não só as palavras que a união perde.

**Sétima aparição, e a sexta que é achatamento, medida na décima sétima
correção**: `background-inbox` declara três palavras onde `RunStatus` tem cinco,
e uma delas é `complete` com outro nome. Perde `idle` e `stopped` — a execução
enfileirada e a interrompida, que são justamente as duas que uma caixa de
trabalho deixado correndo mais tem para mostrar. E é a primeira vez que o
achatamento SOBE da linha para o AGREGADO: a contagem do cabeçalho só sabe somar
duas das três palavras que a própria fonte declara, então uma caixa com três
execuções quebradas e mais nada se anuncia como vazia. **Vocabulário que encolhe
encolhe junto a conta que se faz sobre ele** — e a conta era o que a entrada
tinha de mais próprio.

**Como usar**: ao ler a fonte, olhe os tipos ANTES da anatomia. Um booleano de
estado, uma união com uma palavra a menos que `RunStatus`/`ToolCallState`, ou um
contador posicional que parta a lista em dois desenhos, mandam aplicar os três
testes com atenção — não decidem sozinhos, mas preveem.

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
