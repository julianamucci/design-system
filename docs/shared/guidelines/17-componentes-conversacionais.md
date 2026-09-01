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
| `diff-hunks.ts` *(dispensado, não nasce)* | Nasceria para partir um diff unificado em blocos e guardar o estado por bloco (manter/descartar). A tabela previa que `code-diff` e `reviewable-diff` o dividissem; a vigésima segunda e a vigésima quarta correções mediram as duas fontes e **nenhuma das duas faz nem uma coisa nem outra** — `code-diff` recebe as linhas já partidas e `reviewable-diff` recebe os blocos já partidos, e quem parte é quem monta. O estado por bloco é `pending` (que é `ToolCallState` `pending`) mais o que a §7 tira, e a sobra dele é uma contagem DERIVADA, do tamanho de `isRunFinished`, cuja casa é `chat-protocol.ts` no dia em que uma peça precisar dela. Primitivo que perde as duas tarefas não nasce menor: não nasce. A espécie por linha, que era o resíduo com dono, mora em `code-highlight.ts`, ao lado de `LineRangeInput` |

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

A consequência prática vale para as seis famílias: **peça que se encaixa é peça
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

### 5.1 Já desenhado — vira story ou composição, folha nova nenhuma (86)

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
| `code-runner` | `code-block` (o trecho, sempre visível, com a linguagem no rótulo do cabeçalho) + `terminal-block` (a saída pré-formatada, o cursor e como terminou) + `agent-status` (o relógio e o botão de executar, que é o `start` de `AgentStatusIntent`). Pedia **uma opção** de ações no cabeçalho do `code-block`, onde `.nds-code-block-actions` já era a fila — nem classe nova, nem folha nova; **construída**, e com divergência de API por stack registrada, e não "alinhada": `actions?: HTMLElement[]` no Vanilla, `actions?: ReactNode` no React, `actions?: Snippet` no Svelte, slot nomeado `actions` no Vue e projeção de conteúdo no Angular. Os controles entram **antes** do copiar, para que o copiar siga ancorado no canto do bloco em toda composição (WCAG 3.2.4). Veio da família 2 — ver 5.3 |
| `reasoning-effort` | `toggle-group` `type: 'single'` para escolher o nível — que é CONTROLE, e o catálogo já tem outro escrevendo o mesmo campo — mais `context-display` na forma `bar` para o gasto contra o teto do nível escolhido, que é token contra teto como as irmãs. Veio da família 5 — ver 5.3 |
| `guardrail-notice` | `alert` na variante `warning` — o escudo âmbar entra na coluna que `:has(> svg)` abre, o título é `.nds-alert-title`, a explicação é o `<p>` de `.nds-alert-description`, que a fonte também desenha sempre — mais `.nds-badge` no encaixe `.nds-alert-action`, que o alerta já encosta no fim da linha do cabeçalho com `:has()`, para a etiqueta da política; e as alternativas são `follow-up-suggestions`, que a própria fonte chama de "próximos pedidos sugeridos" e que esta tabela já resolveu em lista de `button` / `pill.css`. Irmã de `error-state` na origem, e a diferença que a fonte reivindica contra ele é a variante. Veio da família 2 — ver 5.3 |
| `subagent-list` | `.nds-item-group` de `job-progress` — uma linha por trabalhador. `.nds-item` `.nds-item-outline` dá a superfície de cada cartão; dentro dela `job-progress` leva o nome (`.nds-job-progress-label`), a PALAVRA do estado e a barra do sistema com nome acessível; `.nds-item-actions` leva o modelo em `.nds-badge` com `.nds-font-mono`. A lista é plana na fonte, e o agregado dela é ENTRADA, não leitura. Veio da família 2 — ver 5.3 |
| `agent-handoff` | `.nds-stack` com três partes: a linha da passagem é `.nds-cluster[data-spacing="xs"]` de dois `.nds-badge` com a seta do lucide entre eles, decorativa, e a relação em `.nds-sr-only`; a palavra do estado é `agent-status`, que traz `RunStatus` inteiro no lugar do booleano da fonte; o motivo é a descrição de `.nds-item`, e o que foi levado junto é `.nds-item-group` de linhas com `.nds-font-mono` e `.nds-truncate`. Veio da família 2 — ver 5.3 |
| `edit-message` | `composer` com `value` — o texto de antes chega pela mesma prop por onde um rascunho volta ao campo — mais `railStart` para o controle de cancelar e uma frase a mais em `.nds-composer-hint`, que é a DESCRIÇÃO do campo e por isso chega antes da tecla de envio, e não depois. A bolha em repouso é a mensagem do `chat-thread` com o controle de editar em `actions` (`.nds-chat-message-actions`), como `message-actions` acima nesta tabela; trocar uma forma pela outra é montagem de quem consome. Quantas réplicas o envio descarta é dado de produto (§7) e entra na frase como `{max}` já entra. Pede **uma opção** `railEnd?: HTMLElement[]` no trilho do `composer`, onde `.nds-composer-rail-end` já é a fila — nem classe nova, nem folha nova. Veio da família 1 — ver 5.3 |
| `mobile-composer` | `composer` com `submitOn: 'modifier'` — o modo do toque, que o docblock do campo já nomeia — e `rows: 1`, mais `railStart` para anexar e para `composer-voice`, que ESCREVE por quem fala em vez de desenhar um microfone parado; e a fileira de atalhos acima é `follow-up-suggestions`, que esta tabela já resolveu em lista de `button` / `pill.css`. A linha que a fonte troca por "return to send" é `.nds-composer-hint`, que já diz qual tecla envia em CADA modo — e no toque a tecla certa não é essa. O que muda no telefone é AMBIENTE, e esta família já respondeu ambiente uma vez com consulta de mídia dentro do bloco que existe (`@media (hover: none)` no `chat-thread`): alvo de toque maior é `min-inline-size`/`min-block-size` no trilho sob `@media (pointer: coarse)`, e a área segura é de quem ENCOSTA a barra no fim da tela — `chat-panel`, nesta mesma tabela —, porque `.nds-composer` não tem `position` nenhum. **Falta uma utilitária, e está nomeada**: nada em `docs/shared/styles/` declara `env(safe-area-inset-bottom)`. Veio da família 1 — ver 5.3 |
| `document-reference` | `.nds-item` `.nds-item-outline` como cartão, e dentro dele duas partes que já existem. O cabeçalho é `.nds-item-media` `.nds-item-media-icon` com o ícone lucide de arquivo, `.nds-item-title` com o nome do documento e `.nds-item-description` com a medida ("N páginas · M citadas"), que é ENTRADA e não leitura — a própria fonte diz que o total de páginas não é conferido contra as âncoras. As citações são `.nds-item-group` de `<button class="nds-item">`: o lugar dentro da fonte em `.nds-badge` com `.nds-font-mono`, o trecho em `<q>` — as aspas vêm do navegador, como na citação em linha —, e a corrente marcada por `aria-current`, que é PALAVRA e não só fundo. O documento é um `ChatSource` escrito UMA vez e cada linha é uma `Citation` que o compartilha: é a decisão do docblock de `Citation` desenhada, não uma peça. **Faltam duas utilitárias, e estão nomeadas**: `.nds-item-media-icon` não tem a variante com o quadrado tingido que `.nds-empty-media-icon` já declara em `empty.css`, e `.nds-item` não tem regra para `[aria-current]`, que `.nds-pagination-link` já tem para `[aria-current="page"]`. Veio da família 3 — ver 5.3 |
| `background-inbox` | `.nds-card` com `.nds-item-group` de `agent-status` — uma linha por execução. `.nds-card-header` leva o título e a contagem em `.nds-badge` com `.nds-font-mono` dentro de `.nds-card-action`, o mesmo encaixe do distintivo de versão; `.nds-card-content` recebe a lista, e cada `.nds-item` `.nds-item-outline` `data-size="sm"` leva o título em `.nds-item-title`, que já corta em uma linha, o resumo em `.nds-item-description` e, em `.nds-item-actions`, o `agent-status` inteiro — a PALAVRA do estado, o relógio já escrito e a ação que muda com ele, que são as três partes do eixo da família. Sem execução nenhuma, `empty.css`. A contagem do cabeçalho é conta sobre `RunStatus`, do tamanho de `isRunFinished`, e a casa dela é `chat-protocol.ts` no dia em que uma peça precisar dela — agregado que é leitura rende função, não desenho. Veio da família 2 — ver 5.3 |
| `read-aloud` | `media-player` `kind="audio"` — sem superfície, a barra É o componente inteiro, e ali já estão os quatro nós que a fonte desenha: `.nds-media-player-button` para tocar e pausar, `.nds-media-player-seek` para a posição, `.nds-media-player-time` para o par decorrido/duração e `.nds-media-player-rate` para a velocidade, que é um `<select>` sobre `rates` e carrega o VALOR, onde a fonte tem um botão que cicla às cegas. Fala sintetizada não tem fim conhecido — a duração só se sabe quando termina, e muda com a velocidade —, então o caminho é o da fonte ao vivo que esta base já resolve: `data-live`, o aviso de transmissão no lugar do relógio e o slider fora de cena. A palavra sendo lida é a marca dentro do `markdown` de `.nds-chat-message-content`; as palavras já ditas NÃO esmaecem, porque opacidade é a codificação que a regra 4 da §8 troca pela palavra. **Falta uma utilitária, e está nomeada**: nada em `docs/shared/styles/` realça palavra dentro de texto corrido — o único `<mark>` desenhado está escopado a `.nds-editor-content .ProseMirror`, e o amarelo do navegador ignora o tema, como aquela folha já registra. **Pede uma opção** no `media-player`: um terceiro motor, que RELATA o próprio estado em vez de ser lido de um elemento, porque fala sintetizada não é elemento de mídia nem quadro de outra origem — `PlayerState` já é a costura e a folha já diz que o motor é substituível. Nem classe nova além da nomeada, nem folha nova. Veio da família 7 — ver 5.3 |
| `retrieval-chunks` | `.nds-stack[data-spacing="sm"]` com três blocos que já existem. O termo procurado é `.nds-badge` com o ícone lucide de banco de dados, que `.nds-badge > svg` já dimensiona e alinha; a linha de estado é `agent-status`, que traz `RunStatus` inteiro no lugar do booleano da fonte, com a contagem de trechos ao lado; e a fila é `.nds-item-group` de `.nds-item` `.nds-item-outline` `data-size="sm"` — `.nds-item-title` com o título da fonte, `.nds-item-description` com o trecho, que já corta em duas linhas com `-webkit-line-clamp: 2`, e `.nds-item-actions` com o lugar e a pontuação em `.nds-badge` com `.nds-font-mono`. Cada linha é uma `Citation`, com `ChatSource` inteiro no lugar da cadeia sem endereço da fonte, e `isSafeUrl` no ponto em que o endereço encosta no DOM. Nenhuma classe nova, e — ao contrário de `document-reference` — nenhuma nomeada como faltando: não há ícone por linha nem linha corrente. Se o produto quiser a pontuação em barra, ela é `.nds-context-display[data-form="bar"]` com outro denominador, que é a família 5 e não esta. Veio da família 3 — ver 5.3 |
| `elicitation-form` | `approval-card` com um corpo de campos entre a pergunta e os controles. `.nds-approval-card-ask` leva o pedido em `.nds-approval-card-question` e o servidor em `.nds-approval-card-scope`, um par de termo e valor; os campos são `.nds-field-group` de `createFormField`, que já monta `<label for>`, já dá id à descrição e à mensagem de erro e já as costura no `aria-describedby` do controle; os controles são `.nds-approval-card-actions`, o mesmo espaço de `HTMLElement[]` que a família inteira usa. A fonte não guarda valor e não valida — `onAccept()` e `onDecline()` não recebem argumento —, então o que sobra dela é moldura, pergunta e espaço, que o cartão já é; esquema que virasse campo seria geração de formulário, e a §2 a mantém de fora. Os campos entram como IRMÃOS de `-ask`, nunca dentro: a região viva fecha antes deles (decisão 1 daquele bloco), e formulário recitado num anúncio é pior que botão recitado. **Falta uma opção, e está nomeada**: `createApprovalCard` não tem por onde receber um corpo — pede `fields?: HTMLElement[]` apensado entre `-ask` e `-actions`, onde a raiz já é a pilha e o `gap` dela já é o afastamento; nem classe nova, nem folha nova. Veio da família 2 — ver 5.3 |
| `confidence-marker` | `markdown` com o gatilho de explicação que esta base já compõe. Cada afirmação é um `<button>` em linha dentro do parágrafo, com a cadeia que `hover-card.fixtures.ts` e `hover-card.source.ts` já escrevem literalmente e nesta ordem — `.nds-underline-dotted` `.nds-cursor-help` `.nds-bg-transparent` `.nds-border-none` `.nds-p-0` —, e o nível troca só a decoração: `.nds-underline` para o que se apoia em fonte, `.nds-underline-dotted` para o que não se apoia, as duas com o mesmo deslocamento que cinco folhas já aplicam. O nível chega também como PALAVRA — `.nds-badge` em linha, como `directive-text` acima nesta tabela, ou `.nds-sr-only` quando o parágrafo não pode ser interrompido —, porque a fonte declara três níveis e desenha duas decorações, deixando o terceiro por conta da cor, que a regra 3 desta folha troca pela palavra e a regra 4 da §8 proíbe (WCAG 1.4.1). A base da afirmação é `.nds-popover-content` num encaixe ABAIXO do parágrafo, ligado por `aria-describedby`: encaixe, e não caixa flutuante, é o que faz a revelação não cobrir o texto que se está lendo, que é a decisão 4 do bloco da citação em linha. O espaço se reserva com `min-block-size`, nunca com a altura fixa da fonte, porque o encaixe carrega texto (§9). Nenhuma classe nova, e nenhuma nomeada como faltando: se o produto quiser três decorações em vez de duas palavras, a que falta é `.nds-underline-dashed` em `utilities.css`, ao lado das duas que já estão lá — utilitária, nunca folha. Veio da família 3 — ver 5.3 |
| `code-diff` | `code-block` com a espécie da linha. O cabeçalho é `.nds-code-block-header`: `.nds-code-block-title` monoespaçado, que já TRUNCA o caminho do arquivo em vez de empurrar o botão, e os dois contadores em `.nds-cluster[data-spacing="xs"]` de `.nds-badge nds-badge-success` / `.nds-badge nds-badge-destructive` com `.nds-font-mono` — o mesmo desenho que `tool-timeline` já resolveu nesta tabela para `{ file, added, removed }`, que é este cabeçalho com outros nomes. O corpo é `.nds-code-block-scroll`, que rola nos dois eixos no mesmo container com `overscroll-behavior-inline: contain`, `tabindex="0"` e — desde o conserto do defeito que a leitura desta entrada encontrou — `role="group"` mais nome acessível, que é o par que a regra 6 da §8 pede (`group` e não `region`: uma página de documentação tem dezenas de blocos, e `region` com nome viraria dezenas de landmarks homônimos); `.nds-code-block-pre` com `lang="en"` e `tab-size: 2`; `.nds-code-block-text` com `white-space: pre`, que é literalmente a decisão que a fonte anuncia; e `.nds-code-block-gutter` sticky, que sobrevive à rolagem horizontal — mais realce por gramática, que a fonte não tem. **Unificado, sem numeração e sem cabeçalho de trecho**: a fonte não desenha nenhum dos três, e é isso que tira daqui a única geometria que esta base não teria — duas numerações que avançam em ritmos diferentes. **Faltavam duas coisas, e as duas estão CONSTRUÍDAS**: `.nds-code-block-line` conhecia um estado por linha (`data-highlighted`) e o diferencial quer três espécies — hoje é `data-kind="context\|added\|removed"` com um par de tinta por espécie, `--success` e `--destructive` a 0.12, o mesmo alfa do destaque, medido contra `--muted` E contra a linha destacada nos dois modos e nos três temas (pior caso 4.66:1, e a 0.14 reprovaria a 4.48:1); e o gutter, que segue `aria-hidden` enquanto numera porque número é redundante com a posição, nesse modo carrega `+` / `−` visível mais a palavra em `.nds-sr-only` e deixa de ser escondido, porque tinta sozinha é a codificação que a regra 4 da §8 recusa e cujo exemplo é este. **As duas opções existem nas cinco**: a espécie por linha (`lineKinds`, indexada por linha e não por intervalo, porque espécie é classificação completa onde destaque é decoração esparsa) e a mesma opção de ações que `code-runner` pede nesta tabela; nem classe fora das nomeadas, nem folha nova. A decisão de marca e palavra por espécie mora em `docs/shared/primitives/code-block-lines.ts`, e as palavras em `code-block-labels.ts`. A entrada escalonada a 60 ms é revelação, e revelação é `13-animacao.md`. Veio da família 4 — ver 5.3 |
| `schedule-card` | `.nds-card` com o interruptor no cabeçalho e `.nds-item-group` de `agent-status` embaixo. `.nds-card-header` leva o nome em `.nds-card-title` `.nds-truncate` e a cadência em `.nds-card-description`, com o `switch` em `.nds-card-action` — a grade já abre a segunda coluna com `:has(> .nds-card-action)` e a segunda linha com `:has(> .nds-card-description)`, e a ação já ocupa as duas linhas com `justify-self: end`, sem regra nova. A linha da próxima execução é `.nds-item` `data-size="sm"` com o rótulo em `.nds-item-title` e o instante em `.nds-badge` com `.nds-font-mono`, chegando já escrito como texto — a decisão da contagem do estado da ligação, que é onde esta família já resolveu tempo FUTURO; pausado, o instante dá lugar à PALAVRA, e não ao esmaecimento, que a regra 4 da §8 recusa. O ícone de relógio entra em `.nds-badge > svg`, que já o dimensiona. O histórico é `.nds-item-group` de `.nds-item` `.nds-item-outline` `data-size="sm"`, com o carimbo em `.nds-item-title` e `agent-status` em `.nds-item-actions` — `RunStatus` inteiro no lugar do booleano da fonte, que separa o que falhou do que alguém interrompeu. Sem execução nenhuma, `empty.css`. O que a cadência agenda e o que pausar faz é produto (§7), e a própria fonte já o põe fora da peça. Veio da família 2 — ver 5.3 |
| `reviewable-diff` | `.nds-card` com um `code-block` por trecho. `.nds-card-header` leva o nome do arquivo em `.nds-card-title` com `.nds-font-mono` e `.nds-truncate`, e a contagem do que já foi decidido em `.nds-badge` com `.nds-font-mono` dentro de `.nds-card-action`, o encaixe que a grade do cabeçalho já abre com `:has(> .nds-card-action)`; `.nds-card-content` recebe `.nds-stack[data-spacing="sm"]` de um `.nds-code-block-root` por trecho, com o intervalo em `.nds-code-block-title` monoespaçado — cadeia que a fonte imprime e nunca reparte, logo nenhum `@@` a interpretar — e, em `.nds-code-block-actions`, os dois controles enquanto o trecho está pendente ou o `.nds-badge` do que foi decidido depois, que é a fila de `actions?: HTMLElement[]` da §2 e não um estado; `.nds-card-footer` leva o que falta decidir e o botão de aplicar. As linhas usam a espécie por linha que `code-diff` já nomeou nesta tabela, dentro de `.nds-code-block-scroll` — que a fonte desta entrada não tem, e é onde a composição fica mais fina que ela. O trecho descartado **não esmaece**: opacidade sozinha separando duas decisões é a codificação que a regra 4 da §8 recusa e que a décima segunda já mediu, e a palavra já está ao lado. A contagem do cabeçalho e o portão do rodapé são derivados de `hunks`, como a própria fonte declara — agregado que é leitura rende função, não desenho. Nenhuma classe nova e nenhuma nomeada como faltando: as opções que `code-runner` e `code-diff` pediam ao `code-block` — `actions`, `lineKinds`, a palavra na calha e o nome da região que rola — já estão de pé. Veio da família 4 — ver 5.3 |
| `message-branches` | `.nds-cluster[data-spacing="xs"]` de três nós dentro do encaixe `actions` da mensagem do `chat-thread` — que é `.nds-chat-message-actions`, e é onde a PRÓPRIA fonte manda pôr a peça ("put it in the assistant message's action row, next to copy and regenerate"). Os dois controles são `.nds-button` `.nds-button-ghost` `.nds-button-icon-sm` com os chevrons do lucide e nome acessível TEXTUAL (regra 7 da §8); o quadrado de 32 px já passa do alvo de 24 px da regra 10, onde a fonte desenha 24 exatos. A posição é `.nds-badge` com `.nds-font-mono`, o mesmo par que sete linhas desta tabela já usam para contador, e o molde é `{index} de {total}`, que `computer-use` já escreve — palavra do idioma, onde a fonte crava uma barra que em voz alta vira "três barra seis". A resposta ativa NÃO é da peça: é `.nds-chat-message-content`, com `createMarkdown` e `isSafeUrl`, e a própria fonte a dispensa no seu exemplo "stepper only" (`[&>p]:hidden`) e não a tem na faixa de runtime, onde o corpo vem do turno. **Não se compõe com `createPagination`**, e é a única armadilha desta linha: aquele produz `<nav role="navigation">`, e um seletor por turno numa conversa de cinquenta renderia cinquenta landmarks homônimos — a mesma leitura que a vigésima segunda correção fez ao escolher `group` em vez de `region`. O que se aproveita de `pagination` é o CONTRATO (`total`, `current`, `onPageChange`), não o landmark nem a fila de números. Dar a volta nas pontas não se reproduz: um "anterior" que na primeira leva à última é controle cujo nome mente, e a faixa de runtime da própria fonte desabilita nas pontas. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 6 — ver 5.3 |
| `regenerate-menu` | `composer-model-picker` no encaixe `actions` da mensagem do `chat-thread`, que é `.nds-chat-message-actions`. A API da fonte é a do seletor já CONSTRUÍDO, campo por campo: `options` é `models`, `currentId` é `value`, `onPick` é `onValueChange`, e `open` com `onOpenChange` têm o mesmo nome dos dois lados. `RegenerateOption` — `{ id, label, detail }` — é `ModelOption` sem `badge`, sem `unavailable` e sem `unavailableReason`, e é essa falta que deixa a opção apagada sem poder dizer por que não pode ser escolhida, que é a decisão 2 daquele bloco. O gatilho é `.nds-button` `.nds-button-ghost` com nome acessível TEXTUAL que diz o que ele escolhe (regra 7 da §8, e decisão 1 do bloco), e a marca do escolhido é `aria-selected` na `.nds-composer-model-option`, não a palavra "current" no lugar do detalhe — que a própria fonte admite ser indistinguível de um detalhe que por acaso diga "current". A fonte também não tem clique fora, `Escape` nem cursor de teclado, e diz isso com todas as letras; o seletor construído tem os três. **Falta uma opção, e está nomeada**: `.nds-composer-model-panel` só abre PARA CIMA (`inset-block-end: calc(100% + …)`), porque o composer mora no pé da conversa — numa fila de ações no meio da thread, ou na barra de ferramentas que o docblock do seletor já prevê, o painel precisa da forma para baixo, como `.nds-input-group-addon` já faz com `data-align`. Nem classe nova, nem folha nova. Veio da família 6 — ver 5.3 |
| `conversation-search` | `.nds-input-group` com o trio de passos ao lado e o trecho corrente abaixo. O campo é `.nds-input-group-control` com a lupa em `.nds-input-group-addon` `data-align="inline-start"`; a posição é `.nds-badge` com `.nds-font-mono` no molde `{index} de {total}`, palavra do idioma onde a fonte crava uma barra; anterior e próximo são `.nds-button` `.nds-button-ghost` `.nds-button-icon-sm` com nome acessível textual — o mesmo trio que `message-branches` resolveu nesta tabela, em `.nds-cluster` e sem classe nova. O trecho corrente é `.nds-item` `.nds-item-muted` com o achado marcado dentro do texto em volta. Os três campos do achado — antes, achado, depois — são `slice` sobre o `excerpt` de `Citation`, e a posição é `(i / (n − 1)) × 100`: a própria fonte calcula os quatro no exemplo, nas DUAS faixas, e agregado que é leitura rende função, não desenho. **Falta uma utilitária, e é a MESMA que `read-aloud` já nomeou**: nada em `docs/shared/styles/` realça palavra dentro de texto corrido fora de `.nds-editor-content .ProseMirror mark`, onde o par de `--accent` a 0.2 com `--accent-foreground` já está medido e explicado — o conserto é levantá-lo para `utilities.css`, utilitária e nunca folha. A trilha de marcas ao lado NÃO se reproduz como a fonte a desenha: ela mora dentro da barra de busca, longe do container que diz mapear; as marcas não são botões e não têm rótulo; e a diferença entre a corrente e as outras é opacidade, que a regra 4 da §8 recusa. Marca sobre a extensão da conversa é a extensão que `ThreadMetrics` já descreve em `chat-scroll.ts`, e se um produto a quiser ela é OPÇÃO do `chat-thread`, na região que rola. Veio da família 6 — ver 5.3 |
| `thread-search` | `command`. A caixa é `.nds-command-input` com `role="combobox"`, a fila é `.nds-command-list` com `role="listbox"`, cada bloco é `.nds-command-group` com `.nds-command-group-heading` — e o bloco fixado é um grupo como os outros, com o próprio rótulo, que é como a fonte já o desenha —, a linha é `.nds-command-item` com `role="option"` e `aria-selected`, e o vazio é `.nds-command-empty`. `pinned` não é estado: é em qual grupo a linha cai, e quem o escreve é quem passa o arranjo. O teclado é o do próprio `command`, e é aí que a composição fica mais fina que a fonte em dois pontos que ela mesma declara: lá "andar é escolher" — a seta troca de conversa a cada toque, sem passo de destaque —, e não há vazio de "nenhuma conversa" distinto do vazio de "nenhum resultado", que `empty.css` separa. **Falta uma utilitária, e está nomeada**: `.nds-command-item` não tem segunda linha, onde `.nds-item-description` já desenha uma — é dela que a prévia da conversa precisa. Veio da família 6 — ver 5.3 |
| `thread-list` | `sidebar`, nó por nó. O painel é `.nds-sidebar-static`; o botão de nova conversa e a busca são `.nds-sidebar-header` com `.nds-button` e `.nds-sidebar-input`; o dia é `.nds-sidebar-group` com `.nds-sidebar-group-label`; a fila é `.nds-sidebar-menu` de `.nds-sidebar-menu-item`, com o título em `.nds-sidebar-menu-button` levando `data-active="true"` e `aria-current` na conversa aberta — os dois, porque um pinta e o outro é a palavra; o instante, que chega já formatado, é `.nds-sidebar-menu-button-badge`; e renomear, arquivar e apagar entram por `.nds-sidebar-menu-action` `.nds-sidebar-menu-action-hover` com um `dropdown-menu`, cujo bloco já aparece no `:focus-within` que a regra 3 da §8 exige. Sem conversa nenhuma, `empty.css`. `unread` não ganha ponto sozinho — ponto é cor, e a regra 4 da §8 pede a palavra junto, em `.nds-sr-only` ou na contagem do distintivo que já está ali. A faixa standalone entrega menos que a de runtime em três pontos: sem busca, com um rótulo "Hoje" fixo sobre qualquer data, e com os ícones de renomear e apagar sem manipulador — a própria fonte diz que são apresentação. Veio da família 6 — ver 5.3 |
| `thread-list-sidebar` | `sidebar` com `thread-list` dentro, e é a única entrada das 120 que **não tem faixa standalone nenhuma** — a fonte diz isso na primeira linha e manda compor o `Sidebar` à mão. O que ela acrescenta ao que envolve é cabeçalho, rodapé e trilho; tudo o mais é repassado, e os três repassados são `data-side`, `data-variant` e `data-collapsible`, que `.nds-sidebar-root` já lê, com `.nds-sidebar-rail` sumindo em `[data-collapsible="offcanvas"]` exatamente como a fonte descreve. A marca no cabeçalho e o link de suporte no rodapé são conteúdo de quem monta, e a própria fonte os chama de espaço reservado. Veio da família 6 — ver 5.3 |
| `shared-conversation` | `.nds-card` com `chat-thread` dentro. `.nds-card-header` leva o título em `.nds-card-title` `.nds-truncate`, quem compartilhou e quando em `.nds-card-description` e o ícone de elo em `.nds-card-action` — a grade já abre a segunda coluna e a segunda linha com `:has()`; `.nds-card-content` recebe a conversa; `.nds-card-footer` leva `.nds-badge` com a palavra e o botão de continuar. Somente leitura NÃO é estado do `chat-thread`: o campo de entrada é peça à parte (§4.2), e transcrição sem composer já é transcrição que não se responde. `SharedTurn` — `{ id, role, text }`, com o papel em duas palavras — estreita duas coisas de uma vez: `ChatRole`, que tem três, e `ChatMessageOptions`, que tem nove campos mais as partes que `MessagePartKind` enumera; e o `text` cru levaria fala de modelo à tela sem `createMarkdown` e sem `isSafeUrl`. Sem turno nenhum, `empty.css`, que a fonte admite não ter. Veio da família 6 — ver 5.3 |
| `onboarding` | `.nds-card` com `stepper` no cabeçalho. `.nds-stepper` é o `<ol>` de etapas com `data-state` `active` e `completed`, `.nds-stepper-indicator` numerado e `.nds-stepper-separator` entre elas — e entrega mais que os pontos da fonte, que são `aria-hidden`, não são botões e por isso não deixam voltar; a posição em palavra é `.nds-badge` com `.nds-font-mono` no molde `{index} de {total}`. O título da etapa é `.nds-card-title`, a explicação é `.nds-card-description`, o exemplo é `.nds-item` `.nds-item-muted`, e pular e avançar são `.nds-card-footer` com `.nds-button` `.nds-button-ghost` e `.nds-button`. Com zero etapas, `empty.css` — a fonte não desenha nada. É a entrada com menos conversa dentro de todas as 120: a própria fonte diz que as etapas são conteúdo de quem escreve e que não há nada a ler do runtime. Veio da família 6 — ver 5.3 |
| `diagram` | `.nds-card` com o desenho pronto dentro de uma `scroll-area`. `.nds-card-header` leva o título em `.nds-card-title` `.nds-truncate` e, em `.nds-card-action`, um `.nds-cluster[data-spacing="xs"]` com a porcentagem em `.nds-badge` com `.nds-font-mono` — o mesmo par que uma dúzia de linhas desta tabela já usa para contador — e os quatro controles em `.nds-button` `.nds-button-ghost` `.nds-button-icon-sm` com nome acessível TEXTUAL (regra 7 da §8); o corpo é `.nds-card-content` com a região que rola, porque desenho ampliado é o que mais transborda desta família, e ela vai com papel e nome (regra 6 da §8). A AMPLIAÇÃO NÃO É DA PEÇA: a fonte a declara obrigatória e não a limita — "does not clamp `zoom` itself" —, então o número é de quem monta e o que sobra é uma multiplicação. **Faltam duas utilitárias, e estão nomeadas**: nada em `docs/shared/styles/` aplica `transform: scale()` a partir de propriedade personalizada — `.nds-hover-scale-105` é a única escala declarada, e é de `:hover` —, e `.nds-dialog-content` está preso em `max-width: 32rem` sem variante de tamanho, onde `.nds-scroll-area` já tem `data-size`; é dela que a vista de tela cheia precisa. Utilitária e variante, nunca folha. Veio da família 4 — ver 5.3 |
| `mermaid-diagram` | os três desenhos que a fonte declara, e os três já existem: enquanto chega, `skeleton`; quando não se lê, `code-block` com a fonte crua, que é onde `syntax-highlighter` acima nesta tabela já resolveu realce sem dependência nova; e quando se lê, o SVG pronto na moldura de `diagram`, nesta mesma tabela. Tirado o renderizador que a §6 mantém do lado de fora, o que resta é `diagram` com outro nome — e é a própria fonte que fecha a leitura, exportando a moldura sozinha (`MermaidZoom`) e mandando embrulhar nela um SVG que já se tenha. Das quatro que a §6 nomeia, é a ÚNICA cuja faixa standalone de fato carrega biblioteca; ver 5.3. `streaming` é revelação, e revelação é `13-animacao.md`. Veio da família 4 — ver 5.3 |
| `math-block` | `.nds-item-group` de `.nds-item` `data-size="sm"`, com a legenda acima em `.nds-badge` com `.nds-font-mono`. Cada passo é `.nds-item-title` com a expressão e `.nds-item-description` com a nota, que já corta em duas linhas. A NOTAÇÃO NÃO É DA PEÇA: `Frac`, `Sup` e `Sub` são exports separados que quem monta assembla e passa PRONTOS, e a anatomia só põe `{step.expression}` dentro de um `<span>` — a faixa com runtime, que é a que o modelo alimenta, só consegue mandar texto cru, e a fonte diz com todas as letras que uma fração chegando por ali desenha como caracteres soltos. Nenhum `role="math"`, nenhum MathML, nenhum nome acessível em lugar nenhum dela. Vale a frase que a décima nona e a vigésima quinta já escreveram, num traje novo: **a expressão não é da peça.** `visibleSteps` é revelação, e revelação é `13-animacao.md`. Veio da família 4 — ver 5.3 |
| `map-answer` | `computer-use` com a lista embaixo, e o encaixe é campo por campo. `.nds-computer-use-screen` é o quadro, com `--computer-use-aspect` declarado pela peça; `.nds-computer-use-surface` recebe a grade de fios de quem monta — que na fonte é pano de fundo esquemático e decorativo, e é também por onde um mapa de verdade entra sem que o design system decida telha de terceiro (§6) —; `.nds-computer-use-trail` leva um `.nds-computer-use-mark` por ponto, posicionado por `--computer-use-mark-x` e `--computer-use-mark-y` em porcentagem do quadro, com `data-active="true"` no corrente, que já cresce e destaca. A lista é `.nds-item-group` de `.nds-item` `.nds-item-outline` `data-size="sm"`, com o rótulo em `.nds-item-title` e o detalhe em `.nds-item-description`, e a linha corrente leva `aria-current`, que é PALAVRA e não só fundo. A linha tracejada é "conectividade decorativa, não caminho calculado" por declaração da própria fonte, e quem tem as coordenadas para desenhá-la é quem passa a superfície. **Falta uma opção, e uma utilitária JÁ nomeada**: `.nds-computer-use-mark` é `aria-hidden` e decorativo, e escolher pelo quadro pede que ele vire `<button>` com nome textual e alvo de 24 px (regras 7 e 10 da §8); e `.nds-item` não tem regra para `[aria-current]`, que é a MESMA que `document-reference` já nomeou nesta tabela. Manter as marcas decorativas e deixar a escolha nas linhas é onde a composição fica mais fina que a fonte, que põe cada ponto DUAS vezes na ordem de foco com o mesmo nome. Veio da família 4 — ver 5.3 |
| `web-preview` | `.nds-card` com `.nds-input-group` no cabeçalho. O endereço é `.nds-input-group-control` somente leitura com `.nds-font-mono` e `.nds-truncate`; recarregar é `.nds-input-group-addon[data-align="inline-start"]` e abrir fora é `[data-align="inline-end"]`, os dois com `.nds-button` `.nds-button-ghost` `.nds-button-icon-sm` e nome acessível textual; o corpo é `.nds-card-content` com o quadro de quem monta, e enquanto carrega, `skeleton` por cima. O ISOLAMENTO NÃO É DA PEÇA, e a fonte o diz duas vezes: o elemento desenha o que recebe "exatamente como veio, sem isolamento próprio", e a caixa de areia mora na faixa com runtime, que a §1 manda não ler como se fosse a peça. Quem monta isola, e o endereço passa por `isSafeUrl` no ponto em que encosta no DOM. Veio da família 4 — ver 5.3 |
| `image-generation` | `skeleton`, e é a mais barata de ler das 120 depois de `thread-list-sidebar`. **A peça nunca desenha imagem nenhuma**, e a fonte declara os quatro motivos: não aceita endereço de imagem, o degradê atrás da grade de pontos é um gráfico decorativo FIXO presente nos dois estados, "1024 × 1024" é literal no código e não campo, e o botão de gerar de novo não tem manipulador. O que resta é `.nds-aspect-ratio` com `--ratio` e `.nds-skeleton[data-shape="fill"]` dentro, mais a linha de baixo com o texto do pedido e um `.nds-button` `.nds-button-ghost` `.nds-button-icon-sm`. A própria fonte manda entregar a imagem de verdade a `image`, que esta tabela já resolveu em `aspect-ratio` + `skeleton` + `dialog`. A grade de 64 pontos com atraso escalonado é `13-animacao.md`, e desliga em `prefers-reduced-motion` (regra 8 da §8). Veio da família 4 — ver 5.3 |
| `web-search` | `.nds-chat-sources` com o termo procurado acima e o estado ao lado. A fila é a lista de fontes de um turno, que esta tabela já aponta em `sources`: `<ol class="nds-chat-sources">` com um `.nds-chat-source` por achado, e o `data-unsafe` que ela já carrega é justamente o que a segunda regra da folha da família 3 manda — o endereço recusado continua legível e deixa de ser link. Quando o produto quiser a fila alta em vez de etiquetas, cada linha é `.nds-item` com `.nds-avatar` `.nds-avatar-fallback` na inicial do domínio dentro de `.nds-item-media`, `.nds-item-title` no título e `.nds-item-description` no endereço. O termo procurado é `.nds-badge` com `.nds-font-mono` e a lupa do lucide — não é campo, porque não se edita o que já se procurou. O estado é `.nds-agent-status`, CONSTRUÍDO: ponto decorativo, rótulo em PALAVRA e relógio, com o `prefers-reduced-motion` da regra 8 da §8 já resolvido, onde a fonte deixa um "Searching" que só cintila. A contagem de fontes lidas é `.nds-badge` `.nds-font-mono` derivada do arranjo, e não o texto literal "Read 3 sources" que a fonte crava no arquivo instalado. A revelação um a um NÃO é peça: `visibleResults` é recorte do arranjo, e quem o move é o relógio de quem monta — a mesma leitura de `streaming` no `chat-thread`, que esta tabela já registra. `cycle` não atravessa: é chave de reconciliação do React, e o dono do assunto é `13-animacao.md`, como a vigésima segunda já leu no mesmo campo. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 3 — ver 5.3 |
| `research-report` | `.nds-agent-plan`, passo por passo, com uma linha de contagem acima. O `<ol class="nds-agent-plan">` já é a fila de seções: `.nds-agent-plan-marker` decorativo, `.nds-agent-plan-label` no título da seção, o estado em PALAVRA num `.nds-badge` e `.nds-agent-plan-detail` na prévia — quatro partes para as quatro que a fonte desenha —, e `aria-current="step"` na seção em curso, que é o que responde "onde estamos" sem depender do brilho do título, que é como a fonte separa dois dos três estados. O vocabulário é `PlanStep`: `heading` é `label`, `preview` é `detail`, e `pending\|writing\|done` é `PlanStepState` sem `failed` e sem `skipped` — uma seção que o agente decidiu não escrever é exatamente `skipped`, o estado que justifica o tipo existir, e ele continua na lista com o motivo em vez de sumir. A linha de contagem é `.nds-badge` com `.nds-font-mono` no molde `{feitas} de {total}`, palavra do idioma onde a fonte crava uma barra, com a contagem de fontes lidas ao lado. A contagem por seção é `.nds-badge` `.nds-font-mono` e some quando é zero, como a fonte já faz. **`Citation` não aparece nenhuma vez**: `sources` é número, e número não diz em que a seção se apoia — quando o produto quiser dizer, a fila de fontes da seção é `.nds-chat-sources`, acima nesta tabela. A borda entre linhas é o `gap` do `.nds-agent-plan`. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 3 — ver 5.3 |
| `memory-chips` | `.nds-composer-context`, CONSTRUÍDO, com outro conteúdo dentro. A `<ul class="nds-composer-context">` com nome é a fila de etiquetas do que vai junto sem ser carga, e cada `.nds-composer-context-item` já tem ícone decorativo, `.nds-composer-context-label`, `.nds-composer-context-detail` e `.nds-composer-context-remove` levando o nome do item no rótulo — que é literalmente o `Forget "…"` que a fonte escreve. O que a fonte chama de `change` cai no `data-automatic` que aquela folha já declara, e a decisão dela é a que falta aqui: o item que a pessoa não pôs "ganha a marca de automático, que é texto, não só a cor mais fraca", onde a fonte separa `existing` de `added` só por tinta e ainda desenha `added` e `updated` idênticos — que a regra 3 da folha da família 3 e a regra 4 da §8 recusam (WCAG 1.4.1). Sobrando duas palavras para três, quem carrega a terceira é `.nds-badge` em linha. O cabeçalho "lembrou N" é contagem derivada do arranjo, e contagem é `.nds-badge` `.nds-font-mono`; o nome da fila já vai no `aria-label` do `<ul>`, que é o que faz o leitor de tela anunciar quantas são antes de percorrê-las. O alvo de toque de 24 px do botão de esquecer é o mesmo que `.nds-composer-context-remove` já resolve (WCAG 2.5.8). **Não se monta com `.nds-tags-input-item`**, e é a única armadilha desta linha: aquele chip mora numa moldura de campo, e uma fila que não se digita não é entrada de texto. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 3 — ver 5.3 |
| `speaker-identity` | `chat-thread`, turno por turno. O `<li class="nds-chat-message" data-role="…">` já é a linha inteira: `.nds-chat-message-avatar` no distintivo com o ícone de quem fala, `.nds-chat-message-header` com `.nds-chat-message-author` no nome e o segundo campo ao lado — onde a thread já põe a hora e a fonte quer o modelo ou a duração —, e `.nds-chat-message-content` no corpo, que passa por `createMarkdown` com `isSafeUrl` onde a fonte entrega uma cadeia crua e, na linha de ferramenta, o JSON do argumento. O `kind` é `ChatRole` achatado e renomeado: `agent` é `assistant`, `system` se perde, e `tool` não é papel de quem fala — é `ChatToolCall`, que a mensagem já mostra em `.nds-chat-message-tools` e em `tool-group`. O agente de dentro é o que `subagent-list` e `agent-handoff` já resolveram nesta tabela, em `.nds-item-group` com o modelo em `.nds-font-mono`; o distintivo redondo contra o quadrado é `.nds-avatar` contra `.nds-item-media-icon`, as duas formas já lado a lado, e é a única distinção da fonte que não é tinta. **A hierarquia não se reproduz porque a fonte não a tem**: a faixa de runtime aninha, e a standalone que a §1 manda ler recebe o arranjo já achatado pelo exemplo da própria fonte. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 3 — ver 5.3 |
| `mcp-server-panel` | `accordion` de abertura única com `connection-state` por linha. O `.nds-accordion` é o `expandedId` da fonte; `.nds-accordion-trigger` traz o chevron e o `aria-expanded` que a regra 5 da §8 exige, e `.nds-accordion-content` o que se abre. O estado da linha é `.nds-connection-state`, CONSTRUÍDO — ponto decorativo, rótulo em PALAVRA dentro do `role="status"`, contagem para a próxima tentativa e o botão de ação —, e é ele que resolve as duas coisas que a fonte deixa em aberto: o ponto colorido com texto só para leitor de tela vira palavra visível, e a ação mora na mesma linha. `McpServerStatus` é `ConnectionState` com os pares trocados de nome — `connecting` é `reconnecting`, e `isRetryScheduled` é quem decide se há o que contar; `failed` é `disconnected` — e `needs-auth` é `waitsForPerson`, que `ToolCallState` `pending` já define junto com o desenho que a fonte erra: quem espera por uma pessoa **nasce aberto**, porque pedir autorização dentro de uma caixa fechada é pedir sem mostrar, que é a decisão 3 do `tool-group`. O cabeçalho "N de M ligados" é `.nds-badge` `.nds-font-mono` com a palavra do idioma; o transporte e a fila de ferramentas são `.nds-badge` num `.nds-cluster`, e as ferramentas chegam como cadeias, sem estado nenhum a desenhar. A versão cheia desta lista é `mcp-config`, acima nesta tabela, em `dialog` + `form` + `badge`. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 3 — ver 5.3 |
| `orb` | `connection-state` mais o medidor de nível do `composer-voice` — e a faixa standalone é **um `<canvas>` e mais nada**: o ponto de estado, o texto "Connecting..." e os botões de conectar, mudo e desligar a fonte só publica na faixa de runtime, e a §1 manda ler a outra. O que existe de portável é a linha do estado, e ela é `.nds-connection-state` nó por nó: `.nds-connection-state-dot` colorido pelo estado e `aria-hidden`, `.nds-connection-state-label` com `role="status"` levando a PALAVRA, `.nds-connection-state-action` para conectar ou desligar. O `connecting` da fonte não pede um quarto estado — `ConnectionState` já registra, com todas as letras, que a primeira tentativa desenha como a quinta. O nível de áudio entra por `--nds-voice-level`, que `.nds-composer-voice-bar` já lê como DADO de runtime, decorativo e `aria-hidden`, com o quadro de repouso sob `prefers-reduced-motion` já medido; mudo é `aria-pressed` no alternador, como o ditado já faz. **Falta uma utilitária, e está nomeada**: o medidor construído é uma fileira de cinco barras de 2 px escopada ao trilho do composer — uma forma do tamanho de foco, lendo o mesmo `--nds-voice-level` num `scale()`, é classe que falta, nunca folha. Ficam de fora o `variant` (`blue`, `violet`, `emerald`), que é paleta fora dos 42 tokens de tema (§9), e a animação em WebGL, que é código e dependência (§6) e cujo quadro de repouso é um círculo colorido — e cor sozinha não descreve estado (regra 4 da §8). Veio da família 7 — ver 5.3 |
| `voice-conversation` | a tela de uma chamada, e ela compõe CINCO peças já construídas: `connection-state` no `connecting`; `thinking-indicator` no `thinking`, que é exatamente "o lugar da resposta enquanto ela não chegou"; `agent-status` no `speaking`, cujo `stop` de `AgentStatusIntent` é o "interromper" da fonte, com rótulo que diz o que faz em vez de um alvo sem nome; `composer-voice` no `listening`, com o alternador de `aria-pressed`, o nível e a palavra do estado; e `chat-thread` na transcrição. `VoiceTurn` — `{ id, role, text }` — é o `SharedTurn` de `shared-conversation` de novo: o papel em duas palavras onde `ChatRole` tem três, e o turno inteiro numa cadeia onde `ChatMessageOptions` tem nove campos e `MessagePartKind` sete espécies de parte, com o `text` cru levando fala de modelo à tela sem `createMarkdown` e sem `isSafeUrl`. A legenda que nomeia o turno é a PALAVRA que as três linhas de estado já carregam, e "Mic off" é o rótulo do alternador quando mudo. `amplitude` é `--nds-voice-level`; `muted` é o booleano do alternador; `onToggleMute` e `onEnd` são espaço de ação (§2). Sem turno nenhum, `empty.css`. Veio da família 7 — ver 5.3 |
| `checkpoint-history` | `.nds-item-group` de `.nds-item` `data-size="sm"`, uma linha por ponto de retorno — a mesma fila que `subagent-list`, `background-inbox` e o histórico de `schedule-card` já montam nesta tabela. O rótulo é `.nds-item-title`; o carimbo e a contagem de arquivos, os dois já escritos por quem monta, são `.nds-badge` com `.nds-font-mono`; restaurar é `.nds-button` `.nds-button-ghost` em `.nds-item-actions`, aparecendo no `:hover` E no `:focus-within` e permanecendo na ordem de foco, que é a regra 3 da §8 e o que `.nds-chat-message-actions` já desenha. A linha corrente leva `aria-current="true"`, `.nds-item-muted` e a palavra "atual" em `.nds-badge` — a palavra, porque as linhas à frente se separam das outras só por opacidade e por um furo no ponto, que a regra 4 da §8 recusa; é a mesma decisão que `agent-plan` escreveu ao dizer que "onde estamos" também precisa chegar ao olho. Sem ponto nenhum, `empty.css`, como na décima sétima e na vigésima terceira. `Checkpoint` não declara estado NENHUM: os três desenhos saem da POSIÇÃO da linha em relação a `currentId`, que é a comparação com um contador da décima primeira correção, e `files: number` obrigaria a peça a escrever "4 arquivos", que é decisão de idioma. Veio da família 2 — ver 5.3 |
| `spec-sheet` | `.nds-card` com uma lista de definição dentro. `.nds-card-header` leva o título em `.nds-card-title` e a legenda em `.nds-card-description`, a segunda linha que a grade do cabeçalho já abre com `:has(> .nds-card-description)`; o corpo é um `<dl>`, com o rótulo em `<dt>` levando `.nds-font-mono` e o valor em `<dd>` alinhado ao fim. **A lista de definição é a decisão desta linha, e esta casa já a tomou duas vezes**: "Rótulo: valor" põe o pareamento na pontuação, e pontuação não sobrevive à navegação por lista de um leitor de tela — é a decisão 2 do `approval-card` e a decisão 1 do `message-timing`, palavra por palavra. `emphasis` é `.nds-font-semibold` mais `--foreground` contra o `--muted-foreground` das outras linhas — peso E cor, porque brilho sozinho é a codificação que a regra 4 da §8 recusa; e ele é o booleano que só ENFEITA, que é a oitava forma do sinal. `visibleCount` é revelação, e revelação é `13-animacao.md`. **Falta uma utilitária, e está nomeada**: nada em `docs/shared/styles/` desenha lista de definição fora de `.nds-approval-card-scope` e `.nds-message-timing-stats`, as duas escopadas à própria peça — o par termo/valor genérico é utilitária, nunca folha. Veio da família 4 — ver 5.3 |
| `comparison-card` | `.nds-grid[data-cols="2"]` de `.nds-card`, um cartão por opção. O `auto-fit` com `minmax` que aquela utilitária já declara empilha sozinho quando a coluna encolhe, pelo espaço do container e sem consulta de mídia, onde a fonte crava um ponto de quebra. Cada cartão leva o nome em `.nds-card-title`, a linha embaixo em `.nds-card-description` e os traços em `.nds-item-group` de `.nds-item` `data-size="sm"`, com o ícone do lucide em `.nds-item-media` `.nds-item-media-icon`; a recomendada leva `aria-current` e a PALAVRA em `.nds-badge`, e não o tingido sozinho. O traço ausente é o rótulo comum atrás do ícone de menos — forma e palavra, onde a fonte o separa do presente por ícone e opacidade. `reason` é o `<p>` abaixo da grade. **Onde a composição fica mais fina que a fonte**: lá `traitLabels` só aparece como recuo do que falta, então a correspondência posicional entre um cartão e outro nunca chega a quem lê — quando o produto quiser dizê-la, é `table` com uma coluna por opção e os rótulos na primeira, que é a mesma fila com cabeçalho. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 4 — ver 5.3 |
| `score-breakdown` | `.nds-item-group` de `context-display` na forma `bar`, com o cabeçalho acima — é a família 5 com outro denominador, exatamente o que a linha de `retrieval-chunks` nesta tabela já previa. O total é `.nds-context-display-value`, o teto é `.nds-context-display-detail` e o veredito é `.nds-badge`, que chega como PALAVRA pela própria fonte (`verdict` é `string`); a cor da etiqueta segue a palavra, e não um limiar, porque na fonte os dois são independentes e podem discordar na mesma tela. Cada critério é `.nds-context-display[data-form="bar"]` com o rótulo, o peso em `.nds-badge` com `.nds-font-mono` e a nota em `.nds-item-description`. A conta é `spentFraction` de `token-budget.ts`, que já recebe um par de números sem exigir `TokenUsage`; **`fractionLevel` NÃO se reaproveita**, e o motivo vale escrito: lá a fração alta é ruim e aqui é boa, e limiar com a polaridade invertida é outro cálculo, não outro valor. `weight` não entra na largura da barra — a própria fonte declara que dois critérios de mesma nota desenham barras idênticas por mais diferente que seja o peso. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 4 — ver 5.3 |
| `recommendation-card` | `approval-card`, campo por campo. `.nds-approval-card-ask` com `role="status"` leva a pergunta em `.nds-approval-card-question`; o corpo entra pelo encaixe entre `-ask` e `-actions` que `elicitation-form` já nomeou nesta tabela, e pelo mesmo motivo, que a região viva fecha antes dele; aceitar e ver alternativas são `.nds-approval-card-actions`, o espaço de `HTMLElement[]` da §2. O assentado NÃO é estado: é o `.nds-badge` que ocupa a fila de ações depois de decidido, a mesma leitura que `reviewable-diff` já fez nesta tabela. As três barrinhas de confiança não se reproduzem — a própria fonte declara que são "uma forma fixa, três alturas, sempre as mesmas", e não a leitura de valor nenhum; quem carrega a confiança é a palavra, que já chega pronta, num `.nds-badge`. O controle sem manipulador vai DESABILITADO, e não vivo: a fonte desta entrada deixa "o botão desenhado, sem nada a chamar", e controle cujo nome promete o que ele não faz é o defeito que a regra 7 da §8 recusa — a fonte de `canvas-split`, nesta mesma tabela, já desabilita os dela pelo mesmo motivo, e desabilitar em vez de sumir mantém a largura da linha estável entre os dois casos. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 4 — ver 5.3 |
| `timeline` | `.nds-agent-plan`, uma linha por evento, com o instante à esquerda. O `<ol class="nds-agent-plan">` já tem o ponto (`.nds-agent-plan-marker`, redondo e tingido por estado), o título (`.nds-agent-plan-label`), a nota (`.nds-agent-plan-detail`) e `aria-current="step"` no corrente; `when` é `PlanStepState` com duas palavras a menos — `past` é `done`, `now` é `running`, `future` é `pending` —, e o instante, que chega já escrito como texto, é `.nds-badge` com `.nds-font-mono`, como em `schedule-card`. **A FONTE CHAMA DE EIXO O QUE OS TIPOS PROVAM NÃO SER**: `time` é `string`, a peça nunca ordena por ele, e as linhas ficam igualmente espaçadas — nenhum valor decide posição nenhuma. **Não se monta com `stepper`**, e é a armadilha desta linha: `.nds-stepper-trigger` é um `<button>`, e evento de linha do tempo não tem chamada de volta nenhuma — a fila ganharia N controles que não fazem nada, que é o defeito que `message-branches` recusou noutro traje. **Falta uma utilitária, e está nomeada**: o trilho vertical entre dois pontos, que `.nds-agent-plan` não desenha e que `.nds-stepper-separator` só sabe na horizontal (`height: 1px` com `min-width`) — regra de uma linha na calha do plano, utilitária e nunca folha. Veio da família 4 — ver 5.3 |
| `file-tree` | `.nds-item-group` de `.nds-item` `data-size="sm"`, com o cabeçalho de totais acima. O nome é `.nds-item-title` com `.nds-font-mono` e `.nds-truncate`; a pasta é a mesma linha com `.nds-item-muted` e o ícone do lucide em `.nds-item-media` `.nds-item-media-icon`; os dois contadores vão em `.nds-item-actions`, num `.nds-cluster[data-spacing="xs"]` de `.nds-badge nds-badge-success` / `.nds-badge nds-badge-destructive` com `.nds-font-mono` — o desenho que a sexta correção deu a `TimelineStat` e que `code-diff` já reusa nesta tabela. O cabeçalho é o mesmo par mais a contagem de arquivos, derivada do arranjo: a própria fonte a escreve com `reduce`, do lado de fora da peça. **NÃO HÁ ÁRVORE**, e a fonte o diz numa frase: a linha de pasta é "um cabeçalho estático, não interativo, nunca um pai de verdade das linhas abaixo, e nunca recolhe" — sem `role="tree"`, sem `aria-level`, sem `aria-expanded`, e sem ajudante de caminho para árvore em lugar nenhum da biblioteca. **Falta uma utilitária, e está nomeada**: recuo por linha a partir de propriedade personalizada — `.nds-sidebar-menu-sub` recua ANINHANDO marcação, e nada em `docs/shared/styles/` recua uma lista plana por um número; vale reparar que o ajudante da própria fonte só emite `depth` 0 e 1. Veio da família 4 — ver 5.3 |
| `artifact-card` | `.nds-item` `.nds-item-outline`, a mesma fila que `background-inbox`, `checkpoint-history` e `document-reference` já montam nesta tabela. O ícone é `.nds-item-media` `.nds-item-media-icon`, o título é `.nds-item-title`, que já corta em uma linha, e a legenda é `.nds-item-description`; a contagem de palavras é `.nds-badge` com `.nds-font-mono`. O estado é `RunStatus` inteiro no lugar do booleano da fonte, que ela mesma preenche mapeando QUATRO palavras para `false`. A seta que só aparece no `:hover` vai também no `:focus-within` e fica na ordem de foco (regra 3 da §8), e o cartão que a fonte desenha com resposta de botão sem manipulador nenhum é `.nds-item` como `<button>`, com nome acessível textual (regra 7 da §8). O brilho de "escrevendo" é revelação, e revelação é `13-animacao.md`. Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 4 — ver 5.3 |
| `canvas-split` | `resizable` com `chat-thread` num painel e `.nds-card` no outro — a mesma composição que `assistant-sidebar` já resolveu nesta tabela. `.nds-resizable[data-direction="horizontal"]` leva dois `.nds-resizable-panel` com `--panel-size`, e o punho é `.nds-resizable-handle` com `role="separator"` e `tabindex="0"`, que desde o conserto de contraste desenha em `--ring` e passa dos 3:1 que a WCAG 1.4.11 pede de um controle que se precisa achar para arrastar. **A peça dá MENOS que o painel redimensionável, e não outro nome para ele**: não há punho, não há tamanho de painel e não há chamada de volta de redimensionamento em lugar nenhum da fonte — o que ela tem é uma consulta de mídia, e `.nds-grid[data-cols="2"]` já empilha sozinha pelo espaço do container, sem ponto de quebra, para quem não quiser o punho. O documento é `.nds-card`: título em `.nds-card-title` `.nds-truncate`, versão e a palavra do estado em `.nds-badge` dentro de `.nds-card-action`, copiar e fechar ali ao lado, e o corpo em `.nds-card-content`. `speaker` é `ChatRole` achatado pela TERCEIRA vez, depois de `SharedTurn` e `VoiceTurn`, e com a mesma perda; o cursor piscando é `13-animacao.md`, e desliga em `prefers-reduced-motion` (regra 8 da §8). Nenhuma classe nova, e nenhuma nomeada como faltando. Veio da família 4 — ver 5.3 |
| `logos` | **fora** — marca registrada. Vira espaço para `HTMLElement` |

### 5.2 As famílias novas (34)

Construir **por família**, não por slug. Dentro de uma família as peças dividem
geometria, estados, tokens e — o que mais importa — a folha. Construir slug a
slug produz **uma folha por componente em vez de uma por família**, e isso não é
sistema, é pilha.

*(Aqui havia "83 folhas". Saiu pelo mesmo motivo que os outros números móveis
desta seção: era a contagem de uma leitura do catálogo que a construção corrigiu
trinta vezes, e ninguém a atualizou. O argumento nunca dependeu do valor — a
razão entre componentes e folhas está nos números que a tabela abaixo carrega, e
ela só ficou mais forte à medida que a triagem encolheu o catálogo sem encolher
o número de famílias.)*

**Eram sete, e são cinco.** A 6 dissolveu-se inteira na vigésima sexta correção
e a 7 na vigésima nona, e as linhas delas ficam na tabela como `diff-hunks.ts`
ficou na §3.2, pelo mesmo motivo: quem vier atrás precisa saber que foram
consideradas e por que não nasceram. Família que perde todas as entradas não
nasce menor — não nasce.

**O que o parêntese de cada linha conta, porque a redação engana**: "(N no
catálogo)" é o que a família tem **AGORA**, depois das saídas — nunca o que ela
tinha no começo, apesar de "no catálogo" sugerir o contrário. **N** são as
entradas restantes e conta para a soma do cabeçalho desta seção; **componentes**
são menos que N
quando uma entrada absorveu outra, e é essa a contagem do que há para construir.
Duas portas já leram este parêntese ao contrário, e uma terceira deixou a
família 6 declarando 8 entradas com 7 componentes depois de a saída já ter sido
escrita — soma 121, invisível porque o cabeçalho continuava dizendo 120. Ao
mover uma entrada, mexa nos DOIS números e reconte família a família a partir
desta tabela, nunca pelo próprio delta.

| Família | Folha | Peças | O eixo comum |
|---|---|---|---|
| **1. Composer** | `composer.css` | `composer`, `composer-attachments`, `composer-context`, `composer-model-picker`, `composer-trigger-popover` (absorve `composer-mentions` e `composer-slash-commands` — ver 5.3), `composer-voice`, `quote`, `draft-restore`, `message-queue` (11 no catálogo — `edit-message` e `mobile-composer` saíram para a 5.1, ver 5.3 —, **9 componentes**, e a família está FECHADA) | Uma superfície de entrada com um trilho de controles. Tudo pende de `textarea` + `popover` ancorado ao cursor. Primitivo: `composer-trigger.ts` |
| **2. Execução do agente** | `agent-run.css` | `agent-status` (absorve `stopped-run`, que é `RunStatus` `stopped` — ver 5.3), `thinking-indicator`, `agent-plan` (absorve `todo-list` — mesmo desenho, mesmos estados, mesmo vocabulário), `job-progress`, `tool-group` (absorve `tool-error`, que é `ToolCallState` `failed`), `terminal-block`, `computer-use`, `connection-state`, `approval-card` (absorve `permission-grant` — mesma API, ver 5.3) (13 no catálogo — `agent-card`, `tool-timeline`, `code-runner`, `guardrail-notice`, `subagent-list`, `agent-handoff`, `background-inbox`, `elicitation-form`, `schedule-card` e `checkpoint-history` saíram para a 5.1, ver 5.3 —, **9 componentes**, e a família está FECHADA) | Todas respondem "o que está acontecendo, há quanto tempo, e o que eu posso fazer a respeito". Estados de `RunStatus` e `ToolCallState`; base em `collapsible`, `progress`, `badge` |
| **3. Evidência e procedência** | `evidencia.css` | `inline-citation` (1 no catálogo — `document-reference`, `retrieval-chunks` e `confidence-marker` saíram para a 5.1 na décima sexta, na décima oitava e na vigésima primeira; `web-search`, `research-report`, `memory-chips`, `speaker-identity` e `mcp-server-panel` saíram em LOTE na vigésima oitava, ver 5.3 —, **1 componente**) | Em que a resposta se apoia. **A folha está de pé com uma entrada só**, e a pergunta que a décima oitava abriu está respondida: das nove entradas originais, oito colapsaram e uma sobreviveu. `Citation` continua sendo o teste — nenhuma das oito a carregava, e a que ficou coube nela sem sobra. Base em `hover-card`, `popover`, `badge`: MATERIAL, e é por isso que a família nasceu, ao contrário da 6. O que era peça pronta estava nas ENTRADAS, não nesta coluna — ver 5.3 |
| **4. Resposta estruturada** | `resposta-estruturada.css` | `flow-graph`, `trace-waterfall`, `activity-graph` (absorve `heat-graph`, que é a mesma grade com menos — ver 5.3) (4 no catálogo — `code-diff` e `reviewable-diff` saíram para a 5.1 na vigésima segunda e na vigésima quarta, `diagram`, `mermaid-diagram`, `math-block`, `map-answer`, `web-preview` e `image-generation` na vigésima sétima, e `spec-sheet`, `comparison-card`, `score-breakdown`, `recommendation-card`, `timeline`, `file-tree`, `artifact-card` e `canvas-split` na trigésima segunda, as duas últimas em lote, ver 5.3 —, **3 componentes**, e a família está FECHADA). **As três sobreviventes estão medidas** — `flow-graph`, `trace-waterfall` e `activity-graph`, na trigésima primeira —, e é uma delas que funda a folha. É a última família a fechar e a que mais encolheu: dezoito entradas quando a vigésima sétima a abriu, três componentes no fim | A forma com que o modelo responde quando não é texto. Base em `card`, `table`, `chart` — e essa coluna é MISTA, o que a vigésima sétima mediu entrada por entrada: `card` é material, `table` e `chart` são peças prontas. **Primitivo nenhum**: `diff-hunks.ts` era o previsto, e a vigésima quarta correção o dispensou depois de medir as duas entradas que o justificavam — ver §3.2. **Dependências — §6, e os dois parágrafos que a vigésima sétima e a trigésima primeira acrescentaram lá**: as quatro entradas que a seção nomeia estão triadas, mais a quinta que a trigésima primeira encontrou, e nenhuma pediu decisão da dona. O que separa as três que ficaram das dezesseis que saíram é a pergunta da trigésima primeira, corrigida pela trigésima segunda: não é posicionar contra empilhar — é **quem CALCULA a posição** |
| **5. Medição** | `medicao.css` | `context-display`, `context-breakdown`, `cost-meter`, `message-timing`, `quota-banner` (5 — `reasoning-effort` saiu para a 5.1, ver 5.3) | O mesmo número em formas diferentes — anel, barra, texto, repartição — e, sem teto, só texto. Primitivo: `token-budget.ts`, para as que têm denominador; `message-timing` mede TEMPO, não tem teto e por isso não lê conta nenhuma — a triagem dele foi refeita ao construir, confirmou o slug, e o porquê está no bloco "Tempo de uma resposta" da folha. O eixo é o que se MEDE: quem ESCOLHE quanto esforço aplicar não mede nada, e por isso não é desta família |
| **6. Navegação da conversa** *(DISSOLVIDA — não nasce)* | nenhuma | Nenhuma. As oito saíram para a 5.1: `message-branches` na vigésima quinta; `regenerate-menu`, `conversation-search`, `thread-search`, `thread-list`, `thread-list-sidebar`, `shared-conversation` e `onboarding` na vigésima sexta, em lote (0 no catálogo, **0 componentes**) | Era "achar e trocar de lugar sem perder o seu", com base em `sidebar`, `command`, `pagination` e `stepper.css` — e as quatro bases eram as próprias peças. `conversa-nav.css` não é fundada. Ver 5.3 |
| **7. Voz** *(DISSOLVIDA — não nasce)* | nenhuma | Nenhuma. As três saíram para a 5.1: `read-aloud` na décima nona; `orb` e `voice-conversation` na vigésima nona, em lote (0 no catálogo, **0 componentes**) | Era "áudio ao vivo, com estado de conexão e legenda", com base em `media-player` — e as três palavras do eixo já tinham dono no dia em que a linha foi escrita: a fonte ao vivo é `stream` no próprio `media-player`, o estado da ligação é `connection-state` da família 2, e a legenda é `<track>`. `voz.css` não é fundada. Ver 5.3 |

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

**Décima oitava correção, e a décima segunda que atravessa de 5.2 para 5.1**:
`retrieval-chunks` é `.nds-item-group` de `Citation` — e as duas contagens mudam
junto, 71 → 70 e 49 → 50. É a segunda a sair da família 3, e a primeira em que
colapsa justamente a peça que a correção ANTERIOR usou como régua para matar
outra.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`RetrievalChunk { id, source: string, locator: string, score: number, text:
string }` e, no componente, `query: string`, `chunks: readonly
RetrievalChunk[]`, `visibleCount: number`, `searching: boolean` e `className`.
Cinco entradas no componente, cinco campos na linha, e chamada de volta
NENHUMA — a terceira entrada triada que não devolve nada a quem monta, depois da
lista de trabalhadores e da passagem. A metade de runtime é um render de
FERRAMENTA (`args.query`, `result.chunks`, `status.type`), e não porta (§1). A
anatomia são três blocos: uma etiqueta com o termo procurado e um ícone de banco
de dados; uma linha de estado que diz "Recuperando" com cintilação, ou a
contagem de trechos; e a fila de cartões, cada um com fonte, lugar, pontuação,
trecho e a barra da pontuação.

**A FONTE NÃO TEM NADA DENTRO DE TEXTO, E A FILA NÃO TEM NADA ALÉM DA FILA** — e
é essa medida dupla que responde as duas reversibilidades e decide todo o resto.

Antes dos três testes, as duas perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **A pontuação de relevância é DESENHO ou é NÚMERO? É número, e nos dois
  caminhos ele já tem dono.** Vale aqui a fórmula da oitava correção, palavra por
  palavra: ordinal sem grandeza vira etiqueta, ordinal com grandeza vira o
  medidor que já existe. Se a pontuação for palavra, é `.nds-badge` com
  `.nds-font-mono`, onde a quinta, a décima primeira, a décima segunda e a décima
  sétima correções já puseram todo valor técnico. Se for barra ou anel, é
  `.nds-context-display[data-form="bar"]` com outro denominador — e aí é a
  família 5, cujo eixo é medir contra um teto, não esta; decidir a folha da 5 de
  dentro da 3 é o que a sexta correção recusou fazer com `TimelineStat`. Nenhum
  dos dois caminhos é geometria nova, e a decisão 1 daquele bloco já diz o que a
  barra é quando existe: **o medidor é decorativo e o número é TEXTO**.

  E o desenho que a fonte dá à pontuação é justamente o que esta família não pode
  herdar: o texto fica esmeralda a partir de 0,8 e apagado abaixo disso, que é
  limiar carregado só por COR — a regra 3 desta folha o troca pela palavra, e a
  regra 4 da §8 o proíbe (WCAG 1.4.1). Tirada a cor, sobra o número.

  Há um terceiro caminho, e é ele que fecha: **se a pontuação for vocabulário de
  verdade, o dono dela é `confidence-marker`** — a irmã não construída desta mesma
  família, cujo eixo é "o quanto se pode confiar", escrito na primeira linha do
  cabeçalho da folha. Fixá-lo daqui seria decidir uma peça antes de ler a fonte
  dela. O que se faz é apontar, e está apontado na cláusula abaixo.

- **O que a fila de trechos tem que a `.nds-item-group` não tem? NADA — e as
  quatro candidatas foram medidas uma a uma na fonte.** *Recorte de texto longo*:
  a fonte escreve que o trecho fica preso a duas linhas e não expande sozinho, e
  `.nds-item-description` já declara `-webkit-line-clamp: 2` — o mesmo número,
  sem regra nova. *Marca do termo procurado dentro do trecho*: **não existe na
  fonte** — o termo aparece uma vez, na etiqueta de cima, e nunca dentro do
  trecho. *Ordenação visível*: não há; as linhas chegam na ordem, que é a mesma
  regra de `ToolGroupOptions.calls` que a sexta correção já leu. *Agrupamento por
  fonte*: não há — as linhas são irmãs, e a própria fonte avisa que não filtra
  nem ordena nada, e que filtrar por relevância é de quem monta. As quatro que
  poderiam ser desenho ou são dado que quem monta passa, ou não estão lá.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a fila não deixa buraco — e a fonte mesma já
  diz de que ela é feita, pela nona vez nesta seção: a etiqueta do termo lê a
  superfície `field` compartilhada, os cartões leem `paper`, e o lugar e a
  pontuação leem `mono`, os três de `surfaces.tsx`. Superfície compartilhada
  declarada na origem — a leitura da quinta, da sétima, da décima, da décima
  primeira, da décima segunda, da décima quarta, da décima quinta e da décima
  sétima correções, e o oposto exato do que a nona leu em `computer-use`.

  A composição são os três blocos, empilhados em `.nds-stack[data-spacing="sm"]`,
  que é a raiz que a oitava e a décima segunda correções já leram para uma pilha
  e nada mais. O termo procurado é `.nds-badge` com o ícone lucide de banco de
  dados, que `.nds-badge > svg` já dimensiona e alinha. A linha de estado é
  `agent-status` inteiro: a PALAVRA de `RunStatus` em `.nds-agent-status-label`,
  com a contagem de trechos ao lado — a mesma leitura que a décima sétima fez ao
  pôr o estado da execução em cada linha da caixa. A fila é `.nds-item-group` de
  `.nds-item` `.nds-item-outline` `data-size="sm"`: `.nds-item-title` com o título
  da fonte, `.nds-item-description` com o trecho, e `.nds-item-actions` com o
  lugar e a pontuação em `.nds-badge` com `.nds-font-mono`.

  **Nenhuma classe nova, e — ao contrário do `document-reference` — nenhuma
  nomeada como faltando.** Aquele precisou de duas: o quadrado tingido atrás do
  ícone, e o fundo da linha corrente. Esta não precisa de nenhuma, porque não tem
  ícone por linha e não tem linha corrente — não tem sequer seleção. **A fila não
  estreitada pede MENOS do que a estreitada**, e essa é a medida mais direta de
  que o desenho não é dela.

  Dois traços a composição não reproduz, os dois por decisão já escrita. A
  cintilação do "Recuperando" é revelação, e revelação é animação
  (`13-animacao.md`) — a mesma leitura que a 5.1 já fez em `streaming-text`,
  `loading-state` e `number-ticker`, e que a sétima correção repetiu para a
  entrada escalonada das linhas de saída. E o limiar da pontuação por cor é a
  codificação que a regra 4 da §8 troca pela palavra.

  Onde fonte e composição DISCORDAM, a composição está mais fina, como na oitava,
  na décima primeira, na décima quarta, na décima quinta e na décima sétima: a
  fonte desenha o cartão sem endereço nenhum, e aqui cada linha carrega
  `ChatSource` inteiro, com `isSafeUrl` no ponto em que o endereço encosta no DOM
  e o título continuando legível quando o endereço é recusado (regra 2 desta
  folha).

- **Estado, não.** É o parágrafo do sinal, e ele disparou pela oitava vez, sétima
  como achatamento: `searching: boolean` sabe fazer dois desenhos — cintilando, e
  com a contagem — onde `RunStatus` tem cinco palavras, e os três que se perdem
  são `idle`, `stopped` e `failed`. A perda é medível contra a PRÓPRIA FONTE, que
  na faixa de runtime declara quatro palavras e as achata em duas ao chegar na
  forma standalone: ela perde informação que ela mesma tinha. E vale medir contra
  a peça em que colapsa: a recuperação que falhou e a que nem começou desenham
  iguais à que terminou sem nada, e "0 trechos" é exatamente a leitura que a
  decisão de `jobProgressValue` existe para impedir — vazio não pode parecer
  começo.

  `visibleCount` não é estado, é FATIA — e a §2 já a entrega a quem monta, que
  passa `chunks.slice(0, n)`. É literalmente o `visibleSteps` que a sexta correção
  leu em `tool-timeline`, com outro nome, e inclusive com o mesmo recorte
  defensivo que a fonte descreve: aparar a entrada é conta de quem monta, não
  desenho.

  E a sub-regra do sinal fica calada por FALTA DE OBJETO: não sobra chamada de
  volta nenhuma para ler. É a terceira entrada assim, depois da lista de
  trabalhadores e da passagem, e nas três o desfecho foi o mesmo.

- **Vocabulário, não — e desta vez ele está achatado num campo e certo em outro.**
  `id` é endereço de linha, e `ChatToolCall.id` e `PlanStep.id` já o declaram com
  o mesmo docblock, que é a leitura da décima sétima. `text` é `Citation.excerpt`
  renomeado, como o `quote` da décima sexta. `locator` é `Citation.anchor`, e aqui
  a fonte ACERTA onde a irmã errava: cadeia, e não número — que é exatamente o
  estreitamento que a décima sexta mediu em `DocumentAnchor.page`. A mesma origem
  escreve o campo certo numa entrada e errado na outra, e o vocabulário desta casa
  já tinha o certo para as duas. Sobram dois:

  · `source: string` é `ChatSource` ACHATADO, e perde o `url`. É o defeito que a
    décima terceira reprovou em `Source.domain` e a décima sexta mediu em
    `document-reference`, agora na forma mais crua das três: lá havia um título e
    uma contagem de páginas, aqui há uma cadeia só. Trecho recuperado sem endereço
    é procedência que ninguém pode conferir, e a segunda regra desta folha fica
    sem objeto pela segunda vez.
  · `score: number` é o único campo sem par, e é ele que teria de salvar a peça.
    Não salva, e o motivo é o que separa esta leitura da nona: `x` e `y` eram um
    EIXO que nada aqui descrevia — posição num espaço contínuo —, e uma fração de
    0 a 1 não é eixo novo. `Attachment.progress` já declara uma, com essas
    palavras ("De 0 a 1"), e `JobCount` e `TokenUsage` já entregam as outras duas
    formas do mesmo número. O que falta não é o tipo: é o DONO, e ele está na irmã
    não construída desta família ou na folha da 5 — nos dois casos, fora desta
    entrada.

E o teste da família, que é o quarto: **ela responde ao eixo, e responde
repetindo a fundação.** Cada linha é uma `Citation` — a fonte, o trecho e onde
dentro dela —, e a fila é a lista dessas citações. É a frase com que a décima
sexta fechou, e ela vale aqui com mais força, porque esta é a fila NÃO
estreitada: **uma peça cujo desenho é a decisão da fundação desenhada não é uma
peça; é a prova de que a fundação está certa.** E vale o traço nos três formatos
que a décima primeira, a décima segunda e a décima quinta nomearam — repetir não
é desenhar, emparelhar não é desenhar, e estreitar também não —, com esta sendo a
primeira em que o que se mede é o primeiro dos três, sozinho.

**As duas reversibilidades que apontavam para cá, respondidas:**

- **`inline-citation` (décima terceira) CONFIRMA, e a cláusula fecha inteira.** A
  condição era: ao construir `document-reference` ou `retrieval-chunks`, a marca
  dentro do texto aparecer sem geometria própria — uma prévia que coubesse num
  cartão de ponteiro, sem alvo de toque em conflito com a entrelinha, e sem o
  caminho de abertura por clique. A décima sexta respondeu a primeira metade;
  esta responde a segunda, e pelo mesmo motivo: **esta fonte não tem marca nenhuma
  dentro de texto.** Não há parágrafo, não há âncora numa frase, não há ponteiro e
  não há abertura — não há sequer uma chamada de volta que pudesse abrir alguma
  coisa. O que ela tem é uma fila que mora AO LADO da resposta, e a única coisa
  que ela empresta da marca é o conteúdo da caixa, que é `Citation` e portanto da
  fundação, não da peça.

  Vale ser exato sobre o MECANISMO, porque a cláusula dizia "ao construir" e esta
  peça também não será construída — mesma situação da décima quarta e da décima
  sexta, e mesma resposta: a verificação se faz pela LEITURA da fonte, e ela
  responde inteira. As duas peças que a cláusula mandava verificar foram
  verificadas, e ela não tem mais metade de pé. `inline-citation` fica na 5.2, e
  segue sendo a única da família 3 construída.
- **`document-reference` (décima sexta) CONFIRMA, e os dois gatilhos ficam
  mudos.** A condição do primeiro era fila de citações com desenho, estado ou
  vocabulário próprios: uma linha que não coubesse num `.nds-item` sem regra nova
  além das duas nomeadas, um estado por citação que a seleção não modelasse, ou o
  lugar dentro da fonte pedindo tipo que `Citation.anchor` não desse. Os três
  falham, e o terceiro falha ao contrário do temido — `locator` é exatamente
  `string`, que é o que `Citation.anchor` dá. Não há estado por linha, e não há
  sequer seleção: a peça não devolve nada. E a linha cabe num `.nds-item` sem
  NENHUMA das duas utilitárias que aquela correção teve de nomear. O segundo
  gatilho — se `retrieval-chunks` pedisse desenho próprio para a fila, quem
  desenha a fila passaria a ser ela — não dispara: ela não pede. A linha da 5.1 de
  `document-reference` continua apontando `item.css`.

**E uma leitura que esta correção obriga a escrever, porque é da FAMÍLIA e não da
peça.** A décima sexta matou `document-reference` chamando-o de "essa fila
ESTREITADA a uma fonte só e sem a pontuação". A fila não estreitada acaba de ser
lida — com fonte, lugar, pontuação e trecho — e também não tem desenho próprio, e
ainda pede menos classe que a estreitada. As duas leituras juntas dizem uma coisa
só, e ela vale para o que falta da família 3: **nesta família, o que tem desenho
próprio é o que vive DENTRO do texto corrido; o que mora AO LADO da resposta é
lista, e lista é `item.css`.** `inline-citation` sobreviveu por ser o primeiro
caso — a geometria de um elemento que interrompe um parágrafo —, e as duas filas
colapsaram por serem o segundo.

Isto NÃO decide as cinco que faltam, e é preciso dizer por quê: decidir a folha de
uma peça antes de ler a fonte dela é o que a sexta correção recusou fazer com
`TimelineStat`, e o que a décima sétima recusou com a caixa da família 6. O que a
leitura faz é dizer ONDE olhar ao ler as próximas — se a peça vive dentro do texto
ou ao lado dele — e apontar as duas mais parecidas na cláusula abaixo. Se
`web-search` e `research-report` também colapsarem, o que estará em causa não é
mais uma peça: é a folha da família 3 ter uma entrada só, e isso se decide ali,
com as três leituras na mão.

**Reversível**, como as outras dezessete: se ao construir `web-search`,
`research-report` ou `confidence-marker` aparecer fila de trechos com desenho,
estado ou vocabulário próprios — uma linha que não caiba num `.nds-item` sem regra
nova, um estado por trecho que a fila não modele, ou a pontuação de relevância
pedindo desenho que nem `.nds-badge` nem o medidor da família 5 deem —,
`retrieval-chunks` desdobra de volta para a 5.2, com o motivo. E há um segundo
gatilho, deste lado: se `confidence-marker` fixar a pontuação como vocabulário
desta família, quem desenha a pontuação passa a ser ela, e esta linha da 5.1 passa
a apontá-la em vez de apontar `.nds-badge` — e continua não sendo peça.

Contagens desta correção, somadas família a família: 1 tem 11, 2 tem 16, 3 tem 7,
4 tem 20, 5 tem 5, 6 tem 8 e 7 tem 3 — **70** na 5.2, e a 5.1 em **50**. Somam
120. A família 3 fica com **7 componentes**.

**E os cabeçalhos não dizem 50 e 70, porque uma segunda porta moveu os mesmos
dois números na mesma passada**: a da família 7 colapsou `read-aloud`, e as duas
tabelas já a trazem — a linha da 7 na 5.2 já diz **2 componentes**, e a linha
dela está na 5.1. Com as duas
correções, a 5.1 fica em **51** (49 linhas contadas no arquivo, e duas delas
carregam duas entradas) e a 5.2 em **69**: 11 + 16 + 7 + 20 + 5 + 8 + 2, e as
sete somam 63. Somam 120, e é isso que os cabeçalhos dizem.
Vale registrar o mecanismo, porque ele vai repetir: **contador compartilhado com
duas portas vivas não se lê do delta de nenhuma das duas — lê-se das tabelas**,
que são o único lugar onde as duas escreveram. Quem soma depois soma o arquivo,
não a própria passada.

E uma nota sobre o parêntese das linhas da 5.2, porque ela já custou uma leitura
errada nesta passada: **o número ali é o que a família tem AGORA na 5.2, e não o
que ela tinha no catálogo** — a palavra "catálogo" sugere o contrário. É por isso
que a linha da 1 diz 11 e não 13, e a da 5 diz 5 e não 6: as duas foram baixadas
quando as suas entradas saíram. Confere-se somando a linha contra o "N tem M"
desta seção, que é o mesmo número por construção; a diferença para o **M
componentes** ao lado é só o que foi absorvido — quatro na 2, duas na 1, nenhuma
na 3.

**Décima nona correção, e a décima terceira que atravessa de 5.2 para 5.1**:
`read-aloud` é a barra do `media-player` sobre a mensagem que o `chat-thread` já
desenha — e as duas contagens mudam junto, 70 → 69 e 50 → 51. É a primeira a
sair da família 7, e sai com `voz.css` ainda por existir: a triagem chegou antes
da folha, que é justamente a ordem que a §4 pede, para que a folha não nasça em
volta de uma peça que não é peça.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`ReadAloudProps { words: readonly string[], spokenIndex: number, playing:
boolean, rate: number, elapsed: string, duration: string, onToggle?: () => void,
onRateChange?: () => void, className }`. Nove entradas, DUAS delas chamadas de
volta — e as duas **sem argumento nenhum**. A anatomia é um `<p>` com as
palavras, a corrente realçada e as anteriores esmaecidas, e abaixo uma fila de
quatro nós: botão de tocar, uma barra cuja largura é `spokenIndex /
words.length`, o par decorrido/duração, e um botão que troca a velocidade.

**A FILA DE QUATRO NÓS É A BARRA DA BASE, NÓ POR NÓ, e é essa medida que decide
todo o resto.** A 5.2 já dizia que a base desta família é `media-player`; o que a
leitura acrescenta é que aqui não há base, há a barra INTEIRA. Tocar e pausar é
`.nds-media-player-button`; a posição é `.nds-media-player-seek`; o par
decorrido/duração é `.nds-media-player-time`, que a folha da base já manda
desenhar com `tabular-nums` e já proíbe de ser região viva, pelo mesmo motivo que
esta guideline escreve na regra 1 da §8; a velocidade é `.nds-media-player-rate`.
Quatro nós, quatro classes, todas de pé nas cinco stacks. E a barra sem
superfície não é arranjo novo: é `kind="audio"`, que a folha da base já resolve
em duas regras — a superfície com `block-size: 0` e a linha separadora removida,
porque sem vídeo acima ela não separa nada.

**E os três nós que a fonte MUDA, ela muda para pior — dois deles desfazendo
correção medida nesta mesma base.** A posição é um `<span>` cuja largura é uma
fração, e não um `<input type="range">`. A folha da base escreve por que não, e
escreve por comportamento e não por gosto: o elemento nativo já é operável por
seta, Home, End e PageUp, já tem papel de slider e já anuncia a posição — trocá-lo
por um `<span>` é assumir os quatro à mão. Pior, a fonte o desenha imóvel e sem
destino, que é exatamente o "controle que não faz nada" que esta base já removeu
duas vezes: o botão de janela flutuante quando não há faixa de vídeo, e o próprio
slider quando a fonte é ao vivo.

**O RELÓGIO É O SEGUNDO, E É O DEFEITO QUE A BASE ACABOU DE CONSERTAR.**
`elapsed: string` e `duration: string` pressupõem um fim conhecido. Fala
sintetizada não tem: a duração só se sabe quando termina, e muda quando a
velocidade muda — que é o outro controle desta mesma fila. A base já mediu esse
caso e já respondeu, e a resposta está escrita: duração infinita não é duração
desconhecida, é ausência de fim, e por isso o relógio dá lugar ao aviso de
transmissão e o slider sai de cena. A fonte finge o relógio. **Entrada que
reintroduz na composição o defeito que a base removeu não está desenhando: está
atrasada em relação ao que já existe aqui.**

**O terceiro é a velocidade**, e é onde aparece a sexta forma do sinal, a que a
décima sexta acrescentou. `onRateChange?: () => void` não recebe argumento: quem
consome não fica sabendo qual velocidade foi escolhida, o componente vira dono da
ordem do ciclo — que é política, e a §7 a mantém fora — e passa a ter de FORMATAR
o rótulo ("1x"), que é decisão de locale, a mesma coisa que a décima sexta
reprovou em `page: number`. A base resolve com um `<select>` sobre
`rates: number[]`, que carrega o valor e já é operável, anunciável e nativo no
toque. Lá a chamada de volta era mais estreita que o vocabulário; aqui é mais
estreita que a BASE, e o efeito é o mesmo — vale registrar a extensão: **o
estreitamento se mede contra o que já está construído, não só contra
`chat-protocol.ts`.**

**E O PARÁGRAFO NÃO É DA PEÇA.** `words: readonly string[]` é a resposta inteira
achatada numa fila de cadeias, sem marcação, sem link, sem código e sem a marca
em linha que a família 3 acabou de construir. A resposta, nesta casa, é
`markdown` dentro de `.nds-chat-message-content` — a 5.1 resolve `markdown-text`
assim desde a primeira leitura. Um componente que recebe as palavras e as imprime
desenha uma SEGUNDA cópia da resposta, empobrecida: ou as duas ficam na tela e
quem usa leitor de tela lê tudo duas vezes, ou a resposta é substituída pela
cópia enquanto é lida. É o argumento que fez `inline-citation` ser a MARCA e não
o parágrafo, aplicado do outro lado — lá a peça era o que INTERROMPE o texto de
quem monta; aqui a fonte tenta SER o texto.

Os três testes, e nenhum passa:

- **Desenho, não.** A fila é a barra da base em `kind="audio"`, sem uma classe
  nova. Tirado o parágrafo, o que sobra é a palavra corrente marcada dentro do
  `markdown` que a mensagem já desenha — e isso é uma classe que falta, nomeada
  na linha da 5.1: nada em `docs/shared/styles/` realça palavra em texto corrido,
  e o único `<mark>` desenhado está escopado a `.nds-editor-content .ProseMirror`,
  onde aquela folha já registra que o amarelo do navegador ignora o tema. Buraco
  que é classe não salva entrada — é o que o preâmbulo da 5.1 diz, e o que a
  décima sexta já mediu com duas.

  **A comparação com a décima terceira é o eixo, porque ela é a única leitura que
  poderia ter salvado esta peça.** `inline-citation` sobreviveu por ter geometria
  própria dentro de texto corrido: assentar na linha de base sem esticar a
  entrelinha, não se separar da palavra anterior na quebra, e ainda oferecer 24 px
  de alvo de toque — três exigências que brigam entre si. **A palavra falada não
  tem alvo.** Não se clica nela, não se foca nela, não abre nada: é fundo pintado
  atrás de um trecho em linha, que é o que `<mark>` sempre foi e o que todo
  navegador desenha sem tocar na caixa de linha. Sem alvo, as três exigências não
  se encontram, e não sobra briga nenhuma para resolver. A décima terceira mediu
  que a marca tem geometria que as caixas não têm; a décima sexta, que as caixas
  não a têm; esta mede a terceira face — **fundo em linha sem alvo também não
  tem.**

- **Estado, não, e o sinal disparou pelo avesso, como na décima quinta.**
  `playing: boolean` é o único estado declarado, e a peça que É a base desta
  família declara o MESMO booleano com o MESMO nome: `PlayerState.playing`, o
  intermediário que existe — e o docblock dele diz por quê — porque os dois
  motores contam a mesma história em línguas diferentes e a barra tem de ser uma
  só. Não há achatamento a medir: `RunStatus` não toca esta peça, e o que a fonte
  declara é o que a base já declarava. Vale a leitura da décima quinta, palavra
  por palavra — **booleano igual ao do dono não é uma peça pequena, é a mesma
  peça** —, e ela se ESTENDE aqui: lá o dono era o `composer`, peça desta
  campanha; aqui é um componente que o design system já tinha antes dela.

  As duas chamadas de volta confirmam pelo caminho da sub-regra do sinal:
  `onToggle` é `play`/`pause` de um elemento de mídia e `onRateChange` é a troca
  de velocidade — as duas nomeiam um dono, e o dono é o mesmo. Nenhuma delas é o
  par de abrir e fechar que a §2 cobra de toda peça, que é o limite medido na
  décima terceira; então a sub-regra fala, e fala duas vezes.

  E o esmaecimento das palavras já ditas não entra como estado, por motivo já
  escrito: os três tratamentos da fonte — esmaecido, realçado, opaco — se separam
  **só por opacidade e fundo**, que é a codificação que a regra 4 da §8 troca pela
  palavra, e é a leitura da décima segunda. Quem diz onde a leitura está é a
  marca, que é uma posição, não uma tinta.

- **Vocabulário, não.** `playing`, `rate`, `elapsed` e `duration` são
  `PlayerState` com dois campos já formatados, e `formatTime` é exportado pela
  base nas cinco. `spokenIndex` sobre `words` é a decisão de `stream-reveal.ts`,
  que a §3.2 já reservou para a fundação com estas palavras: quantas palavras já
  apareceram, qual é a mais nova. Primitivo compartilhado por três usos não é
  vocabulário de uma peça — e menos ainda desta, que é a única dos três que não
  revela nada, porque o texto já está inteiro na tela.

E o teste da família, que é o quarto, e aqui é o mais duro: **ela não responde ao
eixo da própria família.** O eixo é áudio ao vivo, com estado de conexão e
legenda. `read-aloud` não declara estado de conexão nenhum — nem
`connection-state`, que é peça da família 2, nem palavra que se pareça — e não
tem legenda, porque `words` não é legenda: legenda é texto com TEMPO, e a base já
a entrega por `<track>` desde que existe. O que a fonte responde é o eixo da
BASE — o que toca, onde está, quanto falta, a que velocidade — com dois dos
quatro nós piorados. **Entrada que responde ao eixo do que ela usa, e não ao da
família em que foi posta, foi posta na família errada**; e, medida contra a base,
descobriu-se já construída dentro dela.

**Uma leitura de acessibilidade que a triagem tinha de fechar, e fechou pela
negativa**: a regra 1 da §8 proíbe região viva para texto que se escreve sozinho,
e procurou-se aqui a exceção "escopada à palavra" que se supunha registrada para
leitura em voz. **Ela não existe** — nem na §8, nem em `chat-thread.css`, nem em
nenhuma das folhas de família já escritas. O que existe é o contrário, e está na
decisão 1 do `chat-thread`, que nomeia esta base ao dizer por quê: texto em
streaming numa região viva "é o relógio do media player multiplicado por cem".
Fica o registro, para que ninguém a procure de novo: a palavra corrente é
`aria-busy` mais marca visual, e quem anuncia é o anunciador do `chat-thread`,
uma vez, ao terminar.

**E uma leitura que NÃO se decide daqui**: com `read-aloud` fora, a família 7
fica com duas peças, e folha de família com duas peças é pergunta legítima — mas
é pergunta de `orb` e de `voice-conversation`, não desta triagem. Decidir a folha
da 7 de dentro de uma peça que acabou de sair dela é o que a sexta correção
recusou fazer com `TimelineStat` e o que a décima sétima recusou fazer com a
caixa de estado de `thread-list`. `voz.css` continua prevista, e quem a funda é a
primeira das duas a ser construída.

**Reversível**, como as outras dezoito: se ao construir `orb` ou
`voice-conversation` aparecer leitura em voz com desenho, estado ou vocabulário
próprios — uma marca de palavra que a caixa de linha do parágrafo não comporte
sem regra além da nomeada, um estado de fala que `PlayerState` não modele, ou
legenda com tempo que `<track>` não dê —, `read-aloud` desdobra de volta para a
5.2, com o motivo. E há um segundo gatilho, deste lado: se a opção nomeada — o
terceiro motor, que relata o próprio estado em vez de ser lido de um elemento —
não couber no `media-player` sem redesenhar a barra, então o que falta não é uma
opção, é uma peça, e esta linha volta.

Contagens, somadas família a família: 1 tem 11, 2 tem 16, 3 tem 7, 4 tem 20, 5
tem 5, 6 tem 8 e 7 tem 2 — **69** na 5.2. A 5.1 vai a **51** (49 linhas contadas
no arquivo, e duas delas carregam duas entradas). Somam 120. A família 7 fica com
**2 componentes**, e as sete somam 63.

**Vigésima correção, e a décima quarta que atravessa de 5.2 para 5.1**:
`elicitation-form` é `approval-card` com um corpo de campos — e as duas contagens
mudam junto, 69 → 68 e 51 → 52. É a terceira que colapsa numa peça da PRÓPRIA
família 2 já construída, e a primeira em que a peça de destino é uma que a §7 já
nomeia na mesma linha que a entrada.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`ElicitationState = "request" | "accepted" | "declined"`; `ElicitationField {
name, label, value: string, kind: "text" | "choice" | "toggle", options?,
required? }`; e no componente `server: string`, `message: string`, `fields:
readonly ElicitationField[]`, `state`, `onAccept?: () => void`, `onDecline?: ()
=> void` e `className`. Sete entradas no componente, DUAS chamadas de volta — e
as duas **sem argumento nenhum**. A anatomia é um painel com quatro partes:
cabeçalho com ícone de tomada e o nome do servidor; um parágrafo com o pedido;
um contêiner com uma linha por campo; e um rodapé que leva os controles em
`request` e é SUBSTITUÍDO inteiro por uma frase de confirmação em `accepted` e
em `declined`.

**A FONTE NÃO GUARDA VALOR NENHUM, e é essa medida que decide todo o resto.**
Ela escreve de quem é o formulário: "you own the field list, the values inside
it, and which of the two settled states it shows". As duas chamadas de volta não
recebem argumento — `onAccept()` e `onDecline()` —, então o que a pessoa digitou
nunca sai da peça: quem lê o campo é quem o montou. E a validação está do outro
lado da fronteira também: barrar o envio com campo obrigatório vazio é da faixa
de runtime, e é ela que "devolve erros de validação em vez de enviar". O
componente standalone não valida, não guarda e não devolve. **O que ele faz com
os campos é desenhá-los** — e desenhar campo é o que `field`, `form`, `input`,
`textarea`, `select`, `radio-group`, `toggle-group` e `checkbox` já fazem nas
cinco.

Isso responde de saída o risco que a §2 põe nesta entrada, e responde pela
fonte: um formulário que VALIDASSE, que guardasse valor, que soubesse o tipo de
cada campo a partir de um esquema traria runtime junto — e a fonte já tirou os
três de dentro dele. Esquema que vira campo é geração de formulário, não desenho
de componente. Tirados o esquema e a política, o que sobra é uma moldura com uma
pergunta, campos que quem monta põe, e dois controles — que é o cartão de
autorização com um terceiro filho.

Antes dos três testes, as três perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **O corpo de campos é desenho, ou é conteúdo? É conteúdo, e trocar o corpo de
  uma peça por outro conteúdo é MONTAGEM**, que a §2 já entrega a quem consome.
  O cartão de autorização não desenha os controles dele: recebe `HTMLElement[]`
  prontos. Um corpo de campos é o mesmo contrato um degrau acima na marcação, e
  a raiz já é a pilha que o acomoda.
- **`kind` é vocabulário, ou é esquema? É esquema, e ele ESTREITA.** Três
  espécies de campo onde o design system tem uma dúzia de primitivos de
  formulário. Uma união que enumera espécies de campo não descreve conversa
  nenhuma: descreve um gerador.
- **O estado assentado é da pergunta, ou do produto? É do produto, e a §7 o põe
  do lado de fora por escrito.** O que acontece depois de responder — se aparece
  uma confirmação, se o cartão sai da tela, se a resposta vale para as próximas
  — é a lista literal do que o cartão de autorização já recusa fazer, e o
  docblock dele diz uma delas com todas as letras: a peça não se desabilita
  depois de respondida.

Os três testes, todos negativos:

- **Desenho, não.** Montado inteiro, o formulário não deixa buraco — e a fonte
  mesma já diz de que ele é feito, como a quinta, a sétima, a décima, a décima
  primeira, a décima segunda, a décima quarta, a décima quinta, a décima sétima,
  a décima oitava e a décima nona correções já leram nas suas: o painel, os
  rótulos dos campos
  e o botão de enviar leem os tokens compartilhados `paper`, `mono` e
  `inkButton` de `surfaces.tsx`, e os campos leem `field`. Superfície
  compartilhada declarada na origem — o oposto exato do que a nona leu em
  `computer-use`.

  A composição são três filhos da mesma pilha. `.nds-approval-card` é a moldura
  de atenção e já é coluna com `gap`, então um terceiro filho entra sem regra
  nova. `.nds-approval-card-ask` leva o pedido em `.nds-approval-card-question`,
  que a folha já escreve em `--foreground` sobre a moldura de atenção, e o
  servidor em `.nds-approval-card-scope`, um par de termo e valor — que é
  exatamente o que aquela lista é, e a décima primeira e a décima segunda
  correções já puseram cadeia técnica de agente em lugar equivalente. Os campos
  são `.nds-field-group` de `createFormField`, que já monta `<label for>`, já dá
  id à descrição e à mensagem de erro e já as costura no `aria-describedby` do
  controle. E o rodapé é `.nds-approval-card-actions`, o espaço de
  `HTMLElement[]` que a §2 fixou para a família inteira. Nenhuma classe nova,
  nenhuma nomeada como faltando.

  Há UM buraco, e ele é de OPÇÃO, não de classe, como o da sétima e o da décima
  quarta correções: `createApprovalCard` monta `-ask` e `-actions` por dentro e
  não tem por onde receber um corpo. A composição pede **uma opção**
  `fields?: HTMLElement[]`, apensada entre os dois — a raiz já é a pilha, o
  afastamento já é o `gap` dela, e os campos trazem o próprio agrupamento em
  `.nds-field-group`. É o mesmo contrato de espaço que a §2 fixou para a família,
  na mesma forma do `actions?` que a sétima nomeou para o `code-block` e do
  `railEnd?` que a décima quarta nomeou para o composer. É o que a 5.1 manda
  nomear, e está nomeado lá.

  E o LUGAR dessa opção é decisão de acessibilidade, não de ordem: os campos
  entram como IRMÃOS de `-ask`, nunca dentro dela. A decisão 1 daquele bloco
  fecha a região viva antes dos controles porque "botão dentro de anúncio é
  rótulo recitado que ninguém pode apertar dali", e campo dentro de anúncio é
  pior — o anúncio recita o formulário inteiro justamente na hora em que ele
  precisa ser respondido. A decisão 3 já fixa a ordem da marcação: pergunta,
  alcance, controles; o corpo entra entre o alcance e os controles, que é onde o
  olho e a tabulação já o esperam.

  Três traços a composição não reproduz, os três por decisão já escrita. O
  **ícone de tomada** ao lado do nome do servidor é ícone que repete a palavra
  vizinha, que a sexta correção já recusou. O **asterisco** do campo obrigatório
  é glifo, e glifo não chega a quem ouve (regra 7 da §8, WCAG 1.1.1) —
  obrigatoriedade é `required` no controle, que o campo do design system já
  carrega. E o **campo de alternância lendo verdade da cadeia literal `"true"`**
  é o componente decidindo o que uma cadeia significa, que é a mesma classe de
  decisão que esta família tirou dos componentes quando fixou que valor formatado
  chega escrito.

  Onde fonte e composição DISCORDAM, a composição está mais fina, como na
  oitava, na décima primeira, na décima quarta, na décima quinta e na décima
  sétima — e aqui no que mais custa: **a fonte não anuncia a pergunta.** Não há
  região viva no painel, e uma pergunta é um impasse dos dois lados, que é
  exatamente o motivo pelo qual a decisão 1 do cartão de autorização abriu a
  terceira exceção desta folha. Pergunta que aparece e não se anuncia é pergunta
  que ninguém responde: quem não vê a tela fica esperando uma resposta que está
  esperando por ela.

- **Estado, não.** É o parágrafo do sinal, e ele decide sozinho — com uma forma
  que a tabela ainda não tinha. `"request" | "accepted" | "declined"` são três
  palavras, e só a primeira é do vocabulário: `request` é `ToolCallState`
  `pending`, exatamente, e a folha já escreveu que o cartão de autorização É o
  outro lado dele — `waitsForPerson` é verdadeiro só ali. As outras duas não são
  estados da PERGUNTA: são o que acontece depois de respondê-la, que é a §7
  inteira. E o que se perde não é pouco: `running` — a resposta enviada, com o
  servidor trabalhando nela — e `failed` — a resposta recusada. A fonte admite
  `failed` na própria faixa de runtime, que "devolve erros de validação em vez de
  enviar", e não o desenha em lugar nenhum: um formulário cujo envio pode ser
  recusado e que não tem desenho para a recusa. Vale medir a perda contra a irmã
  em que a peça colapsa: o cartão de autorização não tem máquina de estados
  NENHUMA de propósito — a folha removeu todo eixo de estado —, e quem carrega o
  estado é a chamada, no grupo, de onde ela sai quando deixa `pending`. Aqui a
  fonte trouxe um eixo de estado de volta para dentro da pergunta, e o trouxe
  pela metade.

- **Vocabulário, não, e ele ESTREITA duas vezes.** `ElicitationField { name,
  label, value, kind, options?, required? }` não é vocabulário de conversa: é o
  descritor de um campo de formulário, e o design system já o tem — `name`,
  `label`, `required` e a descrição são o que `createFormField` recebe, e
  `options` é o que `select`, `radio-group` e `toggle-group` recebem. Um tipo
  compartilhado para isso não seria protocolo; seria uma segunda declaração da
  API de formulário do sistema, escrita em `chat-protocol.ts`, longe de onde ela
  é usada. E os dois estreitamentos são a sexta forma do sinal, que a décima
  sexta correção acrescentou:

  - `kind: "text" | "choice" | "toggle"` são três espécies onde o design system
    tem `input`, `textarea`, `number-field`, `input-otp`, `select`, `combobox`,
    `radio-group`, `checkbox`, `switch`, `slider`, `toggle-group` e
    `tags-input`. Conte os valores que o tipo deixa de poder expressar: uma
    resposta longa, um número, uma data, uma escolha múltipla. E o custo não
    para no alcance — um componente que traduz `kind` em controle é gerador de
    formulário, e a §2 é literal a respeito.
  - `value: string` faz o trabalho dos três de uma vez, e a fonte diz o preço:
    no campo de alternância ela lê a verdade da cadeia literal `"true"`.
    Booleano estreitado a cadeia de exibição, com o componente decidindo o que a
    cadeia significa.

  `server` e `message` são cadeias soltas: a primeira é dado de produto, que a
  §7 entrega a quem monta, como a etiqueta de política da décima e a tabela de
  faixas da oitava; a segunda é a pergunta, e a folha já a tem. É a distância
  inteira para `computer-use`, que sobreviveu por ter `x` e `y` sem par em lugar
  nenhum: aqui todo campo tem par, e quase todos têm par na mesma folha ou na
  folha de formulário.

E o teste da família, que é o quarto: **ela responde ao eixo, e responde pela
mesma amarra que segura a peça em que colapsa.** Diz o que está acontecendo — a
máquina parou e espera por uma pessoa —, e essa é a amarra que a quinta correção
nomeou ao comparar `agent-card` com o cartão de autorização: não há máquina de
estados, mas há uma chamada de pé, esperando. Não diz há quanto tempo, e não
deve: a decisão 4 daquele bloco já recusou o relógio, porque uma pergunta com
prazo se responde pelo silêncio e o que o silêncio significa é política de
produto. E o que fazer a respeito é o espaço de controles, que já é o mesmo. É a
mesma leitura da sexta, da sétima, da décima primeira, da décima segunda, da
décima quarta, da décima quinta e da décima sétima: `elicitation-form` não sai
por não pertencer à família — sai por já estar construída dentro dela.

**E POR QUE MIGRA EM VEZ DE SER ABSORVIDA**, que é a pergunta que esta entrada
obriga a responder, porque a peça de destino já absorveu uma. `permission-grant`
foi absorvida na quarta correção pelo critério escrito lá: teria "a mesma
marcação, o mesmo vocabulário (nenhum) e a mesma docs page, com outro título" —
nada a acrescentar, nada a compor. Aqui não é o caso, e a diferença se mede em
dois lugares: a composição precisa de uma opção nova no cartão, e traz para
dentro dele uma família de primitivos que ele não conhece — `field`, `form` e os
controles. Uma docs page desta entrada mostraria `.nds-field-group` e
`createFormField`, que a docs page do cartão de autorização não mostra e não
deve mostrar. **Absorção é para quem não acrescenta nada; a 5.1 é para quem
compõe mais de uma peça** — foi por isso que `tool-timeline` foi para a 5.1
sendo `tool-group` aberto, em vez de ser absorvida por ele.

**As reversibilidades que apontavam para cá, respondidas:**

- **`guardrail-notice` (décima) CONFIRMA, e não desdobra.** A condição era
  recusa com desenho, estado ou vocabulário próprios: uma parada que chegue como
  DADO em vez de decisão de quem monta, um estado de recusa que `RunStatus` não
  modele, ou alternativa que seja resposta a uma pergunta de pé em vez de
  próximo pedido. As três ficam mudas, e a terceira pelo motivo mais forte:
  **esta entrada É a pergunta de pé**, e não tem alternativa nenhuma — não há
  lista de próximos pedidos, há dois controles. `declined` parece a primeira
  condição e não é: ele não é uma parada de política que chegue como dado, é o
  registro de que a pergunta foi respondida, que a §7 já mantém do lado de fora
  nas duas peças. E não é estado que `RunStatus` não modele: quem recusa é uma
  pessoa, e pessoa que interrompe é `stopped`, "o mais literal dos cinco".
- **`background-inbox` (décima sétima) CONFIRMA.** A condição era trabalho em
  segundo plano com ponto de entrada que saia da conversa, estado por execução
  que `RunStatus` não modele, ou não-lido chegando como vocabulário. Nenhum dos
  três: aqui não há segundo plano nenhum — a máquina parou e está esperando na
  frente de quem lê —, não há lista, e não há nada por ler depois.
- **`permission-grant` (quarta) não é tocada.** A condição era diferença de
  desenho, estado ou vocabulário aparecer numa peça vizinha. A diferença que
  apareceu é um terceiro filho e uma opção, e ela não separa uma concessão de
  permissão de uma autorização: as duas continuam sendo pergunta, alcance e
  controles, sem corpo. Opção que a concessão não usa não a torna outra peça.

**Reversível**, como as outras dezenove: se ao construir `schedule-card` ou
`checkpoint-history` — as duas que faltam na família — aparecer pergunta com
corpo de desenho, estado ou vocabulário próprios: um corpo que não caiba na
pilha do cartão sem regra nova além da opção nomeada, um estado da pergunta que
`ToolCallState` não modele, ou o que se responde chegando como VOCABULÁRIO em
vez de campo do sistema —, `elicitation-form` desdobra de volta para a 5.2, com
o motivo. E há um segundo gatilho, deste lado: se o cartão de autorização
precisar de desenho próprio para hospedar um corpo — e não só da opção e do
`.nds-field-group` que já agrupa —, o formulário vira variante DELE, e continua
não sendo peça.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 15, 3 tem 7, 4 tem 20, 5 tem 5, 6 tem 8 e 7 tem 2 — **68** na 5.2.
A 5.1 vai a **52** (50 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. A família 2 fica com **11 componentes**, e as sete somam
62.

E um registro de método, porque três portas escreveram nesta seção no mesmo dia
e as três mexeram nas mesmas duas contagens: **o cabeçalho não é fonte, a tabela
é.** Houve uma janela em que a 5.1 e a 5.2 discordavam das próprias tabelas em
uma entrada cada, nos dois sentidos — de modo que o total continuava fechando em
120 e nada denunciava o descompasso. É exatamente o que a décima primeira
correção mandou fazer para pegar esse erro, e vale como regra e não como
anedota: some família a família antes de escrever o número, mesmo quando o
cabeçalho parece certo.

**Vigésima primeira correção, e a décima quinta que atravessa de 5.2 para 5.1**:
`confidence-marker` é `markdown` com o gatilho de explicação que esta base já
compõe — e as duas contagens mudam junto, 68 → 67 e 52 → 53. É a terceira a sair
da família 3, e a primeira em toda a campanha em que a entrada colapsa contra uma
cadeia de utilitárias que a base já escreve LITERALMENTE, na mesma ordem, no
arquivo de exemplo de outra peça.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`ConfidenceClaim { id, text, confidence: "grounded" | "inferred" | "uncertain",
basis: string }` e, no componente, `claims: readonly ConfidenceClaim[]`,
`hoveredId: string`, `onHover?: (id: string) => void` e `className`. Quatro
entradas no componente, quatro campos na linha, e UMA chamada de volta — chamada
com o id ao entrar e ao focar, e com a cadeia VAZIA ao sair e ao desfocar. A
metade de runtime é um render de FERRAMENTA (`cite_claims`, `result.claims`), e
não porta (§1). A anatomia são dois blocos: um parágrafo em que cada afirmação é
um botão em linha, sublinhado pelo nível; e, abaixo dele, um encaixe de ALTURA
FIXA que mostra a base da afirmação sob o ponteiro ou o foco, ou nada — fixa,
diz a fonte, para que revelar "never shifts the paragraph above".

**A FONTE DECLARA TRÊS PALAVRAS E DESENHA DUAS** — "solid for grounded and
inferred, dotted for uncertain" —, e é essa medida dupla que decide todo o resto.

Antes dos três testes, as duas perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **O nível de confiança é vocabulário desta casa? É — e não é desta peça.**
  Nada em `chat-protocol.ts` diz o quanto se pode confiar numa afirmação; a
  primeira linha do cabeçalho desta folha reservou o lugar antes de existir peça
  ("o quanto se pode confiar"), e a regra 4 da §8 já nomeia "nível de confiança"
  entre o que não pode ser só cor. Até aqui, aprova. O que reprova é o passo
  seguinte, e ele é a fórmula da oitava correção palavra por palavra: **ordinal
  sem grandeza vira etiqueta; ordinal com grandeza vira o medidor que já
  existe.** `ConfidenceClaim` não tem número nenhum — nem fração, nem teto, nem
  limiar —, então é o primeiro caminho, e etiqueta é `.nds-badge`. E a casa da
  palavra é `chat-protocol.ts`, que é a FUNDAÇÃO e não um slug: vale o que a
  décima sétima fez com a contagem da caixa — a casa dela é o protocolo no dia em
  que uma peça precisar dela —, e escrever fundação em volta de uma peça que não
  é peça é justamente o que a décima nona recusou fazer com `voz.css`.
  **Vocabulário que a fundação hospeda não é vocabulário próprio de quem o
  desenha**; foi assim que `approval-card` ficou sem nenhum e continuou de pé.
- **Viver DENTRO do texto corrido basta, depois da décima terceira? Não — e é
  aqui que a leitura da família se corrige.** A décima oitava fechou dizendo que
  nesta família o que tem desenho próprio é o que vive dentro do texto corrido, e
  o que mora ao lado é lista. Esta entrada vive dentro do texto corrido e colapsa
  do mesmo jeito, porque o que a décima terceira mediu não foi o LUGAR, foi a
  FORMA do gatilho: a marca da citação é um glifo de um caractere que precisa de
  24 px de parada de toque dentro de uma caixa de linha de 20 px, e é essa briga
  que nada nesta base concilia. Uma afirmação é uma FRASE — já ocupa a caixa de
  linha inteira, quebra entre linhas como qualquer link de parágrafo, e é o alvo
  em linha que a 2.5.8 dispensa por estar preso à entrelinha do texto em volta.
  **Dentro do texto corrido, quem tem desenho próprio é o que INTERROMPE o
  parágrafo, não o que É o parágrafo.**

Os três testes, todos negativos:

- **Desenho, não, e a medida é a mais direta desta seção inteira.** O gatilho da
  afirmação já existe nesta base, montado, com esta função e nesta ordem:
  `hover-card.fixtures.ts` e `hover-card.source.ts` escrevem `nds-text-primary
  nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help
  nds-bg-transparent nds-border-none nds-p-0` — um botão sem cromo nenhum, dentro
  de texto corrido, sublinhado pontilhado, que revela uma explicação sem navegar.
  E o docblock de `utilities.css` já escreveu o PORQUÊ do pontilhado, que é
  exatamente o que a fonte pede do nível: "o sinal visual de 'passe o mouse para
  saber mais' — distingue o gatilho de HoverCard/Tooltip de um link que navega".
  As duas decorações que a fonte usa são `.nds-underline` e
  `.nds-underline-dotted`, com o mesmo deslocamento que cinco folhas já aplicam
  ao seu link.

  O resto compõe sozinho. O parágrafo é `markdown`, e tem de ser, porque a
  resposta é Markdown. A base é `.nds-popover-content`, e aqui vale o sinal que
  esta campanha já leu nove vezes: **a fonte declara que a pastilha da base lê as
  superfícies `floating` e `mono` compartilhadas de `surfaces.tsx`**. Superfície
  compartilhada declarada na origem — e, ao contrário do que a décima terceira
  encontrou na citação em linha, aqui ela cobre a ÚNICA caixa que a peça tem: lá
  a origem não tinha o que oferecer para a marca dentro da frase, aqui ela
  oferece tudo o que há.

  Dois traços a composição não copia, os dois por decisão já escrita. O encaixe
  da base é de altura FIXA na fonte, e altura fixa em coisa que carrega texto é o
  que a §9 proíbe (WCAG 1.4.4): reserva-se o espaço com `min-block-size`, e o
  objetivo — não empurrar o parágrafo ao revelar — se atende igual. E o terceiro
  nível, que na fonte se separa dos outros dois só por cor: a regra 3 desta folha
  o troca pela palavra e a regra 4 da §8 o proíbe. Tirada a cor, sobram duas
  decorações para três níveis, e quem carrega o nível é a palavra — em
  `.nds-badge` em linha, que é o que a 5.1 já respondeu em `directive-text`, ou
  em `.nds-sr-only`.

  **Nenhuma classe nova, e nenhuma nomeada como faltando** — a segunda entrada
  seguida assim, depois de `retrieval-chunks`. Se o produto quiser três
  decorações em vez de duas mais a palavra, a que falta é `.nds-underline-dashed`
  em `utilities.css`, ao lado das duas que já estão lá: utilitária nomeada, que é
  o que o cabeçalho da 5.1 manda, e nunca folha.

- **Estado, não.** Não há máquina de estados: `hoveredId` mais `onHover` é
  disclosure de seleção única, que a §2 autoriza a ser interno e obriga a ser
  controlável. E é o MESMO desenho que a décima terceira já recusou uma vez —
  `openIndex: number | null`, um só índice para o parágrafo inteiro. Aqui a fonte
  endereça por id em vez de índice, o que é melhor, e continua sendo um revelado
  por vez, o que é decisão de quem monta.

  O sinal do achatamento fica MUDO, e por um motivo que não tinha aparecido: não
  há booleano nem união encolhida porque não há união DESTA casa para encolher —
  `RunStatus` e `ToolCallState` não têm o que dizer sobre uma afirmação graduada.
  Mudo não prevê nada (nona e décima terceira), então vale a sub-regra: que
  assinatura sobrou no lugar do estado? `onHover(id)` / `onHover("")` é abrir e
  fechar, o par que a §2 exige de TODA peça desta família — o limite exato que a
  décima terceira mediu em `onOpenIndexChange`. Não aponta dono, e quem decide
  são os três testes sozinhos. O que esta leitura ACRESCENTA ao instrumento está
  na seção do sinal, logo abaixo: aqui a união não é achatada pelo TIPO, é
  achatada pelo DESENHO.

- **Vocabulário, não — e a ausência é a notícia, ao contrário da décima
  terceira.** Lá `Citation` e `ChatSource` descreviam a entrada inteira e
  descreviam MELHOR, e caber sem sobra foi lido como prova de que a fundação
  estava certa. Aqui a entrada não carrega `Citation` NENHUMA: não há fonte, não
  há trecho, não há âncora, não há `url`. `basis: string` é a cadeia de exibição
  que fica no lugar dos três — a sexta forma do sinal que a décima sexta nomeou,
  tipo mais estreito que o do vocabulário, agora na forma mais extrema: lá
  `DocumentAnchor.page` estreitava UM campo, e aqui uma cadeia ocupa o lugar de
  um objeto inteiro. É a terceira vez que a segunda regra desta folha fica sem
  objeto, e a primeira em que ela fica sem objeto porque não há endereço nenhum a
  recusar.

  Sobram `id` e `text`. `id` é endereço de linha, que `ChatToolCall.id`,
  `PlanStep.id` e o `id` da décima oitava já declaram com o mesmo docblock.
  `text` é a notícia ao contrário, e a décima terceira já escreveu a frase: **o
  design system não pode ficar dono do texto da resposta, que é do modelo e é
  desenhado pelo Markdown ou pela conversa.** Lá o parágrafo estava preso no
  arquivo instalado e a peça sobreviveu virando a MARCA em vez do parágrafo; aqui
  o parágrafo chega por prop, o que é melhor, e ainda assim a peça é dona dele —
  um arranjo de afirmações não sabe desenhar um link, uma lista ou um trecho de
  código, que é o que uma resposta tem dentro. **Aplicada a mesma correção que
  salvou a irmã, o que sobra é a marca sobre uma frase, e a marca é a cadeia de
  utilitárias de cima.**

E o teste da família, que é o quarto: **ela responde ao eixo pela metade, e a
metade que falta é a fundação.** "Em que a resposta se apoia" é o eixo, e o campo
que diria em que ela se apoia é uma cadeia livre. A linha da 5.2 diz que todas as
peças desta família carregam `Citation`, e esta é a primeira lida que não carrega
— e não por descuido da triagem: a fonte não tem o objeto. Corrigido o campo,
`basis` vira `Citation`, e a caixa que mostra fonte, trecho e lugar é a que a
citação em linha já desenha. Vale o traço nos formatos que a décima primeira, a
décima segunda, a décima quinta e a décima oitava nomearam — repetir não é
desenhar, emparelhar não é desenhar, estreitar não é desenhar —, com esta sendo a
primeira em que o que se estreita é o vocabulário INTEIRO num campo só.

**As duas cláusulas que apontavam para cá, respondidas — e as duas fecham a
décima oitava:**

- **O primeiro gatilho NÃO dispara.** A condição era que ao construir
  `confidence-marker` aparecesse fila de trechos com desenho, estado ou
  vocabulário próprios. Não aparece fila nenhuma: esta fonte não tem lista, tem
  um parágrafo e um encaixe. `retrieval-chunks` continua na 5.1, e a cláusula
  perde o terceiro dos três nomes que mandava verificar — sobram `web-search` e
  `research-report`.
- **O segundo gatilho NÃO dispara, e é a herança que a décima oitava deixou em
  aberto de propósito.** A condição era: se `confidence-marker` fixar a pontuação
  como vocabulário desta família, quem desenha a pontuação passa a ser ela.
  **Não fixa, e a resposta é mais simples do que a pergunta: esta fonte não tem
  pontuação.** `ConfidenceClaim` não declara número nenhum — a confiança aqui é
  ordinal de três palavras, sem grandeza por trás, e não uma fração de 0 a 1. As
  duas nem medem a mesma coisa: uma pontuação de relevância diz o quanto um
  trecho se PARECE com o que se procurou, e um nível de confiança diz o quanto
  uma afirmação se APOIA no que se recuperou. A linha de `retrieval-chunks` na
  5.1 fica exatamente como está, apontando `.nds-badge` com `.nds-font-mono` para
  a pontuação como texto, e `.nds-context-display[data-form="bar"]` (família 5)
  para o dia em que o produto quiser barra. O terceiro caminho que aquela
  correção abriu está fechado, e fechado por leitura da fonte.

**Reversível**, como as outras vinte: se ao construir `web-search`,
`research-report`, `memory-chips`, `speaker-identity` ou `mcp-server-panel`
aparecer graduação de afirmação com desenho, estado ou vocabulário próprios — uma
marca sobre uma frase que não caiba na cadeia de utilitárias do gatilho de
explicação, um nível que a palavra não carregue, ou GRANDEZA numérica por trás do
nível, que é o que falta aqui para ele deixar de ser etiqueta —,
`confidence-marker` desdobra de volta para a 5.2, com o motivo.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 15, 3 tem 6, 4 tem 20, 5 tem 5, 6 tem 8 e 7 tem 2 — **67** na 5.2.
A 5.1 vai a **53** (51 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. A família 3 fica com **6 componentes**, e as sete somam 61.

**E a leitura de família que esta correção obriga a ATUALIZAR, porque corrige a
que a décima oitava escreveu.** Aquela dizia que nesta família o desenho próprio
está dentro do texto corrido e a lista está ao lado; esta entrada vive dentro do
texto corrido e colapsa, então a divisa não era essa. A divisa medida é a FORMA
do gatilho: **o que interrompe o parágrafo tem geometria própria; o que É o
parágrafo, ou o que mora numa fila ao lado dele, não tem.** Três das nove
entradas originais da família 3 colapsaram e uma sobreviveu, e a pergunta que a
décima oitava deixou de pé — se a folha desta família vai ter uma entrada só —
fica mais aguda e continua sem resposta: ela se decide ao ler `web-search` e
`research-report`, e decidi-la aqui seria decidir uma peça antes de ler a fonte
dela, que é o que a sexta correção recusou fazer com `TimelineStat`.

**Vigésima segunda correção, e a décima sexta que atravessa de 5.2 para 5.1**:
`code-diff` é `code-block` com a espécie da linha — e as duas contagens mudam
junto, 67 → 66 e 53 → 54. É a **primeira leitura da família 4**, e ela ABRE a
família sem fundar `resposta-estruturada.css`: a triagem chegou antes da folha,
que é a ordem que a §4 pede, para que a folha não nasça em volta de uma peça que
não é peça. É a segunda vez que isso acontece — a décima nona saiu da 7 com
`voz.css` ainda por existir —, e a primeira em que a família aberta é a maior das
sete.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`DiffLine { kind: "context" | "added" | "removed"; text: string }` e
`CodeDiffProps { filename, additions, deletions, lines, cycle, className }`. A
anatomia inteira são DOIS filhos: uma linha de cabeçalho com o nome do arquivo e
os dois contadores, e uma caixa que rola na horizontal com as linhas dentro.

**E o que a fonte NÃO tem é o que decide.** Três ausências, todas conferidas na
página e nenhuma presumida, porque eram elas as candidatas a geometria própria:

- **Não há lado a lado.** A fonte é explícita: o formato é unificado, e não de
  duas colunas.
- **Não há numeração.** Nenhuma coluna de número, e portanto nenhuma das DUAS
  numerações que avançam em ritmos diferentes — que era a única geometria desta
  entrada que o design system não teria como desenhar.
- **Não há cabeçalho de trecho.** Nenhum `@@`, nenhum intervalo, nenhum bloco — e
  por isso nenhum disclosure e nenhum "controle de bloco de diff", que é o que as
  regras 5 e 10 da §8 nomeiam.

Procurar as três antes de aplicar teste nenhum era obrigatório, porque qualquer
uma delas viraria a leitura sozinha. Nenhuma está lá. O que sobra é uma lista
plana de linhas com uma etiqueta de três valores em cada uma.

Os três testes, todos negativos:

- **Desenho, não.** Montado inteiro, o diferencial não deixa buraco de
  geometria — e, como na quinta, na sétima e na décima terceira, é a PRÓPRIA
  FONTE que declara compartilhado o que ela usa: a superfície do cartão vem do
  `paper` e a região de rolagem do par `codeScroll`/`codeSurface`, em
  `surfaces.tsx`. É o mesmo par, com o mesmo nome, que a sétima correção leu em
  `code-runner` — duas entradas do catálogo apontando a mesma superfície
  compartilhada da origem, que aqui é `.nds-code-block-root` inteiro.

  O cabeçalho é `.nds-code-block-header`: `.nds-code-block-title` monoespaçado,
  que já TRUNCA em vez de empurrar o botão — caminho de arquivo é exatamente o
  caso para o qual essa regra foi escrita —, e `.nds-code-block-actions`, a fila
  que o cabeçalho já encosta no fim com `margin-inline-start: auto`. Os dois
  contadores são `.nds-cluster[data-spacing="xs"]` de `.nds-badge
  nds-badge-success` / `.nds-badge nds-badge-destructive` com `.nds-font-mono`, e
  isso não é invenção desta leitura: é a linha que a sexta correção já escreveu
  na 5.1 para a faixa de estatísticas de arquivo do `tool-timeline`, cujo
  `TimelineStat { file, added?, removed? }` É este cabeçalho com outros nomes.
  **Duas entradas do catálogo trazem o mesmo dado, e ele já tem desenho decidido
  nesta tabela.**

  O corpo é `.nds-code-block-scroll`, que rola nos DOIS eixos no mesmo container
  — o que é o que mantém o gutter alinhado — com
  `overscroll-behavior-inline: contain` e `tabindex="0"`;
  `.nds-code-block-pre` com `lang="en"` e `tab-size: 2`; `.nds-code-block-text`
  com `white-space: pre`, que é literalmente a decisão que a fonte anuncia (a
  linha guarda o próprio espaço em branco e rola em vez de quebrar); e
  `.nds-code-block-line` com `.nds-code-block-gutter` sticky, que sobrevive à
  rolagem horizontal. Mais o realce por gramática, que a fonte não tem.

  Há UM buraco, e ele é de ATRIBUTO e de OPÇÃO, não de folha:
  `.nds-code-block-line` conhece um único estado por linha — `data-highlighted`,
  um par de tinta — e o diferencial quer três espécies. É a mesma forma do buraco
  que a sétima correção nomeou (a fila do cabeçalho existia, faltava a opção de
  enchê-la), e é o que a 5.1 manda nomear. Está nomeado abaixo.

  Dois traços da fonte a composição não reproduz, os dois por decisão já escrita.
  A entrada escalonada das linhas a 60 ms é revelação, e revelação é animação e
  recorte, não peça — mesma leitura que a 5.1 já fez em `streaming-text`,
  `loading-state` e `number-ticker`, e a sétima correção recusou o MESMO
  escalonamento, a 80 ms, no `code-runner`. E a tinta sozinha separando adição de
  remoção é a codificação que a regra 4 da §8 recusa, e o exemplo que ela dá é
  este ("adição e remoção num diff"); o que entra no lugar é a PALAVRA, e está no
  que fica nomeado.
- **Estado, não.** `DiffLine.kind` não é máquina de estados: a linha nasce
  contexto, adição ou remoção e nunca transita. Não há `RunStatus`, não há
  `ToolCallState`, não há sequer disclosure. Classificação por linha que chega de
  fora é o que `highlightLines` JÁ É — `parseLineRanges` recebe `[3, '5-7']` e o
  construtor pendura o atributo na linha —, com dois valores onde o diferencial
  quer três.

  E aqui a leitura se inverte em relação às oito da tabela do sinal: **alargar de
  dois para três é o contrário do achatamento.** Lá a entrada trazia menos
  palavras do que o vocabulário tem, e o que se perdia era desenho; aqui ela traz
  uma a mais do que o ATRIBUTO tem, e atributo com um valor a mais é atributo com
  um valor a mais. Vale registrar, porque é a primeira vez que a diferença
  aparece deste lado: **o sinal prevê colapso quando a entrada é pequena demais
  para o vocabulário; ele não vira sobrevivência quando ela é um passo maior que
  um atributo.**

  A assinatura que sobra no lugar do estado é `cycle: number`, e ela é nova o
  bastante para render leitura própria — está no bloco do sinal mudo, adiante.
- **Vocabulário, não — e a ausência é a notícia, como na décima terceira.**
  `DiffLine` é `{ kind, text }`: três palavras e uma cadeia. `filename`,
  `additions` e `deletions` são `TimelineStat` com outros nomes. Nenhum tipo
  próprio, e nada que `chat-protocol.ts` precise aprender.

  E o que **não** está aqui é justamente o que a tabela da 5.2 apostava que
  estivesse. `diff-hunks.ts` guarda, segundo a §3.2, partir um diff unificado em
  blocos e o estado por bloco — e `code-diff` **não faz nem uma coisa nem
  outra**: não recebe um diff unificado para partir (recebe `lines`, já partido
  por quem monta) e não tem estado por bloco, porque não tem bloco. A aposta foi
  conferida, não herdada, e não se sustenta deste lado. Do outro, ver a cláusula
  do que esta leitura não decide.

  Vale também a sexta forma do sinal — tipo mais estreito —, medida na décima
  sexta e alargada na décima nona para "o estreitamento se mede contra o que já
  está construído". Aqui ele não está num campo: está na peça inteira.
  `code-diff` não tem `language`, e por isso não tem realce nenhum, onde
  `code-block` tem `code-highlight.ts` com onze espécies de token medidas nos
  dois modos e nos três temas; não tem numeração, onde `code-block` tem o gutter
  sticky; não tem copiar, onde `code-block` tem um botão cujo conteúdo é
  exatamente a cadeia que entrou. **A fonte é a peça construída com MENOS, mais
  uma etiqueta por linha.**

E o teste da família, que é o quarto: ela responde ao eixo — a forma com que o
modelo responde quando não é texto — respondendo com a peça que esta base usa
quando a resposta É código. A base declarada da família 4 é `card`, `table` e
`chart`, e a desta entrada não é nenhuma das três. Não é ele que decide, porque
os três já decidiram; mas aponta na mesma direção, e é a leitura da quinta
correção pelo avesso: lá a entrada não pertencia à família; aqui ela pertence, e
já está construída FORA dela.

**O que fica nomeado como faltando** — a 5.1 exige nomear, e são três, nenhum
deles folha nova nem token novo:

1. **`.nds-code-block-line[data-kind="context|added|removed"]` em
   `code-block.css`**, com um par de tinta por espécie ao lado do par de destaque
   que já existe. Não é token novo: é `--success` e `--destructive` com alfa, como
   o destaque já é `--primary` com alfa. E se mede como as outras cores desta
   folha se mediram — contra `--muted` E contra a linha destacada, nos dois modos
   e nos três temas —, porque o cabeçalho de `code-block.css` já registra uma
   medição que reprovou por ter olhado só um dos fundos.
2. **Nesse modo o gutter carrega a PALAVRA, e deixa de ser `aria-hidden`.** Hoje
   o construtor põe `aria-hidden="true"` no gutter porque número de linha é
   redundante com a posição; sinal de diferencial não é. O visível é `+` / `−` /
   espaço, e o que o leitor recebe é a palavra em `.nds-sr-only`, uma por linha —
   que é a regra 4 da §8 e a mesma troca de ícone por palavra que a decisão 4 do
   `tool-group` já fez. É decisão de CONSTRUTOR, no atributo; a folha não muda por
   causa dela.
3. **Uma opção de espécie por linha em `createCodeBlock`**, ao lado de
   `highlightLines` — e junto com ela a opção `actions?: HTMLElement[]` que a
   sétima correção já nomeou e que **ainda não existe**: conferido em
   `CodeBlockOptions`, que hoje declara `code`, `language`, `title`,
   `showLineNumbers`, `highlightLines`, `footer`, `copyLabel`, `copiedLabel` e
   `class`, com a fila `.nds-code-block-actions` montada por dentro e só com o
   copiar. É a mesma opção, e agora são DUAS entradas da 5.1 pedindo-a.

E um quarto item, que não é desta entrada mas que esta leitura encontrou e a
regra de zero pendências manda dizer em voz alta: **`.nds-code-block-scroll` tem
`tabindex="0"` e não tem nome acessível nem papel**, e a regra 6 da §8 pede os
dois ("uma só camada rola, e ela tem nome"). É defeito do `code-block`
construído, não da triagem, e fica nomeado aqui porque quem abrir a opção do item
3 mexe no mesmo construtor.

**Reversível**, como as outras vinte e uma: se ao construir `reviewable-diff` — ou
qualquer outra da família 4 que mostre mudança de arquivo — aparecer diferencial
com desenho, estado ou vocabulário próprios (numeração em duas colunas que não
avançam juntas, lado a lado, trecho dobrável com intervalo no resumo, ou estado
por linha que uma etiqueta de espécie não modele), `code-diff` desdobra de volta
para a 5.2, com o motivo. E há um segundo gatilho, deste lado: se as três tintas
não couberem em `code-block.css` sem regra que não seja por linha — se o
diferencial pedir cabeçalho próprio, corpo próprio ou uma segunda coluna —, ele
volta a ser peça, e volta com a folha da família 4 ainda por fundar.

**O que esta leitura NÃO decide, e por quê.** `reviewable-diff` é entrada IRMÃ e
não foi triada aqui: decidir uma peça de dentro da triagem de outra é o que a
sexta correção recusou fazer com `TimelineStat`. Fica REGISTRADO, para quem a
abrir, o que a fonte dela declara e que esta leitura teve de ler para medir a
aposta do primitivo: `DiffHunk { id, range, decision, lines }`,
`HunkDecision = "pending" | "kept" | "discarded"`, mais `onKeep`, `onDiscard` e
`onApply`, e um rodapé com quanto falta decidir. **O bloco, o intervalo e o
estado por bloco moram inteiros nela**, e `DiffLine` é o único tipo que as duas
dividem. Duas consequências, nenhuma decidida aqui:

- a justificativa de `diff-hunks.ts` na tabela da §3.2 é de UMA entrada e não de
  duas — a linha de lá já foi corrigida para dizer isso, sem decidir a irmã;
- e `DiffLine`, que esta correção acabou de transformar em opção do `code-block`,
  é o tipo que a irmã importa. Onde ele mora — `chat-protocol.ts`, o construtor
  do `code-block`, ou o primitivo — é decisão de quem triar `reviewable-diff`,
  com as duas leituras na mão.

**E uma previsão da sexta correção que esta leitura corrige, porque agora há
medida onde lá havia adiamento.** Ela deixou `TimelineStat { file, added,
removed }` para `diff-hunks.ts`, "com `code-diff` e `reviewable-diff`, na família
4", e adiou o desenho de propósito, para não decidir a folha da 4 de dentro da 2.
Medido agora, dos dois lados: o cabeçalho de `code-diff` É esse tipo, e ele
colapsa no `.nds-badge` que a PRÓPRIA sexta correção já havia escrito na 5.1 para
a faixa de estatísticas de arquivo; e o cabeçalho de `reviewable-diff` não tem
contadores nenhum — a fonte dela mostra o nome do arquivo e quanto já foi
decidido, não quantas linhas entraram e saíram. **`TimelineStat` não tem casa em
`diff-hunks.ts`**, e não porque a decisão tenha sido tomada aqui: porque das duas
entradas que a justificavam, uma não carrega o tipo e a outra não é peça. O
adiamento estava certo; o que ele adiou já tinha dono na tabela ao lado.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 15, 3 tem 6, 4 tem 19, 5 tem 5, 6 tem 8 e 7 tem 2 — **66** na 5.2.
A 5.1 vai a **54** (52 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. A família 4 fica com **19 componentes**, e as sete somam
60.

E o registro de método vale outra vez, porque a porta da `confidence-marker`
escreveu nesta seção enquanto esta lia: **a 3 tem 6 e não 7 porque aquela
correção a baixou**, e este número não saiu do delta desta passada — saiu da
tabela da 5.2 relida depois dela. Contador compartilhado com duas portas vivas
lê-se do arquivo, nunca da própria conta.


**Vigésima terceira correção, e a décima sétima que atravessa de 5.2 para 5.1**:
`schedule-card` é `.nds-card` com `switch` no cabeçalho e `.nds-item-group` de
`agent-status` — e as duas contagens mudam junto, 66 → 65 e 54 → 55. É a quarta
que colapsa numa peça da PRÓPRIA família 2 já construída, e a primeira em que o
sinal do booleano aparece nas DUAS formas dentro da mesma entrada.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`ScheduleRun { id: string, at: string, ok: boolean }` e, no componente, `name:
string`, `cadence: string`, `nextRun: string`, `enabled: boolean`, `history:
readonly ScheduleRun[]`, `onToggle?: () => void` e `className`. Sete entradas no
componente, três campos na linha, UMA chamada de volta — e sem argumento. Faixa
de runtime não há: a página publica só a forma standalone, e é a primeira entrada
triada assim. A leitura fica mais curta por isso, e é preciso dizer para que lado:
o que falta é a contradição INTERNA que a décima oitava e a vigésima acharam
entre as duas faixas das suas, e ela é uma prova a menos contra a entrada — nunca
uma a favor. A anatomia são três blocos: um cabeçalho com ícone de relógio, o
nome cortado, a cadência abaixo e um `<button role="switch" aria-checked>` no fim
da linha; uma linha "next" que mostra `nextRun` enquanto ligado e a palavra
literal "paused" enquanto desligado, com a linha inteira esmaecendo; e uma fila
"recent runs" de uma linha por execução passada, com visto ou cruz, o carimbo e a
palavra "ok" ou "failed". Com `history` vazio o rótulo da fila continua desenhado
e nenhuma linha segue.

**A FONTE DIZ, DELA MESMA, QUE A REGRA E O QUE PAUSAR SIGNIFICA MORAM DO LADO DE
FORA** — "it is a plain display; the schedule itself, and what pausing actually
does, live in your own backend" —, e é essa medida que decide todo o resto. É a
§7 escrita pela origem, antes de esta seção precisar aplicá-la: tirada a política
— o que a cadência agenda, o que pausar faz, se a execução perdida é reposta —, o
que sobra é um nome, três cadeias já formatadas, um interruptor e uma lista.

Antes dos três testes, as três perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **Tempo FUTURO é eixo novo nesta família? NÃO É, e a folha já o tinha
  construído.** É a pergunta mais forte da entrada, porque as nove peças desta
  família já construídas descrevem o que está acontecendo ou o que já aconteceu, e
  esta descreve o que vai acontecer. A resposta está em
  `.nds-connection-state-countdown`: "em 5 s" é um instante futuro, desenhado ao
  lado da palavra do estado e antes da ação — e a decisão 2 daquele bloco já
  registra o preço, que é o mesmo aqui. **Chega já escrito, como texto**, porque
  formato de duração e de data é decisão de idioma, e um componente que o
  formatasse decidiria idioma em cinco lugares; a terceira regra do estado da
  execução diz o mesmo do relógio dela. Com o instante futuro já resolvido como
  cadeia por uma peça de pé, `nextRun` não abre eixo nenhum: entra numa fenda que
  a família abriu, e não numa que ela não tem.
- **A cadência é vocabulário, ou é cadeia? É cadeia, e a fonte já a entrega
  escrita.** "Daily at 06:00" é o valor inteiro — não há regra de recorrência, não
  há intervalo, não há dia da semana, não há nada que o componente parta ou
  interprete. É a diferença exata para `x` e `y` na nona correção: lá o tipo
  trazia DADO que nada aqui descrevia e que só existia sobre uma superfície; aqui
  o tipo é `string`, e cadeia já formatada é o que esta família decidiu receber
  por regra. **Conceito que não entra no sistema de tipos não é vocabulário que se
  ganha; é texto que se hospeda** — e hospedar texto é o que
  `.nds-card-description` faz.
- **O interruptor é ação, ou é estado? É o `switch`, inteiro, e o desenho dele já
  está no design system.** A fonte escreve `<button role="switch"
  aria-checked={enabled}>`, que é literalmente a árvore do cabeçalho de
  `switch.css`, atributo por atributo. E o par de campos que o alimenta —
  `enabled: boolean` mais um `onToggle` que "não muda `enabled` sozinho" — é a API
  de um interruptor controlado, que aquele primitivo já tem construído nas cinco
  stacks. A tentação é lê-lo como a terceira parte do eixo da família ("o que eu
  posso fazer a respeito"), e ele é: mas ali a família já respondeu com ESPAÇO, e
  o espaço no cabeçalho de um cartão é `.nds-card-action`, onde a quinta correção
  pôs o distintivo de versão, a décima a etiqueta de política e a décima sétima a
  contagem.

Os três testes, todos negativos:

- **Desenho, não.** Montado inteiro, o cartão não deixa buraco — e a fonte mesma
  já diz de que ele é feito, como em quase toda esta seção: a raiz "usa a
  superfície `paper` compartilhada", a cadência e os rótulos "next" e "recent
  runs" usam `mono`, e a linha "next" "fica numa pílula `field`". Superfície
  compartilhada declarada na origem — a leitura da quinta, da sétima, da décima,
  da décima primeira, da décima segunda, da décima quarta, da décima quinta, da
  décima sétima, da décima oitava, da décima nona e da vigésima correções, e o
  oposto exato do que a nona leu em `computer-use`.

  A composição são três filhos de `.nds-card`. O cabeçalho é `.nds-card-header`
  com `.nds-card-title` `.nds-truncate` para o nome, `.nds-card-description` para
  a cadência e o `switch` em `.nds-card-action` — e a grade que costura isso já
  está escrita: `.nds-card-header:has(> .nds-card-action)` abre a segunda coluna,
  `.nds-card-header:has(> .nds-card-description)` abre a segunda linha, e
  `.nds-card-action` já ocupa a coluna 2 nas duas linhas com `justify-self: end`.
  É o cabeçalho da fonte, sem uma regra nova. O ícone de relógio entra em
  `.nds-badge > svg`, que já o dimensiona e alinha, e é a mesma saída que a décima
  oitava usou para o ícone de banco de dados — e não `.nds-item-media-icon`, cujo
  quadrado tingido a décima sexta teve de nomear como faltando. A linha "next" é
  `.nds-item` `data-size="sm"` com o rótulo em `.nds-item-title` e o instante em
  `.nds-badge` com `.nds-font-mono`, onde a quinta, a décima primeira, a décima
  segunda, a décima sétima e a décima oitava já puseram todo valor técnico. A fila
  é `.nds-item-group` de `.nds-item` `.nds-item-outline` `data-size="sm"`, com o
  carimbo em `.nds-item-title` e `agent-status` inteiro em `.nds-item-actions` — o
  ponto decorativo e a PALAVRA. Sem execução nenhuma, `empty.css`, como na décima
  sétima. Nenhuma classe nova, nenhuma nomeada como faltando.

  Três traços a composição não reproduz, os três por decisão já escrita. O
  esmaecimento da linha "next" quando pausado é opacidade, que a regra 4 da §8
  troca pela PALAVRA — e a palavra já está lá, porque a própria fonte escreve
  "paused" no lugar do instante. O visto e a cruz por linha são o ícone que esta
  folha já recusou uma vez: o ponto é decorativo e a palavra é o estado, e trocar
  isso numa entrada seria redecidir uma regra da família para uma peça. E a fonte
  não separa corpo de cabeçalho, que a composição separa porque o cartão desta
  casa tem `.nds-card-content` — divergência de marcação, não de desenho.

  Onde fonte e composição DISCORDAM, a composição está mais fina, como na oitava,
  na décima primeira, na décima quarta, na décima quinta, na décima sétima e na
  décima oitava: a fonte separa a execução que deu certo da que falhou por ícone e
  por duas palavras inglesas fixas, e aqui cada linha carrega `RunStatus` inteiro
  pela `agent-status`, com a palavra traduzida e a distinção que a fonte não faz
  entre o que falhou e o que alguém interrompeu.

  E há uma leitura de PARENTESCO que fecha este teste, e ela não vem desta
  família: `item.css` abre dizendo que a linha rica é "usada em listas de
  configurações". Um nome, uma explicação abaixo dele e um interruptor no fim da
  linha é a linha de configuração canônica do design system, e `settings-panel` já
  está na 5.1 apontando `form`. A entrada é uma configuração de agendamento com um
  histórico embaixo.

- **Estado, não — e é a primeira em que o sinal fala pelas DUAS bocas na mesma
  entrada.** `ok: boolean` sabe fazer dois desenhos onde `RunStatus` tem cinco
  palavras, e o que se perde é o pior conjunto possível para o assunto: `stopped`
  — a execução agendada que alguém interrompeu no meio —, `running` — a das seis
  da manhã que ainda está correndo quando se abre a tela — e `idle`. Uma fila de
  execuções passadas em que a interrompida desenha igual à que quebrou é a mesma
  perda que a décima oitava mediu, e aqui ela custa mais: num agendamento
  repetido, distinguir "eu parei esta" de "esta falhou" é o que decide se a
  cadência está errada ou se o mundo está.

  E `enabled: boolean` é o sinal PELO AVESSO, a leitura da décima quinta e da
  décima nona: não achata vocabulário nenhum — não há palavra de conversa para
  "pausado", e não deve haver, porque agendamento pausado não é execução parada —,
  mas é o MESMO booleano que a peça que desenha a superfície já declara. Lá o dono
  era o `composer` e depois o `media-player`; aqui é o `switch`, e a coincidência
  é mais crua que nas duas anteriores, porque não é só o booleano: é o booleano, a
  chamada de volta que não o muda sozinha e o `role="switch"` com `aria-checked`,
  que é a árvore inteira do primitivo. **As duas formas do sinal na mesma entrada
  não se somam, elas se dividem o campo**: um booleano fica aquém do vocabulário,
  o outro é de outra peça — e não sobra nenhum que seja desta.

  A sub-regra do sinal mudo não se aplica, porque o sinal falou; mas a chamada de
  volta que sobra confirma pelo mesmo caminho das outras: `onToggle` é a assinatura
  de UM tipo de peça, e o dono dela está construído nas cinco stacks. Depois de
  `onSelect`, `onPick` e `onJump`, é a primeira que não é de escolha e ainda assim
  nomeia dono — o que ela nomeia não é quem escolhe, é quem alterna.

- **Vocabulário, não, e desta vez nenhum campo fica sem par.** `id` é endereço de
  linha, que `ChatToolCall.id` e `PlanStep.id` já declaram com o mesmo docblock.
  `at` é carimbo já formatado, que é a decisão do relógio de `agent-status` e da
  contagem de `connection-state`, nas mesmas palavras. `ok` é `RunStatus`
  estreitado, medido acima. `name` e `cadence` são dado de produto, que a §7
  entrega a quem monta, como o servidor da vigésima e a etiqueta de política da
  décima. `nextRun` é a mesma cadeia de instante, medida na primeira pergunta. É a
  distância inteira para `computer-use`, que sobreviveu por ter dois campos sem par
  em lugar nenhum: aqui todos têm par, e quase todos têm par nesta folha.

E o teste da família, que é o quarto: **ela responde ao eixo, e é a primeira que o
responde sobre uma execução que ainda não existe.** "O que está acontecendo" é
"nada, e de novo amanhã às seis"; "há quanto tempo" é o instante futuro que o
estado da ligação já desenha; "o que eu posso fazer a respeito" é desligar. As
três respostas cabem, e nenhuma pede desenho que a folha não tenha — o que faz
desta a leitura mais limpa do padrão que a sexta, a sétima, a décima primeira, a
décima segunda, a décima quarta, a décima quinta, a décima sétima e a vigésima já
nomearam: **`schedule-card` não sai por não pertencer à família — sai por já estar
construída dentro dela.**

**E POR QUE MIGRA EM VEZ DE SER ABSORVIDA**, pelo critério da quarta e da
vigésima: absorção é para quem não acrescenta nada — mesma marcação, mesmo
vocabulário, mesma docs page com outro título. Aqui a composição junta três peças
que não se conhecem — o cartão, o interruptor e o estado da execução — e uma docs
page desta entrada mostraria `switch` dentro de `.nds-card-action`, que a docs
page do estado da execução não mostra e não deve mostrar. **A 5.1 é para quem
compõe mais de uma peça.**

**As reversibilidades que apontavam para cá, respondidas:**

- **`background-inbox` (décima sétima) CONFIRMA, e a cláusula fecha os dois
  gatilhos.** A condição era trabalho em segundo plano com desenho, estado ou
  vocabulário próprios: um ponto de entrada que saia da conversa e peça desenho,
  um estado por execução que `RunStatus` não modele, ou não-lido chegando como
  VOCABULÁRIO. Nenhum dos três: não há ponto de entrada, não há gatilho e não há
  painel; o estado por execução é `ok: boolean`, que é aquém do vocabulário e não
  além dele; e não-lido não existe — as linhas são histórico, e ninguém as coleta.
  O segundo gatilho — se `agent-status` precisasse de desenho próprio para viver
  em lista — também fica mudo: aqui ela vive em lista pela segunda vez, e
  `.nds-item-group` continua bastando. `background-inbox` fica na 5.1.
- **`elicitation-form` (vigésima) CONFIRMA.** A condição era pergunta com corpo de
  desenho, estado ou vocabulário próprios. Não há pergunta nenhuma aqui: não há
  pedido, não há alcance, não há par de controles e não há nada de pé esperando
  resposta. Um interruptor não é pergunta com consequência no sentido da §7 — o
  que ele muda é o mundo, direto, e o que essa mudança significa a própria fonte
  já pôs fora da peça. `elicitation-form` fica na 5.1.
- **`permission-grant` (quarta) e `computer-use` (nona) não são tocadas**: nada
  aqui é pergunta com consequência nem geometria sobre superfície.

**Reversível**, como as outras vinte e duas: se ao construir `checkpoint-history` —
a única que falta na família — aparecer agendamento com desenho, estado ou
vocabulário próprios: uma cadência que chegue ESTRUTURADA e precise de desenho
(um trilho de sete pontos, uma prévia das próximas execuções, um calendário), um
estado por execução passada que `RunStatus` não modele — `missed`, `throttled`,
`skipped` por sobreposição, que são os três que um agendamento repetido tem e uma
execução avulsa não —, ou o estado do próprio agendamento chegando como
VOCABULÁRIO em vez de ser o booleano do interruptor —, `schedule-card` desdobra de
volta para a 5.2, com o motivo. E há um segundo gatilho, deste lado: se
`agent-status` precisar de desenho próprio para carregar um instante FUTURO em vez
de um decorrido — o que a composição evita pondo o instante da linha "next" num
distintivo, e não na fenda do relógio —, a mudança é dela, e o cartão continua não
sendo peça.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 14, 3 tem 6, 4 tem 19, 5 tem 5, 6 tem 8 e 7 tem 2 — **65** na 5.2. A
5.1 vai a **55** (53 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. A família 2 fica com **10 componentes**, e as sete somam 59.

E o registro de método vale uma terceira vez, porque DUAS portas escreveram nesta
seção enquanto esta lia a fonte: a 3 tem 6 pela vigésima primeira e a 4 tem 19
pela vigésima segunda, e nenhum dos dois números saiu do delta desta passada —
saíram das tabelas relidas depois de a árvore assentar. A conta que esta correção
tinha escrito antes disso dizia 20 na 4, e já estava velha quando foi escrita.
**Contador compartilhado não se lê duas vezes: lê-se uma, depois.**

**Vigésima quarta correção, e a décima oitava que atravessa de 5.2 para 5.1**:
`reviewable-diff` é `.nds-card` com um `code-block` por trecho — e as duas
contagens mudam junto, 65 → 64 e 55 → 56. É a **segunda leitura da família 4**, e
ela fecha a dupla do diferencial: as duas entradas do catálogo que mostravam
mudança de arquivo eram composição, e `resposta-estruturada.css` **continua por
fundar**. A vigésima segunda abriu a maior das sete famílias sem folha; esta a
deixa do mesmo jeito, e isso é resultado, não pendência — folha que nascesse em
volta de duas peças que não são peça nasceria em volta de nada.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`HunkDecision = "pending" | "kept" | "discarded"`; `DiffLine { kind: "context" |
"added" | "removed"; text: string }` — o MESMO tipo da irmã, palavra por palavra;
`DiffHunk { id, range, decision, lines }`; e no componente `filename`, `hunks`,
`onKeep(id)`, `onDiscard(id)`, `onApply()` e `className`. A anatomia são TRÊS
filhos: um cabeçalho com o nome do arquivo e "N de M mantidos"; um corpo com um
bloco por trecho — o intervalo, e os dois controles enquanto está pendente ou o
rótulo da decisão depois dela; e um rodapé com "N falta decidir" ou "tudo
revisado" e um botão de aplicar desabilitado enquanto houver pendente.

**A vigésima segunda deixou escrito o que faria esta entrada sobreviver**, e são
quatro gatilhos nomeados lá. Procurei os quatro na página antes de aplicar teste
nenhum, porque qualquer um deles viraria a leitura sozinho:

- **Trecho dobrável, com o intervalo no resumo?** Não. Não há `open`, não há
  `onOpenChange`, não há disclosure nenhum — o intervalo é uma linha de texto
  acima das linhas e o bloco está sempre aberto. É a regra 5 da §8 sem nada para
  reger.
- **Numeração, ou duas numerações que avancem em ritmos diferentes?** Não.
  `DiffLine` é `{ kind, text }` e a anatomia não tem calha. Era a ÚNICA geometria
  que esta base não teria como desenhar, e é a mesma ausência que a irmã já
  tinha.
- **Lado a lado?** Não. Unificado, e a fonte o diz na primeira linha.
- **Estado por linha que uma etiqueta de espécie não modele?** Não. O estado está
  no BLOCO, não na linha — e é por isso que ele merece leitura própria, no
  segundo teste.

E há uma quinta ausência, que a irmã não tinha e que inverte o sinal de
superfície compartilhada: **a fonte não declara região de rolagem nenhuma.**
`code-diff` lê `paper` MAIS `codeScroll`/`codeSurface` de `surfaces.tsx`; esta lê
`paper` e `inkButton`, e nada mais. Onde a irmã declarava compartilhada a caixa
que rola, esta não tem caixa que role, e a linha comprida não tem para onde ir. É
o traço em que a composição fica **mais fina que a fonte**, como na oitava, na
décima primeira, na décima quarta, na décima quinta, na décima sétima e na
vigésima: `.nds-code-block-scroll` dá à revisão o que a origem não deu à revisão
dela.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, a revisão não deixa buraco — e a própria
  fonte declara compartilhado o que usa, `paper` na superfície e `inkButton` no
  botão de aplicar, os dois em `surfaces.tsx`, que é a leitura da quinta, da
  sétima, da décima, da décima terceira, da vigésima e da vigésima segunda.

  Os três filhos da anatomia são os três filhos de `.nds-card`, conferidos na
  folha e não presumidos: `.nds-card-header` leva o nome do arquivo em
  `.nds-card-title` com `.nds-font-mono` e `.nds-truncate` — caminho de arquivo é
  o caso para o qual a regra do truncamento foi escrita — e a contagem em
  `.nds-badge` com `.nds-font-mono` dentro de `.nds-card-action`, o encaixe que a
  grade já abre com `:has(> .nds-card-action)`; `.nds-card-content` recebe
  `.nds-stack[data-spacing="sm"]` de um `code-block` por trecho; e
  `.nds-card-footer` leva a frase do que falta e o botão de aplicar.

  Cada trecho é `.nds-code-block-root` inteiro, e o encaixe é exato:
  `.nds-code-block-title` monoespaçado recebe o intervalo — que chega como CADEIA
  e que a fonte nunca reparte —, e `.nds-code-block-actions`, a fila que o
  cabeçalho já encosta no fim com `margin-inline-start: auto`, recebe os dois
  controles enquanto está pendente e o distintivo do que foi decidido depois. As
  linhas são `.nds-code-block-line` com a espécie que a vigésima segunda já
  nomeou, dentro de `.nds-code-block-scroll`, `.nds-code-block-pre` com
  `lang="en"` e `.nds-code-block-text` com `white-space: pre`. Nenhuma classe
  nova, e nenhuma nomeada como faltando além das que a irmã já nomeou.

  **A troca dos controles pelo rótulo é o contrato da §2, não um estado.** "Ação
  é espaço, não política: `actions?: HTMLElement[]`" — quem monta passa dois
  botões ou passa um distintivo, e o bloco desenha o que recebe. É o mesmo
  movimento que o cartão de autorização já faz com os controles dele, e o
  componente nunca precisa saber qual dos dois está lá.

  Um traço a composição não reproduz, por decisão já escrita: as linhas do trecho
  descartado ESMAECEM e continuam visíveis. Opacidade sozinha separando duas
  decisões é a codificação que a regra 4 da §8 recusa, e a décima segunda já
  mediu o custo dela em `agent-handoff` — dois desenhos que se separam só por cor
  e opacidade não são dois desenhos. O que entra no lugar é a PALAVRA, que a
  própria fonte já põe ali ao lado.
- **Estado, não — e é aqui que a entrada quase vira peça, então a medida vale
  inteira.** `HunkDecision` tem três palavras. `pending` é `ToolCallState`
  `pending` sem folga nenhuma: é o estado que espera por uma PESSOA, que é a
  razão declarada de ele existir separado de `running` (§3.1) e o que
  `waitsForPerson` já responde. As outras duas não são estados da peça: são o que
  acontece DEPOIS de respondê-la, e a §7 as põe do lado de fora por escrito.

  É a mesma forma da vigésima correção, palavra por palavra: `request | accepted
  | declined` tinha uma do vocabulário e duas do produto, e colapsou por isso.
  Aqui a diferença que se poderia alegar — que o assentado desta é LIDO pela peça
  enquanto ela continua de pé, em vez de encerrá-la — foi medida e não segura: o
  que o assentado alimenta é uma CONTAGEM, e a fonte diz dela que é sempre
  derivada de `hunks` e nunca guardada em separado. **Agregado que é leitura
  rende função, não desenho** — a décima sétima já escreveu essa frase, e lá ela
  reprovava a entrada porque a conta encolhia junto com o vocabulário; aqui a
  conta está certa, e continua sendo uma função.

  E `kept` contra `discarded`, medido pelo critério da §3.1 — um estado só existe
  se muda o desenho: tirado o esmaecimento que a regra 4 recusa, os dois se
  separam por uma palavra dentro do mesmo `.nds-badge`. **Palavra diferente no
  mesmo distintivo é conteúdo.** O que muda desenho de verdade é pendente contra
  decidido — dois botões ou um distintivo —, e isso é a fila de `actions` que a
  §2 dá à família inteira.

  Vale reparar em quem GUARDA a decisão, porque a fonte é explícita nas duas
  faixas: `useState<Record<string, HunkDecision>>` mora em quem CONSOME, nas
  duas. Isso sozinho não decide nada — nesta família todo estado entra por prop, e
  `agent-status` recebe `RunStatus` do mesmo jeito —, mas fecha a leitura: a peça
  não é dona da decisão, não a produz e não a guarda; recebe o que alguém decidiu
  e o repassa.
- **Vocabulário, não, e a ausência é a notícia pela terceira vez** (a décima
  terceira e a vigésima segunda foram as outras duas). `DiffLine` é o tipo da
  irmã, idêntico, e a vigésima segunda já o transformou em opção do `code-block`.
  Tirado `decision`, que é o item acima, `DiffHunk` fica `{ id, range, lines }`:
  um endereço, um rótulo em cadeia e uma lista. É exatamente o que a quinta
  correção recusou chamar de vocabulário em `AgentSkill` — "uma linha de lista
  com nome próprio" —, e `range` é o caso mais claro disso, porque a fonte o
  imprime e nunca o reparte. Nada que `chat-protocol.ts` precise aprender.

E o teste da família, que é o quarto: ela responde ao eixo — a forma com que o
modelo responde quando não é texto — e a base que usa é `card`, que é uma das
três que a 5.2 declara para a família 4. É o inverso exato do que a vigésima
segunda leu na irmã, e por isso vale dizer que **não é ele que decide aqui
tampouco**: os três já decidiram, e responder ao eixo não salva quem não tem
nenhum dos três, como `code-runner` já mostrou na sétima.

**O que fica nomeado como faltando: NADA — e essa é a segunda notícia desta
leitura.** A vigésima segunda nomeou três coisas (`actions?: HTMLElement[]` no
cabeçalho, a espécie por linha ao lado de `highlightLines`, e o gutter que nesse
modo carrega a palavra em vez de ser `aria-hidden`) mais um quarto item que era
defeito do `code-block` construído e não da triagem — `.nds-code-block-scroll`
com `tabindex="0"` sem nome nem papel, regra 6 da §8. **As quatro estão de pé na
árvore**, medidas em `CodeBlockOptions` no momento de compor e não lidas desta
guideline: `lineKinds`, `actions`, `addedLabel`/`removedLabel` e `regionLabel`,
com `role="group"` na região que rola. Foi outra porta que as construiu enquanto
esta lia a fonte, o que é o motivo pelo qual a §11 manda ler o estado do
componente na hora de compor: uma triagem que tivesse copiado a lista de
pendências da irmã teria nomeado como faltando quatro coisas que existem.

E isso ENDURECE o desfecho em vez de o enfraquecer. O buraco de opção era a
última coisa que separava a composição de estar pronta, e o teste do desenho da
5.1 é literalmente "montada inteira, deixa buraco?". Não deixa nenhum. A revisão
de cinco trechos, que sem `regionLabel` seriam cinco paradas de tabulação
anônimas, tem cinco regiões nomeadas.

**As três heranças que a vigésima segunda deixou para esta triagem, respondidas:**

1. **`diff-hunks.ts` não nasce.** A §3.2 lhe dava duas tarefas. A primeira —
   partir um diff unificado em blocos — não é de ninguém: as DUAS entradas
   recebem o material já partido, `code-diff` em `lines` e esta em `hunks`, e
   quem parte é quem monta. A segunda — o estado por bloco — não é desenho: é
   `pending` mais o que a §7 tira, e o que resta dele é a contagem derivada, do
   tamanho de `isRunFinished`, cuja casa é `chat-protocol.ts` no dia em que uma
   peça precisar dela, que é o que a décima sétima já fixou para a contagem do
   `background-inbox`. **Primitivo previsto que perde as duas tarefas não nasce
   menor: não nasce.** A linha da §3.2 foi corrigida para dizer isso.
2. **`DiffLine` não sobrevive como forma, e a espécie mora em
   `docs/shared/primitives/code-block-lines.ts`** — módulo folha ao lado de
   `code-highlight.ts`, com `CodeLineKind` e o mapa de espécie para marca
   visível e para palavra falada. A parte desta decisão que era desta triagem é a
   NEGATIVA, e ela se mantém: não em `chat-protocol.ts`, que é o vocabulário da
   CONVERSA e onde espécie de linha de código não descreve nem mensagem, nem
   parte, nem chamada de ferramenta; e não no primitivo da família 4, que pelo
   item 1 não existe. A positiva foi MEDIDA na árvore, não decidida aqui: a porta
   do `code-block` a construiu enquanto esta lia a fonte, e o lugar dela é melhor
   do que o que esta leitura escreveria — o módulo carrega mais do que um tipo,
   carrega o par marca/palavra, e isso é decisão que rende cinco `if`, que é o
   critério da §3.2. Dentro de `code-highlight.ts`, que é tokenizador, o mapa não
   teria o que fazer.

   E a FORMA confirma o que esta leitura previu por outro caminho: o construtor
   recebe `code: string` mais `lineKinds`, uma lista paralela indexada por linha,
   como já recebe `code` mais `highlightLines`. **O par `{ kind, text }` da fonte
   não sobrevive em stack nenhuma**, porque quem já tem o código inteiro numa
   cadeia não o reparte para depois juntar de novo.
3. **`TimelineStat` não tem casa, e agora está medido dos dois lados.**
   Conferido na fonte DESTA entrada, que era a metade que faltava: o cabeçalho é
   o nome do arquivo mais "N de M mantidos", e não há contador de adição nem de
   remoção em lugar nenhum da peça. A previsão da vigésima segunda se confirma, e
   quem deu desenho ao tipo continua sendo a sexta correção — `.nds-cluster` de
   `.nds-badge`, na 5.1, na linha do `tool-timeline`.

**Reversível**, como as outras vinte e três: se ao construir `file-tree`,
`trace-waterfall` ou qualquer outra da família 4 aparecer revisão de mudança com
desenho, estado ou vocabulário próprios — trecho dobrável, numeração, lado a
lado, uma rolagem horizontal ÚNICA que atravesse os trechos e os mantenha no
mesmo deslocamento, ou um assentado que se desenhe de outro jeito que não uma
palavra —, `reviewable-diff` desdobra de volta para a 5.2, com o motivo. E há um
segundo gatilho, deste lado: se a fila de N blocos numa mesma revisão pedir regra
que não seja de bloco — cabeçalho pegajoso por trecho, uma calha comum, uma
segunda coluna —, ela volta a ser peça, e volta com `resposta-estruturada.css`
ainda por fundar.

**E `code-diff` NÃO desdobra.** A cláusula da vigésima segunda pedia que esta
leitura procurasse quatro coisas na irmã, e as quatro estão respondidas acima:
não há numeração em duas colunas, não há lado a lado, não há trecho dobrável com
intervalo no resumo, e não há estado por linha que uma etiqueta de espécie não
modele. O segundo gatilho daquela correção também fica de pé: as três tintas
continuam cabendo em regra por linha, e o cabeçalho de que esta entrada precisa é
o do `card`, não um cabeçalho próprio do diferencial.

**O que esta leitura NÃO decide**: nenhuma das outras dezoito da família 4 foi
triada aqui. Quem abrir a próxima funda `resposta-estruturada.css` — e agora sem
as duas entradas de diferencial dentro, o que muda o eixo do que a folha vai ter
de reger: as duas que saíram puxavam a família para código, e as dezoito que
ficam não são código.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 14, 3 tem 6, 4 tem 18, 5 tem 5, 6 tem 8 e 7 tem 2 — **64** na 5.2.
A 5.1 vai a **56** (54 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. A família 4 fica com **18 componentes**, e as sete somam
58.

E o registro de método vale uma quarta vez, pelo avesso das três anteriores: a
árvore estava ASSENTADA quando esta contagem foi feita — a vigésima terceira
tinha acabado de ser commitada, e as tabelas foram recontadas depois disso, linha
a linha. Foi assim que o número de partida desta correção ficou 65 e não 66: o
briefing que a pediu trazia 66, que era a conta de antes da vigésima terceira, e
uma correção que confiasse nele teria escrito 65 no fim. **Contador
compartilhado não se herda de quem pede o trabalho: lê-se do arquivo, depois.**


**Vigésima quinta correção, e a décima nona que atravessa de 5.2 para 5.1**:
`message-branches` é o encaixe `actions` da mensagem do `chat-thread` com um
trio de `.nds-cluster` dentro — e as duas contagens mudam junto, 64 → 63 e
56 → 57. É a primeira que sai da família 6, que continua sem folha e agora com
sete entradas, e é a primeira leitura da campanha em que a peça onde a entrada
colapsa é a BASE DECLARADA da própria família.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`variants: readonly string[]`, `index: number`,
`onIndexChange: (index: number) => void` e `className`. Quatro entradas, uma
delas chamada de volta, **nenhum tipo declarado e nenhuma união** — a forma mais
rala das vinte e cinco leituras, mais rala até que a da décima quarta, que ao
menos tinha um booleano. A anatomia é uma raiz com duas coisas: um `<p>` com a
variante ativa, "keyed on index so it fades in on change", e uma fileira de
anterior, `n / m` e próximo. Fora disso, três comportamentos declarados: dá a
volta nas duas pontas, com uma variante só os dois controles nascem
desabilitados e o contador lê `1 / 1`, e sem variante nenhuma lê `0 / 0`.

**A PEÇA NÃO SABE DA ÁRVORE, SÓ DO ÍNDICE — e é essa medida que decide todo o
resto.** A prosa da fonte abre falando de irmandade: "a regenerated answer does
not replace the previous one; it becomes a sibling branch". Mas isso é a faixa
de RUNTIME, e é lá que moram as três coisas que fariam da irmandade um
vocabulário — `branchNumber`, `branchCount` e `switchToBranch({ position |
branchId })`, que é a única assinatura da página capaz de endereçar um ramo em
vez de contar posições. **A faixa standalone não tem NADA disso**: não há id, não
há pai, não há irmão, não há relação nenhuma. Há um arranjo plano e um número que
o indexa, e a §1 é literal sobre qual das duas se lê ("use sempre a forma
standalone, nunca a with runtime"). A árvore que dava nome à entrada fica inteira
do lado que esta guideline não porta, e o que atravessa para cá é
`total`/`current`/`onPageChange` com outros três nomes.

Antes dos três testes, as quatro medidas que esta triagem tinha de tomar, porque
é de uma delas que sairia desenho próprio:

- **O que é a posição.** `index: number`, base zero, exibido base um — que é
  `current` do `pagination`, base um, com a conversão de fora. Índice fora do
  intervalo "cai de volta para a primeira variante", que é tolerância de entrada,
  não estado.
- **O que é o total.** `variants.length`. Não é campo, é a MEDIDA DO ARRANJO — e
  é a única coisa que separa esta entrada do `pagination`, que recebe `total` de
  fora porque não tem as páginas na mão. Só que a diferença corre para o lado
  errado: agregado que se lê do conteúdo é a conta que a décima sétima e a
  vigésima quarta já classificaram, e as duas escreveram a mesma frase —
  **agregado que é leitura rende função, não desenho.**
- **Se há estado por ramo. Não há, e é a ausência mais larga da campanha.** Um
  ramo é uma `string`. Não tem id, não tem instante, não tem modelo, não tem quem
  o gerou, não tem estado de execução — nem sequer a marca de qual deles é o
  ORIGINAL, que é justamente o que a décima quarta correção disse que este
  seletor tornava alcançável.
- **Se a navegação tem consequência que uma paginação não tem.** Tem uma, e é a
  única carta séria desta triagem: trocar de ramo troca o texto que alguém está
  lendo. Mas a consequência **já tem dono nas duas pontas**. Do lado do anúncio, a
  regra 1 da §8 e `.nds-chat-thread-announcer`, que é a única região viva desta
  família e é da thread, não da peça. Do lado do desenho, a fonte responde à troca
  com um esmaecimento de entrada — `cycle` com outro nome —, e a 5.1 já deu dono a
  esse assunto quatro vezes, sempre o mesmo: `13-animacao.md`. E vale reparar no
  que a fonte NÃO traz: nem `aria-live`, nem `aria-busy`, nem anúncio nenhum. A
  peça que teria de existir por causa da consequência não desenha a consequência.

Os três testes, todos negativos:

- **Desenho, não.** Montada inteira, não deixa buraco, e a fonte mesma já diz de
  que ela é feita, pela oitava vez nesta seção e na forma mais forte que já
  apareceu: "the buttons use the shared `ghostButton` surface and the counter the
  `mono` surface from `surfaces.tsx`". Ela tem DOIS tipos de nó, e declara os dois
  compartilhados. É a leitura da quinta, da sétima, da décima, da décima quarta e
  da vigésima segunda, e o oposto exato do que a nona leu em `computer-use` e a
  décima terceira em `inline-citation` — lá a origem declarava compartilhado o
  resto e não tinha o que oferecer para o que a peça tinha de próprio; aqui não
  sobra nada para oferecer.

  E as duas metades do trio já estão DESENHADAS nesta casa, em dois lugares
  diferentes: `calendar` põe dois `.nds-calendar-nav-btn` ladeando um
  `.nds-calendar-caption`, e `computer-use` — construída nesta mesma campanha —
  escreve "3 de 6" em `.nds-computer-use-position`, com `tabular-nums` e o tom
  secundário. As duas carregam classe ESCOPADA porque as duas têm geometria em
  volta: uma sobrepõe uma grade, a outra legenda um quadro. Aqui não há geometria
  em volta nenhuma — é uma fileira de três itens numa fila que já existe —, e por
  isso o trio sai de `.nds-cluster` mais `.nds-button` mais `.nds-badge`, sem
  classe nova. Se um dia se quiser o trio compartilhado, ele é UTILITÁRIA, nunca
  folha e nunca peça, e é exatamente o que a abertura da 5.1 manda.

  Onde a composição e a fonte DISCORDAM, a composição está mais fina, como na
  oitava, na décima primeira e na décima quarta, e em três pontos. O contador da
  fonte é `text-foreground/35` — opacidade carregando a informação, que é a
  codificação que a regra 4 da §8 recusa e que a décima segunda já mediu —,
  contra a etiqueta com borda e `--foreground` da regra de container colorido da
  §9. O molde é uma barra crua, contra `{index} de {total}`, que é palavra de
  idioma e é o que `computer-use` já escreve; "3 / 6" lido em voz alta é "três
  barra seis". E o alvo de toque da fonte é 24 px exatos, no limite da regra 10,
  contra os 32 px do quadrado pequeno desta casa.

  Há um ponto em que compor com a peça errada seria defeito, e ele fica
  registrado porque é a única armadilha da linha: `createPagination` monta
  `<nav role="navigation" aria-label>`, e um seletor por turno numa conversa de
  cinquenta renderia cinquenta landmarks homônimos. É a leitura da vigésima
  segunda, palavra por palavra, quando ela escolheu `group` em vez de `region`
  para o bloco de código. O que se aproveita de `pagination` é o CONTRATO; o
  landmark e a fila de números ficam onde estão.

- **Estado, não — e o sinal ficou MUDO pela oitava vez.** Não há booleano, não há
  união encolhida, não há máquina de estados: não há TIPO. Pela sub-regra da
  décima, olha-se então a assinatura que sobrou no lugar do estado, e ela é uma
  só — `onIndexChange`. É a quarta chamada de volta de escolha depois de
  `onSelect`, `onPick` e `onJump`, e é a que aponta o dono mais exato das quatro:
  não uma analogia, e sim o mesmo trio, com o mesmo sentido, a uma pasta de
  distância — `PaginationOptions` declara `total`, `current` e
  `onPageChange?: (page: number) => void`, e `pagination` é o que a 5.2 escreve
  como base desta família. Não é o limite da décima terceira: `onOpenIndexChange`
  era o par de abrir e fechar que a §2 exige de TODA peça daqui, e por isso não
  apontava ninguém; escolher um item numa fila não é isso, e as três anteriores
  colapsaram.

  E vale a distinção que separa esta leitura da nona, porque as duas têm um índice
  sobre um arranjo e desfechos opostos. Em `computer-use` o eixo não era o índice:
  era o PONTO, `x` e `y` em porcentagem do quadro, que não tinha par em nada que
  este vocabulário descrevesse, e o `activeIndex` era o que sobrava ao lado dele.
  Aqui o índice é o eixo inteiro, e o eixo tem dono. **Índice sobre arranjo plano
  não é dimensão; é a coordenada que a fila já tinha.**

- **Vocabulário, não — e a ausência aqui é do tipo que a sexta forma pega.**
  `variants: readonly string[]` é a repetição exata de `words: readonly string[]`
  da décima nona, e vale a frase que aquela correção deixou escrita: **o parágrafo
  não é da peça.** Uma resposta irmã, nesta casa, é `ChatMessageOptions` —
  conteúdo em Markdown, autor, hora, avatar, `streaming`, chamadas de ferramenta,
  raciocínio, fontes e ações. Achatar isso numa cadeia não perde um campo: perde
  oito, e perde junto todas as PARTES que `MessagePartKind` enumera. É o
  estreitamento medido contra o que está CONSTRUÍDO, que é o alargamento que a
  décima nona fez da regra, e é o mais largo já medido — as anteriores estreitavam
  uma união (`DocumentAnchor.page`, `kind` de campo de formulário); esta estreita
  o objeto inteiro.

  E o efeito não fica no tipo: obriga a peça a desenhar a resposta num `<p>` de
  texto cru, onde esta casa passa toda fala de modelo por `createMarkdown` com
  `isSafeUrl` dentro de `.nds-chat-message-content`. A própria fonte já não
  acredita nesse `<p>`: o exemplo "stepper only" dela o esconde
  (`className="[&>p]:hidden"`) e manda o corpo vir de fora, e a faixa de runtime
  não o tem, porque lá o corpo é `MessagePrimitive.Parts`. **Corpo que a própria
  fonte esconde no segundo exemplo não é a peça** — o que resta é o trio.

E o teste da família, que é o quarto: ela responde ao eixo — achar e trocar de
lugar sem perder o seu — e responde com uma das quatro peças que a 5.2 nomeia
como BASE da família. É a leitura da décima quarta com um grau a mais: lá a
entrada colapsava na peça de que a família tomou o nome, e aqui colapsa na peça
que a família declarou como fundação antes de existir uma linha dela.

**As três contradições entre as faixas da fonte, e as três a standalone perde**,
que é a leitura que a décima oitava fixou e a vigésima confirmou. Dar a volta nas
pontas: a faixa de runtime desabilita nas pontas, e o "anterior" que na primeira
leva à última é um controle cujo nome mente. Sumir com uma variante só:
`hideWhenSingleBranch` existe no runtime "para manter a fileira de ações
estável", e a standalone desenha dois controles inertes em todo turno que tem uma
resposta só. Endereçar um ramo: `switchToBranch({ branchId })` existe no runtime,
e na standalone não há id nenhum. **Nas três, o que a standalone entrega é pior**
— e a terceira é a que apaga a árvore.

**O que a décima quarta escreveu sobre o seletor de ramo SE SUSTENTA, e o escopo
dela também.** Conferido na fonte do `edit-message`, palavra por palavra: "at
runtime, editing does not delete anything: sending … appends the rewrite as a new
sibling of the original under the same parent … the original message and
everything under it stay in the thread's history, reachable again through the
branch picker's `n / m` stepper, so nothing is actually discarded, only no longer
the branch showing". Aquela correção citou o trecho com a ressalva certa — "com
runtime" — e a conclusão que ela tirou dele não dependia de o seletor ser peça:
dependia de `discardedReplies` ser dado de produto, e a fonte diz isso com todas
as letras. O que esta leitura ACRESCENTA é o que faltava dizer: a irmandade que
torna a original alcançável mora na faixa de runtime, e a peça que a 5.2 tinha
reservado para ela nunca teve como carregá-la. **Tratar o seletor como coisa
existente estava certo; o que não se podia é supor que ele seria SLUG** — e agora
ele existe, como composição, no encaixe que a própria décima quarta já usava para
o controle de editar.

**E uma leitura que NÃO se decide daqui**, pela herança da décima sétima: nada
nesta triagem tocou `thread-list`. A caixa de execuções em segundo plano
projetava o estado da LISTA DE CONVERSAS, e a correção que a colapsou deixou
escrito que, se aquilo reaparecer como filtro dela, o conserto é na família 6.
`message-branches` navega entre irmãs de UM turno, dentro de uma thread; não
enxerga conversa nenhuma, não tem fila de conversas e não encosta naquele
assunto. A herança segue aberta, e quem triar `thread-list` a responde.

**E uma leitura de FAMÍLIA que esta correção obriga a escrever, porque a folha
continua por fundar.** A 5.2 dá quatro bases à família 6 — `sidebar`, `command`,
`pagination` e `stepper.css` —, e esta foi a primeira entrada a bater em uma
delas. O que ela mede é que `pagination` entra na família como CONTRATO (`total`,
`current`, `onPageChange`) e não como markup: o `<nav>` com nome que serve a um
rodapé de tabela é o que não pode ser repetido por turno. Quem fundar
`conversa-nav.css` escreva isso no cabeçalho — **e a vigésima sexta respondeu que
ninguém funda: a folha não nasce, e a leitura ficou na linha desta entrada na
5.1** — e repare que as sete que ficam são
todas de nível de CONVERSA, não de turno: buscar, listar, retomar, compartilhar,
apresentar. A única que era de dentro do turno saiu, e o eixo da folha fica mais
estreito e mais nítido por causa disso.

**Reversível**, como as outras vinte e quatro: se ao construir `regenerate-menu` —
a irmã mais próxima, que é o controle que CRIA o ramo — aparecer navegação entre
irmãs com desenho, estado ou vocabulário próprios (um ramo que chegue como objeto
com id, instante ou modelo em vez de cadeia; um estado por ramo que a posição não
modele; ou uma geometria que a fileira de ações não comporte),
`message-branches` desdobra de volta para a 5.2, com o motivo. E há um segundo
gatilho, deste lado: se `thread-list` ou `shared-conversation` pedirem um trio de
anterior, posição e próximo com regra que não seja de fila — posição pegajosa,
teclado de fila, o trio governando uma região rolável —, o que nasce é a
UTILITÁRIA compartilhada do trio, e ela continua não sendo esta peça.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 14, 3 tem 6, 4 tem 18, 5 tem 5, 6 tem 7 e 7 tem 2 — **63** na 5.2.
A 5.1 vai a **57** (55 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. A família 6 fica com **7 componentes**, e as sete somam 57.
(Números desta correção, não os de hoje: a vigésima sexta dissolveu a família 6
inteira, e a 5.2 passou a 56.)

E o registro de método vale uma quinta vez, e desta vez contra o BRIEFING e não
contra a árvore, que estava limpa: o pedido desta correção trazia que `pagination`
"já desenha anterior / N de M / próximo", e ele **não desenha**. `pagination.css`
não tem nó de fração nenhum, e `createPagination` monta um link por página com
reticências a partir de sete — enumeração, não posição. A afirmação empurrava para
o COLAPSO, e a peça colapsou assim mesmo, por outros três caminhos. **Vale para os
dois lados: afirmação que favorece o desfecho a que se chega é a que menos se
confere, e é por isso que ela tem de ser conferida primeiro.** O mesmo pedido
contava "nove triagens seguidas" colapsadas; são ONZE — da décima quarta à
vigésima quarta, sem sobrevivência no meio, e a última foi a décima terceira.


**Vigésima sexta correção, a primeira em LOTE, e a primeira que dissolve uma
FAMÍLIA inteira**: as sete entradas que restavam da família 6 colapsam, e a 6
deixa de existir. São a vigésima à vigésima sexta travessia de 5.2 para 5.1, e
as contagens mudam uma vez só, ao fim do lote: 63 → 56 e 57 → 64.
`conversa-nav.css` não é fundada, e as folhas novas desta guideline passam de
sete para seis.

**O MECANISMO, escrito uma vez porque seis das sete colapsam por ele**: a 5.2 deu
à família 6 quatro bases — `sidebar`, `command`, `pagination` e `stepper.css` —
antes de existir uma linha dela, e **as quatro bases eram as próprias peças**.
`message-branches` bateu em `pagination` na vigésima quinta; `thread-search` é
`command`; `thread-list` e `thread-list-sidebar` são `sidebar`; `onboarding` é
`stepper`. Não é coincidência de leitura, e o motivo é anterior a esta campanha:
as outras seis famílias descrevem coisas que só existem porque um modelo
responde — a superfície de entrada, o estado da execução, a evidência, a
medição, a voz —, e a 6 descrevia ACHAR E TROCAR DE LUGAR, que todo aplicativo
já tinha antes de haver conversa. Um design system de propósito geral resolve
navegação porque é obrigado a resolvê-la primeiro. **Base declarada antes de
construir é previsão; quando a previsão nomeia uma peça inteira em vez de um
material, ela já é o veredito** — e é isso que a 5.2 não sabia estar dizendo
quando escreveu aquela coluna.

O corolário para as folhas que faltam: ao abrir uma, leia a coluna do eixo comum
da própria 5.2 e pergunte se as bases ali são MATERIAL (`collapsible`,
`progress`, `badge`, `card`, `table`, `chart` — pedaços de que se monta) ou PEÇAS
(`sidebar`, `command`, `stepper` — telas prontas). Material sustenta família;
peça pronta é o dono.

**1. `regenerate-menu` — colapsa, e é a mais direta das sete.**

- **A favor**: é o controle que CRIA o ramo, e a vigésima quinta o nomeou como a
  irmã mais próxima de `message-branches` e um dos gatilhos para desdobrá-la. Se
  alguma da família tinha desenho próprio, seria a que abre um menu dentro da
  fila de ações de um turno.
- **Contra**: a API é a de `composer-model-picker`, CONSTRUÍDO nesta campanha,
  campo por campo — `options`/`models`, `currentId`/`value`,
  `onPick`/`onValueChange`, e `open` com `onOpenChange` idênticos dos dois lados.
  `RegenerateOption` é `ModelOption` sem `badge`, sem `unavailable` e sem
  `unavailableReason`. E o seletor foi feito AUTÔNOMO de propósito: o docblock
  dele diz, com essas palavras, que existe para "ter o seletor sem ter o campo —
  numa barra de ferramentas, numa página de ajustes".
- **Colapsa.** É a leitura da décima quinta e da décima nona na largura máxima:
  lá o que se repetia era um booleano com o mesmo nome do dono; aqui é a API
  inteira. **Booleano igual ao do dono é a mesma peça; API igual à do dono não é
  nem discussão.**
- **A evidência que teria virado o voto**: um segundo eixo no menu que o seletor
  não tenha — regenerar escrevendo dois campos diferentes de uma vez —, ou um
  estado por opção que `ModelOption` não modele, como uma alternativa já tentada
  neste turno com o resultado ao lado. Procurada nos tipos: `RegenerateOption`
  tem três cadeias e nada disso. O que a fonte tem A MAIS é `detail`, que é
  `description` com outro nome.

**2. `conversation-search` — colapsa, e foi a que chegou mais perto.**

- **A favor**: é a única das sete com GEOMETRIA declarada — `position: number`,
  de 0 a 100, uma marca por achado numa trilha lateral "com forma de barra de
  rolagem". Foi geometria em porcentagem que fez `computer-use` sobreviver na
  nona, e nada em `docs/shared/styles/` desenha marca sobre trilha fora de
  `.nds-computer-use-trail`, que é escopada. Soma-se a isso um vocabulário que
  parece novo — antes, achado, depois — e a única coisa que a família prometia e
  nenhuma peça construída entrega: achar dentro de uma conversa longa.
- **Contra**: quatro coisas, e a última decide. (a) A barra é o trio que a
  vigésima quinta acabou de resolver — campo, contador e dois controles —, agora
  com `.nds-input-group` em volta. (b) `activeIndex` sobre `hits[]` é índice
  sobre arranjo plano, que aquela mesma correção classificou como a coordenada
  que a fila já tinha; e `onStep(delta)` é ainda menos que `onPageChange`, porque
  a peça declara não fazer conta de índice nenhuma. (c) O realce dentro do texto
  é utilitária que falta, JÁ nomeada por `read-aloud`, e a abertura da 5.1 é
  literal: buraco vira classe nomeada, nunca folha. (d) **Os dois campos que
  pareciam vocabulário são `slice`** — a fonte calcula `before`, `match` e
  `after` com três fatias sobre uma cadeia, e a posição com `(i / (n − 1)) ×
  100`, nas DUAS faixas, no próprio exemplo. Agregado que é leitura rende
  função, não desenho, pela quarta vez.
- E a geometria não resiste ao lugar em que a fonte a põe: a trilha mora DENTRO
  da barra de busca, longe do container que diz mapear; as marcas não são botões
  e não têm rótulo; e a corrente se separa das outras por opacidade, que a regra
  4 da §8 recusa e que a décima segunda já mediu. Marca sobre a extensão da
  conversa é a extensão que `ThreadMetrics` descreve em `chat-scroll.ts`, que é o
  primitivo em que esta família foi fundada. **O eixo tem dono, e o dono é a peça
  ao lado.**
- **Colapsa** — e a distinção contra a nona vale escrita, porque as duas têm
  porcentagem: em `computer-use` o quadro É da peça, com `--computer-use-aspect`
  declarado por ela, e o ponto só significa dentro dele; aqui a peça não é dona
  do espaço a que a posição se refere. **Porcentagem sobre espaço alheio não é
  geometria própria: é projeção, e projeção é opção de quem desenha o espaço.**
- **A evidência que teria virado o voto**: a trilha desenhada SOBRE a região que
  rola, ancorada no `scrollHeight` real, com as marcas sendo controles — um jeito
  de saltar por elas pelo teclado. Procurada na fonte: são `<span>` sem rótulo, e
  a fonte manda o consumidor rolar sozinho com `scrollIntoView` a partir de um
  `data-message-id` que é da faixa de runtime.

**3. `thread-search` — colapsa em `command`.**

- **A favor**: filtro, blocos com rótulo, linha com título e prévia, teclado que
  dá a volta nas duas pontas, e um bloco fixado que vem sempre primeiro.
  `pinned: boolean` parece estado por linha, que é o que `command` não tem.
- **Contra**: `command.css` já é a árvore inteira — `.nds-command-input` com
  `role="combobox"`, `.nds-command-list` com `role="listbox"`,
  `.nds-command-group` com `.nds-command-group-heading`, `.nds-command-item` com
  `role="option"` e `aria-selected`, e `.nds-command-empty`. E `pinned` não é
  estado: a própria fonte diz que a linha fixada "renderiza no bloco fixado em
  vez do seu grupo" — é em qual grupo ela cai, decidido por quem passa o arranjo.
  `onSelect` é a chamada de volta de escolha que já nomeou dono três vezes, e é
  literalmente o mesmo nome da oitava.
- **Colapsa**, com uma utilitária nomeada: `.nds-command-item` não tem segunda
  linha, e `.nds-item-description` tem. Onde a composição fica mais fina que a
  fonte são dois pontos que ela mesma declara: lá andar É escolher (a seta troca
  de conversa a cada toque, sem passo de destaque), e não existe vazio de
  "nenhuma conversa" distinto do vazio de "nenhum resultado".
- **A evidência que teria virado o voto**: um estado por conversa que `command`
  não pudesse carregar — a que está gerando agora, a arquivada, a que falhou —,
  com desenho por estado. Procurada nos tipos da faixa standalone:
  `SearchableThread` tem cinco campos e nenhum é estado. A palavra que faltava
  está na faixa de runtime (`isRunning`), e o que a standalone faz com ela é
  escrevê-la como texto de prévia.

**4. `thread-list` — colapsa em `sidebar`, nó por nó.**

- **A favor**: é a superfície mais usada de um produto de conversa e a que dá
  nome à família. A faixa de runtime tem agrupamento por dia, busca, renomear no
  lugar, arquivar, apagar, fiapo de execução por linha e `aria-current` — mais
  anatomia que várias entradas que sobreviveram.
- **Contra**: a §1 manda ler a standalone, e a standalone é `{ title, time,
  unread }` com um índice: sem busca, com um rótulo "Hoje" fixo sobre qualquer
  data, e com os ícones de renomear e apagar declarados como apresentação, sem
  manipulador. E mesmo a faixa RICA é `sidebar` inteira: `.nds-sidebar-static`,
  `.nds-sidebar-header` com `.nds-sidebar-input`, `.nds-sidebar-group` com
  `-group-label`, `.nds-sidebar-menu` de `-menu-item`, `-menu-button` com
  `data-active="true"`, `-menu-button-badge` para o instante e `-menu-action`
  `-menu-action-hover` para a fila do menu. Não sobra um nó.
- **Colapsa.** `onActiveIndexChange` é a quinta chamada de volta de escolha da
  campanha, e o dono não está a uma pasta de distância: está na coluna de bases
  da própria linha da família.
- **A evidência que teria virado o voto**: uma linha que carregasse estado de
  EXECUÇÃO com desenho — a conversa que responde enquanto se olha outra —, porque
  isso é `RunStatus` numa fila e nenhum menu de barra lateral desenha. Procurada:
  existe, e está do lado errado. `s.threadListItem.isRunning` é da faixa de
  runtime, é um booleano onde `RunStatus` tem cinco palavras, e a faixa
  standalone não o tem — ela tem `unread`, que é outro assunto e ainda por cima
  só cor.

**E a herança da décima sétima, respondida aqui, que era o que faltava.** A caixa
de execuções em segundo plano projeta o estado da lista de conversas, e aquela
correção deixou escrito que, se aquilo reaparecesse como FILTRO de `thread-list`,
o conserto seria na família 6. **Não reaparece.** A faixa standalone não tem
filtro nenhum, e o filtro da faixa de runtime casa TEXTO contra o título — nada
de estado. A lista não tem vocabulário de execução para filtrar: o mais perto é o
`isRunning` acima, que é um fiapo por linha e não uma projeção. A décima sétima
fica de pé onde está: `background-inbox` é `.nds-card` com `.nds-item-group` de
`agent-status`, e quem quiser saber quais conversas estão trabalhando põe
`agent-status` na linha — a peça que aquela composição já usa —, não um filtro
numa fila que não sabe o que é uma execução. **A cláusula fecha CONFIRMANDO a
correção que a abriu**, e é a segunda vez na campanha que uma herança fecha
assim, depois da décima primeira.

**5. `thread-list-sidebar` — colapsa, e é a mais barata de ler das 120.**

- **A favor**: nenhum que sobreviva à primeira linha da fonte.
- **Contra**: **ela não tem faixa standalone.** É a única entrada das 120 assim,
  e a §1 é literal sobre qual das duas se lê. O que resta é casca: cabeçalho,
  rodapé, trilho, e todo o resto repassado ao `Sidebar` que ela envolve — `side`,
  `variant` e `collapsible`, que `.nds-sidebar-root` já lê como `data-side`,
  `data-variant` e `data-collapsible`, com o trilho sumindo em `offcanvas`
  exatamente como a fonte descreve. A marca do cabeçalho e o link do rodapé a
  própria fonte chama de espaço reservado.
- **Colapsa.** Entrada sem faixa standalone não é peça deste porte: é a
  demonstração de composição de duas outras, que é o que a 5.1 produz.
- **A evidência que teria virado o voto**: uma casca com desenho que o `sidebar`
  não tenha — largura própria, colapso próprio, uma segunda coluna. Procurada: os
  três nomes de prop que ela repassa são os três `data-*` que a folha já lê.

**E a reversibilidade da décima quinta, que apontava para cá, respondida**:
`mobile-composer` desdobraria se `thread-list-sidebar` mostrasse superfície de
toque com desenho, estado ou vocabulário próprios. Não mostra nada — não tem
superfície própria, e a forma de telefone que existe é a do `sidebar`, que já
resolve o assunto num `sheet` com as consultas de mídia da própria folha.
**`mobile-composer` CONFIRMA na 5.1**, e resta um só gatilho para ela: o
`voice-conversation` da família 7.

**6. `shared-conversation` — colapsa em `card` mais `chat-thread`.**

- **A favor**: uma transcrição de outra pessoa, com procedência — quem
  compartilhou e quando — e uma porta para continuar. "Somente leitura" parece um
  estado que o `chat-thread` não tem.
- **Contra**: somente leitura não é estado da thread. O campo de entrada é peça à
  parte por decisão registrada na §4.2, e transcrição sem composer já é
  transcrição que não se responde — não há o que acrescentar. O resto é
  cabeçalho, corpo e rodapé, que é `card` com os encaixes que a grade dele já
  abre com `:has()`. E `SharedTurn` é o estreitamento mais largo depois do da
  vigésima quinta, em duas direções ao mesmo tempo: o papel em duas palavras onde
  `ChatRole` tem três, e o turno inteiro em `{ id, role, text }` onde
  `ChatMessageOptions` tem nove campos e `MessagePartKind` sete espécies de parte
  — com o `text` cru levando fala de modelo à tela sem `createMarkdown` e sem
  `isSafeUrl`.
- **Colapsa.** É a segunda entrada do lote cujo corpo é "a lista de mensagens de
  outra pessoa", e vale a frase que a décima nona e a vigésima quinta já
  escreveram: **o parágrafo não é da peça.**
- **A evidência que teria virado o voto**: procedência com desenho — assinatura,
  selo de integridade, instante em que o compartilhamento expira, alguma coisa
  que dissesse que ESTA transcrição é aquela e não outra. Procurada: `sharedBy` e
  `sharedAt` são duas cadeias "já formatadas" que truncam no cabeçalho, e
  `onContinue` é um botão.

**7. `onboarding` — colapsa em `stepper` mais `card`, e é a que menos pertence a
esta guideline.**

- **A favor**: um passo por vez, com progresso, pular e avançar, é uma tela que o
  design system não tem montada em lugar nenhum; e `stepper.css` existe como
  folha, sem componente com stories por cima.
- **Contra**: `.nds-stepper` é o `<ol>` de etapas com `data-state` `active` e
  `completed`, indicador numerado e separador — e entrega MAIS que a fonte, cujos
  pontos são `aria-hidden`, não são botões e por isso não deixam voltar (a
  própria fonte diz que um controle de voltar teria de ser escrito por fora). O
  resto é `card` com rodapé de dois botões, e "n de m" é o distintivo
  monoespaçado que sete linhas da 5.1 já usam. `index` sobre arranjo plano é a
  coordenada da fila; `onNext` e `onSkip` são sinais puros que não mudam nada,
  como a fonte declara.
- E há o que a separa das outras seis: **ela não é conversa.** A fonte diz, sobre
  a própria faixa de runtime, que as etapas "são conteúdo que você escreve, não
  estado que o runtime guarda", e que não há nada a ler do estado. Peça sem
  vocabulário desta família e sem estado de runtime nenhum é um assistente de
  primeiro uso — e assistente de primeiro uso o design system já desenha.
- **Colapsa.**
- **A evidência que teria virado o voto**: uma etapa que ENSINASSE mostrando — um
  turno de exemplo vivo, um composer que responde, alguma coisa que precisasse do
  vocabulário da conversa para desenhar. Procurada: `OnboardingStep` são três
  cadeias, e a terceira, o exemplo trabalhado, é texto dentro de um quadro.

**As duas sobreposições que o lote existia para medir, medidas:**

- **`conversation-search` e `thread-search` são DUAS peças, e não uma com dois
  escopos** — e a suspeita estava errada em espécie, não em grau. Uma procura
  DENTRO de um texto e devolve posições nele (`{ before, match, after, position }`,
  com `onStep(delta)` andando por elas); a outra escolhe um item numa fila
  (`{ id, title, group, preview, pinned }`, com `onSelect(id)`). Não compartilham
  um campo, não compartilham um controle e não colapsam no mesmo lugar. **Nem
  toda dupla com a mesma palavra no nome é uma dupla**: "busca" aqui é palavra do
  produto, não do desenho.
- **`thread-list` e `thread-list-sidebar` SÃO uma dentro da outra, e a fonte diz
  isso primeiro.** A segunda não tem faixa standalone, envolve a primeira e
  repassa tudo ao `Sidebar`. As duas colapsam no mesmo dono, e a de dentro é o
  menu daquele dono. É o único caso do lote em que ler as duas juntas custou
  menos que ler uma.

**A terceira herança, da vigésima quinta, respondida**: aquela correção mandou
quem fundasse `conversa-nav.css` escrever no cabeçalho que `pagination` entra
como contrato e não como markup. **Ninguém funda.** A leitura sobrevive e muda de
casa: não é do cabeçalho de uma folha, é da linha de `message-branches` na 5.1,
onde já está escrita.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 14, 3 tem 6, 4 tem 18, 5 tem 5, 6 tem 0 e 7 tem 2 — **56** na 5.2.
A 5.1 vai a **64** (62 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. Os componentes a construir somam **50**, em **seis** folhas.

**Reversível**, como as outras vinte e cinco, e aqui em duas alturas. Por
entrada: se ao compor qualquer uma das sete numa story aparecer desenho, estado
ou vocabulário que a base não comporte, ela desdobra para a 5.2, com o motivo.
Pela família: a 6 só volta a existir se DUAS ou mais desdobrarem — uma sozinha
não funda folha de família, e a §4 é explícita quanto a isso. A candidata mais
provável é `conversation-search`, e o gatilho dela está nomeado acima: marcas que
sejam controles, sobre a região que de fato rola.

**E o registro de método, que vale uma sexta vez e desta vez em duas direções.**
O pedido trazia duas leituras já formadas — que `conversation-search` e
`thread-search` podiam ser a mesma peça com dois escopos, e que
`thread-list-sidebar` podia ser `thread-list` dentro de `sidebar`. A primeira
estava errada, a segunda estava certa, e as duas empurravam para o mesmo lado
(menos peças), que é o lado a que se chegou. **Afirmação que favorece o desfecho
a que se chega é a que menos se confere**, e a defesa é conferi-la primeiro: a
primeira caiu ao comparar os campos dos dois tipos, a segunda passou ao ler a
primeira linha da fonte. E o lote não produziu leitura rasa, pelo motivo que a
abertura previa: três das sete (`thread-search`, `thread-list`, `onboarding`) só
se leem bem uma contra a outra, porque é a repetição delas que expõe o mecanismo
comum. Uma a uma, cada colapso pareceria coincidência; sete de uma vez, nenhum
parece.


**Vigésima sétima correção, a segunda em LOTE, e a primeira que lê a família 4
pelo lado que não é código**: seis entradas colapsam — `diagram`,
`mermaid-diagram`, `math-block`, `map-answer`, `web-preview` e
`image-generation`. São a vigésima sétima à trigésima segunda travessia de 5.2
para 5.1, e as contagens mudam uma vez só, ao fim do lote: 56 → 50 e 64 → 70.
`resposta-estruturada.css` **continua por fundar**, pela terceira leitura seguida
desta família — e isso deixou de ser resultado neutro: restam doze entradas, e a
folha só nasce quando uma delas trouxer o que estas seis não trouxeram.

**O MECANISMO, escrito uma vez porque quatro das seis colapsam por ele: a peça é
a MOLDURA de um conteúdo que ela não produz.** `diagram` recebe o gráfico já
desenhado, `mermaid-diagram` recebe o SVG (ou o texto que não deu para ler),
`web-preview` recebe o quadro e `image-generation` não recebe nem isso — nunca
desenha imagem nenhuma. Nas quatro, o que a entrada acrescenta ao conteúdo é
cabeçalho, corpo e uma linha de estado de carregamento, que é `.nds-card` com os
encaixes que a grade dele já abre com `:has()`. É parente do mecanismo da
vigésima sexta e vale distinguir os dois, porque a defesa é outra: **lá a base
declarada ERA a peça; aqui a peça não tem base nenhuma, porque não tem conteúdo
próprio.** Moldura em volta de material de terceiro é o caso em que a §2 já
mandava olhar — "o componente desenha o que recebe" —, e quando ele recebe TUDO,
não sobra desenho para ser dele.

**1. `diagram` — colapsa, e é a que mais parecia dona de alguma coisa.**

- **A favor**: é a única das dezoito que tem VISTA — uma caixa com fator de
  escala, onde o conteúdo é maior que a moldura. Ampliar, repor e abrir em tela
  cheia é um trio que nenhum componente do design system tem: `scroll-area` rola
  mas não escala, `dialog` abre mas não amplia, `aspect-ratio` fixa proporção mas
  não transforma. E um desenho que chega com 2000 px de largura numa coluna de
  700 é o caso mais literal de "conteúdo que transborda", que é uma das duas
  regras que a folha desta família teria de reger.
- **Contra**: a peça não é dona da ampliação. `zoom` é obrigatório e a fonte diz
  em letras que ela **não o limita** — "does not clamp `zoom` itself, so an
  out-of-range value is whatever the caller passed in" —, e o exemplo da própria
  página põe o `clamp` no lado de fora. Sobra uma multiplicação, quatro botões e
  uma porcentagem arredondada. O cabeçalho é `.nds-card-header` com
  `.nds-card-action`; os botões são `.nds-button-ghost` `.nds-button-icon-sm`; a
  porcentagem é `.nds-badge` com `.nds-font-mono`, o par que uma dúzia de linhas
  da 5.1 já usa; o transbordo é `scroll-area`; a tela cheia é `dialog`.
- **Colapsa**, com duas utilitárias nomeadas (a escala a partir de propriedade
  personalizada, e a variante de tamanho de `.nds-dialog-content`, hoje preso em
  `max-width: 32rem`). E o que decide vale escrito, porque é a distinção contra a
  nona: **vista que ESCALA não é geometria própria, porque a peça não calcula
  posição nenhuma.** Em `computer-use` o quadro é da peça e a marca só significa
  dentro dele; aqui não há coordenada, há um multiplicador que o chamador
  segura. A vigésima sexta já tinha medido um degrau desse mesmo lance —
  "porcentagem sobre espaço alheio é projeção" —, e este é o degrau abaixo: nem
  projeção há.
- **A evidência que teria virado o voto**: a peça computando a vista — um enquadre
  que se ajustasse ao conteúdo, um ponto de origem da escala seguindo o ponteiro,
  limites que ela mesma impusesse. Procurada na fonte e nos tipos: `zoom` é
  `number` sem faixa, os três `on*` de escala não recebem argumento nenhum, e o
  quarto só liga ou desliga um botão.

**2. `mermaid-diagram` — colapsa em `diagram` mais `code-block` mais `skeleton`.**

- **A favor**: é a única entrada das 120 que RENDERIZA um formato, e a única cuja
  faixa standalone carrega biblioteca de verdade. E o `MermaidZoom` que ela
  exporta tem comportamento que nenhuma outra tem: sobreposição em tela cheia,
  roda para ampliar entre 0,5× e 4× centrada no ponteiro, arrastar para
  deslocar, armadilha de foco e `Escape`.
- **Contra**: tirada a biblioteca — e a §6 a mantém de fora —, os três desenhos
  que a fonte declara são três peças que já existem, e ela os nomeia um por um:
  esqueleto enquanto chega, fonte crua quando não dá para ler, SVG quando dá. O
  primeiro é `skeleton`; o segundo é `code-block`, que a 5.1 já deu a
  `syntax-highlighter` sem dependência nova; o terceiro é a moldura da entrada
  anterior. E a fonte fecha a leitura sozinha: exporta `MermaidZoom` separado e
  manda embrulhar nele **um SVG que já se tenha**, que é literalmente a saída da
  §6 escrita pelo autor da peça.
- **Colapsa.** Sem o renderizador, é `diagram` com outro nome — e `diagram` já
  colapsou uma linha acima. **Entrada cuja identidade inteira é a biblioteca não
  sobrevive à decisão de não trazer a biblioteca**, e é a primeira vez que a §6
  decide um veredito em vez de só custar peso.
- E `streaming: boolean` é a terceira aparição do sinal PELO AVESSO, depois de
  `mobile-composer` e `read-aloud`: é o mesmo booleano que o dono já declara, com
  o mesmo nome — a 5.1 escreve `streaming-text` como "`chat-thread`,
  `streaming: true` + `aria-busy`" desde a primeira redação.
- **A evidência que teria virado o voto**: desenho da moldura que sobrevivesse à
  saída da §6 — uma calha por nó, um mapa do gráfico, alguma coisa que soubesse
  o que há dentro do SVG. Procurada: os `data-slot` da anatomia são três estados
  e um botão de expandir, e o conteúdo é opaco nos três.

**3. `math-block` — colapsa em `.nds-item-group`.**

- **A favor**: notação matemática é vocabulário que esta casa não tem em canto
  nenhum, e a fonte exporta `Frac`, `Sup` e `Sub` — uma fração empilhada com
  risco no meio é geometria tipográfica que nenhum `.nds-*` desenha. E uma
  derivação lida em voz alta é um problema de acessibilidade real, do tamanho de
  MathML.
- **Contra**: nada disso é da peça. `Frac`, `Sup` e `Sub` são exports
  SEPARADOS que quem monta assembla e passa prontos; a anatomia põe
  `{step.expression}` dentro de um `<span>` e mais nada; e a faixa com runtime —
  a que o modelo alimenta — só consegue mandar texto cru, o que a própria fonte
  admite ao dizer que uma fração chegando por ali desenha como caracteres
  soltos. Não há `role="math"`, não há MathML, não há nome acessível em lugar
  nenhum: a promessa de acessibilidade do assunto está inteira DO LADO DE FORA da
  peça. O que resta é uma legenda monoespaçada e uma fila de linhas com título e
  nota, que é `.nds-item-group` de `.nds-item`.
- **Colapsa.** Vale a frase da décima nona e da vigésima quinta num traje novo:
  **a expressão não é da peça.**
- **A evidência que teria virado o voto**: a peça sendo dona da notação — saída
  em MathML, ou `Frac` dentro da árvore dela com alinhamento próprio de linha de
  base. Procurada nos tipos: `expression` é `ReactNode`, que é a assinatura de
  quem não olha para dentro.

**4. `map-answer` — colapsa em `computer-use` mais `.nds-item-group`, e é a que
exigiu mais leitura das seis.**

- **A favor**: geometria declarada, que foi o que fez `computer-use` sobreviver na
  nona — pontos em porcentagem dentro de um quadro. E mais que aquela: N marcas
  simultâneas em vez de um trajeto, marcas que são CONTROLES com nome, uma linha
  ligando pontos (a única aresta da família fora de `flow-graph`), e a mesma
  escolha alcançável de dois lugares, marca e linha da lista.
- **Contra**: `MapPin` é `ComputerStep` campo por campo — `label`/`action` como
  texto primário, `detail`/`target` como secundário, `x` e `y` em porcentagem do
  quadro, e um `id`. A árvore construída já tem tudo: `.nds-computer-use-screen`
  com `--computer-use-aspect`, `.nds-computer-use-trail` com uma
  `.nds-computer-use-mark` por ponto posicionada por
  `--computer-use-mark-x`/`-y`, e `data-active="true"` no corrente, que já cresce
  e destaca. E o que a peça desenha por conta própria é DECORATIVO por
  declaração dela: a grade de fios é pano de fundo esquemático, e a linha é
  "conectividade decorativa, não caminho calculado", sempre na ordem do arranjo.
  **Geometria decorativa não é geometria**, porque não carrega informação — e a
  informação que sobra é x, y, qual é o corrente, e uma fila de rótulos.
- **Colapsa**, com uma opção nomeada (a marca virando `<button>` com nome textual
  e alvo de 24 px) e uma utilitária que `document-reference` já nomeou
  (`.nds-item` sem regra para `[aria-current]`). E a composição fica mais fina
  que a fonte no mesmo movimento: lá cada ponto aparece DUAS vezes na ordem de
  foco, com o mesmo nome, porque a marca e a linha da lista são dois controles
  para uma coisa só.
- **E ela acrescenta um degrau à sub-regra da décima**, que é o que faz esta
  leitura valer o custo: `onSelect` é a quinta chamada de volta de escolha da
  campanha, depois de `onSelect`, `onPick`, `onJump`, `onIndexChange` e
  `onActiveIndexChange` — e **a primeira que não aponta dono nenhum**, porque
  nada nesta casa escolhe um ponto sobre uma superfície. Pela décima terceira,
  assinatura que não aponta dono deixa a sub-regra calada, e quem decide são os
  três testes sozinhos. Decidiram pela identidade do tipo, não pela chamada de
  volta. **Sub-regra calada não é sub-regra a favor**, e esta é a segunda vez que
  isso precisa ser dito.
- **A evidência que teria virado o voto**: projeção de verdade — latitude e
  longitude com um sistema de coordenadas, ou pontos que se movessem sob
  deslocamento e ampliação do quadro. Procurada nos tipos, e a fonte responde
  antes da pergunta: "`x`: Horizontal position, 0 to 100 percent. **Not
  longitude.**", e o mesmo para `y`.

**5. `web-preview` — colapsa em `.nds-card` mais `.nds-input-group`.**

- **A favor**: é a única entrada da família que mostra PROCEDÊNCIA do que desenha
   — um endereço que quem lê pode conferir antes de confiar no que está abaixo —,
  e a faixa com runtime traz `SafeContentFrame`, que é isolamento de verdade, com
  origem por render e descarte.
- **Contra**: o isolamento não é da peça, e a fonte o diz duas vezes: o conteúdo
  é desenhado "exatamente como veio, sem isolamento próprio". `SafeContentFrame`
  é da faixa com runtime, que a §1 manda não ler como se fosse a peça. O que
  resta é um cabeçalho de botão, campo e botão — que é `.nds-input-group` com
  `.nds-input-group-addon` nas duas pontas, `data-align` já resolvido — mais um
  corpo e um brilho de carregamento, que é `skeleton`.
- **Colapsa.** E `loading: boolean` entra na tabela do sinal: dois desenhos onde
  `RunStatus` tem cinco palavras, e o que se perde é `failed` acima de tudo —
  uma prévia que quebrou desenha igual a uma que ainda está chegando, para
  sempre.
- **A evidência que teria virado o voto**: a peça participando do isolamento —
  uma origem que ela verificasse, um estado de bloqueio, alguma coisa que
  ligasse a barra de endereço ao que está desenhado embaixo. Procurada:
  `origin` é uma cadeia mostrada, e a fonte diz que o quadro é de quem monta.

**6. `image-generation` — colapsa em `skeleton`, e é a mais barata de ler das 120
depois de `thread-list-sidebar`.**

- **A favor**: a grade de 8×8 pontos pulsando com atraso escalonado é uma
  animação que nenhum `.nds-*` tem, e "a moldura que guarda o lugar de uma
  imagem que ainda não chegou" é um momento de produto de verdade.
- **Contra**: **a peça nunca desenha imagem nenhuma**, e a fonte declara os
  quatro motivos numa frase cada — não aceita endereço de imagem, o degradê
  atrás dos pontos é um gráfico decorativo FIXO presente nos dois estados,
  "1024 × 1024" é literal no código e não campo, e o botão de gerar de novo não
  tem manipulador. É um marcador de lugar: `.nds-aspect-ratio` com
  `.nds-skeleton[data-shape="fill"]` dentro. E a própria fonte manda entregar a
  imagem de verdade a `image`, que a 5.1 já resolveu.
- **Colapsa**, e `generating: boolean` entra na tabela do sinal ao lado de
  `loading`: perde `failed` e `stopped`, que numa geração de imagem são
  justamente o que se espera poder mostrar.
- **A evidência que teria virado o voto**: a peça recebendo a imagem e desenhando
  a passagem — o borrão resolvendo sobre o arquivo que chegou. Procurada: não há
  prop de imagem, e a fonte diz isso com todas as letras.

**O TESTE MATERIAL-CONTRA-PEÇA, aplicado entrada por entrada, e o que ele
respondeu — que é a leitura mais valiosa deste lote.** A vigésima sexta deixou o
corolário: ao abrir uma folha, pergunte se as bases da coluna do eixo são
material ou peças prontas. A família 4 declara `card`, `table` e `chart`, e essa
coluna é a única MISTA das seis — `card` é material, `table` e `chart` são peças.
Aplicado às seis:

| entrada | em que ela colapsa | material ou peça | o teste previu? |
|---|---|---|---|
| `diagram` | `card` + `scroll-area` + `dialog` | material + peças | pela metade |
| `mermaid-diagram` | `diagram` + `code-block` + `skeleton` | peças | sim |
| `math-block` | `item` | material | **não** |
| `map-answer` | `computer-use` + `item` | peça | sim |
| `web-preview` | `card` + `input-group` | material | **não** |
| `image-generation` | `skeleton` | peça | sim |

Três de seis. E o que as três falhas ensinam é o LIMITE do corolário, que a
vigésima sexta não podia ver porque lá as quatro bases eram peças: **base
material prevê que a família PODE existir, nunca que a entrada vai sobreviver.**
Material sustenta família; sustentar não é preencher. `math-block` e
`web-preview` caem sobre material puro e colapsam assim mesmo, porque o que
faltava não era onde pôr — era o que pôr. Dito ao contrário, que é como se usa:
**a coluna do eixo prevê colapso quando nomeia uma peça, e não prevê nada quando
nomeia material.** É a mesma assimetria que o sinal mudo tem desde a nona, e vale
a mesma disciplina: quando ela fica calada, decidem os três testes sozinhos.

**O QUE A §6 EXIGE, MEDIDO NAS FONTES, e ela precisa de conserto.** A seção nomeia
quatro entradas que "pedem biblioteca que o repositório não tem". Lidas as quatro
páginas em cru, na faixa standalone: `mermaid-diagram` de fato analisa o texto e
desenha o SVG, e é a única. `diagram` a §6 já sabia que não tinha. **`math-block`
e `map-answer` também não têm** — a primeira não menciona KaTeX em linha nenhuma
e recebe a expressão pronta como `ReactNode`; a segunda não menciona biblioteca
de mapa nenhuma e desenha uma grade de fios com marcas em porcentagem, dizendo
nos tipos que `x` e `y` **não** são longitude e latitude. A coluna "saída sem
dependência" descrevia, nessas duas, o que a fonte JÁ É — não uma saída a tomar.
A consequência prática é a melhor possível: **nenhuma decisão de dependência
precisou ir para a dona neste lote**, e das quatro só sobra `mermaid-diagram`,
que colapsou justamente por causa da biblioteca. O parágrafo de conserto está na
§6.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 14, 3 tem 6, 4 tem 12, 5 tem 5, 6 tem 0 e 7 tem 2 — **50** na 5.2.
A 5.1 vai a **70** (68 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. Os componentes a construir somam **44**, em **seis** folhas
— e `resposta-estruturada.css` é uma das que ainda não nasceram.

*(Estes três totais valem para o INSTANTE deste lote, e já não valem: outras duas
portas estavam escrevendo as famílias 2, 3 e 7 na mesma passada, e fecharam
depois. O que continua sendo desta leitura é a linha da família 4. Os totais se
leem das tabelas, depois — é a mesma regra que a vigésima quarta escreveu, e esta
é a prova dela pelo avesso: eu a segui contra o briefing e ainda assim publiquei
número que envelheceu em minutos, porque medi árvore com porta viva dentro.)*

**Reversível**, como as outras vinte e seis, e aqui em duas alturas. Por entrada:
`diagram` desdobra se ao compor aparecer vista que a peça CALCULE — enquadre
automático, origem de escala seguindo o ponteiro, limites próprios —, e
`mermaid-diagram` desdobra junto, porque depende dela. `map-answer` desdobra se
aparecer projeção de verdade, ou pontos que se movam sob deslocamento e
ampliação. `math-block` desdobra se a notação entrar na árvore da peça (MathML,
`Frac` alinhado por ela). `web-preview` e `image-generation` não têm gatilho
plausível: as duas são molduras de conteúdo que elas declaram não receber. Pela
família: a 4 continua de pé com doze entradas, então nenhum desdobramento precisa
fundar nada — quem desdobrar entra na folha que a primeira sobrevivente fundar.

**O que esta leitura NÃO decide**: as doze restantes da família 4 —
`spec-sheet`, `comparison-card`, `score-breakdown`, `recommendation-card`,
`timeline`, `file-tree`, `flow-graph`, `trace-waterfall`, `activity-graph`,
`heat-graph`, `artifact-card` e `canvas-split`. Duas notas medidas de passagem,
para quem abrir a próxima, e as duas saíram dos TIPOS, não da anatomia: (a) o
contador de revelação — `visibleCount`, `visibleSteps` — aparece em **sete** das
dezoito entradas originais desta família, e nas duas que ele apareceu aqui o dono
foi sempre o mesmo, `13-animacao.md`; é o assunto mais repetido da família e não
é desenho de nenhuma delas. (b) `TimelineStat`, que a vigésima segunda e a
vigésima quarta deixaram sem casa, tem candidato: `file-tree` declara
`totalAdditions` e `totalDeletions` no cabeçalho, que é o par exato. Nenhuma das
seis deste lote o quis.

**E o registro de método, que vale uma sétima vez, e desta vez sobre uma
afirmação do próprio arquivo.** O pedido trazia a §6 como coisa a ler antes de
decidir, e a §6 é do arquivo, não de quem pediu. Ela estava errada em duas das
quatro linhas, e errada do lado que mais atrapalha: descrevia como "saída" o que
a fonte já era, o que faz a leitura começar procurando um contorno para um
problema que não existe. **Seção que descreve fonte que ninguém leu envelhece
como contagem** — e o conserto foi o mesmo de sempre, abrir as quatro páginas e
procurar o nome da biblioteca. Custou quatro `grep`.


**Vigésima oitava correção, a terceira em LOTE, e a que FECHA a família 3**: as
cinco entradas que restavam colapsam, e a família fica com uma peça —
`inline-citation`, construída nas cinco stacks. São a trigésima terceira à
trigésima sétima travessia de 5.2 para 5.1, e as contagens mudam uma vez só, ao
fim do lote: a família 3 vai de **6 entradas e 6 componentes** para **1 e 1**, a 5.2
perde 5 entradas e a 5.1 ganha as mesmas 5.

**A folha NÃO se dissolve, e é a diferença que vale guardar contra a família 6.**
Lá `conversa-nav.css` nunca foi fundada e as oito entradas saíram; aqui
`evidencia.css` está escrita, `inline-citation` está de pé nas cinco stacks, e
uma família com uma peça é uma família pequena — não uma família que não nasceu.
A pergunta que a décima oitava abriu e a vigésima primeira deixou mais aguda —
se esta folha vai ter uma entrada só — está respondida, e a resposta é sim.

**O MECANISMO, escrito uma vez porque as cinco colapsam por ele**: quatro das
cinco caem em cima de peças que esta campanha JÁ CONSTRUIU — `web-search` em
`.nds-chat-sources`, `research-report` em `.nds-agent-plan`, `speaker-identity`
em `.nds-chat-message`, `mcp-server-panel` em `.nds-connection-state` — e a
quinta, `memory-chips`, em `.nds-composer-context`, que também está de pé. Não é
o mesmo mecanismo da família 6, e a diferença importa mais que a semelhança. Lá a
5.2 nomeou quatro bases e as quatro eram as peças: o veredito estava escrito na
coluna do eixo antes de existir uma linha da família. Aqui a coluna ACERTOU —
`hover-card`, `popover` e `badge` são material, e foi por isso que a família
nasceu e ficou de pé com uma peça. **O que a coluna não podia dizer é que as
ENTRADAS eram peças de outras famílias vestidas de evidência**: um relatório é um
plano, um painel de servidores é um estado de ligação, uma lista de quem fala é a
própria conversa. O corolário da vigésima sexta se corrige sem se perder: **a
coluna das bases prevê se uma FAMÍLIA pode existir; ela não prevê se uma ENTRADA
pode.** Para a entrada a pergunta é outra, e é mais barata — QUAL peça já
construída desenha isto? —, e das cinco, quatro tinham dono que a 5.2 nunca
nomeou.

**A SEGUNDA MEDIDA, e é nova: nas cinco, a faixa STANDALONE é a achatada.** A §1
manda ler a standalone, e manda por um bom motivo — é a conversão que o
assistant-ui já pagou, e ela chega controlada e sem estado interno. Este lote
mostra o custo dela, cinco vezes de cinco: `searching: boolean` esconde as quatro
palavras de `status.type`, que a faixa de runtime da mesma página declara;
`turns` chega PLANO onde o aninhamento existe na outra faixa, e é o exemplo da
própria fonte que o achata; o estado do servidor tem quatro palavras onde a
faixa de runtime tem seis, e a fonte publica o `switch` que joga duas fora; a
fila de ferramentas é arranjo de cadeias onde a outra faixa tem nome, descrição e
esquema; e o chip de memória perde os argumentos tipados da chamada que o
escreveu. A décima oitava já tinha visto metade disso em `thread-list` — a
palavra que faltava estava achatada na outra faixa —, e ali era uma. **A faixa
standalone está pronta para o React, e o que ela terminou de fazer foi jogar fora
justamente o vocabulário que esta casa já tem.** A instrução da §1 continua
valendo, porque o runtime não porta; o que não vale é a leitura que ela convida,
de que a standalone é o trabalho acabado. Para as famílias que faltam: leia a
standalone para o DESENHO, e confira os tipos da faixa de runtime para saber
quantas palavras a fonte tinha antes de escolher desenhar menos.

**1. `web-search` — colapsa, e é a que mais parecia a família.**

- **A favor**: o cabeçalho desta folha reservou o lugar dela antes de existir
  peça — "o que foi procurado e o que voltou" é uma das cinco coisas que ele diz
  que procedência significa, e nenhuma outra entrada das 120 mostra uma busca
  ACONTECENDO dentro da resposta. E ela traz o que parecia geometria temporal:
  uma fila que admite uma linha por vez, com espaço reservado para não empurrar o
  texto abaixo, e uma chave que faz a entrada tocar de novo. Nada em
  `docs/shared/styles/` desenha uma lista que cresce um item por vez.
- **Contra**: o achado da fonte é título mais domínio — `ChatSource` com o
  endereço ACHATADO em cadeia de exibição, que é palavra por palavra o defeito
  que a décima terceira reprovou em `Source { domain, title, snippet }`: "perde o
  `url`, que é o que faz uma procedência ser verificável". É a sexta forma do
  sinal, e é a quarta vez nesta família que a segunda regra da folha fica sem
  objeto — só que pior que na décima sexta, onde o endereço simplesmente não
  existia: aqui existe mutilado, e endereço mutilado convida a peça a desenhar um
  link que ela não pode abrir. A revelação um a um não é estado: a contagem de
  visíveis é recorte do arranjo, o relógio que a move está no exemplo de quem
  MONTA, e a mesma leitura já pôs `streaming-text` na 5.1. E o estado que sobra é
  `searching: boolean`, idêntico ao de `retrieval-chunks`, que já está na tabela
  do sinal — **primeira repetição de um achatamento idêntico entre duas entradas
  da mesma família.** Montada, ela é a fila de fontes de um turno com o termo
  procurado acima: `.nds-chat-sources`, que a 5.1 já aponta em `sources`, com
  `.nds-agent-status` para o estado e `.nds-badge` `.nds-font-mono` para a
  contagem.
- **Colapsa.** E há duas correções de fonte junto, as duas já escritas nesta
  seção: a linha "leu N fontes" é texto literal no arquivo instalado, não
  derivado do arranjo — o espécime da décima terceira outra vez, e componente
  cujo texto mora no arquivo instalado não é componente; e `cycle` é chave de
  reconciliação do React, que a vigésima segunda já mandou para `13-animacao.md`
  no mesmo campo e com o mesmo nome.
- **A evidência que teria virado o voto**: um campo por achado que a lista de
  fontes não segure — um trecho com âncora, que seria `Citation` e faria da linha
  uma citação; uma pontuação de relevância COM grandeza, que é o que a vigésima
  primeira nomeou como o que falta para um ordinal deixar de ser etiqueta; ou um
  estado de busca que a peça possua, e não quem monta. Procurada nos tipos: o
  achado tem duas cadeias e mais nada; a contagem de visíveis é de quem monta, no
  exemplo da própria fonte; e peça que buscasse sozinha bate na primeira regra
  desta folha, que é anterior a qualquer teste.

**2. `research-report` — colapsa, e é a que responde a sobreposição do lote.**

- **A favor**: é a única entrada da família que prende evidência a uma SEÇÃO —
  granularidade que nem a marca em linha (por frase) nem a lista de fontes (por
  turno) têm. E é a que chega mais perto de ter máquina de estados própria: três
  palavras com um glifo por linha, mudando enquanto a resposta se escreve.
- **Contra**: o desenho é `.nds-agent-plan`, construído nesta campanha, parte por
  parte — marcador decorativo, rótulo, estado em `.nds-badge`, detalhe embaixo. A
  seção da fonte é `PlanStep` campo a campo: o título é `label`, a prévia é
  `detail`, o endereço é `id`. E o docblock daquela folha já absorveu `todo-list`
  com a frase que serve uma terceira vez: "plano e lista de tarefas têm o mesmo
  desenho, os mesmos estados e o mesmo vocabulário; o que muda é quando a lista
  aparece e quem a propôs, e isso é política de produto, não forma." A união é
  `PlanStepState` estreitada — `writing` é `running` renomeada, como `ready` era
  `complete` em `background-inbox` —, e o que ela perde é `failed` e `skipped`,
  que é justamente o estado que o docblock diz JUSTIFICAR o tipo existir. Pior: a
  fonte declara três palavras e desenha DUAS, e diz por quê — `pending` apaga o
  título, `writing` e `done` o desenham igual —, deixando a terceira por conta de
  um glifo sem palavra. É a sétima forma do sinal, a mesma de
  `confidence-marker`, e a resposta do `.nds-agent-plan` já está escrita: "o
  marcador é decorativo e o estado é palavra em `.nds-badge`".
- **Colapsa.** E o teste da família reprova sozinho: a contagem por seção e o
  total lido são CONTAGENS de evidência, nunca a evidência — e a fonte diz que os
  dois números nunca são conferidos um contra o outro. "Em que a resposta se
  apoia" respondido com um número é o eixo não respondido, e esta é a segunda
  entrada da família sem `Citation` nenhuma, depois da vigésima primeira.
- **A evidência que teria virado o voto**: a contagem de fontes sendo `Citation[]`
  em vez de número, que faria da linha um passo de plano com fontes e forçaria
  campo novo ou peça nova; um estado que um passo não saiba estar (uma seção em
  REVISÃO, uma bloqueada por outra); ou PROFUNDIDADE — um sumário com níveis, que
  é o que separaria um sumário de uma lista plana, e que `.nds-agent-plan` não
  desenha. Procurada nos tipos: o arranjo de seções é PLANO, sem campo de pai, de
  nível ou de profundidade; a contagem é número; e as três palavras da união já
  estão todas em `PlanStepState`. A faixa de runtime não acrescenta nada —
  transmite os mesmos argumentos.

**3. `memory-chips` — colapsa, e é a única das cinco em que quem lê MUDA aquilo
que a resposta vai usar.**

- **A favor**: é a única com uma chamada de volta que decide produto — esquecer
  um fato —, e a única entrada da família em que quem lê altera aquilo em que a
  próxima resposta vai se apoiar. Uma peça que EDITA procedência seria nova, e a
  folha nunca previu uma. A espécie da mudança também parecia vocabulário desta
  casa: o que aconteceu com um fato lembrado neste turno não está em
  `chat-protocol.ts`.
- **Contra**: a fonte declara três palavras e desenha duas, e as duas se separam
  **só por cor** — os chips acrescentados e os atualizados dividem a mesma tinta,
  e a própria fonte escreve que quem consome não sabe distingui-los por ela. É a
  sétima forma do sinal com o agravante que a décima segunda mediu em
  `agent-handoff`: quando o achatamento e a codificação por cor aparecem juntos, o
  que a fonte tem não é um estado pequeno, é nenhum (regra 3 desta folha, regra 4
  da §8, WCAG 1.4.1). Tirada a cor, a espécie é palavra, e palavra sem grandeza é
  `.nds-badge` — a fórmula da oitava, repetida pela décima oitava e pela vigésima
  primeira. O que sobra é endereço, texto e etiqueta, com um botão de remover que
  leva o nome do item: `.nds-composer-context`, CONSTRUÍDO, com ícone, rótulo,
  detalhe e `.nds-composer-context-remove` — cuja decisão 3 é exatamente a
  correção que falta aqui, "ele ganha a marca de automático, que é texto, não só
  a cor mais fraca". A fonte ainda declara compartilhadas as três únicas peças de
  cromo que tem — a superfície do chip, a do botão e a do cabeçalho —, que é o
  sinal lido na quinta, na sétima, na décima e na vigésima primeira, e aqui ele
  cobre a peça inteira.
- **A objeção séria, e ela vem da própria folha do composer**: aquele docblock diz
  que a fila de anexos e a de contexto têm a MESMA geometria e ainda assim são
  duas peças, porque "o que as separa está no protocolo, não na folha" — anexo é
  carga, tem bytes, progresso e falha; contexto é referência. Um terceiro caso
  caberia. Mas o critério é o mesmo e responde: o chip de memória não tem estado,
  não tem progresso e não tem o que esperar. É referência — cai do lado do
  contexto, e não abre um terceiro lado.
- **Colapsa.** E o teste da família reprova antes de tudo: memória não é
  procedência. O cabeçalho desta folha enumera o que o eixo significa — o
  documento, o trecho, o lugar dentro dele, o quanto se pode confiar, o que foi
  procurado e o que voltou —, e um fato lembrado sobre QUEM PERGUNTA não é
  nenhum dos cinco. Não tem fonte, trecho, âncora nem endereço; e onde
  `confidence-marker` ainda tinha uma cadeia fazendo as vezes de `Citation`, aqui
  não há nem isso. Terceira entrada da família sem `Citation`.
- **A evidência que teria virado o voto**: um terceiro desenho para a terceira
  palavra — algo que mostrasse o fato ANTES e DEPOIS de ser atualizado, que seria
  diferença e portanto assunto da família 4 —, ou uma âncora do fato para o turno
  que o escreveu, que seria a procedência do próprio fato e poria a peça no eixo
  com uma forma que a família não tem. Procurada nos tipos: o chip tem três
  campos, a espécie da mudança não carrega carga nenhuma, não há endereço de
  mensagem, não há turno e não há momento; e a fonte diz, com todas as letras,
  que acrescentado e atualizado renderizam idênticos. A faixa de runtime oferece
  o endereço da chamada como endereço natural do chip, e nada além.

**4. `speaker-identity` — colapsa, e é a mais direta das cinco.**

- **A favor**: quatro espécies onde `ChatRole` tem três, e o subagente é palavra
  que esta casa não tem — um turno que vale por uma conversa aninhada inteira. A
  fonte ainda lhe dá FORMA, não tinta: o distintivo do subagente é círculo cheio
  onde os outros são quadrado arredondado, e forma carregando sentido é
  justamente o que a regra 4 da §8 pede. Conversa com vários agentes é buraco
  real: o `chat-thread` desenha pessoa, assistente e sistema, e nada no DS
  desenha qual de vários agentes falou.
- **Contra**: é o `chat-thread`, linha por linha. A árvore daquela folha já traz
  `.nds-chat-message-avatar`, `.nds-chat-message-header` com
  `.nds-chat-message-author` e um segundo campo ao lado — onde ela põe a hora e a
  fonte quer o modelo ou a duração — e `.nds-chat-message-content` no corpo. Vale
  a frase da vigésima sexta na largura máxima: **API igual à do dono não é nem
  discussão** — e aqui o dono não é uma irmã, é a PRIMEIRA peça construída desta
  guideline. A espécie do turno é `ChatRole` achatado, renomeado e misturado: o
  agente é o assistente (a própria fonte admite que agente e subagente são
  vocabulário do componente, e não papéis do runtime), `system` se perde — a
  mesma perda, no mesmo campo, que a tabela do sinal já registra para
  `shared-conversation` —, e ferramenta não é papel de quem fala: é
  `ChatToolCall`, que a mensagem já mostra em `.nds-chat-message-tools`. As
  quatro espécies viram três tinturas, duas delas iguais, o que a regra 4 da §8
  apaga; o que sobra é o ícone e o NOME, e o nome já é campo. E o corpo é o
  parágrafo outra vez: o design system não pode ficar dono do texto da resposta —
  pior aqui do que na décima terceira e na vigésima primeira, porque na linha de
  ferramenta o exemplo da fonte enche esse campo com o JSON cru do argumento,
  onde `.nds-chat-message-content` passa tudo por `createMarkdown` com
  `isSafeUrl`.
- **Colapsa.** O agente de dentro é o que a décima primeira e a décima segunda já
  resolveram na 5.1, em `.nds-item-group` com o modelo em `.nds-font-mono`; e o
  distintivo redondo contra o quadrado é `.nds-avatar` contra
  `.nds-item-media-icon`, duas formas que já estão lado a lado nesta casa.
- **A evidência que teria virado o voto**: ANINHAMENTO — um turno de subagente
  que contivesse os próprios turnos, desenhado como árvore, que o `<ol>` plano do
  `chat-thread` não segura e que seria geometria de verdade. Procurada na fonte, e
  ela EXISTE: a chamada de ferramenta carrega as mensagens aninhadas que ela
  produziu. Só que está na faixa de RUNTIME, e o auxiliar da própria fonte a
  ACHATA — empurra cada mensagem aninhada para o mesmo arranjo, marcada como
  subagente — antes de entregar. A faixa standalone recebe um arranjo de turnos
  sem campo de filhos. **A única coisa que poderia ter sido desenho é exatamente
  a que a fonte jogou fora antes de passar adiante**, e a §1 manda ler a faixa que
  a recebeu assim.

**5. `mcp-server-panel` — colapsa, e é a que tinha mais maquinário.**

- **A favor**: é a mais equipada das cinco — abertura única sobre uma fila, uma
  conta no cabeçalho, quatro palavras de estado com ponto por linha, uma ação que
  só existe num dos estados e uma fila de etiquetas dentro do que se abre. Se
  alguma das cinco tinha estado próprio, era esta. E "precisa de autorização" é
  palavra que `ConnectionState` não tem: nem `connected`, nem `reconnecting`, nem
  `disconnected` querem dizer "esperando que alguém autorize".
- **Contra**: as quatro palavras, uma a uma. Ligado é `connected`. Ligando é
  `reconnecting` — e a própria fonte dobra a autorização pendente dentro dela —,
  com `isRetryScheduled` já decidindo se a contagem tem o que contar. Falhou é
  `disconnected`, e de novo é a fonte que dobra erro e desligado num só. E
  "precisa de autorização" é `waitsForPerson`, que `ToolCallState` `pending`
  define com a consequência de desenho junto: "nasce ABERTA — pedir autorização
  dentro de uma caixa fechada é pedir sem mostrar". A fonte desenha o contrário: a
  linha que precisa de autorização chega FECHADA, e a pastilha de autorizar só
  aparece depois de abrir. **A palavra que parecia nova é a que a fundação define
  com mais cuidado**, e vale a frase da vigésima primeira — vocabulário que a
  fundação hospeda não é vocabulário próprio de quem o desenha.
- **E o achatamento aqui é DECLARADO pela fonte, em seção própria**, o que não
  tinha acontecido nas doze da tabela: a faixa de runtime carrega seis estados, o
  painel só tem quatro, e a fonte manda dobrar os dois que sobram "no ponto mais
  próximo", com o `switch` publicado ao lado. Doze vezes o achatamento se leu nos
  tipos; esta vem com o código que joga a informação fora antes de o componente
  vê-la.
- **Colapsa.** O desenho é `.nds-accordion` de abertura única com
  `.nds-connection-state` por linha, as duas de pé, e a segunda já traz ponto,
  palavra, contagem e ação na ordem em que a fonte as quer. As ferramentas chegam
  como cadeias sem estado, então a fila é `.nds-badge` num `.nds-cluster`. E o
  teste da família reprova de saída: quais servidores estão ligados não é em que a
  resposta se apoia; é se ainda há por onde pedir, que é a razão declarada de
  `ConnectionState` existir separado de `RunStatus`. Não há mensagem, não há
  resposta, não há `Citation` — a quinta entrada seguida sem —, e a própria fonte
  aponta a versão cheia desta lista: `mcp-config`, dentro de um diálogo, que já
  está na 5.1 desde a leitura do catálogo. **Painel cuja versão cheia já colapsou
  é painel.**
- **A evidência que teria virado o voto**: um estado por servidor com ação que não
  fosse tentar de novo — que é o que "precisa de autorização" parecia ser, e que
  `waitsForPerson` já hospeda —, ou estado por FERRAMENTA: uma ferramenta
  desligada, indisponível ou usada neste turno, que faria da fila uma lista de
  verdade. Procurada nos tipos: a fila de ferramentas é arranjo de cadeias nuas,
  sem estado, sem descrição e sem esquema. A faixa de runtime tem as três coisas,
  mais o último erro — mais rica, e a §1 proíbe pegá-la; a standalone jogou tudo
  fora.

**As três cláusulas de reversibilidade que apontavam para cá, todas respondidas,
e nenhuma dispara:**

- **A da vigésima primeira NÃO dispara, e nomeava as cinco.** A condição era que
  em alguma delas aparecesse graduação de afirmação com desenho, estado ou
  vocabulário próprios — uma marca sobre uma frase que não coubesse na cadeia do
  gatilho de explicação, um nível que a palavra não carregue, ou GRANDEZA
  numérica por trás do nível. Nenhuma das cinco gradua afirmação nenhuma: quatro
  não têm nível de coisa alguma, e a quinta tem estado de LIGAÇÃO, que mede
  transporte e não confiança. Grandeza numérica não aparece em lugar nenhum do
  lote — os únicos números são contagens sem teto, e contagem sem teto é
  etiqueta, que é a fórmula da oitava. `confidence-marker` fica na 5.1, e esta
  cláusula fecha.
- **A da décima sexta NÃO dispara.** A condição era: ao construir
  `retrieval-chunks` ou `research-report`, aparecer fila de citações com desenho,
  estado ou vocabulário próprios — linha que não caiba num `.nds-item`, estado por
  citação que a seleção não modele, ou lugar dentro da fonte pedindo tipo que
  `Citation.anchor` não dê. `research-report` não tem fila de trechos: as linhas
  dela são títulos de seção com um NÚMERO ao lado, e não há trecho, âncora nem
  endereço em campo nenhum. `document-reference` fica na 5.1, e esta cláusula
  fecha — a vigésima primeira já havia fechado a metade que era de
  `retrieval-chunks`.
- **A metade que a vigésima primeira deixou de pé, da décima oitava, também
  fecha.** Ela dizia que sobravam `web-search` e `research-report` para verificar
  se aparecia fila de trechos com desenho próprio. `web-search` desenha título e
  domínio por linha, sem trecho; `research-report` desenha título e contagem, sem
  trecho. `retrieval-chunks` fica na 5.1, e nenhuma das três cláusulas desta
  família continua aberta.

**As duas sobreposições que o lote existia para medir, resolvidas:**

- **`web-search` e `research-report` NÃO são a mesma coisa em escalas diferentes —
  e nenhuma é a escala da outra.** Elas colapsam em peças DIFERENTES: uma na lista
  de fontes de um turno, outra na fila de passos do plano. O que elas dividem não
  é escala, é um defeito só, e ele fica visível quando se põem os dois tipos lado
  a lado: **as duas trocam a IDENTIDADE de uma fonte por uma EXIBIÇÃO dela** —
  uma cadeia de domínio numa, um número na outra. A escala nunca foi o eixo; o
  eixo era se a fonte sobrevive como `ChatSource`, e nas duas ela não sobrevive.
- **`memory-chips` e `speaker-identity` NÃO são a mesma etiqueta com dois
  conteúdos, e a premissa cai na segunda.** `memory-chips` é etiqueta curta:
  pastilha com texto e um botão de dispensar. `speaker-identity` não é etiqueta
  nenhuma — é uma fila de TURNOS, cada um com corpo de texto embaixo, que o
  exemplo da própria fonte enche com JSON na linha de ferramenta; o que nela é
  curto é só o distintivo que segura o ícone. É por isso que caem em donos
  diferentes: uma em `.nds-composer-context`, outra em `.nds-chat-message`. O que
  elas de fato dividem é outra coisa, e é a mesma dos outros três: **as duas
  achatam uma união que esta casa já tem** — três palavras com dois desenhos numa,
  `ChatRole` perdendo `system` e renomeando o assistente na outra —, e as duas
  fecham a diferença com cor, que a regra 4 da §8 apaga.

**E uma leitura de família que se CONFIRMA sem ter sido testada, e vale dizer as
duas coisas.** A divisa da vigésima primeira — o que interrompe o parágrafo tem
geometria própria; o que É o parágrafo, ou o que mora numa fila ao lado dele, não
tem — previu as cinco corretamente: as cinco moram ao lado da resposta, e as
cinco colapsaram. Mas previu barato, porque **nenhuma das cinco interrompe um
parágrafo**: `memory-chips` fica abaixo da resposta, `speaker-identity` É o
recipiente dela, e as outras três são painéis ao lado. A divisa fecha a família
com um positivo e oito negativos, e o positivo continua sendo o mesmo de sempre —
`inline-citation`. Quem a levar para a família 4 deve saber disso: ela nunca foi
testada contra um segundo elemento que interrompa texto corrido, porque nenhum
apareceu depois da marca.

**E uma nota para quem abrir `evidencia.css` depois desta correção**: o cabeçalho
da folha enumera cinco coisas que procedência significa — o documento, o trecho,
o lugar dentro dele, o quanto se pode confiar, o que foi procurado e o que
voltou. Depois das oito saídas, só as três primeiras têm peça, e as duas últimas
foram reservadas para entradas que colapsaram (`confidence-marker` e
`web-search`). O cabeçalho não é corrigido aqui de propósito: ele descreve o
EIXO, não o inventário, e o eixo não encolheu — encolheu o que a fonte tinha para
oferecer sobre ele.

Contagens — e aqui esta correção faz DIFERENTE das anteriores, de propósito. A
família 3 fica com **1 entrada e 1 componente**; a 5.2 perde 5 entradas e a 5.1
ganha as mesmas 5. Os totais das duas seções NÃO vão escritos aqui, e o motivo é
medido: este lote foi triado com outras duas portas escrevendo na mesma
guideline ao mesmo tempo, e a linha da família 4 passou de 18 entradas para 12
entre a leitura desta correção e a escrita dela. **Soma anotada durante a
medição de outra porta registra a medição, não o arquivo** — foi assim que uma
família ficou declarando 8 entradas com 7 componentes e o total foi a 121 sem
ninguém ver. Quem precisar do total soma as SETE linhas da tabela da 5.2 e conta
as linhas da 5.1, lembrando das que carregam duas entradas, na hora em que
precisar. É a mesma disciplina que o parêntese da 5.2 já manda: reconte família a
família a partir da tabela, nunca pelo próprio delta.

**Vigésima nona correção, a quarta em LOTE, e a segunda que dissolve uma
FAMÍLIA inteira**: `orb` e `voice-conversation` colapsam, e a 7 deixa de existir.
São a trigésima oitava e a trigésima nona travessia de 5.2 para 5.1, e as
contagens mudam uma vez só, ao fim do lote. `voz.css` não é fundada, e as folhas
novas desta guideline passam de seis para cinco.

**O ordinal desta correção saiu da POSIÇÃO no arquivo, e não de delta**: três
portas escreveram nesta seção na mesma passada e as três reivindicaram a
vigésima sétima, que é o mesmo defeito de contador compartilhado que a vigésima
terceira registrou. Quem reconciliar, reconcilie por ordem de leitura — e foi o
que se fez: a atribuição das cinco está escrita na nota de numeração do lote das
três sobreviventes, o último desta seção.

**O MECANISMO, e ele NÃO é o da vigésima sexta correção**: lá a 5.2 tinha dado à
família quatro bases e as quatro eram as próprias peças, e o corolário mandou perguntar,
ao abrir uma folha, se as bases da coluna do eixo são MATERIAL ou PEÇAS. A 7
declara uma base só, `media-player`, e ela É peça — então o instrumento previa o
desfecho a que se chegou. **Previu certo pelo motivo errado, e é isso que vale
guardar.** Nenhuma das duas entradas colapsa dentro do `media-player`: só
`read-aloud` colapsou lá, na décima nona. Estas duas colapsam em
`connection-state` e `thinking-indicator` (família 2), em `composer-voice`
(família 1), em `agent-status` (família 2) e no `chat-thread` que já existia
antes de tudo. **Base declarada é previsão, e previsão acerta o QUE sem acertar
o ONDE** — o que ela mede é que a família não tinha material próprio, não que
tenha um dono só.

O que mede melhor é a coluna do eixo, lida palavra por palavra: "áudio ao vivo,
com estado de conexão e legenda". As três coisas já tinham dono no dia em que a
linha foi escrita. Áudio ao vivo é `MediaPlayerOptions.stream`, e o docblock dele
já mede o que a transmissão faz com a barra; estado de conexão é
`connection-state`, peça da família 2, com `ConnectionState` no vocabulário
compartilhado; legenda é `<track>`, que a folha do `media-player` chama de
exigência de nível A e que o `MediaPlayerTrack` já modela. **Eixo cujas três
palavras nomeiam coisas construídas não é eixo de família: é um índice do que já
existe.** É a leitura da vigésima sexta noutro registro — lá a família descrevia
o que todo aplicativo já tinha, aqui descreve o que ESTE design system já tinha.

**1. `orb` — colapsa, e a faixa que a §1 manda ler é quase toda a leitura.**

- **A favor**: é a única entrada das 120 cujo assunto declarado é uma FORMA
  ANIMADA, e forma animada é a coisa que menos se compõe de peças prontas. A
  §8 a nomeia pelo nome na regra 8 ("orb pulsando"), o que se lê como a própria
  guideline já contando com ela; `volume` é um sinal físico ao vivo, e nenhum
  tipo de `chat-protocol.ts` carrega um; e uma superfície de foco não se monta
  com um ponto de 8 px. Se alguma peça desta campanha ia sobreviver por desenho
  puro, era esta.
- **Contra**: **a faixa standalone é um `<canvas>` e mais nada.** A anatomia
  mostra os dois blocos lado a lado, e o que é a peça standalone é só o primeiro:
  `<canvas className="aui-voice-orb" data-state="…" />`, com três props. O ponto
  de estado, o "Connecting...", o alternador de mudo e o desligar moram em
  `VoiceControl`, `VoiceStatusDot`, `VoiceMuteButton` e `VoiceDisconnectButton`,
  e a tabela que os declara está inteira sob **With a runtime**. A §1 é literal
  sobre qual das duas se lê, e a leitura da faixa certa deixa um elemento sem
  papel, sem nome, sem texto e sem controle.
- E o pouco que ela declara tem dono, campo por campo. `state` é o produto
  achatado de três eixos que a faixa de runtime mantém separados —
  `status.type`, `isMuted` e `mode` —, e a própria fonte exporta a resolução como
  FUNÇÃO (`deriveVoiceOrbState`), o que a classifica: agregado que é leitura
  rende função, não desenho — a leitura que a vigésima sexta fez em
  `conversation-search`. `volume` entra por `--nds-voice-level`, que
  `.nds-composer-voice-bar` já lê, com o mesmo docblock ("o nível é valor de
  runtime, e entra por custom property"), a mesma decisão de
  ser `aria-hidden` e o mesmo quadro de repouso sob movimento reduzido — peça
  desta campanha, construída oito correções antes desta. `variant` é uma paleta
  de três cores nomeadas fora do tema, que a §9 fecha em uma frase. E o `<canvas>`
  é código: a fonte diz que a peça "owns the WebGL animation", e o que a §1 pega
  é desenho, nunca implementação — aqui não há um sem o outro.
- **Colapsa**, e o teste que decide é o do quadro de repouso.
  `prefers-reduced-motion` é o que a própria linha da 5.2 destacava para esta
  família, e sob ele o orb é um
  círculo colorido: cinco estados separados por cor, que é o que a regra 4 da §8
  proíbe e o que a decisão 4 do `connection-state` já escreveu para o ponto de 8
  px. Uma peça cuja informação inteira desaparece quando a animação para não
  carrega informação nenhuma — **o que informa é a palavra, e a palavra com ponto
  e ação é `.nds-connection-state`, nó por nó.**
- **A evidência que teria virado o voto**: geometria sem dono, como a da nona
  correção — um sistema de coordenadas, uma forma que precisasse posicionar dado
  sobre um espaço. Procurada nos tipos, que é onde a nona a achou: o único número
  é `volume`, de 0 a 1, e ele escala a própria forma. **Escalar a si mesmo não é
  sistema de coordenadas**; em `computer-use` o quadro é da peça e o ponto só
  significa dentro dele, e aqui não há ponto, não há quadro e não há segunda
  dimensão. A segunda coisa procurada foi um estado que a família não tenha e que
  MUDE O DESENHO: `listening` contra `speaking` é o candidato, e a própria fonte
  o desenha igual — o ponto de estado dela é verde nos dois. Cinco palavras,
  quatro desenhos, e o que fecha a diferença é uma predefinição de animação: é a
  sétima forma do sinal, medida na vigésima primeira, com o agravante de a
  diferença sumir junto com o movimento.

**2. `voice-conversation` — colapsa, e é a que compõe MAIS peças construídas de
todas as 120.**

- **A favor**: é a leitura mais forte do lote, e por três coisas que `orb` não
  tem. A forma animada aqui é um `<button aria-label="Interrupt the assistant">`
  — tem alvo, que é justamente o que faltou à palavra falada da décima nona; a
  legenda NOMEIA o turno, que é a palavra que a regra 4 da §8 cobra; e `mode`
  declara `thinking`, um estado que a faixa de runtime da fonte **não tem** e que
  a standalone acrescentou — o contrário exato do achatamento, e a primeira vez
  na campanha que a standalone entrega MAIS que o runtime. Some-se a isso o eixo
  que o vocabulário compartilhado de fato não tem: de quem é a vez de falar.
- **Contra**: as quatro palavras de `mode` têm quatro donos, e todos os quatro
  estão construídos. `connecting` é `ConnectionState`, com a decisão de que a
  primeira tentativa desenha como a quinta já escrita. `thinking` é o
  `thinking-indicator`, cujo bloco abre dizendo que ele é "o lugar da resposta
  enquanto ela não chegou" — a peça existe exatamente para esse vão. `speaking` é
  `RunStatus` `running` com o `stop` de `AgentStatusIntent` ao lado, que é o
  interromper da fonte com um rótulo que diz o que faz, e não um alvo de 120 px
  sem nome visível. `listening` é `VoiceState` `recording` no `composer-voice`,
  com alternador de `aria-pressed`, nível e palavra. **União cujas palavras se
  repartem entre quatro peças de pé não é estado da entrada: é a ordem em que
  elas aparecem na tela.**
- E a transcrição fecha o resto: `VoiceTurn` é `SharedTurn` repetido, o
  estreitamento em duas direções que a vigésima sexta mediu, e vale a frase que a
  décima nona e a vigésima quinta já escreveram — **o parágrafo não é da peça.**
  `muted` é o booleano do alternador,
  o avesso da décima quinta e da décima nona; `amplitude` é `--nds-voice-level`;
  `onToggleMute` e `onEnd` são espaço de ação, que a §2 entrega a quem consome.
- **Colapsa**, pelo critério que a vigésima terceira fixou para separar absorção
  de migração: **a 5.1 é para quem compõe mais de uma peça**, e esta compõe cinco.
  Nenhuma docs page de nenhuma delas mostraria o `thinking-indicator` acima de um
  `chat-thread` com o alternador de voz no pé, e é isso que a story de composição
  existe para mostrar.
- **A evidência que teria virado o voto**: uma decisão de REGIÃO VIVA que o
  sistema ainda não tivesse tomado. Era a candidata mais séria, e a linha da 5.2
  apontava para ela: áudio ao vivo é o caso em que anunciar pode ser certo, e a
  regra 1 da §8 proíbe por padrão. Procurada nas folhas construídas, e **as três
  metades já estão decididas, cada uma numa peça de pé**: perder a ligação
  anuncia, e o `connection-state` escreve por quê ("não é o passo seguinte, é o
  chão saindo"), com `role="status"` polido e a região envolvendo só a palavra; a
  resposta que começa a vir anuncia UMA vez, e é o `thinking-indicator`; o
  medidor de nível não anuncia nada, e é o `composer-voice`. Falta a quarta — de
  quem é a vez —, e ela responde sozinha: numa chamada ao vivo quem anuncia o
  turno é a voz que fala, e uma região viva por cima dela seria a peça falando
  junto com o modelo. Para quem não ouve, o turno chega escrito na transcrição, e
  quem anuncia lá é o anunciador do `chat-thread`, uma vez, ao terminar. **A
  decisão mais difícil da família estava tomada três vezes antes de a família
  abrir.**

**As reversibilidades que apontavam para cá, respondidas:**

- **`read-aloud` (décima nona) CONFIRMA no primeiro gatilho, e o segundo NÃO é
  destas duas.** A condição era leitura em voz com desenho, estado ou vocabulário
  próprios aparecendo ao construir uma destas: uma marca de palavra que a caixa de
  linha não comporte, um estado de fala que `PlayerState` não modele, ou legenda
  com TEMPO que `<track>` não dê. Nenhum dos três, e nenhum por pouco: nenhuma das
  duas marca palavra nenhuma — `orb` não tem texto e a transcrição da outra são
  turnos inteiros; o único estado de fala declarado é `mode`, que se reparte entre
  quatro peças e não descreve reprodução; e a transcrição é `{ id, role, text }`,
  que é MENOS que `<track>`, porque não tem tempo nenhum. `read-aloud` fica na 5.1.
  O segundo gatilho daquela cláusula — se o terceiro motor, o que relata o próprio
  estado em vez de ser lido de um elemento, não couber no `media-player` sem
  redesenhar a barra — **continua aberto e não é destas duas**: ele se mede ao
  compor a story de `read-aloud` sobre o `media-player`, e nem `orb` nem
  `voice-conversation` tocam aquele motor. Fica dito para não ser procurado aqui.
- **`mobile-composer` (décima quinta) CONFIRMA, e era o último gatilho dela.** A
  vigésima sexta já escreveu que restava um só, e é este. A condição era
  superfície de toque com desenho, estado ou vocabulário próprios: uma barra que
  se prenda ao teclado por conta própria, um estado do aparelho que consulta de
  mídia não alcance, ou geometria de telefone que não caiba numa regra do bloco
  que já existe. `voice-conversation` não tem teclado, não tem campo, não tem
  `keyboardOpen`, não tem consulta de mídia e não diz uma palavra sobre telefone —
  é a mesma leitura da vigésima sexta sobre `thread-list-sidebar`, e pelo mesmo
  motivo: **a fonte não é sobre isso.** `mobile-composer` fica na 5.1, e a
  cláusula fecha sem gatilho nenhum de pé.
- **`permission-grant` (quarta) e `computer-use` (nona) não são tocadas**: não há
  pergunta com consequência nem geometria sobre superfície em nenhuma das duas.

**A sobreposição que o lote existia para medir, medida**: `orb` está DENTRO de
`voice-conversation`, e a fonte diz isso primeiro — a página da segunda manda ler
a da primeira para o adaptador e diz cobrir "a tela em volta". É o par
`thread-list` / `thread-list-sidebar` invertido: lá a de fora não tinha faixa
standalone e a de dentro tinha; aqui a de dentro é que é uma casca de um elemento
só, e é a de fora que dá à forma um papel, um nome, um alvo e uma palavra. **As
duas colapsam no mesmo lugar, e a de dentro é o indicador da de fora.**

**E a leitura de FAMÍLIA que fecha, porque uma família não se dissolve por soma
de entradas**: a 7 é a única das sete cujo eixo era um MEIO, e não uma pergunta.
As outras cinco vivas descrevem o que se pergunta, o que o agente está fazendo, em
que a resposta se apoia, com que forma ela chega e quanto ela custa — coisas que
mudam de desenho conforme a resposta. A 7 descrevia o CANAL: som em vez de texto.
Trocar o meio não muda o que a interface tem a dizer, e a prova está nas quatro
palavras de `mode` caindo em quatro peças que já desenhavam a mesma coisa por
escrito. **Família definida por canal herda as peças do canal antigo, e não tem o
que acrescentar.**

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos, e
com duas portas escrevendo nas famílias 3 e 4 enquanto esta lia a fonte — o
registro de método da vigésima terceira vale pela quarta vez, e os números das
duas famílias vizinhas saíram das linhas relidas depois, nunca de delta desta
passada. A família 7 fica com **0 entradas** e **0 componentes**; a 5.2 perde
duas entradas e dois componentes, e a 5.1 ganha duas entradas.

**E o registro de método, que vale uma sétima vez.** O pedido trazia duas
afirmações a conferir, e as duas estavam erradas para o mesmo lado. A primeira:
que `orb` seria "a única entrada de todo o catálogo cujo assunto declarado é forma
animada" — e não é. `typing-indicator` e `number-ticker` também o são, e as duas
já estavam na 5.1 desde a primeira leitura, a segunda com o dono escrito
("animação de dígito, não componente — `13-animacao.md`"). A segunda: que a
família 2 teria "dez peças construídas" — e tem NOVE; a décima era justamente
`checkpoint-history`, a entrada por triar. As duas empurravam para o mesmo lado, e
o lado era o da sobrevivência. **Afirmação que favorece o desfecho contrário ao
que se está medindo também precisa ser conferida** — a vigésima sexta escreveu a
metade fácil desta regra, que é conferir primeiro a afirmação que favorece o
desfecho a que se chega; a metade que faltava é que nenhuma se confere sozinha.

**Trigésima correção, e a quadragésima travessia de 5.2 para 5.1**:
`checkpoint-history` é `.nds-item-group` de `.nds-item` com a linha corrente
marcada — e as duas contagens mudam junto. É a quinta que colapsa numa peça da
PRÓPRIA família 2 já construída, a última entrada que faltava dela, e **com ela a
família 2 FECHA**, em nove componentes, como a 1 fechou na décima quinta.

O que a fonte descreve, lida inteira e pelos TIPOS antes da anatomia:
`Checkpoint { id: string, label: string, at: string, files: number }` e, no
componente, `checkpoints: readonly Checkpoint[]`, `currentId: string`,
`onRestore?: (id: string) => void` e `className`. Quatro entradas no componente,
quatro campos na linha, UMA chamada de volta. Faixa de runtime não há: a página
publica só a forma standalone, e é a segunda entrada triada assim, depois de
`schedule-card`. Vale a mesma leitura, na mesma direção: o que falta é a
contradição INTERNA entre as duas faixas que a décima oitava e a vigésima
acharam, e ela é uma prova a menos contra a entrada — nunca uma a favor. A
anatomia é um rótulo "Checkpoints" e uma linha por ponto: um ponto (azul cheio
no corrente, anel vazado nos que estão à frente, cinza cheio nos de trás), o
rótulo, o carimbo com a contagem de arquivos, e ou a palavra "current" ou um
botão de restaurar que só aparece no `:hover` ou no `:focus`. Com o arranjo
vazio, só o rótulo é desenhado.

Antes dos três testes, as três perguntas que esta entrada obriga a fazer, porque
é de uma delas que sairia desenho próprio:

- **Voltar atrás é eixo novo nesta família? NÃO É, e a folha já o tinha
  construído.** É a pergunta mais forte da entrada: as nove peças de pé descrevem
  o que está acontecendo, o que já aconteceu ou o que vai acontecer, e esta
  descreve DESFAZER. A resposta está no `agent-plan`: uma lista ordenada com um
  ponto marcado como "aqui", `aria-current` no passo, e a decisão escrita de que
  "onde estamos também precisa chegar ao olho" — porque a cor do marcador não
  responde sozinha. A diferença que o checkpoint acrescenta é que as linhas de
  DEPOIS do cursor já aconteceram e foram deixadas para trás, em vez de ainda não
  terem acontecido; e essa diferença não muda um pixel: o plano já desenha um
  estado que não vai acontecer e continua na lista, que é `skipped`, e o desenha
  com traço, não com opacidade. **Cursor sobre lista ordenada não é eixo desta
  entrada: é o que a peça ao lado faz.**
- **O trio corrente / à frente / atrás é estado, ou é POSIÇÃO? É posição, e a
  fonte diz como a calcula.** A linha corrente é achada casando `currentId` contra
  o arranjo, e o resto sai do ÍNDICE: quem vem depois desenha à frente, quem vem
  antes desenha atrás, e um `currentId` que não casa com nada faz todas as linhas
  desenharem atrás. Nenhum campo de `Checkpoint` participa disso. É a quarta forma
  do sinal, medida na décima primeira: o estado por item não é um booleano
  declarado, é uma comparação com um contador — só que ali a comparação partia a
  lista em dois desenhos e aqui em três, e o efeito é o mesmo, incluindo o de
  amarrar o desenho à ORDEM do arranjo. **Ao ler os tipos, conte quantos desenhos
  distintos a peça sabe fazer, e depois pergunte de onde eles saem: se saem do
  índice, quem os decide é quem passa o arranjo.**
- **A contagem de arquivos é medição, e portanto da família 5? Não, e por dois
  motivos.** Não tem teto e não tem fração — `token-budget.ts` não teria o que
  contar —, e a família 5 já registrou que quem não mede contra denominador não
  é dela. E `files: number` cobra o preço que esta família tira do componente por
  regra: para desenhar, ele teria de escrever "4 arquivos", com plural e ordem de
  palavras, que é decisão de idioma. É a sexta forma do sinal, medida na décima
  sexta sobre `page: number`, com o mesmo desfecho — **o número chega já escrito,
  como o carimbo ao lado dele.**

Os três testes, todos negativos:

- **Desenho, não.** Montado inteiro, o cartão não deixa buraco — e a fonte mesma
  já diz de que ele é feito, como em quase toda esta seção: a raiz "usa a
  superfície `paper` compartilhada" e o carimbo com a contagem usam `mono`.
  Superfície compartilhada declarada na origem, e é o oposto exato do que a nona
  leu em `computer-use`.

  A composição é `.nds-item-group` de `.nds-item` `data-size="sm"`, a mesma fila
  que `subagent-list`, `background-inbox` e o histórico de `schedule-card` já
  montam. O rótulo é `.nds-item-title`; o carimbo e a contagem, já escritos, são
  `.nds-badge` com `.nds-font-mono`, onde a quinta, a décima primeira, a décima segunda, a
  décima sétima, a décima oitava e a vigésima terceira já puseram todo valor
  técnico; restaurar é `.nds-button` `.nds-button-ghost` em `.nds-item-actions`. A
  linha corrente leva `aria-current="true"` e `.nds-item-muted`, que é o fundo
  destacado da fonte. Sem ponto nenhum, `empty.css` — e aqui a composição é mais
  fina que a fonte, que desenha o rótulo sobre o vazio e mais nada.

  Três traços a composição não reproduz, os três por decisão já escrita, e os três
  são regras da §8 e não gosto. O ponto colorido como único portador do trio é a
  regra 4, e o conserto é o mesmo do `agent-plan` e do `connection-state`: o ponto
  é reforço e a PALAVRA é o estado, em `.nds-badge`. A opacidade reduzida das
  linhas à frente é a mesma regra 4, e é o traço que a décima segunda mediu em
  `agent-handoff` — dois desenhos separados só por cor e opacidade custam a
  informação inteira para quem não enxerga a diferença. E o botão que aparece só
  no `:hover` é a regra 3: ações aparecem no `:hover` **e** no `:focus-within` e
  permanecem na ordem de foco, que é o que `.nds-chat-message-actions` já desenha
  por `opacity` e nunca por `display`. A fonte diz "hover or focus", e é a
  diferença entre focar o botão e focar a LINHA que a decide.

- **Estado, não, e o sinal fica MUDO — e é o mais mudo desde
  `message-branches`.** `Checkpoint` não declara booleano, união nem tipo de
  estado: são três cadeias e um número. Pela sub-regra da décima, olha-se a
  assinatura que sobrou no lugar do estado, e é `onRestore(id)`. Ela nomeia um
  dono — mas, pela primeira vez em seis, **o dono não é um componente nem uma
  guideline transversal: é uma cláusula desta.** Restaurar é AÇÃO, e a §2 fecha o
  assunto em uma linha: ação é espaço, não política, e o contrato é
  `actions?: HTMLElement[]`, que o `approval-card` fixou e que o `.nds-item-actions`
  hospeda. A vigésima segunda tinha escrito que dono pode não ser peça, quando
  `cycle` apontou `13-animacao.md`; esta acrescenta o terceiro lugar em que um
  dono mora — **a regra da própria família.** Quando a única assinatura que sobra
  é uma que a §2 já classificou como espaço, ela não descreve a peça: descreve o
  que quem monta põe dentro dela.

- **Vocabulário, não, e nenhum campo fica sem par.** `id` é endereço de linha, que
  `ChatToolCall.id` e `PlanStep.id` já declaram com o mesmo docblock e pelo mesmo
  motivo. `label` é `PlanStep.label`. `at` é carimbo já formatado, que é a decisão
  do relógio de `agent-status`, da contagem de `connection-state` e do `at` de
  `schedule-card`, nas mesmas palavras. `files` é uma contagem sem total, e esta
  família tem o tipo exato para isso — `JobCount`, cujo docblock existe justamente
  porque "trabalho que não sabe de quantos é caso REAL" —, o que confirma que o
  número não é conceito novo: é o `done` de uma conta sem denominador, com o
  rótulo por escrever. É a distância inteira para `computer-use`, que sobreviveu
  por ter dois campos sem par em lugar nenhum.

E o teste da família, que é o quarto: **ela responde ao eixo, e é a segunda que o
responde sobre um tempo que não é agora — a vigésima terceira olhava para a
frente, e esta olha para trás.** "O que está acontecendo" é "você está no ponto
três"; "há quanto tempo" é o carimbo de cada um; "o que eu posso fazer a respeito"
é voltar. As três respostas cabem, e nenhuma pede desenho que a folha não tenha —
o que faz desta a décima leitura do padrão que a sexta, a sétima, a décima
primeira, a décima segunda, a décima quarta, a décima quinta, a décima sétima, a
vigésima e a vigésima terceira já nomearam: **`checkpoint-history` não sai por não
pertencer à família — sai por já estar construída dentro dela.**

**E POR QUE MIGRA EM VEZ DE SER ABSORVIDA**, pelo critério da quarta, da vigésima
e da vigésima terceira: absorção é para quem não acrescenta nada — mesma marcação,
mesmo vocabulário, mesma docs page com outro título. Aqui a composição junta a
linha rica, o distintivo monoespaçado, o botão que só aparece no foco e o vazio, e
uma docs page desta entrada mostraria `aria-current` numa fila de `.nds-item`, que
a docs page de nenhuma peça da família mostra. **A 5.1 é para quem compõe mais de
uma peça.**

**A LEITURA QUE A §7 OBRIGA, e ela não muda o veredito**: aquela seção nomeia
`checkpoint-history` entre as peças que fazem perguntas com consequência, e é
preciso dizer por que isso não a salva. A lista da §7 é de ASSUNTOS que encostam
em política, não de peças: das seis que ela nomeia, `permission-grant` foi
absorvida na quarta, `guardrail-notice` colapsou na décima, `elicitation-form` na
vigésima e `edit-message` na décima quarta — sobrou `approval-card`, que é uma. E
aqui não há pergunta nenhuma no sentido daquela seção: pergunta é pedido, alcance
e um par de controles com alguma coisa de pé esperando a resposta, que é a API que
o `approval-card` fechou. Uma fila com um botão por linha não é isso. **A linha da
§7 continua valendo, e passa a valer para quem MONTAR a composição**: o que
restaurar devolve, se os pontos à frente sobrevivem à volta, e se voltar duas
vezes desfaz duas — nada disso é do design system, e é exatamente o que aquela
seção manda perguntar à dona na hora.

**A reversibilidade da vigésima terceira, que apontava para cá, respondida — e é a
única que apontava.**

- **`schedule-card` CONFIRMA, e a cláusula fecha os quatro gatilhos.** A condição
  era agendamento com desenho, estado ou vocabulário próprios aparecendo ao
  construir `checkpoint-history`. (a) Cadência que chegue ESTRUTURADA e peça
  desenho — um trilho de sete pontos, uma prévia das próximas execuções, um
  calendário: não há cadência nenhuma aqui, nem recorrência, nem intervalo; os
  pontos são passado avulso. (b) Um estado por execução passada que `RunStatus` não
  modele — `missed`, `throttled`, `skipped` por sobreposição: `Checkpoint` não
  declara estado NENHUM, o que é aquém do `ok: boolean` que aquela correção mediu,
  e não além dele. (c) O estado do próprio agendamento chegando como VOCABULÁRIO
  em vez do booleano do interruptor: não há agendamento e não há interruptor. (d) O
  segundo gatilho, se `agent-status` precisasse de desenho próprio para carregar um
  instante FUTURO: esta entrada não tem instante futuro, e os carimbos que ela tem
  vão para o distintivo, que é a saída que aquela composição já usava.
  `schedule-card` fica na 5.1.
- **`permission-grant` (quarta) não é tocada**: não há pergunta com consequência
  aqui, pelo que a leitura da §7 acima mede.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: a
família 2 passa a **13 entradas** e **9 componentes**, e FECHA. A 5.2 perde uma
entrada e a 5.1 ganha uma. As famílias 3 e 4 estavam sendo escritas por outras
duas portas enquanto esta lia a fonte, e os números delas não saem de delta desta
passada: leem-se das linhas, depois — **contador compartilhado não se lê duas
vezes: lê-se uma, depois.**


**Trigésima primeira correção, o segundo lote da família 4, e o primeiro da
campanha inteira em que peças SOBREVIVEM em bloco**: `flow-graph`,
`trace-waterfall` e `activity-graph` são slugs, e `activity-graph` absorve
`heat-graph`. **Nenhuma travessia de 5.2 para 5.1** — sobrevivente não atravessa,
e a contagem para nas quarenta que a trigésima fechou. O que muda na linha da
família 4 é só a absorção — 12 entradas, **11 componentes**. E o que isso decide
é maior que a contagem: **`resposta-estruturada.css` tem eixo e vai nascer**,
depois de três leituras seguidas que a deixaram por fundar.

*(Nota de numeração, e ela é do método: três portas escreveram "vigésima sétima
correção" nesta mesma rodada — a que colapsou as seis molduras da família 4, a
que fechou a família 3 e a que dissolveu a família 7 — e uma escreveu "vigésima
oitava". A reconciliação foi feita por POSIÇÃO NO ARQUIVO, que aqui coincide com
a ordem dos commits: o lote das seis molduras ficou com a vigésima sétima, o que
fechou a família 3 com a vigésima oitava, o que dissolveu a família 7 com a
vigésima nona, `checkpoint-history` com a trigésima, e este bloco com a trigésima
primeira. Mesmo reconciliado, este bloco continua chamando o primeiro lote da
família 4 de **o lote das seis molduras**, e não pela ordinal, porque a lição não
caducou com o conserto: **ordinal escrita em paralelo é contador compartilhado
com outro nome** — quem escrever em paralelo de novo escreva o ASSUNTO, que não
colide.)*

**O MECANISMO, e ele é o avesso exato do lote das seis molduras**: lá a peça
recebia o conteúdo inteiro e não sobrava desenho para ser dela; aqui a peça
recebe DADOS e o desenho é o que ela faz com eles. As três põem em pixel uma
relação que não está no dado — adjacência, intervalo sobre um eixo comum,
densidade numa grade de datas —, e nenhuma dessas três relações existe em canto
nenhum desta casa. Escrito como pergunta, para as nove que faltam da família 4:
**a peça POSICIONA alguma coisa, ou só empilha?** Empilhar é `.nds-stack`,
`.nds-item-group` e `.nds-card`, e foi o que colapsou seis vezes seguidas.
Posicionar é o que esta família tem de próprio, e é a razão de a 5.2 lhe ter dado
uma folha desde o começo.

**1. `flow-graph` — SOBREVIVE, e é a mais clara das três.**

- **A favor**: nós em coordenadas de grade (`column`, `row`) que quem monta
  escolhe, com uma curva por aresta ligando os que dependem um do outro, e o
  traço da aresta acendendo só quando as duas pontas estão visíveis. **Nada em
  `docs/shared/styles/` liga dois retângulos.** Medido: o único conector do
  design system é `.nds-stepper-separator`, uma linha de 1 px entre etapas
  ADJACENTES de uma fila linear, e `chart` tem oito tipos — `bar`, `line`,
  `area`, `pie`, `pie-nest`, `funnel`, `radar`, `scatter` — e nenhum é grafo.
- **Contra**: `agent-plan` já desenha trabalho em etapas com estado por etapa, e
  `PlanStep` tem cinco palavras onde esta tem três. Se o que a entrada
  acrescentasse fosse só a posição, seria `agent-plan` com layout.
- **Sobrevive**, e o que decide não é a posição, é a ARESTA. `FlowEdge` é
  `{ from, to }`: adjacência, uma relação entre dois itens, e `chat-protocol.ts`
  não tem como dizer "este depende daquele" — `PlanStep` é fila ordenada e ordem
  não é dependência, porque fila não se ramifica nem se reencontra, que é
  literalmente o que a fonte declara ("branches that fan out and rejoin"). É a
  leitura da nona ampliada: lá o eixo novo era um PONTO; aqui é um ponto mais uma
  RELAÇÃO, e relação é a primeira coisa deste catálogo que não cabe num campo de
  item nenhum.
- **O achatamento existe e não segurou**: `done | active | pending` são três
  desenhos onde `ToolCallState` tem quatro e `PlanStepState` tem cinco; `active`
  é `running` com outro nome, e o que se perde é `failed` — um nó de trabalho que
  quebrou desenha igual a um que terminou. **O sinal previu e errou**, e é a
  primeira vez na campanha que ele erra: pela abertura da própria seção do sinal,
  ele "não decide sozinho, mas prevê", e aqui o desenho e o vocabulário decidiram
  contra. A peça construída leva `ToolCallState` inteiro, como sete peças da
  família 2 já levam no lugar do booleano da fonte.
- **A evidência que teria virado o voto**: as arestas serem de quem monta, como
  a superfície de `computer-use` é. Procurada na anatomia: o `<svg>` das curvas é
  filho da raiz, e o brilho de cada traço é calculado pela peça a partir de
  `visibleCount` — quem não desenha as arestas não sabe acender nenhuma.

**2. `trace-waterfall` — SOBREVIVE.**

- **A favor**: uma barra por linha POSICIONADA em `startMs / totalMs` e larga em
  `durationMs / totalMs`, todas contra o mesmo eixo, com recuo por `depth`. É
  intervalo, e intervalo não existe neste vocabulário: `chat-protocol.ts` sabe
  dizer estado e duração, e não sabe dizer QUANDO dentro de quê.
- **Contra**: `progress` é barra, `job-progress` é barra com rótulo e palavra de
  estado, e `message-timing` já mede o tempo de uma resposta.
- **Sobrevive**, e as três objeções caem pela mesma medida. `progress` preenche
  a partir do zero — `.nds-progress-indicator` é `transform: translateX(calc((var(--value) - 100) * 1%))`,
  que é uma barra ancorada no início e não tem como começar no meio; medido no
  repositório inteiro, **a única coisa que o design system posiciona por
  deslocamento é `.nds-computer-use-mark`**, com `inset-inline-start: calc(var(--computer-use-mark-x) * 1%)`.
  E `message-timing` não tem eixo nenhum: é um `<dl>` de pares termo/valor, e a
  folha da família 5 diz por escrito que ali "não há medidor que troque de forma"
  e "não há teto de que caiba uma fração". Barra com começo é outro desenho, não
  outra variante.
- **O achatamento também existe aqui e também não segurou**: `running |
  completed | failed` são três onde `ToolCallState` tem quatro, e `completed` é
  `done` renomeada; falta `pending` — o trecho que ainda não começou, que num
  eixo de tempo é justamente o que se quer ver. Segunda vez no mesmo lote que o
  sinal prevê e erra.
- **E ela traz de brinde as duas regras que a folha vai ter de reger**, o que
  ajuda a fundá-la: a fila de N barras num eixo largo é região que ROLA, e vai
  com papel e nome (regra 6 da §8), e a cor da barra é a única diferença entre os
  três estados na fonte, o que a regra 4 recusa (WCAG 1.4.1) — entra palavra ao
  lado, como `agent-status` já faz.
- **A evidência que teria virado o voto**: as barras não dividirem eixo — cada
  linha com a própria escala, que seria `progress` numa tabela. Procurada: a
  fonte diz o contrário em três lugares, e o mais claro é o exemplo de mostrar
  só os últimos trechos, em que `totalMs` continua sendo o total real "para que
  as barras restantes guardem a posição verdadeira no eixo em vez de
  reescalarem".

**3. `activity-graph` — SOBREVIVE, absorvendo `heat-graph`.**

- **A absorção primeiro, porque é barata**: `heat-graph` declara UM prop,
  `data`. Não tem `className`, não tem `data-slot` na raiz — a própria fonte diz
  que as duas ausências são únicas no catálogo —, tem janela fixa nos 365 dias
  que terminam hoje, e a escala de cinco níveis é "cinco valores hexadecimais
  puros, sem variante para o modo escuro". `activity-graph` é a mesma grade com
  janela declarável (`start`, `end`), título, total, `className` e uma escala que
  conhece os dois modos. E quem fecha é a fonte de `heat-graph`, mandando quem
  quiser uma versão restilizável começar por `activity-graph` "em vez de bifurcar
  esta, que é fixa". **Mesma grade, mesmos dados, uma sabe menos**: é absorção,
  como `agent-status` absorveu `stopped-run`.
- **A favor**: uma grade de uma célula por dia, uma coluna por semana, com
  rótulos de mês posicionados sobre as colunas, rótulos de dia em linhas
  alternadas, legenda de cinco níveis entre "menos" e "mais", e dica por célula.
  Nada nesta casa desenha isso: `chart` não tem tipo de mapa de calor entre os
  oito, e `calendar` é uma `<table>` de mês para ESCOLHER data, com navegação e
  células que são botões de seleção — outra geometria e outro propósito.
- **Contra, e é a objeção séria desta**: `chart` já delega desenho a uma
  biblioteca que sabe fazer mapa de calor em coordenada de calendário. Um valor
  novo em `ChartType` seria "um argumento do que já existe", que é o critério de
  variante.
- **Sobrevive**, e a resposta a essa objeção é o que esta leitura acrescenta ao
  instrumento. **O teste não é se a peça existente PODERIA crescer até cobrir a
  entrada — tudo pode crescer. É se o desenho já existe.** As opções nomeadas
  pela campanha até aqui foram sempre aditivas sobre um desenho INALTERADO:
  `actions` numa fila de cabeçalho que já estava lá, `railEnd` num trilho que já
  estava lá, `lineKinds` ao lado de `highlightLines`. Um mapa de calor de
  calendário daria a `chart` um sistema de coordenadas que ele não tem, uma forma
  de dado que ele não aceita (`{ date, count }` onde `ChartDataPoint` é
  `{ label, value }`) e uma legenda de níveis — isso não é um argumento, é outra
  peça morando dentro de `chart`.
- **E há uma medida que fecha do lado da acessibilidade**: as células são
  focalizáveis e cada uma tem nome próprio ("N contribuições em tal dia"), e o
  desenho de `chart` entrega isso a uma tela desenhada por biblioteca, cuja
  resposta acessível é a `ChartTable`. Célula com nome é DOM, não marca de
  gráfico.
- **A evidência que teria virado o voto**: a grade ser lida como um todo e não
  célula a célula — sem foco por dia, sem nome por dia, com a leitura acessível
  saindo de uma tabela ao lado. Procurada na fonte: "Hovering **or focusing** a
  cell shows a tooltip".
- **Sinal mudo**, o décimo terceiro: não há booleano, não há união, não há estado
  nenhum, e no lugar dele não sobra assinatura — `activity-graph` não tem uma só
  chamada de volta. Pela sub-regra da décima, quando não sobra nada a que apontar,
  decidem os três testes; decidiram pelo desenho.

**UMA DEPENDÊNCIA QUE A §6 NÃO VIU, e é a quinta.** As duas fontes de mapa de
calor envolvem o pacote **`heat-graph`** — a de `heat-graph` se descreve como
"uma composição fina sobre os primitivos do pacote `heat-graph`" (`Root`,
`MonthLabels`, `DayLabels`, `Grid`/`Cell`, `Legend`, `Tooltip`), e
`activity-graph` "constrói o próprio calendário sobre os mesmos primitivos". A
§6 diz o contrário, em letras: que `activity-graph` e `heat-graph` "se desenham
com SVG e CSS próprios". **Não se desenham.** É o segundo conserto na mesma
seção em duas leituras, e a leitura de método é a mesma: aquela tabela previu o
que cada assunto pediria, e previsão não é fonte lida.

**E isso NÃO vira pergunta para a dona**, pelo teste que a própria §6 define: a
saída sem dependência existe e é barata. Uma grade de 53 colunas por 7 linhas com
cinco níveis de tinta é `display: grid` mais uma classificação de contagem em
nível — não é analisar uma linguagem, que é o que fazia `mermaid-diagram`
depender de verdade da biblioteca dela. **Onde a saída é uma folha de estilo, não
há decisão a tomar**; onde a saída seria reescrever um analisador, há. Nenhuma
dependência nova entra por esta família.

**O QUE A FOLHA VAI TER DE REGER, medido nas três e escrito aqui para quem a
funda** — porque folha escrita antes de qualquer peça é previsão, e esta rodada
já mostrou duas vezes o que previsão vira:

1. **O eixo**: as três põem em pixel uma RELAÇÃO que o dado não carrega —
   adjacência, intervalo num eixo comum, densidade numa grade de datas. É por isso
   que dividem folha, e é o que separa a família 4 das outras cinco: as outras
   desenham o que está acontecendo; esta desenha a FORMA de uma resposta.
2. **Conteúdo que transborda**: as três são mais largas que a conversa, e as três
   rolam. Uma só camada rola, com `tabindex="0"`, `role="group"` e nome acessível
   (regra 6 da §8, e `group` e não `region` pela leitura da vigésima segunda).
3. **Cor que carrega significado**: estado de nó, estado de trecho e nível de
   densidade são, nas três fontes, diferença SÓ de cor. As três levam palavra ao
   lado (regra 4 da §8, WCAG 1.4.1), e a escala de intensidade do mapa de calor se
   verifica nos dois modos e em todos os temas, que é o que a §9 já reservava para
   ela.
4. **Sem região viva**, por default (regra 1 da §8): as três se escrevem sozinhas
   enquanto uma execução corre, e uma grade que se reanuncia a cada célula é
   impossível de ouvir.
5. **O contador de revelação não entra na peça.** As três fontes declaram
   `visibleCount`, e ele aparece em sete das dezoito entradas originais desta
   família. Revelação é `13-animacao.md`, e a §2 já decide o resto: o componente
   desenha o que recebe. Quem quiser revelar passa menos itens.
6. **Vocabulário**: as três achatam estado, e as três levam `ToolCallState`
   inteiro no lugar — é o movimento que a família 2 já fez sete vezes. O intervalo
   (`startMs`/`durationMs` contra um total) é candidato a `chat-protocol.ts`, e a
   classificação de contagem em nível é candidata a primitivo (`§3.2`), porque é
   decisão que rende cinco `if`. **As duas se decidem ao construir a PRIMEIRA
   peça, não aqui.**

**Reversível**, como as outras. Por entrada: se ao construir `flow-graph` as
arestas puderem ser passadas prontas por quem monta sem a peça perder o cálculo
do traço, ela desdobra para a 5.1 em `computer-use`. Se `trace-waterfall` for
montada e a fila de barras couber em `data-table` com uma coluna de barra sem
perder o eixo compartilhado, ela desdobra. Se `activity-graph` for construída e o
que sair for um `chart` com um tipo a mais e nada de DOM por célula, ela desdobra
e leva `heat-graph` junto. Pela família: a 4 fica de pé com qualquer uma das três,
e só deixa de existir se as três desdobrarem.

**O que esta leitura NÃO decide**: as nove restantes — `spec-sheet`,
`comparison-card`, `score-breakdown`, `recommendation-card`, `timeline`,
`file-tree`, `artifact-card` e `canvas-split` (oito entradas, oito componentes,
mais `heat-graph` já absorvida). Duas notas medidas de passagem para quem abrir a
próxima, e as duas são da pergunta deste lote: `file-tree` POSICIONA por `depth`
e declara `totalAdditions`/`totalDeletions`, que é o par exato de `TimelineStat`,
sem casa desde a vigésima segunda; e `timeline` declara `when: past | now |
future`, que é dot mais conector por linha e é onde `.nds-stepper-separator` — o
único conector desta casa — encosta pela primeira vez num assunto desta família.
As outras seis empilham.


**Trigésima segunda correção, o terceiro lote da família 4, o quinto em LOTE, e a
que FECHA a leitura do catálogo**: as oito entradas que restavam colapsam —
`spec-sheet`, `comparison-card`, `score-breakdown`, `recommendation-card`,
`timeline`, `file-tree`, `artifact-card` e `canvas-split`. São a quadragésima
primeira à quadragésima oitava travessia de 5.2 para 5.1, e as contagens mudam
uma vez só, ao fim do lote: a família 4 vai de **12 entradas e 11 componentes**
para **4 e 3**, a 5.2 perde 8 entradas e a 5.1 ganha as mesmas 8. **Depois deste
bloco não há mais nada por ler**: as 120 entradas estão triadas, as cinco
famílias que nasceram estão fechadas, e as duas que não nasceram continuam na
tabela pelo motivo de sempre.

**O MECANISMO, e ele NÃO é o do lote das seis molduras nem o avesso dele.** Lá a
peça recebia o conteúdo inteiro e não sobrava desenho para ser dela; na trigésima
primeira a peça recebia dados e o desenho era o que ela fazia com eles. Aqui a
peça recebe dados e **desenha o que já estava no dado**: um par rótulo-e-valor
por linha, uma pergunta com dois botões, uma fila de cartões, um cartão com
ícone e legenda. Nenhuma delas põe em pixel uma relação que o dado não carrega —
que é, palavra por palavra, o eixo que a trigésima primeira escreveu para a
folha. Duas parecem pôr, e é aí que este lote vale o custo.

**1. `spec-sheet` — colapsa em `.nds-card` mais lista de definição.**

- **A favor**: é a forma estruturada mais comum do catálogo por declaração da
  própria fonte ("a resposta que um resultado de ferramenta alcança logo depois
  de uma tabela"), e o par rótulo-monoespaçado com valor alinhado ao fim não tem
  utilitária nesta casa: as duas listas de definição que existem —
  `.nds-approval-card-scope` e `.nds-message-timing-stats` — estão escopadas cada
  uma à sua peça, e a terceira ocorrência é justamente o que costuma promover
  regra a utilitária.
- **Contra**: o que ela desenha é `title`, `subtitle` e uma fila de
  `{ label, value }`. Não há unidade, não há teto, não há agrupamento, não há
  ordem que a peça imponha, e `emphasis` é a única variação de linha — um
  booleano que não descreve o item, só o realça, que é a oitava forma do sinal.
  `.nds-card-header` já abre a segunda linha com `:has(> .nds-card-description)`,
  e o corpo é um `<dl>`.
- **Colapsa**, com uma utilitária nomeada. E o que fica registrado é que a falta
  era de UTILITÁRIA e não de peça: uma regra de duas colunas num `<dl>` não é
  desenho próprio, é a terceira vez que a mesma regra se escreve.
- **A evidência que teria virado o voto**: a peça sabendo o que a linha significa
  — unidade, comparação com outra ficha, agrupamento em seções, ordenação por
  valor. Procurada nos TIPOS: `SpecRow` é `{ label: string; value: string;
  emphasis?: boolean }`, e `label` serve de chave do React, o que a fonte
  transforma em regra de uso ("mantenha os rótulos únicos") em vez de estrutura.

**2. `comparison-card` — colapsa em `.nds-grid[data-cols="2"]` de `.nds-card`.**

- **A favor**: é a única das oito que põe N objetos em CORRESPONDÊNCIA — o traço
  `i` de cada opção pareado com `traitLabels[i]` —, e correspondência posicional
  entre colunas é o que uma matriz é. Se ela desenhasse a matriz, teria eixo.
- **Contra**: ela não a desenha. `traitLabels` **nunca aparece como cabeçalho**:
  a anatomia põe, em cada linha de cada cartão, o valor da opção, e o rótulo
  comum só entra como recuo quando o traço falta. A correspondência existe no
  arranjo e não chega a quem lê — duas linhas de cartões vizinhos podem nem ter a
  mesma altura. O que sobra é N cartões numa grade, com `recommendedId`
  decidindo qual leva a palavra "escolha", e uma frase embaixo.
- **Colapsa**, e a composição fica mais fina que a fonte de duas maneiras: a
  grade do design system empilha pelo espaço do CONTAINER, sem o ponto de quebra
  de viewport que a fonte crava, e quem quiser a correspondência dita em voz alta
  tem `table` com uma coluna por opção — que é a matriz que a entrada sugere e
  não desenha.
- **A sobreposição com `spec-sheet`, medida e resolvida**, porque este lote existe
  para isso: são a mesma fila de atributos, uma vez e N vezes. `spec-sheet` é um
  objeto rotulado; `comparison-card` é N objetos com os rótulos içados para fora.
  A diferença entre as duas é o CONTAINER — `<dl>` contra grade de cartões —, e
  diferença que é só container é a definição de composição. Nenhuma das duas
  precisa da outra, e nenhuma das duas precisa de folha.
- **A evidência que teria virado o voto**: a matriz de verdade — cabeçalho de
  coluna renderizado uma vez, linhas alinhadas entre opções, primeira coluna
  pegajosa, uma rolagem horizontal única para N opções. Procurada na anatomia:
  não há `<table>`, não há linha de cabeçalho, e a fonte declara que a peça não
  tem `visibleCount` nem recorte — todo cartão e todo traço desenham sempre.

**3. `score-breakdown` — colapsa em `.nds-item-group` de `context-display`, e é a
travessia mais limpa das oito porque atravessa de FAMÍLIA.**

- **A favor**: tem denominador. `total` contra `outOf`, uma barra por critério
  contra o mesmo teto, e uma etiqueta de veredito — que é literalmente o eixo da
  família 5 ("o mesmo número em formas diferentes"), com a diferença de que aqui
  há VÁRIAS medições contra um teto só, o que nenhuma peça daquela folha faz:
  `context-breakdown` reparte um total em parcelas que somam, e estas não somam.
- **Contra**: `.nds-context-display[data-form="bar"]` é exatamente uma medição
  contra um teto, e N delas numa fila é `.nds-item-group`, não geometria nova. A
  conta já está construída e já é genérica: `spentFraction(spent, budget)` de
  `token-budget.ts` recebe um par de números e não exige `TokenUsage`. E a
  própria linha de `retrieval-chunks`, na 5.1, já havia escrito a saída antes de
  alguém ler esta entrada: "se o produto quiser a pontuação em barra, ela é
  `.nds-context-display[data-form="bar"]` com outro denominador, que é a família
  5 e não esta".
- **Colapsa.** E duas medidas fecham o assunto pelo lado de dentro da fonte:
  `weight` **não entra na largura da barra** — a fonte declara que dois critérios
  de mesma nota desenham barras idênticas por mais diferente que seja o peso, de
  modo que a única coisa que faria a repartição ser uma repartição não é
  desenhada; e a cor da etiqueta sai de um limiar sobre `total / outOf` enquanto
  a PALAVRA sai de `verdict`, dois campos independentes que podem discordar na
  mesma tela. O design system fica com a palavra, que é a regra 4 da §8.
- **Uma nota para quem construir, e ela não é adiamento**: `fractionLevel` de
  `token-budget.ts` NÃO se reaproveita, porque lá a fração alta é ruim e aqui é
  boa. Limiar com a polaridade invertida é outro cálculo, não outro valor — e
  como o veredito chega escrito, não há cálculo nenhum a fazer.
- **A sobreposição com `recommendation-card`, medida e resolvida**: a segunda que
  este lote existia para medir, e ela se dissolve em vez de se decidir. Uma MEDE
  com denominador; a outra não mede nada — a "confiança" dela é uma forma fixa de
  três alturas, por declaração da fonte, e o único dado é uma palavra. Não são
  duas vistas de uma coisa: uma é medição e a outra é pergunta, e cada uma achou
  dono num lugar diferente, `medicao.css` e `agent-run.css`.
- **A evidência que teria virado o voto**: a repartição sendo repartição — barras
  que somassem o total, ou largura que lesse o peso. Procurada, e a fonte
  responde antes da pergunta, no texto da anatomia: cada barra é escalada contra
  o `outOf` geral, "não contra o peso do critério nem contra um máximo próprio".

**4. `recommendation-card` — colapsa em `approval-card`.**

- **A favor**: é a peça que pergunta e RECOMENDA ao mesmo tempo, e a fonte lhe dá
  um segundo desenho para depois da resposta — o visto com a palavra do assentado
  —, que `approval-card` não tem por escrito.
- **Contra**: campo por campo, é o cartão de autorização. `question` é
  `.nds-approval-card-question`; o corpo é o encaixe entre a pergunta e os
  controles que `elicitation-form` já nomeou; aceitar e ver alternativas são
  `.nds-approval-card-actions`, o espaço de `HTMLElement[]` da §2. E o segundo
  desenho **não é estado**: é o `.nds-badge` que ocupa a fila de ações depois de
  decidido, exatamente a leitura que `reviewable-diff` fez na vigésima quarta.
- **Colapsa**, e o achatamento é dos mais claros da campanha: `state = idle |
  accepted` são dois desenhos onde `RunStatus` tem cinco e `ToolCallState` tem
  quatro — e o que se perde não é só `failed`: **não há `declined`**, numa peça
  que desenha um botão de alternativas. Uma recomendação recusada não tem como
  desenhar.
- **A evidência que teria virado o voto**: a confiança sendo dado. Procurada na
  anatomia, e a fonte a nega em uma frase: as três barras são "uma forma fixa,
  três alturas, sempre as mesmas, e não a leitura de um valor numérico de
  confiança; só o texto de `confidenceLabel` vem do dado".

**5. `timeline` — colapsa em `.nds-agent-plan`, e é a primeira das duas que
PARECEM posicionar.**

- **A favor**: é a primeira entrada desta família em que `.nds-stepper-separator`
   — o único conector desta casa, medido na trigésima primeira — encosta no
  assunto, e a única das oito com trilho: ponto por linha e uma linha ligando um
  ponto ao seguinte, sólida no passado e vazada no futuro. E a fonte a apresenta
  como eixo, com todas as letras: "eventos num eixo de tempo", "um eixo
  vertical".
- **Contra, e é o achado deste lote**: **a fonte chama de eixo o que os tipos
  provam não ser.** `time` é `string`; a peça "nunca ordena por `time` nem por
  `when`"; as linhas ficam igualmente espaçadas na ordem do arranjo. Nenhum valor
  decide posição nenhuma — o lugar de um evento é o índice dele. E o resto já
  está construído: `.nds-agent-plan` tem o ponto redondo tingido por estado, o
  título, a nota e `aria-current="step"`, e `when` é `PlanStepState` com duas
  palavras a menos (`past` é `done`, `now` é `running`, `future` é `pending`;
  faltam `failed` e `skipped`).
- **Colapsa**, com uma utilitária nomeada — o trilho vertical, que
  `.nds-agent-plan` não desenha e que `.nds-stepper-separator` só sabe na
  horizontal (`height: 1px` com `min-width`). E o que decide vale escrito, porque
  é a distinção contra `flow-graph`: **conector que só liga vizinhos não carrega
  informação — a ordem já a carrega.** A aresta de `flow-graph` carrega, porque
  fila não se ramifica nem se reencontra; um traço entre a linha 3 e a linha 4 de
  um `<ol>` diz o que o `<ol>` já disse.
- **E a armadilha, que fica registrada porque é convidativa**: não se monta com
  `stepper`. `.nds-stepper-trigger` é um `<button>`, e evento de linha do tempo
  não tem chamada de volta nenhuma — a composição ganharia N controles que não
  fazem nada, que é o mesmo defeito que `message-branches` recusou noutro traje
  ao não se compor com `createPagination`.
- **A evidência que teria virado o voto**: o instante virando coordenada — `time`
  numérico, linhas espaçadas pelo intervalo entre elas, dois eventos próximos
  desenhando perto. Procurada nos tipos e no texto: `time` é `string` "mostrada
  na coluna de tempo, em monoespaçado", e a ordenação é de quem monta.

**6. `file-tree` — colapsa em `.nds-item-group`, e é a segunda que PARECE
posicionar.**

- **A favor**: recuo por `depth`, que é a única das oito em que a posição de uma
  linha carrega uma relação — contenção. E o par `totalAdditions` /
  `totalDeletions` no cabeçalho é `TimelineStat` exato, o tipo que a vigésima
  segunda e a vigésima quarta deixaram sem casa.
- **Contra**: a contenção é falsa, e a fonte a desmente em uma frase — a linha de
  pasta é "um cabeçalho estático, não interativo, **nunca um pai de verdade** das
  linhas abaixo, e nunca recolhe". `depth` e `kind` são campos independentes que
  quem monta atribui a cada nó; `path` só serve de chave, e "nada da posição de
  uma linha é derivado dele". Não há `role="tree"`, não há `aria-level`, não há
  `aria-expanded`, e a biblioteca não tem ajudante de caminho para árvore — o
  `buildFileTree` do exemplo mora no arquivo de quem chama, e só emite `depth` 0
  e 1. O que resta é uma fila plana com `padding-inline-start` por linha.
- **Colapsa**, com uma utilitária nomeada (recuo por propriedade personalizada;
  `.nds-sidebar-menu-sub` recua ANINHANDO marcação, e nada em
  `docs/shared/styles/` recua uma lista plana por um número).
- **A pista do `TimelineStat`, respondida, e a resposta é não.** Ele não se muda
  para cá, e por três medidas: `file-tree` não declara o tipo — declara dois
  `number` soltos no cabeçalho, sem o `file` que o par carrega, e repete o par
  numa segunda escala por nó (`additions?`, `deletions?`); os totais são
  agregado, e a própria fonte os escreve com `reduce` fora da peça, que é o
  "agregado que é leitura rende função, não desenho" da décima sétima; e a
  entrada colapsa, de modo que não sobra peça a carregar tipo nenhum. **O tipo
  continua sem casa de TIPO e com casa de DESENHO**, que é o `.nds-cluster` de
  dois `.nds-badge` que a sexta correção lhe deu na 5.1 — e esta é a terceira
  fonte seguida a carregar a forma sem carregar o tipo. Fica assim, e agora
  definitivamente: não há mais entrada por ler que possa querê-lo.
- **A evidência que teria virado o voto**: a árvore sendo árvore — pastas que
  recolhessem, `aria-level` por linha, ou a peça derivando `depth` de `path`.
  Procurada nos três lugares, e a fonte nega os três por escrito.

**7. `artifact-card` — colapsa em `.nds-item`, e é a mais barata de ler das oito.**

- **A favor**: "o documento que o modelo está escrevendo enquanto você lê" é um
  momento de produto de verdade, e a peça tem um desenho que muda enquanto ele
  corre — a legenda dá lugar à contagem de palavras com brilho.
- **Contra**: é ícone, título, legenda e uma seta, que é `.nds-item`
  `.nds-item-outline` — a mesma fila que `background-inbox`, `checkpoint-history`
  e `document-reference` já montam. E os dois defeitos que ela traz o design
  system já resolve por regra: a seta só existe no `:hover`, onde a regra 3 da §8
  pede `:focus-within` e ordem de foco, e o cartão "carrega estilo de pairar e de
  pressionar como se fosse um botão, mas não declara manipulador nenhum" —
  palavras da fonte —, onde `.nds-item` como `<button>` com nome textual é a
  saída (regra 7 da §8).
- **Colapsa**, e `generating: boolean` entra na tabela do sinal como o caso mais
  literal dela: a faixa de runtime da PRÓPRIA fonte declara quatro palavras
  (`running`, `requires-action`, `incomplete`, `complete`) e mapeia três delas
  para `false`, escrevendo "qualquer outra coisa vira `false`". O sinal fala
  pelas duas bocas na mesma página, como já falara uma vez.
- **A evidência que teria virado o voto**: o cartão sabendo o que há dentro do
  artefato — prévia, contagem por espécie, versão comparável. Procurada nos
  tipos: `title`, `meta`, `generating`, `words`, e "todas as outras props de
  `div` são repassadas à raiz".

**8. `canvas-split` — colapsa em `resizable` mais `chat-thread` mais `.nds-card`.**

- **A favor**: é a única entrada das 120 que desenha a CONVERSA e o ARTEFATO na
  mesma tela, e o par tem geometria: uma calha estreita de mensagens ao lado de
  um documento largo, que empilha quando não cabe.
- **Contra, e a hipótese que este lote existia para medir cai pelo lado
  inesperado**: `canvas-split` **não é `resizable` com outro nome — é MENOS que
  ele**. Não há punho, não há tamanho de painel, não há chamada de volta de
  redimensionamento: a fonte declara uma consulta de mídia e nada mais ("abaixo
  de `md` empilham, em `md` e acima viram linha"). O painel redimensionável
  construído tem punho com `role="separator"` e `tabindex="0"`, tamanho por
  `--panel-size` e, desde o conserto de contraste, uma linha em `--ring` que
  passa dos 3:1 da WCAG 1.4.11 — e `.nds-grid[data-cols="2"]`, para quem não
  quiser punho, já empilha pelo espaço do CONTAINER, sem ponto de quebra de
  viewport. A composição fica mais fina que a fonte nos dois caminhos.
- **Colapsa.** E `speaker: "user" | "assistant"` é o achatamento de `ChatRole`
  pela TERCEIRA vez, depois de `SharedTurn` e `VoiceTurn`, com a mesma perda e no
  mesmo campo — o que faz dele o achatamento mais repetido do catálogo inteiro.
- **A evidência que teria virado o voto**: a divisão sendo da peça — tamanho
  guardado, punho, mínimo por painel, ou o documento e a conversa rolando
  acoplados. Procurada na tabela de partes: `CanvasSplit`, `CanvasSplitThread` e
  `CanvasSplitDocument` recebem `className` e mais nada.

**ONDE A PERGUNTA "POSICIONA OU EMPILHA" FALHOU, e é o que este lote acrescenta
ao instrumento.** Ela previu SOBREVIVÊNCIA para duas das oito, e errou nas duas:
`file-tree` posiciona por `depth` e `timeline` desenha um trilho, e as duas
colapsaram. Nas outras seis ela acertou ao dizer "empilha", mas dizer "empilha"
é dizer o resultado, não a razão. O conserto é de VERBO, e mantém a leitura da
trigésima primeira inteira:

> **A peça CALCULA a posição a partir do dado, ou recebe a posição pronta?**

Nas três sobreviventes quem calcula é a peça: o traço da aresta sai de dois `id`
de nó, a barra sai de `startMs / totalMs`, a célula sai de uma data mapeada numa
grade de semanas. Nas duas que enganaram, a posição chega pronta — `depth` é um
inteiro que quem monta atribui, e o lugar de um evento é o índice dele no
arranjo. E isto **não contradiz** a trigésima primeira, que já havia escrito, de
`flow-graph`, que "o que decide não é a posição, é a ARESTA": as coordenadas de
`flow-graph` também chegam prontas, e não foram elas que decidiram. O que este
lote faz é generalizar aquela frase de uma entrada para a família.

Vale dizer também **onde ela ficou calada**: em `score-breakdown` e em
`recommendation-card` a pergunta não tinha o que responder — nenhuma das duas
posiciona nem empilha, uma mede e a outra pergunta —, e quem decidiu foi o dono
do assunto noutra família. Terceira vez na campanha que um instrumento fica mudo
e a regra vale igual: **instrumento calado não é instrumento a favor.**

**E o SINAL, que neste lote se comportou ao contrário do anterior.** Na trigésima
primeira ele falou duas vezes e errou as duas — foi a primeira vez que errou.
Aqui falou quatro vezes e acertou as quatro: `timeline`, `recommendation-card`,
`artifact-card` e `canvas-split` estão na tabela abaixo. Ficou MUDO em três —
`comparison-card`, `score-breakdown` e `file-tree` não declaram estado nenhum —, e
em `spec-sheet` apareceu na oitava forma, o booleano que só enfeita. Lido junto
com o lote anterior, o registro fecha uma leitura: **o sinal erra onde a peça
sobrevive por desenho, e acerta onde ela colapsa** — o que não o torna circular,
porque em nenhum dos dois casos ele decidiu sozinho.

**O QUE A FOLHA GANHA DESTE LOTE: nada, e isso é resultado.**
`resposta-estruturada.css` continua com as três regras que a trigésima primeira
mediu e com as seis linhas que ela escreveu para quem a funda. Nenhuma das oito
acrescenta regra, porque nenhuma delas põe em pixel uma relação — e a folha nasce
com o eixo que já tinha, agora sem risco de que uma entrada por ler o alargue.
**Três utilitárias ficam nomeadas na 5.1, e nenhuma é da folha**: a lista de
definição genérica (`spec-sheet`), o trilho vertical do plano (`timeline`) e o
recuo por linha a partir de propriedade personalizada (`file-tree`).

**E a §6 não muda, medido e não previsto**, porque ela já errou duas vezes nesta
mesma família: procurado o nome de biblioteca nas oito páginas, **nenhuma cita
uma**. Nem pacote de terceiro, nem primitivo importado, nem renderizador — as
oito desenham com marcação e folha de estilo próprias. Nenhuma decisão de
dependência vai para a dona neste lote, e com ele a seção fica fechada: as cinco
entradas que já tinham sido medidas continuam sendo as únicas do catálogo em que
o assunto aparece.

Contagens, somadas família a família e lidas das TABELAS, não dos cabeçalhos: 1
tem 11, 2 tem 13, 3 tem 1, 4 tem 4, 5 tem 5, 6 tem 0 e 7 tem 0 — **34** na 5.2. A
5.1 vai a **86** (84 linhas contadas no arquivo, e duas delas carregam duas
entradas). Somam 120. Os componentes a construir somam **27**, em **cinco**
folhas — `composer.css`, `agent-run.css`, `evidencia.css`, `medicao.css` e
`resposta-estruturada.css`, a única que ainda não nasceu. **Os dois cabeçalhos
foram mexidos nesta correção**, e foi a primeira vez que isso pôde ser feito com
segurança: é a última triagem, e nenhuma outra porta os disputa.

**Reversível**, como as outras trinta e uma, e aqui em duas alturas. Por entrada:
`spec-sheet` desdobra se a ficha ganhar unidade, seção ou comparação entre
fichas; `comparison-card` desdobra se a matriz for desenhada como matriz —
cabeçalho içado, linhas alinhadas, rolagem única; `score-breakdown` desdobra se
as parcelas passarem a somar ou a largura passar a ler o peso, e nesse dia ela
vai para a família 5 e não para esta; `recommendation-card` desdobra se o
assentado deixar de ser palavra; `timeline` desdobra se o instante virar
coordenada; `file-tree` desdobra se a pasta virar pai de verdade — recolher,
`aria-level`, profundidade derivada do caminho; `artifact-card` não tem gatilho
plausível; `canvas-split` desdobra se a divisão passar a ser da peça. Pela
família: a 4 fica de pé com as três da trigésima primeira, e só deixa de existir
se as três desdobrarem.

**O que esta leitura NÃO decide, e é a primeira vez que a resposta é "nada"**: não
resta entrada por triar em nenhuma das sete famílias. O que sobra é construir — e
a próxima decisão desta guideline não é de triagem, é a primeira peça de
`resposta-estruturada.css`, com as duas perguntas que a trigésima primeira deixou
explicitamente para o dia da construção: se o intervalo (`startMs`/`durationMs`
contra um total) entra em `chat-protocol.ts`, e se a classificação de contagem em
nível vira primitivo.

**E o registro de método, que vale uma oitava vez, e desta vez é sobre uma pista
recebida pronta.** O briefing trazia duas pistas medidas por quem triou antes —
`file-tree` como casa de `TimelineStat`, e `timeline` encostando no
`.nds-stepper-separator` —, e as duas estavam CERTAS no que afirmavam e ERRADAS
no que sugeriam: `file-tree` de fato declara o par exato, e `timeline` de fato é
a primeira a encostar no conector; nenhuma das duas coisas fez a entrada
sobreviver. **Pista é onde olhar, nunca o que concluir** — e a disciplina que
sobrou é a mesma da sexta correção, que recusou decidir uma peça de dentro da
triagem de outra: quem herda uma pista herda a obrigação de medi-la, não a de
confirmá-la.


### O sinal mais barato de que uma entrada vai colapsar

O critério é um só, e é a parte que dura: **booleano onde este vocabulário já tem
cinco palavras.** Ele aparece de duas maneiras.

A primeira é o **achatamento**: a fonte declara menos palavras do que esta
família já tem, e o que se perde some do desenho. **Quem conta os achatamentos é
a tabela abaixo** — uma linha por entrada, com o que a fonte declara e o que ela
perde. Quem precisar do número conta as linhas dela, na hora em que precisar.

A segunda é o **avesso**: o booleano não achata vocabulário nenhum, porque não há
palavra desta conversa para o que ele descreve — e o que ele descreve já está
construído, com esse nome, noutra peça. Vão NOMEADAS, porque lista curta se
confere sozinha e número não: `mobile-composer`, `read-aloud` e
`mermaid-diagram`, que disparam só pelo avesso e são as três que fecham a
sub-regra; e `schedule-card`, `orb` e `voice-conversation`, que declaram as duas
formas de uma vez e por isso também estão na tabela.

Ao critério o registro acrescentou FORMAS, e elas valem tanto quanto ele: o
achatamento pode vir sem campo nenhum, como comparação com um contador (quarta
forma); pode vir em dois desenhos que se separam só por cor e opacidade, que a
regra 4 da §8 recusa (quinta); pode estreitar o tipo até a largura em que
estreitar vira identidade com o dono (sexta); pode estar no DESENHO da própria
fonte, e não no tipo (sétima); e o booleano pode não descrever o item — ORDENAR a
lista, particioná-la ou só enfeitá-la, que é entrada de quem monta (oitava). E o
sinal também fica MUDO: quando fica, quem decide é a assinatura que sobra no
lugar do estado.

*(Esta abertura trazia, até esta rodada, o total das aparições — "dezessete
vezes: catorze como achatamento e quatro pelo avesso". Ele saiu, e o motivo é
medido: quatro portas triaram em paralelo e cada uma incrementou o total por
conta própria, de modo que a tabela chegou a VINTE linhas com o texto ainda
dizendo catorze, e a prosa abaixo passou a reivindicar aparições que já não
fechavam entre si. **Número móvel repetido fora da sua fonte é dívida com
juros** — é o mesmo defeito dos cabeçalhos da 5.1 e da 5.2 e das somas de
família, e a resposta é a mesma: a fonte do achatamento é a tabela, a do avesso é
a lista nomeada acima, e nenhuma das duas precisa de um total escrito por cima.)*

| entrada | o que a fonte declara | o que ela perde |
|---|---|---|
| `agent-card` | `connected: boolean` | `reconnecting` |
| `tool-timeline` | `streaming: boolean` | `stopped`, `failed`, `complete` |
| `code-runner` | `RunState = idle\|running\|ok\|error` | `stopped` |
| `subagent-list` | `i < completedCount` — nem campo é | `idle`, `stopped`, `failed` |
| `agent-handoff` | `settled: boolean` — e os dois desenhos diferem só em cor e opacidade | `idle`, `stopped`, `failed` |
| `background-inbox` | `state = running\|ready\|failed` — e `ready` é `complete` renomeada | `idle`, `stopped` |
| `retrieval-chunks` | `searching: boolean` — e a faixa de runtime da própria fonte declara quatro palavras | `idle`, `stopped`, `failed` |
| `elicitation-form` | `state = request\|accepted\|declined` — e só `request` é do vocabulário | `running`, `failed` |
| `schedule-card` | `ok: boolean` por execução passada — e `enabled: boolean` ao lado, que é o do `switch` | `idle`, `running`, `stopped` |
| `reviewable-diff` | `HunkDecision = pending\|kept\|discarded` — e só `pending` é do vocabulário | `running`, `failed` |
| `thread-list` | `isRunning: boolean`, e só na faixa de RUNTIME — a standalone não tem estado nenhum | `idle`, `stopped`, `failed`, `complete` |
| `shared-conversation` | `role: "user"\|"assistant"` — a primeira união achatada que não é de estados | `system` |
| `orb` | `state = idle\|connecting\|listening\|speaking\|muted` — o produto de três eixos que a faixa de runtime separa, com `muted` junto, que é o do alternador | `reconnecting`, e o motivo de um fim (`finished\|cancelled\|error`) |
| `voice-conversation` | `role: "user"\|"assistant"` em `VoiceTurn`, com `muted: boolean` ao lado, que é o do alternador | `system` |
| `web-search` | `searching: boolean` — e a faixa de runtime da própria fonte declara quatro palavras, exatamente como em `retrieval-chunks` | `idle`, `stopped`, `failed` |
| `research-report` | `state = pending\|writing\|done` — e `writing` é `running` renomeada, como `ready` era `complete` | `failed`, `skipped` — e `skipped` é o que justifica `PlanStepState` existir |
| `speaker-identity` | `kind = user\|agent\|subagent\|tool` — a segunda união achatada que não é de estados, e a única que mistura papel de quem fala com espécie de parte | `system` — a MESMA perda, no mesmo campo, de `shared-conversation` |
| `mcp-server-panel` | quatro palavras de estado onde a faixa de runtime da própria fonte declara seis — e ela publica o `switch` que dobra as duas que sobram | a espera por uma PESSOA separada da espera por uma nova tentativa, e o erro separado do desligado |
| `web-preview` | `loading: boolean` | `idle`, `stopped`, `failed` — e `failed` é o pior: a prévia que quebrou desenha igual à que ainda está chegando, para sempre |
| `image-generation` | `generating: boolean` | `idle`, `stopped`, `failed` |
| `timeline` | `when = past\|now\|future` — e `past` é `done`, `now` é `running`, `future` é `pending`, os três renomeados de uma vez | `failed`, `skipped` — a MESMA perda, no mesmo tipo, de `research-report` |
| `recommendation-card` | `state = idle\|accepted` | `running`, `failed` — e `declined`, numa peça que desenha o botão de alternativas: uma recomendação recusada não tem como desenhar |
| `artifact-card` | `generating: boolean` — e a faixa de runtime da PRÓPRIA fonte declara quatro palavras e manda mapear três delas para `false`, escrevendo "qualquer outra coisa vira `false`" | `idle`, `stopped`, `failed` |
| `canvas-split` | `speaker: "user"\|"assistant"`, com `saved: boolean` e `writing: boolean` ao lado | `system` — a TERCEIRA vez que `ChatRole` achata no mesmo campo, depois de `shared-conversation` e `voice-conversation`, o que faz dele o achatamento mais repetido do catálogo |

Em todas elas o achatamento não é economia — é sinal de que a entrada foi
desenhada para uma tela só, sem o vocabulário que a família já tem. E todas
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

**Oitava aparição, e a sétima que é achatamento, medida na décima oitava
correção**: `retrieval-chunks` declara `searching: boolean` — dois desenhos onde
`RunStatus` tem cinco palavras —, e o que a torna a mais barata de ler das oito é
que a PRÓPRIA FONTE tem quatro do outro lado: a faixa de runtime dela declara
`running | complete | incomplete | requires-action`, e a forma standalone achata
as quatro em duas. **Quando a fonte se contradiz entre as duas faixas, quem
perdeu foi a standalone** — e olhar as duas custa uma linha de leitura, porque
elas estão na mesma página. O que se perde aqui são `idle`, `stopped` e `failed`,
e o último é o pior: na tela, a recuperação que quebrou desenha a mesma contagem
de zero com que uma recuperação bem-sucedida e vazia se anuncia.

**Nona aparição, e a segunda pelo avesso, medida na décima nona correção**:
`read-aloud` declara `playing: boolean`, e a peça que é a BASE dela — o
`media-player`, que a 5.2 já nomeava — declara o mesmo booleano com o mesmo nome,
em `PlayerState`. É a leitura da décima quinta repetida, e a repetição ESTENDE a
sub-regra num ponto: lá o dono era o `composer`, peça desta campanha; aqui é um
componente que o design system já tinha antes dela. **A identidade se mede contra
quem desenha a superfície, seja ela nova ou velha** — e a pergunta "quem já
declara este booleano?" não se limita às seis famílias.

E a sexta forma — tipo mais estreito — apareceu na mesma leitura, também contra a
base: `onRateChange?: () => void` não devolve a velocidade escolhida, onde a base
tem um `<select>` sobre `rates: number[]` que carrega o valor. Vale o mesmo
alargamento: **o estreitamento se mede contra o que já está construído, e não só
contra `chat-protocol.ts`.**

**Décima aparição, e a oitava que é achatamento, medida na vigésima
correção**: `elicitation-form` declara três palavras, e só a primeira é do
vocabulário — `request` é `ToolCallState` `pending`. As outras duas não são
estados da peça: são o que acontece depois de respondê-la, que é a §7. Perde
`running` e `failed`, e `failed` é o caso em que a fonte se contradiz sozinha —
a faixa de runtime dela devolve erro de validação em vez de enviar, e a forma
standalone não tem desenho nenhum para a recusa. **Estado que a própria fonte
produz e não desenha é estado que ela não tem**, e é a terceira vez seguida,
depois do agregado da décima sétima e das quatro palavras que a décima oitava
achou na faixa de runtime, que o defeito se mede DENTRO da fonte e não só contra
o vocabulário.

E nela o estreitamento vem junto, na sexta forma que a décima sexta acrescentou,
e desta vez sobre uma união que não é de estados: `kind: "text" | "choice" |
"toggle"` são três espécies de campo onde o design system tem uma dúzia de
primitivos de formulário. Ao contar os valores que o tipo deixa de expressar,
conte também os que ele deixa de MONTAR — uma resposta longa, um número, uma
data, uma escolha múltipla. E quando a união enumera espécies de CONTROLE em vez
de estados, o que ela descreve não é vocabulário: é um gerador de formulário, que
a §2 já mantém do lado de fora.

**Sétima forma do sinal, medida na vigésima primeira correção, e a primeira em
que o achatamento não está no TIPO**: `confidence-marker` declara três níveis —
`grounded`, `inferred`, `uncertain` — e desenha DOIS, "solid for grounded and
inferred, dotted for uncertain", deixando o terceiro por conta da cor. Nas oito
da tabela a fonte achatava um vocabulário que esta casa tem; aqui o vocabulário é
NOVO, não há nada a perder deste lado, e quem o achata é o desenho da própria
fonte. O efeito é o mesmo, e a leitura que o pega é a que a décima primeira já
escreveu: **conte quantos desenhos DISTINTOS a peça sabe fazer, não quantas
palavras ela declara** — só que ali a contagem se fazia contra `RunStatus`, e
aqui se faz contra a própria união declarada, duas linhas acima na mesma página.
Não entra na contagem da abertura desta seção, e é preciso dizer por quê: aquelas
são entradas que perdem palavras DESTE vocabulário, e esta não perde nenhuma —
perde as suas. **União declarada maior que o número de desenhos não é vocabulário
grande; é vocabulário que a fonte não usa** — e, quando o que fecha a diferença é
a cor, a regra 4 da §8 apaga o resto (WCAG 1.4.1), que foi a leitura da décima
segunda em `agent-handoff`.

**Sétimo sinal mudo, medido na vigésima segunda correção**, e o primeiro em que
a assinatura que sobra no lugar do estado não aponta um componente, e sim uma
GUIDELINE: `code-diff` não declara união de estados nenhuma — `DiffLine.kind`
classifica a LINHA, não a peça —, e o que sobra é `cycle: number`, um contador
cuja função declarada é reiniciar a animação de entrada sem desmontar o
componente. Colapsou. Pela sub-regra da décima, quando o sinal fica mudo olha-se
a assinatura que ficou no lugar: `onSelect`, `onPick` e `onJump` nomeavam um
componente que já existia, e as três entradas colapsaram; `activeIndex` sobre um
par de coordenadas era eixo sem dono, e aquela sobreviveu; `onOpenIndexChange`
era o par de abertura que a família inteira tem, e ficou calado. `cycle` não é
nenhum dos três — não é eixo do conteúdo e não é chamada de volta. É a chave de
uma animação, e a 5.1 já deu dono a esse assunto três vezes, sempre o mesmo:
`13-animacao.md`. **Dono pode não ser peça** — e quando a única assinatura que
sobra pertence a uma regra transversal em vez de a um componente, a sub-regra
fala do mesmo jeito.

E uma leitura pelo avesso que esta correção obriga a escrever, porque ela é a
primeira do lado LARGO: o instrumento inteiro desta seção mede o que a entrada
PERDE — palavras da união, valores do campo, agora capacidades da peça
construída. `code-diff` traz uma coisa a mais do que a base tem: três espécies de
linha onde `.nds-code-block-line` conhece um booleano. **Ganhar um valor num
atributo não é o inverso do sinal, é uma opção.** O que inverteria o sinal seria
a entrada trazer um EIXO que a base não tem — foi o que `activeIndex` sobre um
ponto fez na nona correção —, e uma etiqueta a mais na mesma coluna não é eixo.
Ao contar o que a entrada perde, conte também o que ela acrescenta, e pergunte se
o acréscimo é um valor ou uma dimensão.


**Décima primeira aparição, e a primeira em que o sinal fala pelas DUAS bocas na
mesma entrada, medida na vigésima terceira correção**: `schedule-card` declara
dois booleanos, e eles não são do mesmo defeito. `ok: boolean` é achatamento —
dois desenhos onde `RunStatus` tem cinco palavras, e o que se perde é `stopped`,
`running` e `idle`, num assunto em que a execução que alguém interrompeu e a que
quebrou são justamente o que se vai ler. `enabled: boolean` é o avesso da décima
quinta e da décima nona: não achata nada, porque não há palavra de conversa para
"pausado" e não deve haver — mas é o booleano que o `switch` já declara, com a
chamada de volta que não o muda sozinha e o `role="switch"` com `aria-checked`
junto, que é a árvore inteira do primitivo. **Quando as duas formas aparecem na
mesma entrada, elas não se somam: dividem o campo** — um booleano fica aquém do
vocabulário, o outro é de outra peça, e não sobra nenhum que seja da entrada. Ao
ler os tipos, não pare no primeiro booleano: conte de quem é cada um.

**Décima segunda aparição, e a nona que é achatamento, medida na vigésima quarta
correção**: `reviewable-diff` declara `pending | kept | discarded`, e é a
repetição exata da décima — uma palavra do vocabulário e duas do produto, com
`running` e `failed` de fora. O que ela acrescenta ao instrumento é o lugar onde
a diferença podia estar e não estava. Na décima o assentado SUBSTITUÍA a peça: o
rodapé inteiro era trocado por uma frase e a pergunta acabava ali. Aqui não —
aqui as decisões convivem na mesma tela, a peça continua de pé com umas
respondidas e outras não, e o assentado é lido por ela. Parecia bastante para o
achatamento não valer, e não é: **o que a peça faz com o assentado é uma CONTA**,
e a própria fonte declara que ela é derivada e nunca guardada. Ao ler uma união
em que só a primeira palavra é do vocabulário, pergunte o que a peça faz com as
outras — se troca desenho por elas, é a §7; se soma, é função; peça não é nenhuma
das duas.

**Oitavo sinal mudo, medido na vigésima quinta correção**, e é o mais mudo de
todos: `message-branches` não declara booleano, união nem tipo — declara um
arranjo de cadeias, um número e uma chamada de volta. Pela sub-regra da décima,
a assinatura que sobrou no lugar do estado é `onIndexChange`, a quarta de escolha
depois de `onSelect`, `onPick` e `onJump`, e a que aponta o dono mais exato das
quatro: `PaginationOptions` declara `total`, `current` e `onPageChange` com o
mesmo sentido, e `pagination` é a base que a 5.2 já dava à família da entrada.
Colapsou. O que ela acrescenta ao instrumento é o par que faltava para fechar a
leitura da nona: **índice sobre arranjo plano não é eixo, é a coordenada que a
fila já tinha.** Em `computer-use` o `activeIndex` também indexava uma lista e
não decidiu nada — quem decidiu foi o PONTO ao lado dele, `x` e `y`, que era eixo
sem dono. Ao ver um índice, pergunte sobre o que ele anda: se sobre uma fila, o
dono existe; se sobre uma dimensão que este vocabulário não tem, é a nona.

E a sexta forma — tipo mais estreito — apareceu na mesma leitura, na largura
máxima já medida: `variants: readonly string[]` diz que uma resposta irmã é uma
cadeia, onde `ChatMessageOptions` tem nove campos e `MessagePartKind` enumera
sete espécies de parte. As anteriores estreitavam uma união dentro de um objeto;
esta estreita o objeto inteiro, e o efeito chega ao desenho: obriga a peça a pôr
fala de modelo num `<p>` cru, onde esta casa passa tudo por `createMarkdown` com
`isSafeUrl`. É a repetição de `words: readonly string[]` na décima nona, e vale a
mesma frase — **o parágrafo não é da peça.**


**Décima terceira e décima quarta aparições, as duas de achatamento, medidas em
LOTE na vigésima sexta correção.** `shared-conversation` é a primeira em que a
união achatada NÃO é de estados: `role` em duas palavras onde `ChatRole` tem
três, e o que se perde é `system`. Vale o alargamento — **o achatamento se conta
contra qualquer união deste vocabulário, e não só contra `RunStatus` e
`ToolCallState`.** E `thread-list` é a primeira em que a palavra que falta não
está achatada na faixa que se lê: está achatada na OUTRA. `isRunning: boolean` é
da faixa de runtime, e a standalone não tem estado nenhum — a linha da conversa
que está respondendo agora desenha igual à que está parada há um mês. É a
décima oitava levada ao limite: quando a fonte se contradiz entre as faixas quem
perde é a standalone, e aqui ela nem chegou a perder, porque nunca teve.

**E uma forma nova, a oitava, medida na mesma correção**: `thread-search` declara
`pinned: boolean`, e ele não é estado nem é do dono — é uma PARTIÇÃO do arranjo.
A própria fonte diz que a linha marcada "renderiza no bloco fixado em vez do seu
grupo": o booleano não descreve a linha, escolhe em qual grupo ela cai, e quem o
escreve é quem passa o arranjo. Ao ler um booleano, pergunte se ele descreve o
item ou se ele ORDENA a lista — o segundo é entrada de quem monta, e some no dia
em que a lista chega já partida.

**Nono, décimo e décimo primeiro sinais mudos, medidos em lote na vigésima
sexta**: `conversation-search`, `onboarding` e `thread-list-sidebar` não declaram
booleano, união nem tipo de estado, e colapsaram os três. Pela sub-regra da
décima, o que sobra no lugar do estado aponta o dono em dois deles —
`onStep(delta)` e o par `onNext`/`onSkip` são sinais de controle sem conta
nenhuma por trás, e a própria fonte declara que uma "não faz conta de índice" e
a outra "não avança sozinha". No terceiro não sobra nada, porque
`thread-list-sidebar` não tem faixa standalone para ter assinatura. **Entrada que
não tem a faixa que a §1 manda ler não precisa de sub-regra: ela já respondeu.**

E a sexta forma — tipo mais estreito — apareceu na mesma correção na largura
máxima possível: `RegenerateOption` não estreita um campo nem uma união,
estreita a API INTEIRA de uma peça construída, e nessa largura deixa de ser
estreitamento e vira identidade. **Quando o tipo estreitado é o do dono, pare de
contar o que se perde e repare em quem já declara aquilo** — é a leitura da
décima quinta e da décima nona, e o teto dela.

**A aparição pelo avesso do lote das seis molduras**: `mermaid-diagram` declara
`streaming: boolean`, e o dono já o declara com o MESMO nome — a 5.1 escreve
`streaming-text` como "`chat-thread`, `streaming: true` + `aria-busy`" desde a
primeira redação. É a leitura da décima quinta e da décima nona pela terceira
vez, e agora com três donos diferentes: o `composer`, peça desta campanha; o
`media-player`, componente que o design system já tinha; e o `chat-thread`, que é
a primeira peça da própria família. **A pergunta "quem já declara este booleano?"
varre a casa inteira, e ela mesma.**

**Décimo segundo sinal mudo, medido na vigésima sétima**, e ele acrescenta o
degrau que faltava à sub-regra da décima: `map-answer` não declara booleano de
estado nem união nenhuma, e a assinatura que sobra no lugar é `onSelect` — a
quinta chamada de volta de escolha da campanha, depois de `onSelect`, `onPick`,
`onJump`, `onIndexChange` e `onActiveIndexChange`. **É a primeira que não aponta
dono nenhum**, porque nada nesta casa escolhe um ponto sobre uma superfície. Pela
décima terceira, assinatura que não aponta dono deixa a sub-regra calada, e
decidem os três testes sozinhos — e decidiram pela identidade de `MapPin` com
`ComputerStep`, campo por campo, que é a sexta forma na largura que a vigésima
sexta chamou de identidade. Escrito para quem vier: **sub-regra calada não é
sub-regra a favor.** Quatro das cinco chamadas de escolha nomearam dono e as
quatro entradas colapsaram; esta não nomeou, e colapsou igual.

E `route: boolean`, na mesma entrada, é a oitava forma que `thread-search`
inaugurou, num grau a menos: ele não descreve o item nem parte a lista — DECORA
a lista, ligando os pontos na ordem em que chegaram. A própria fonte o chama de
"conectividade decorativa, não caminho calculado". Ao ler um booleano, a pergunta
da oitava forma ganha um terceiro ramo: ele descreve o item, ORDENA a lista, ou
só a enfeita? Os dois últimos são de quem monta.

**As duas aparições da correção que dissolveu a família 7, medidas em lote, e as
duas falam pelas DUAS bocas.** `orb` declara cinco palavras em
`state`, e elas são o produto ACHATADO de três eixos que a faixa de runtime da
MESMA página mantém separados: `status.type` — com o encerrado carregando ainda
`finished | cancelled | error` —, `isMuted` e `mode`. Perde `reconnecting`, que
`ConnectionState` tem e cujo bloco já escreveu por que a primeira tentativa
desenha como a quinta; e perde o MOTIVO de um fim, de modo que a chamada que caiu
por erro desenha igual à que a pessoa encerrou — a mesma perda que a décima oitava
mediu em `retrieval-chunks` e a vigésima em `elicitation-form`. É mais uma vez em que
a fonte se contradiz entre as faixas, e quem perde continua sendo a standalone. O
avesso vem na mesma união: `muted` não é estado da sessão, é o `aria-pressed` de
um alternador que está CONSTRUÍDO, com esse atributo e essa decisão, no
`composer-voice`. **União que mistura um controle com dois eixos de estado não é
vocabulário: é a tela de um componente escrita como enum.** E
`voice-conversation` repete `SharedTurn` — `role` em duas palavras onde `ChatRole`
tem três, perdendo `system`, que é a segunda vez que o achatamento não é de
estados — com o mesmo `muted: boolean` ao lado. Mais duas entradas com as duas
bocas, depois de `schedule-card`, e o campo se reparte igual: um fica aquém
do vocabulário, o outro é de outra peça, e não sobra nenhum que seja da entrada.

E uma EXTENSÃO do avesso, que estas duas obrigam a escrever: `volume` e
`amplitude` não são estado nenhum e ainda assim disparam o sinal, porque o que já
está construído não é um booleano — é a MECÂNICA inteira. `--nds-voice-level`
entra por propriedade personalizada porque é dado de runtime e não valor de
desenho; é `aria-hidden` porque o que muda a cada quadro não se anuncia; e tem
quadro de repouso declarado sob `prefers-reduced-motion`, para não parecer
desligado justamente para quem pediu menos movimento. Três decisões, escritas numa
peça de pé, e a entrada nova não muda nenhuma. **A identidade se mede também
contra a mecânica, e não só contra o campo** — a décima quinta mediu o nome, a
décima nona mediu o dono, e esta mede a decisão.

**O sinal MUDO da correção de `checkpoint-history`**, e o primeiro em que o dono
que sobra não é componente nem guideline transversal: a entrada não declara
booleano, união nem tipo de estado — três cadeias e um número —, e os
três desenhos saem da POSIÇÃO da linha contra `currentId`, que é a quarta forma, da
décima primeira, com três desenhos em vez de dois. Pela sub-regra da décima, a
assinatura que sobra é `onRestore(id)`, e ela nomeia dono como as cinco chamadas de
escolha anteriores; só que o dono é a **§2 desta guideline**, que já classificou
ação como ESPAÇO e fixou o contrato no `approval-card`. Depois de `13-animacao.md`
na vigésima segunda, é o terceiro lugar em que um dono mora, e o mais perto de
casa. Não entra na tabela da abertura desta seção, e é preciso dizer por quê:
aquelas são entradas que PERDEM palavras deste vocabulário, e esta não declara
nenhuma para perder.

**AS DUAS PRIMEIRAS VEZES EM QUE O SINAL PREVIU E ERROU**, medidas no segundo
lote da família 4 (o das três sobreviventes). `flow-graph` declara `done |
active | pending` — três desenhos onde `ToolCallState` tem quatro e
`PlanStepState` tem cinco, com `active` sendo `running` renomeada e `failed` de
fora. `trace-waterfall` declara `running | completed | failed` — três onde
`ToolCallState` tem quatro, com `completed` sendo `done` renomeada e `pending` de
fora. Pela tabela acima, as duas deveriam colapsar. **As duas sobreviveram**,
porque o desenho e o vocabulário decidiram contra: nada nesta casa liga dois
retângulos, e nada posiciona uma barra por deslocamento fora de
`.nds-computer-use-mark`.

Isso não enfraquece o instrumento — CONFIRMA o que a abertura dele já dizia, e
que uma sequência de acertos sem falha nenhuma — a tabela daquela seção inteira,
que é quem os conta — tinha feito parecer forte demais: **ele prevê, não
decide.** A leitura prática, para quem vier: quando o achatamento aparecer numa
entrada que também POSICIONA alguma coisa, o achatamento é o que a peça
construída conserta (leva o vocabulário inteiro, como a família 2 fez sete
vezes), não o que a reprova. Em cada linha daquela tabela, o que sobrava
depois de tirar as palavras perdidas era empilhamento; aqui sobra geometria.

**E O LOTE QUE FECHOU O CATÁLOGO, em que ele se comportou ao contrário**, medido
no terceiro lote da família 4 (o das oito últimas entradas). Falou quatro vezes e
acertou as quatro — `timeline`, `recommendation-card`, `artifact-card` e
`canvas-split` estão na tabela acima, e `artifact-card` é o caso mais literal
dela, com a faixa de runtime da própria página declarando quatro palavras e
mandando mapear três para `false`. Ficou MUDO em três: `comparison-card`,
`score-breakdown` e `file-tree` não declaram booleano, união nem estado, e
nenhuma delas deixa assinatura a que apontar — pela sub-regra da décima,
decidiram os três testes sozinhos. E em `spec-sheet` apareceu na **oitava forma,
terceiro ramo**: `emphasis` não descreve o item nem parte a lista — enfeita uma
linha, como `route` enfeitava a de `map-answer`.

Lido junto com o lote anterior, o registro fecha uma leitura sobre o próprio
instrumento: **ele erra onde a peça sobrevive por desenho e acerta onde ela
colapsa.** Não é circular, porque em nenhum dos dois lotes ele decidiu sozinho —
é só a consequência de medir vocabulário numa família cuja identidade é
geometria. Onde a entrada não tem geometria, o achatamento é o que sobra para
ver; onde tem, ele é o que a peça construída conserta.

**Como usar**: ao ler a fonte, olhe os tipos ANTES da anatomia. Um booleano de
estado, uma união com uma palavra a menos que `RunStatus`/`ToolCallState`, ou um
contador posicional que parta a lista em dois desenhos, mandam aplicar os três
testes com atenção — não decidem sozinhos, mas preveem.

O critério, que a partir da trigésima segunda correção não serve mais para triar
— não resta entrada — e passa a servir só para a construção: **uma entrada do
catálogo vira slug quando tem desenho, estado ou vocabulário próprios.** Se a
diferença cabe num argumento do que já existe, ela é variante — vira story e
linha na tabela, não peça. Ao decidir isso durante a construção, corrija a tabela
de 5.2 no mesmo passo; não anote para depois.

E o contrário também vale: peça que na leitura parecia uma e ao construir
mostrou ser duas se DESDOBRA aqui, com o motivo.

Ordem entre famílias — a que evita retrabalho:
**3.1 fundação → 1 composer → 2 execução → 5 medição → 3 evidência → 4 resposta
estruturada.**
O composer primeiro porque fecha o ciclo com o `chat-thread` que já existe (dá
para usar o produto ao fim da família 1); execução e medição em seguida porque
são as que mais reaproveitam `chat-protocol.ts` e endurecem o vocabulário
enquanto ele é barato de mudar; resposta estruturada por último entre as grandes
porque é a que traz dependência externa, e dependência decidida cedo demais é
decidida sem informação.

---

## 6. Dependências novas — decidir antes, não durante

Quatro entradas do catálogo pareciam pedir biblioteca que o repositório não tem —
as quatro da família 4, e as quatro já triadas, todas na 5.1 desde a vigésima
sétima. Nenhuma dependência entra sem decisão explícita da dona, e três têm saída
sem dependência:

| Peça | Dependência natural | Saída sem dependência |
|---|---|---|
| `mermaid-diagram` | `mermaid` (~600 kB) — **e é a única das quatro que a fonte de fato carrega** | O consumidor passa o SVG já renderizado; o componente desenha a moldura, o zoom e o modo de tela cheia |
| `math-block` | `katex` (~280 kB + fontes) — dependência NATURAL do assunto, não da fonte | A fonte **já é** a saída: `expression` chega pronto e a peça o põe num `<span>` |
| `map-answer` | `maplibre-gl` (~800 kB) — dependência NATURAL do assunto, não da fonte | A fonte **já é** a saída: grade esquemática com marcas em porcentagem, e os tipos dizem que `x` e `y` não são longitude e latitude. A saída continua sendo a melhor: mapa embutido carrega telha de terceiro, o que é decisão de privacidade além de peso |
| `diagram` | nenhuma | Já é assim na fonte: "you hand it the rendered graphic" |

**Conserto medido na vigésima sétima correção, lendo as quatro páginas em cru.**
Esta tabela foi escrita prevendo o que cada assunto PEDIRIA, e três das quatro
linhas descreviam como "saída sem dependência" aquilo que a fonte já é. Só
`mermaid-diagram` analisa alguma coisa; `math-block` não menciona KaTeX em linha
nenhuma e `map-answer` não menciona biblioteca de mapa nenhuma. A consequência
prática: **nenhuma decisão de dependência foi para a dona neste lote**, e a única
entrada que a dependência decidia colapsou por causa dela. Vale como aviso de
método para as doze que faltam da família 4: a coluna "dependência natural" diz o
que o ASSUNTO costuma pedir, e isso não é leitura da fonte — leia a página antes
de tratar a saída como contorno.

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
   ícone, texto ou padrão. Vale para as seis famílias, e é o defeito mais provável
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
- Tokens novos, nenhum. As cinco folhas usam o que os 42 tokens de tema já dão. Se
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
