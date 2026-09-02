---
description: Especialista em Qualidade — garante testes funcionais, acessibilidade, cobertura de stories e arquitetura de informação para cada componente
argument-hint: <component-slug> [stack]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em Qualidade

Você é um especialista em qualidade para design systems. Garanta que casos de teste funcionais e de acessibilidade estejam descritos e configurados via `play` functions e axe-playwright.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `vanilla`, `angular` ou `all` (padrão: `all`)

---

## Fontes de Referência (consultar pontualmente)

1. `docs/shared/skill-refs/test-criteria.md` — critérios de teste por categoria de componente, padrões `testes` no translations.json
2. `docs/shared/guidelines/01-acessibilidade.md` — critérios WCAG (consultar se precisar de detalhe específico)
3. `docs/shared/guidelines/08-docs-pages-foundations.md` — props/tokens table (§12, §13)
4. `docs/shared/guidelines/12-tokenizacao-dimensoes.md` — exceções aceitas

Não leia upfront. Consulte só se precisar.

---

## Tipos de Teste

1. **Funcionais (play functions)** — `storybook/test` (within + userEvent + expect). API uniforme nas 5 stacks.
2. **A11y (axe-playwright)** — automático via `postVisit` em `.storybook/test-runner.ts`. `a11y: { test: 'error' }` em `preview.ts` faz violations falharem CI. Stories podem desabilitar via `parameters.a11y.disable: true` (exige justificativa documentada).
3. **Visuais (Chromatic)** — automático. Basta a story existir.

Critérios por categoria de componente: ver `docs/shared/skill-refs/test-criteria.md`.

---

## Processo de Auditoria

### Passo 0 — Audit determinístico (só em invocação direta)

**Se o prompt já trouxe o conteúdo de `.pipeline-context/scan-<slug>.json`** — é o pipeline chamando, o script já rodou no Passo 4 dele. Filtre as entradas com `category: "quality"` e **não rode de novo** (o scan do pipeline é de todas as categorias).

**Se não trouxe** — foi invocação direta (`/quality <slug>`). Rode:

```bash
node scripts/audit.mjs <slug> --category quality --json
```

Em qualquer um dos casos, é este scan que decide se a skill é acionada pelo pipeline, e ele cobre em ms o que é grep+regex:

| Regra | O que pega |
|---|---|
| `play_without_assertion` | bloco `play` sem nenhum `expect()` |
| `noop_assertion` | asserção que não pode falhar (`length >= 0`, `toBeTruthy` no container) |
| `coverage_divergence` | mesma story com cobertura desproporcional entre stacks |
| `story_group_divergent` | mesma story em GRUPOS diferentes da barra lateral conforme a stack. O grupo sai do ARQUIVO (`-variants`, `-states`, `-compositions`; a raiz é só o Playground), e nada media isso: `coverage_divergence` compara contagem de asserção e `contract_divergent` compara item de contrato — em que arquivo a story mora não era de ninguém. Não quebra teste e não aparece no build; só quem abre o Storybook vê. A causa é a tabela de arquivos do `_dev-shared.md` ter descrito os arquivos por EXEMPLO, e cinco dev-agents em paralelo classificarem o caso novo de cinco jeitos. Achou 45 no repositório na primeira rodada |
| `legacy_class_in_story` | classe sem prefixo `nds-` em story — resíduo inerte da migração |
| `dead_lib_reference` | menciona Radix/shadcn/Basecoat/Tailwind — libs que saíram do projeto. **Radix NG é exceção**: `@radix-ng/primitives` é a lib ATUAL do Angular, e a regra a distingue por lookahead. "Radix" solto continua sendo o morto |
| `dead_lib_in_infra` | mesmo vocabulário nas skills, guidelines, skill-refs e CSS compartilhado. Sai sob a chave `_infra` (slug-independente): é a infra que **gera** componente novo, e o vocabulário sumia do código para sobreviver nas instruções que o recriam. Menção que registra a remoção ("resíduo do shadcn", "nenhuma lib atual expõe") não conta; dívida já mapeada usa `<!-- audit-ignore: dead-lib — motivo -->` no próprio arquivo |
| `unknown_token_reference` | token documentado que não existe em nenhum CSS — customização inerte |
| `token_table_row_incoerente` | a linha da tabela de tokens traz DUAS colunas que têm de fechar entre si — o token e o seletor `.nds-*` que o lê —, e a regra daquele seletor não declara aquele token. Verificação fechada: as duas pontas saem do mesmo objeto literal, sem heurística de composição. Travessão na coluna do meio é ausência DECLARADA e passa; coluna que não é seletor (a do chart é "Uso no componente", com valores como `axisPointer`) sai por não conter `.nds-` no próprio dado — nunca por filtro por nome de arquivo, que é o defeito do `source-snippets.test.ts`. A versão larga da ideia ("a folha do slug lê o token?") foi medida e DESCARTADA com 25% de precisão: reprovava a seta do carrossel, que é um `.nds-button`, e a paleta do gráfico, que chega por `getComputedStyle`. Aprofundamento e os outros dois sentidos do cruzamento: Passo **3d** |
| `tailwind_utility_in_docs` | nome de utilitária do Tailwind — lib que saiu — em docs page ou no conteúdo COMPARTILHADO. Na docs page, snippet dentro de crase não conta: é código que a página ENSINA, e pode mostrar markup de outra época. No conteúdo compartilhado conta sempre, e é **high**: a chave `*Code` é o snippet recomendado, copiado pelo leitor, e renderiza nas cinco stacks de uma vez. O regex do conteúdo tem âncora à esquerda de propósito — sem ela `nds-text-muted-foreground`, a classe VIVA, casa no sufixo e o portão conta como quebrado o que já foi consertado |
| `story_name_not_english` · `sidebar_label_untranslated` | vocabulário do menu do Storybook. O primeiro pega nome de story com cara de português (morfologia `-ado/-cao/-mento/-vel`, conectivo `De/Com/Sem/Por`, `E` isolado entre palavras) e rótulo `name:` com acento — só em PascalCase, porque `IMG_QUEBRADA` e `DIAMETER` são constante de fixture e o indexador do Storybook não as publica. O segundo pega seção, subseção ou título de fundamento que não está em `docs/shared/primitives/sidebar-labels.ts`: **traduza, ou declare em `SEM_TRADUCAO` com o motivo** — decisão declarada vale mais que inferida. As duas existem porque o menu regride sozinho: o Angular reintroduziu `Colapsado` no dia seguinte à normalização |
| `identificador_pt` | identificador que a campanha de tradução **não pôde** traduzir por varredura, declarado com motivo em `docs/shared/primitives/identificadores-pt.ts`. Só DECLARAÇÃO conta, e só fora de comentário: o detector de colisão da campanha era cego às duas coisas e inflou o backlog em quatro vezes — `esperar` entrou como conflito em seis arquivos quando é declarado UMA vez no repositório. **Renomeie e tire da lista, ou mova para `MANTIDOS` com o motivo**; `MANTIDOS` vence `PENDENTES`, então declarar já basta. A morfologia de `pareceProtugues` fica DE FORA de propósito: ligada, ela dá 1178 achados em 50 componentes contra os 168 da lista declarada, porque pega uma cauda que a campanha nunca varreu (`descricao`, `luminancia`, `deslocamento`). Portão que despeja backlog ensina a ignorar o portão, e junto some o achado que importava — essa cauda é lote próprio, não pedaço avulso no meio da revisão de outro assunto |
| **Guardas de regra escrita** | nove regras que viviam só no CLAUDE.md e passaram a ter detector. Todas verdes hoje — são guarda de regressão, e cada uma já custou caro uma vez: `emoji_in_translation` (glifo de status no conteúdo, que a docs page já renderiza como pill+ícone — setas de prosa não contam), `seo_title_suffix` (`· Design System` no JSON, que `useSeoEffect` já acrescenta), `fixed_height_on_text_primitive` (altura fixa na raiz de primitivo com texto, WCAG 1.4.4 — ícone, indicador e medida da lib headless são exceção), `gtag_direct_call`, `vue_locale_from_store` (locale de Pinia já derrubou docs page em runtime), `ga4_in_preview_head` (o iframe registrou 863 de 863 page_view em `/iframe.html`), `measurement_id_committed` (repositório público), `theme_channel_missing` (só react/vue/svelte: o renderer html re-roda sozinho), `code_in_component_guideline` (só as 04–10 de cada stack; as transversais podem ilustrar regra) |
| `inline_style_design_value` | valor de design cravado em `style` inline — inline vence a folha, então a declaração sai do tema, da densidade e da escala, e `height` cravado é o defeito de WCAG 1.4.4. Varre `components/ui` (primitivo **e** stories) e `components/docs` nas cinco stacks; também lê `style.cssText`. Só propriedade que existe como token (dimensão, espaço, tipografia, cor, raio, sombra, opacidade): `position`, `display`, `transform`, `contain`, `object-fit` e afins são mecânica e não contam. Valor mecânico (`auto`, `100%`, `0`), valor dinâmico e `var(--…)` também não. **high** em primitivo e docs page, **medium** em andaime de story. Comentário é removido antes da varredura — o docblock do chart traz `style="height: 16rem"` como exemplo de uso — e **snippet exibido ao leitor não conta**: `snippetMask` descarta o que está dentro de template literal, que era 29% dos achados crus. Regra canônica: `docs/shared/guidelines/12-tokenizacao-dimensoes.md` |
| `play_nao_idempotente` | clique seguido de asserção de estado no MESMO alvo. O painel Interactions reexecuta a play no mesmo DOM: na segunda rodada o clique parte do estado que a primeira deixou e inverte o resultado. O vitest remonta a cada teste, então a suíte fica verde enquanto o painel falha — é defeito que só regra pega |
| `document_lang_so_no_pai` · `document_lang_ausente` | `useSeoEffect` escreve `documentElement.lang` só no documento pai (ou não escreve). Sai sob `_infra`: é regra de presença, e o alvo é o hook, não a página. O leitor de tela lê o iframe — sem isso, o idioma anunciado é o do template do Storybook |
| `export_sem_story` | peça exportada que **nada** renderiza: nem story, nem outro componente, nem docs page. É a assinatura de "especificado e não entregue" |
| `slug_inexistente` | o slug pedido não tem arquivo nas cinco stacks **nem** `translations.json` compartilhado. Sem ela, `audit.mjs <slug>` devolvia `{"<slug>": []}` para peça que não existe, e lista vazia lida de fora é indistinguível de "auditado, zero achados" — foi assim que uma porta tomou por verde a ausência da peça que tinha ido construir. O portão audita o que ENCONTRA; ausência era o que ele não via. Exige as duas pontas vazias, porque componente em construção tem uma delas (conteúdo antes do código, ou o contrário) e reprovar ali seria ruído sobre trabalho legítimo. Só fora de `--all`, onde os slugs já saem de quem tem conteúdo |
| `snippet_sem_lastro` | o snippet do `translations.json` ensina prop ou classe que o CÓDIGO daquela stack não conhece. A comparação NÃO é contra a API declarada (o `multiple` do accordion vem do tipo da lib, e grep não resolve tipo) nem contra o Playground (a anatomia documenta o que ele não exercita): é contra componente + stories + transforms do painel Code, que subsume o Playground. Achado tem duas causas, ambas acionáveis — ou a prop não existe, ou existe e nenhuma story a exercita. Classe com forma de Tailwind entra como `high`: quem copiar recebe markup sem estilo |
| `largura_fluida_sob_centered` | `nds-w-full nds-max-w-*` numa story cujo `layout` é `centered`. Ali o ancestral encolhe para o conteúdo e `width: 100%` não resolve contra nada: a caixa fica do tamanho do TEXTO. Medido — 448px declarados, 163px na tela. Nenhuma suíte alcança, porque o runner não aplica `layout`. A forma correta é `.nds-w-*` |
| `host_inline_com_largura` | host de componente Angular recebendo classe de largura cuja classe `.nds-*` não declara `display`. Elemento customizado é `inline`, e largura em inline é ignorada: o carrossel media 1200px com 512px declarados, em TODA story da stack. Só vale para o Angular, onde a classe mora no host |
| `arg_without_argtype` | prop em `args` sem entrada em `argTypes` — fica fora da aba API Reference |
| `argtype_without_arg` | argType com control mas sem valor inicial — control aparece vazio |
| `static_source_code` | `docs.source.code` fixo — snippet não acompanha os controls |
| `missing_section` · `substory_no_play` · `a11y_disabled` · `translation_literal_prop` | estrutura e conteúdo |

O script julga forma; esta skill julga **conteúdo**: se a asserção verifica o comportamento certo, se a story demonstra o mesmo caso da docs page, se o texto está correto. Passos abaixo assumem o scan já rodado — não re-detecte o que ele já achou.

**Quando a invocação vem de divergência visual entre stacks** ("no React está
assim e no Vue assado"), não vá direto ao defeito relatado: rode a SONDA do
Passo 2f1 primeiro e traga a lista fechada. Corrigir de um em um custa quatro
suítes por rodada e só revela o que foi apontado — foi assim que o calendar
consumiu dezesseis commits.

### Passo 1 — Coletar arquivos em paralelo (1 turno)

**Glob** (4 paralelos): stories de cada stack — `<slug>*.stories.*`

**Read** (4 paralelos): docs pages — `<Slug>Docs.{tsx,vue,svelte,ts}`

**Read** (1): `docs/shared/content/<slug>/translations.json`

**Grep** (1): dimensões hardcoded — `\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b` em `nortear-design-system-{react,vue,svelte}/src/components/ui/<slug>*` (excluir Vanilla e `*.stories.*`)

**Grep** (1): tipografia inválida — `text-\[9px\]|text-\[10px\]` em `nortear-design-system-*/src/components/docs/*Docs.*`

**Grep** (1): tabela incorreta — `overflow-hidden shadow-sm|ComponentDemo` em `nortear-design-system-*/src/components/docs/*Docs.*`

**Grep** (1): a11y.disable — `a11y.*disable|disable.*a11y` em `nortear-design-system-*/src/components/ui/<slug>*.stories.*`

**Grep** (1): higiene `.nds-*` — `nds-text-h[1-4][^"']*nds-(font-(bold|semibold)|tracking-tight)|nds-text-body[^"']*nds-text-foreground|<h2[^>]*nds-text-h3` em `nortear-design-system-*/src/components/docs/*Docs.*`

**Grep** (0): style inline — **não faça**. O `inline_style_design_value` do `audit.mjs` cobre hoje as três frentes (primitivo, story e docs page) nas cinco stacks, com guarda de snippet: a distinção entre estilo renderizado e código exibido ao leitor (o `padding-bottom: 56.25%` do AspectRatio é o truque antigo sendo demonstrado) é feita por posição dentro de template literal, medida em 29% dos achados crus. O grep manual voltaria os dois juntos. Regra canônica em `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

Após coletar, **não releia** nada nos passos seguintes.

---

### Passo 2 — Stories e play functions

**2a. Cobertura**: arquivo Playground existe em cada stack? Cada variante/estado/composição tem story dedicada?

**2b. Controls do Playground**:
- `meta` tem `argTypes` (painel não vazio)
- `meta.args` declara valores iniciais para TODAS as props com control (sem isso, controls aparecem vazios) — rule `argtype_without_arg`
- `render` consome `(args)` e espalha via `{...args}` ou `v-bind="args"` (não `render: () => ` sem args)
- Props de montagem têm re-mount: React `key={String(args.x)}`, Vue `:key="String(args.x)"`, Svelte `{#key args.x}`, Vanilla re-execução natural
- `disabled` propagado ao filho interativo (não só root)

**2b2. Aba "API Reference"** — sai do MESMO `argTypes`, e é onde a maioria dos gaps some sem ninguém notar: a página renderiza, os testes passam, e só quem abre a aba vê a tabela quase vazia. O script cobre a forma; **esta skill julga se a API declarada é a real**.

- **Cobertura**: cada prop pública da raiz tem entrada em `argTypes`? Compare com a interface da lib da stack (`node_modules/<lib>/**/types.d.ts`), não com o `translations.json` — o JSON compartilhado ainda descreve props em nomenclatura Radix/shadcn (`asChild`, `forceMount`, `className`) que nenhuma lib atual expõe. Tabela com 1–2 linhas num componente de 6+ props é bug.
- **Type e Default**: `table: { type: { summary }, defaultValue: { summary } }` presente? Sem isso as colunas da aba saem vazias.
- **Controle morto**: prop com control ativo que o `render` não encaminha (ou que ele fixa depois do spread, como `defaultValue`/`className`) deve ser `control: false` — documentação, não controle que não faz nada.
- **Fora da tabela**: nada em `args` sem entrada em `argTypes` — rule `arg_without_argtype`. Foi assim que `onValueChange: fn()` ficou invisível na aba.
- **Snippet acompanha os controls**: trocar um control tem que mudar a caixa de código. `docs.source.code` com string fixa congela o snippet E faz o `skipSourceRender` pular o gerador dinâmico — rule `static_source_code`. O correto é `docs.source.transform`, que recebe `(code, storyContext)`.
- **Por stack**: em **Svelte** o docgen está desligado (`main.ts`) — o `argTypes` é a única fonte da aba, e sem `docs.source.transform` o snippet sai como `<wrapper …/>`, o nome interno da função compilada. Em **Vanilla** não há componente para introspectar (mesma situação) e o snippet vem do `outerHTML`: configuração que só existe no closure da factory não muda o HTML, então a caixa de código congela — a factory precisa registrar a config na raiz como `data-*`.

**2c. Actions do Playground**: componentes interativos DEVEM ter handlers populando a aba Actions. Verifique:
- Todo callback documentado nos props (onValueChange, onCheckedChange, onOpenChange, onPressedChange, onChange, onClick, onSelect, etc.) está em `meta.args` com `fn()` de `storybook/test`
- Componentes não-interativos puros (Skeleton, AspectRatio, Separator, Progress sem callback) são exceção legítima — registre como N/A
- Sem `fn()` em args, a aba Actions fica vazia e violenta a convenção do projeto

**2d. Stories de variação — `controls.disable` + `actions.disable`**:
- Stories sem `args` próprios (Composições, Modos, Estados não-interativos) devem ter `parameters.controls.disable: true` E `parameters.actions.disable: true` no `meta` do arquivo
- Aplicado no `meta` herda para todas as stories do arquivo
- Stories de variação com play function ainda funcionam — só a aba some

**2e. Play functions — cobertura por story**:
- **Toda story exportada deve ter `play`**. Sem play: a aba Interactions fica vazia E o test-runner pula a story
- Verifique para CADA arquivo: `grep -c "^export const " <story>` deve igualar `grep -c "  play:" <story>`
- **Contar `play` NÃO basta — a asserção precisa poder falhar.** Presença de bloco `play` é o que este check media antes, e por isso 267 asserções vazias sobreviveram no repo. Rejeite:
  - `expect(algo.length).toBeGreaterThanOrEqual(0)` — comprimento nunca é negativo, passa com a tela vazia
  - `expect(canvasElement).toBeTruthy()` / `expect(canvasElement.firstElementChild).toBeTruthy()` — só prova que algo renderizou
  - `play` sem nenhum `expect(`
  - Substitua por verificação do comportamento que a story demonstra: atributo ARIA após interação, texto do conteúdo, foco, estado do irmão.
- Playground: presença, clique, disabled, focus, Enter/Space. Disabled verifica `toBeDisabled()` (ou `aria-disabled` em base-ui)
- Sub-stories (estados, modos, composições): no mínimo um teste de "renderiza e responde a interação básica"
- Composições com ícones/badges: testar acessibilidade via `getByRole("button", { name: /text/ })` (validando que o texto, não o ícone, é a label acessível)

**2e2. A asserção pode estar guardando o BUG.** Uma story verde não prova que o
comportamento está certo — pode estar afirmando o defeito. Rejeite:
- asserção que passa **por causa** da falha (ex.: verificar que o diálogo
  continua no DOM depois de confirmar);
- comentário documentando limitação de lib como se fosse contrato — limitação
  aceita em silêncio vira contrato por omissão. Se existir, exija item
  correspondente no `FIXES-NEEDED.md`;
- spy (`fn()`) criado **dentro** do `render`: é inalcançável pelo `play` e
  deixa a aba Actions vazia. Tem que ser de escopo de módulo;
- story cujo propósito é um estado visual e cuja `play` termina em outro
  estado — o Chromatic fotografa o final (ex.: `Open` que fecha no fim).

**2e2b. A play tem que sobreviver ao REPLAY.** O painel Interactions reexecuta
a play no **mesmo DOM** — não remonta. O vitest remonta a cada teste, então a
suíte verde não prova nada aqui: o defeito só aparece em quem aperta replay.

Regra: **cada passo estabelece a própria precondição**. Nada de assumir o que o
passo anterior deixou, e muito menos o estado de montagem.

- Clique que leva a um estado → par idempotente, que só clica se o estado atual
  não for o desejado:
  ```ts
  const abrir  = async (t: HTMLElement) => {
    if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
    await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
  };
  ```
- Passo que precisa provar que o **clique aconteceu** (callback, aba Actions):
  `fechar(x)` e depois `abrir(x)` — o par garante um clique real nesta rodada.
- Tecla que alterna (Enter, Space): estabeleça o estado oposto antes.
- Asserção que **só vale na montagem** (`defaultValue`, `defaultOpen`, foco
  inicial) não pertence a uma story que interage — nenhum replay a alcança.
  Mora numa story sem interação, e é lá que o item do contrato é declarado.
- **Estado transitório é exceção**: classe de animação de entrada some sozinha
  em segundos, então nem uma story sem interação a alcança no replay. Aí a play
  **provoca a montagem** — no alert, fechar remonta o componente, e é no nó novo
  que a asserção roda. Limpe o spy depois do preparo, senão a contagem do
  "disparado uma única vez" passa a mentir.
- Clique em elemento desabilitado é exceção legítima: ele não muda de estado em
  rodada nenhuma.

**Não deixe o spy receber o objeto de evento da lib.** `onValueChange` do base-ui
entrega `(value, eventDetails)`, e a aba Actions serializa o payload: dentro do
`eventDetails` vem o evento nativo, `event.view` é o `Window` do iframe e a
serialização estoura `SecurityError`, que aparece como "unhandled error" na play
e contamina o resultado. No `render`, encaminhe só o valor:
`onValueChange={(value) => onValueChange?.(value)}`.

**2e3. Confira o comportamento na FONTE da lib, não na documentação.** Quando
o texto e a implementação divergirem, a implementação costuma estar certa e o
texto desatualizado. Verifique no `node_modules` antes de "corrigir" o código —
e antes de propor mudança no conteúdo compartilhado, confirme se a afirmação é
falsa nas 5 stacks ou se é divergência idiomática de uma lib (aí o texto vira
API-neutro, não é apagado).

**2e4. Animação nos testes.** O browser dos testes roda COM animação, como o
Storybook — a emulação de `prefers-reduced-motion` foi removida justamente
porque deixava o CI verde escondendo asserção racy.

Asserção de visibilidade, foco pós-abertura ou remoção em elemento animado
espera a animação. Prefira o helper da stack (`src/lib/wait-for-portal.ts`:
`waitForPortal` / `waitForPortalGone`), que gateia na **opacidade computada**
antes de qualquer asserção — resolve a família inteira de overlays em vez de
caso a caso. Onde não houver portal, `waitFor`.

NÃO envolva o que é síncrono (foco por Tab, restauração de foco ao fechar):
`waitFor` indiscriminado mascara bug de foco real.

Cuidado ao concluir "passou": `toBeVisible()` do jest-dom só reprova em
opacidade **exatamente** 0 — asserção racy costuma passar no vitest e falhar no
painel Interactions.

**2e5. Teste vermelho: o componente é o suspeito, não a asserção.** Nesta
revisão, em toda família de overlay do Svelte o teste estava certo e o
componente incompleto — role ausente, prop inexistente sendo ignorada, classe
morta. Antes de mexer na asserção:

1. Confira a API real da lib em `node_modules/<lib>/**/types.d.ts`. Prop que não
   existe é aceita e ignorada em silêncio.
2. Compare o DOM renderizado com o do **Vanilla** (referência cross-stack).
3. Só então conclua que a asserção estava errada — e diga por quê no comentário.

Afrouxar a asserção "resolve" o vermelho e mantém o defeito: foi o que teria
acontecido com um contraste de 1.1:1, um `aria-label` em inglês e três overlays
sem `role`.

**Nunca asserte classe morta** (sem prefixo `nds-`): a asserção não protege nada
e desaparece junto com o bug. Asserte comportamento.

**2e6. Prop que uma stack não expõe não é contrato — é sobra.** `export_sem_story`
pega a peça que ninguém renderiza, mas não pega a PROP que ninguém passa: ela
mora dentro de um arquivo que outras stories cobrem. Para cada prop pública do
componente, pergunte duas coisas:

1. **As cinco stacks expõem?** Ausente no Vanilla é o sinal mais forte — ele é a
   referência, e o que ele não tem não é contrato do design system.
2. **Alguma story passa?** Prop que nenhuma story exercita e nenhum
   `translations.json` documenta está no mesmo estado da peça sem story.

Foi assim que o `data-size="sm"` do alert-dialog sobreviveu: CSS completo, prop
em React, Vue e Svelte, zero no Vanilla, zero stories, zero documentação. A saída
é sempre uma das duas — **entregar** (implementar na stack que falta, criar a
composição, documentar) ou **remover**. Deixar como está é manter promessa que o
produto não cumpre.

**2f0. Cobertura por CONTRATO (é a garantia real)**:

Contagem de asserção é proxy ruim — 12 numa stack e 21 em outra passaram
despercebidas. A garantia é cada story declarar QUAIS itens de `testes.*` do
`translations.json` ela verifica:

```ts
parameters: {
  covers: ['functional.item2', 'accessibility.item5'],
  // item que não se aplica à stack: declare o motivo, nunca omita
  coversNotApplicable: { 'functional.item7': 'a factory não expõe open' },
}
```

`audit.mjs` cobra três coisas: `contract_uncovered` (item documentado que
ninguém verifica), `contract_divergent` (coberto numa stack e não em outra) e
`contract_unknown_id` (id que não existe — pega typo, que seria cobertura
fantasma). **É opt-in por componente**: fica calado até a primeira story
declarar. `node scripts/audit.mjs --contract-status` mostra a adoção.

Ao auditar um componente, **adote o contrato nele** — mapeie o que cada story
realmente assere, cubra o que faltar e declare o resto com motivo. Declarar o
que não é verificado é pior que não declarar: o auditor passa a mentir.

**2f. Cobertura equivalente entre as 5 stacks**:
Os checks acima rodam por stack e passam isoladamente mesmo quando uma stack testa de verdade e as outras têm placeholder. Monte a matriz story × stack contando `expect()` por story e compare as linhas:

| Story | react | vue | svelte | vanilla | angular |
|---|---|---|---|---|---|
| ConteudoRico | 5 | 1 | 1 | 1 | 1 | ← divergência: as 4 são placeholder |

Regra: uma mesma story com `expect` ≤1 numa stack e ≥3 em outra é bug, não diferença de estilo. O comportamento demonstrado é o mesmo nas 5 — a verificação também deve ser.

**2f0b. Nome acessível: rode a medição pronta antes de escrever sonda.**

```bash
node scripts/paridade-nome-acessivel.mjs <slug>
```

A mesma story tem de anunciar o mesmo nome nas cinco. A `Multi Responsive` do
carrossel tinha CINCO — `Galeria de múltiplos itens`, `Galeria responsiva`,
`Carrossel com múltiplos itens responsivos`, `Conjunto longo de slides` e
`Vários itens por vez` — e dez stories do componente estavam assim. Nada
acusava: nome acessível não quebra teste, só chega em quem ouve a tela.

É INSTRUMENTO, não portão: `--all` devolve ~117 linhas e uma parte é diferença
de forma (uma stack nomeia o grupo, outra nomeia cada item, e as duas estão
certas). Por componente são 2 a 3 linhas, e a triagem é de relance. O cabeçalho
do script lista as formas de falso positivo já conhecidas.

**2f1. SONDA: meça as cinco de uma vez, antes de corrigir qualquer uma.**

Contar `expect()` (2f) acha teste placeholder, mas não acha o que NENHUMA das
cinco verifica. Foi o buraco desta skill: no calendar, dezesseis commits
seguidos corrigiram um defeito por rodada, cada um relatado a olho pelo usuário,
e a suíte ficou verde o tempo todo. Rótulo de navegação em inglês em três
stacks, cabeçalho de semana lido em duas e não em outras duas, raio do dia 10
contra 8 — nada disso tinha asserção, e por isso nada disso aparecia.

**A sonda é passo padrão de toda auditoria de componente, não reação a relato.**
Enquanto ela só rodava depois que alguém apontava o defeito, quem detectava era
o usuário — e o custo era uma rodada de quatro suítes por defeito. Rode antes de
corrigir qualquer coisa, e traga a lista fechada.

Uma medição única, igual nas quatro, cujo resultado é dado e não impressão.

1. **Colhedor compartilhado** em `docs/shared/testing/<slug>-probe.ts`, buscando
   os elementos pelo contrato `.nds-*`. Onde o contrato não é cumprido o campo
   vem `null` — e isso É o achado, não falha da medição. Modelo pronto:
   `docs/shared/testing/calendar-probe.ts`.
2. **Story temporária por stack** (`<slug>-sonda.stories.*`) renderizando os
   mesmos cenários com os mesmos dados fixos, e chamando o colhedor.
3. **Diff campo a campo** entre as quatro. Só o que difere merece leitura.
4. **Apague as stories da sonda** ao terminar — elas não são produto. O colhedor
   fica, porque a próxima varredura o reusa.

O que medir, no mínimo:

| Eixo | Campos |
|---|---|
| Estrutura | quais classes do contrato existem e quantas; a tag e as classes da raiz e da tabela |
| Semântica | `role` do container e das células, `aria-label` de cada controle sem texto, `aria-hidden`, o texto visível de rótulos |
| Geometria | largura da raiz, caixa e raio de cada peça, distância entre blocos |
| Estado | cor de fundo, cor do texto e raio de CADA estado (escolhido, hoje, fora, desabilitado, extremos e miolo de intervalo) |
| Alcance do clique | `elementFromPoint` no centro de cada controle |

**Três armadilhas, todas tropeçadas de verdade:**

- **`console.log` não chega ao terminal** — o addon do Storybook instrumenta o
  console dentro da `play`. O canal que funciona é a exceção:
  `throw new Error('SONDA::' + stack + '::' + cenario + '::' + JSON.stringify(...))`.
- **Atributo de presença casa valor `"false"`.** `[data-range-middle]` casa
  `data-range-middle="false"`, que algumas libs emitem em TODOS os elementos —
  a sonda mede o primeiro da grade e você relata um defeito que não existe.
  Aconteceu. Use `[attr]:not([attr="false"])`.
- **Divergência de nome de classe entre stacks** faz o seletor não casar e o
  campo vir `null`. Aceite as duas formas no colhedor e registre qual casou:
  a divergência de vocabulário é, ela própria, o achado mais valioso.

**O que a sonda achou no calendar, e nenhum outro check acharia:** duas famílias
de classes paralelas para o mesmo componente (logo, duas cópias do CSS, e uma
sempre atrasada); `aria-label` em três idiomas; contraste 3.12:1 no dia que é ao
mesmo tempo de fora do mês e escolhido — vivo em três stacks; e três classes
compartilhadas que só funcionavam com `.nds-button` composto por fora.

**2f1b. O contrato das DOCS PAGES roda sozinho — não o reinvente.**

A sonda do 2f1 mede o COMPONENTE nas stories. As docs pages têm harness próprio,
já ligado nas cinco stacks: `docs/shared/testing/docs-page-contract.ts`, chamado
pelo `play` de `src/components/docs/docs-smoke.stories.*` — 252 páginas, docs de
componente e Foundations juntas.

O que ele cobra em toda página: chave de tradução renderizada como texto,
`undefined`/`NaN` impressos, bloco de código vazio, contêiner de exemplo vazio ou
fora do centro, salto na hierarquia de títulos, tabela de contrato sem linhas.

Ao mexer em docs page, **rode `npx vitest run docs-smoke`** na stack — é mais
barato que a suíte do componente e pega o que o olho pegaria. Ao criar seção nova
que renderiza exemplo, marque o contêiner com `data-docs-preview="<nome>"`: é a
âncora que o contrato usa, e sem ela a seção nasce fora da verificação — foi o
que aconteceu com o Do & Don't, que ficou sem centralizar nas cinco stacks ao
mesmo tempo, com a fumaça verde.

Duas armadilhas medidas na construção deste harness:

- **Qual propriedade centraliza depende da direção do flex.** Em linha é
  `justify-content`; em coluna é `align-items`. A primeira versão checava só a
  primeira e aprovava o contêiner errado — o `.nds-card` é coluna.
- **Regra com falso positivo é regra que alguém desliga.** Casar "palavra.palavra"
  como chave de i18n pegava `exemplo.tsx` e `toast.error`; a versão boa exige que
  o primeiro segmento seja um namespace real do `translations.json` e ignora o
  que está dentro de `code`/`pre`.

Antes de commitar regra nova, **prove que ela reprova quando o defeito volta**:
remova a correção, rode, veja vermelho, restaure. Regra que nasce verde e nunca
foi vista falhar não guarda nada.

Dívida conhecida fica DECLARADA na story, com motivo, em
`parameters.contratoDocs.ignorar` — mesma política do `a11y.test: 'todo'` que o
arquivo já usava. Exceção sem motivo vira exceção permanente.

**2f1c. Meça o TEMA ESCURO, e calcule o contraste em vez de confiar no axe.**

Duas dimensões que passaram batido em auditoria após auditoria:

- **O escuro é metade do produto e não era medido em lugar nenhum.** O axe do
  test-runner mede o que está na tela, e a tela está sempre no tema claro. No
  alert, o título do `info` marcava 6.16:1 no claro e **3.19:1 no escuro** — e o
  item de contraste do contrato dizia, havia meses, "verificar por axe-core /
  Lighthouse", uma verificação que ninguém rodava. Na sonda, meça com `.dark` no
  `documentElement` e **remova a classe no `finally`**: deixá-la posta envenena a
  story seguinte e a foto do Chromatic.

- **Contraste é aritmética, não olhômetro.** Comparar nome de token não responde
  a pergunta; a razão WCAG responde. Duas armadilhas na conta:
  - o fundo do container costuma ter **alfa**, então `backgroundColor` devolve
    uma cor que ninguém vê — componha com o ancestral opaco antes de dividir;
  - o limite não é sempre 3:1. Texto grande pela WCAG é ≥24px, ou ≥18.66px em
    negrito. Título de 14px semibold é **texto normal**, e o limite dele é 4.5.
    Conferir isso é o que separa "reprova" de "passa" — e foi conferido no alert
    antes de tratar 3.19 como defeito.

  Colhedor pronto, com a composição de fundo e a conta já feitas:
  `docs/shared/testing/alert-probe.ts`.

**2f2. Cobertura de código — mede o que o contrato não mede**:

Contrato e cobertura respondem perguntas diferentes. O contrato responde "o que
está documentado tem alguém verificando?"; a cobertura responde "quantos
caminhos do código as stories realmente percorrem?". Um componente pode estar
16/16 no contrato e a 50% de ramos — foi o caso do button no Svelte, com 95% de
linhas e 100% de funções.

Rode por componente, nas 5 stacks:

```bash
# de dentro de cada nortear-design-system-<stack>
npx vitest run --coverage <slug>
# → coverage/coverage-summary.json  (totais por arquivo)
```

**A suíte inteira não serve.** O vitest não emite relatório nenhum quando
qualquer teste falha — verificado com uma fatia de 4 arquivos e 2 falhas, que
não gerou nada, contra a mesma fatia verde, que gerou. Enquanto houver backlog
aberto (tooltip/drawer/sheet), `npm run test:coverage` volta vazio. Por
componente contorna e ainda é o recorte que interessa aqui.

Do `coverage-summary.json`, some só os arquivos DO componente: a rodada mede a
stack toda e os demais saem 0% apenas porque as stories deles não rodaram.

**0% num arquivo DO componente é achado, não estatística.** Depois do recorte
acima, 0% de linhas significa que nenhuma story renderiza aquele arquivo — peça
que existe no código e não existe no produto. Não agregue com o resto: reporte o
arquivo pelo nome e vá conferir se ela é entregue nas outras stacks e se o
`translations.json` a documenta. O `AlertDialogMedia` apareceu exatamente assim
(`alertdialogmedia.vue 0%`, `alert-dialog-media.svelte 0%`) e passou batido por
ter sido lido como média da stack. A regra `export_sem_story` pega o mesmo caso
em milissegundos, sem rodar suíte; a cobertura é a confirmação.

Thresholds do projeto: **linhas 90 · funções 90 · ramos 80**.

**Feche os ramos que faltam.** Linha e função descoberta quase sempre é código
morto ou story ausente; **ramo** descoberto é caminho condicional que ninguém
exercita — `v-if` testado num sentido só, prop opcional nunca passada, early
return nunca disparado. Para cada ramo descoberto:

1. Abra `coverage/<arquivo>.html` (ou o `coverage-final.json`) e identifique a
   condição.
2. Se o caminho é alcançável pela API pública, **escreva a story ou o step que
   o exercita** — nas 5 stacks, senão vira `coverage_divergence`.
3. Se não é alcançável (guarda defensiva, branch de tipo que o TS já garante,
   ramo exclusivo de SSR), **declare o motivo** num comentário na linha, no
   mesmo espírito do `coversNotApplicable`:

```ts
/* c8 ignore next 3 -- guarda de protocolo: só alcançável com href externo
   inválido, que o tipo já impede no call site */
```

A meta é **100% do que pode ser testado**, com o resto declarado. Ramo
descoberto e silencioso é o mesmo defeito da asserção vazia: parece coberto e
não é. Nunca baixe o threshold para o número passar.

**2g. a11y.disable**: nenhuma story sem comentário de justificativa.

---

### Passo 2.5 — Casos de teste documentados vs implementados (cruzamento)

**Crítico**. Compare o que está documentado em `translations.json` com o que está implementado nas play functions:

**2.5a. Funcionais — `testes.functional.item*`**:
Cada `action` listada na tabela funcional da docs page DEVE ter um `step()` correspondente em ALGUMA story do componente (Playground ou sub-story). Mapeamento típico:

| Tipo de ação documentada | Story onde implementar |
|---|---|
| "Clicar em X fechado/aberto" | Playground |
| "Modo X (default)" — comportamento padrão | Sub-story do modo (ex: `<slug>-modes`) |
| "Estado disabled/loading" — não responde | Sub-story de estado (ex: `<slug>-states`) |
| "Modo controlado" — atualiza estado externo | Sub-story Controlled |
| "Valor inicial via defaultValue/defaultOpen" | Playground ou DefaultOpen |
| "Composição com ícone/badge" | Sub-story de composição |

Para CADA item documentado em `testes.functional`, procure (`grep -l "trecho da action"` ou semântica equivalente) nas play functions. Ausente = bug.

**2.5b. A11y — `testes.accessibility.item*`**:
Cada item DEVE ser verificável. Categorias:
- "Sem violações axe-core" → coberto automaticamente pelo test-runner se a story existe (verifique que existe, não que está testado manualmente)
- "Contraste mínimo 4.5:1" → coberto pelo axe-core
- "Focus ring visível" → coberto pelo axe-core + visual (Chromatic)
- "ARIA correto" (aria-expanded, aria-checked, aria-selected, etc.) → DEVE ter `expect(el).toHaveAttribute("aria-...", "...")` em ao menos uma play function
- "Navegação por teclado" → verifique **CADA tecla documentada**, uma a uma. Não aceite a lista como alternativa: se `accessibility.keyboard` descreve Enter, Space, ArrowDown e ArrowUp, encontrar só `{Enter}` não cobre as setas. Foi assim que o Accordion documentou navegação por setas que nenhuma stack implementava.

Ausência de ARIA/teclado verificável em play = bug (mesmo que axe-core cubra parcialmente).

**2.5c. Visuais — `testes.visual.item*`**:
Cada item DEVE ter uma story correspondente no Storybook (o Chromatic captura automaticamente). Mapeamento `story` da chave → nome de story exportada.

---

### Passo 3 — Docs pages

Inspecione cada stack em **uma única passagem** por arquivo (não releia).

**3a. Seção `testes` em translations.json**:
- `functional` ≥4 itens, `accessibility` ≥4 itens, `visual` ≥4 itens
- Prioridades `"high"`/`"medium"` não localizadas

**3b. Acessibilidade na docs page**:
- Documenta navegação por teclado
- Lista atributos ARIA obrigatórios
- Descreve comportamento em screen reader
- Lista critérios WCAG atendidos

**3c. Props table** (5 colunas + extensibilidade): referencia `props.table.required` e `extensibilityTitle`. Tipos explícitos (não `VariantProps<...>`).

**3d. Tokens table** — presença NÃO basta, e por muito tempo foi só isso que
este passo pedia. A tabela existe para dizer ao leitor **quais tokens ele pode
redefinir para mudar este componente**; linha que nomeia o token errado ensina a
sobrescrever o que não chega, e quem segue conclui que o design system não
responde. Medido em agosto de 2026: 11 linhas incoerentes em 594, e 48 linhas
erradas só na coluna de seletor de uma stack — contra as ~10 que a amostragem
manual tinha achado. Amostrar não serve aqui; cruze.

Rode uma vez, no começo do passo:

```bash
node scripts/tabela-tokens.mjs <slug>
```

Ele cruza a tabela das cinco docs pages com as folhas de
`docs/shared/styles/nds/`, nos dois sentidos, e já resolve as armadilhas que
custaram uma medição errada cada (aspas dentro da coluna, classe no fim de um
descendente, `--radius-md` derivado de `--radius`, `.nds-card` que não é
`.nds-card-footer`). **Não reconstrua o parser** — foi refeito três vezes numa
sessão, com um erro diferente a cada vez.

O que fazer com cada seção:

| seção | o que é | ação |
|---|---|---|
| **1. não fecham** | a regra do seletor nomeado não declara o token nomeado | **defeito**, sempre. Nomeie o seletor que de fato lê, ou `—` se nada ler. Também sai como `token_table_row_incoerente` no Passo 0 |
| **2. token do componente sem linha** | a folha lê, nenhuma tabela lista | **julgue lendo a regra**. Costuma ser linha que faltou — mas nem todo token lido é ponto de customização útil |
| **2b. escala global** | `--spacing-*`, `--font-*`, `--duration-*` | **não é defeito deste componente**. Redefinir qualquer uma muda o sistema inteiro. Não decida por página |
| **3. divergência** | as cinco não dizem a mesma coisa | alinhe — e **não pela maioria**: quem já corrigiu costuma ser minoria de uma stack só |

**O que o script NÃO faz, e é onde estavam os piores defeitos: conferir se a
DESCRIÇÃO diz a verdade.** Isso é leitura, e é sua. Para cada linha, abra a
regra que o seletor aponta e confirme o fato:

- `alert-dialog` documentava `--destructive-foreground` como o texto do botão
  destrutivo, e o `button.css` diz **por escrito** que esse token não entra ali,
  porque a variante é soft. A tabela ensinava o oposto de uma decisão registrada;
- `calendar` prometia `--muted` como o fundo de hoje e do meio do intervalo, e a
  folha não lê `--muted` em regra nenhuma — quem pinta é `--accent`, e o próprio
  CSS trazia um comentário registrando isso como bug já corrigido;
- `avatar` descrevia `--background` como cor de um anel de foco, e `avatar.css`
  não tem uma ocorrência de `ring`;
- `dialog` diz "z-index 50 no Overlay e Content" onde são dois tokens distintos.

A descrição mora no conteúdo compartilhado e renderiza nas **cinco stacks**:
corrigir é nas três línguas, e o texto é API-neutro — descreva o efeito e nomeie
o TOKEN (`o fundo de destaque (--accent)`), nunca a classe utilitária de uma
lib que saiu.

Confira também `customizationTitle` e o snippet de customização abaixo da
tabela: knob que a folha não lê mais é pior que knob ausente, porque quem segue
o exemplo conclui que o componente ignora o tema. O snippet do carrossel ensinava
`--radius-button` numa seta arredondada por `--radius-full`.

**3e. Semântica HTML**:
- Headings: `<h2>` seções, `<h3>` sub-divisões, nunca pular nível, nunca `<h1>`
- Tabelas: `<thead>` + `<th scope>`
- Listas: `<ul>`/`<ol>` semânticos
- Links internos Storybook: `window.top.location.href`
- Links externos: `target="_blank" rel="noopener noreferrer"`
- Toda âncora do `DocsNav` tem `<section id="...">`

**3e2. Leitor de tela** — nada aqui falha em teste ou axe; só aparece no NVDA:
- Um `<main tabindex="-1" aria-labelledby="<id do h1>">` por página, inclusive
  nas de layout próprio (foundations, catálogos). Zero `<main>` aninhado.
- Nenhuma live region (`role="alert"`, `aria-live`) em conteúdo estático.
- Clicar num item do `DocsNav` move o foco para a seção, não só rola.
- Snippet renderizado como HTML não pode virar controle real: procure
  `<select>`/`<textarea>`/`<input>` vindos de string de código ou de prosa.
- **Idioma do documento QUE O LEITOR LÊ.** Dentro do Storybook é o `iframe.html`,
  não o manager. `useSeoEffect` escreve metatag no documento pai — correto para
  SEO, insuficiente para `lang`: o iframe fica no `lang="en"` do template e a
  prosa em português sai com pronúncia inglesa (WCAG 3.1.1, **nível A**).
  A regra `document_lang_so_no_pai` cobre o mecanismo; aqui julgue o resto —
  trecho em outro idioma marcado com `lang` (3.1.2, AA) onde a voz erra de fato,
  e **não** em empréstimo já absorvido (`menu`, `link`, `card`), que só deixa a
  fala picotada. Ver `01-acessibilidade.md` §"Idioma do documento".

**3f. Tokenização** (do Grep do Passo 1): zero `h-5` a `h-12` / `size-5` a `size-10` em UI primitives. Exceções: `[&_svg]:size-4`, `min-h-16`, `px/gap/py-*`. Ver `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

**3g. Tipografia + tabelas** (do Grep do Passo 1): zero `text-[9px]`/`text-[10px]` em corpo, zero tabelas dentro de `<ComponentDemo>`, zero wrappers com `overflow-hidden` (correto: `border rounded-xl overflow-x-auto p-4 shadow-sm`).

**3h. Higiene `.nds-*`** (dos Greps do Passo 1): zero peso/tracking redundante sobre `nds-text-h1..h4`, zero `nds-text-foreground` junto de `nds-text-body`, zero `nds-text-muted-foreground` em `<p class="nds-text-body">` de corpo, zero `style` inline em docs pages, `<h2>` sempre com `nds-text-h2`, `<Table>` sem wrapper de borda. Regras em `_dev-shared.md` §Higiene.

**3i. Stories ↔ docs page — mesmo exemplo, mesmas classes**:
Nenhum check anterior ligava os dois artefatos, e eles divergiram em silêncio: a mesma composição tinha 4 exemplos diferentes entre stacks e continha markup que já havia sido corrigido só na docs page. Verifique:
- **Mesmo exemplo**: a story de cada variante/estado/composição demonstra o MESMO caso da seção correspondente da docs page (mesmos rótulos, mesmos dados). A story é o que o Chromatic fotografa; se divergir, a regressão visual protege outra coisa.
- **Mesmas classes**: o markup da story usa as mesmas classes `nds-*` do exemplo da docs page.
- **Vocabulário `nds-*`**: zero classe sem o prefixo em `*.stories.*`. Classes do Tailwind (`w-full`, `rounded-md`, `text-blue-500`, `min-h-[120px]`) não existem mais e são inertes — a story renderiza diferente do documentado sem nenhum erro.
- **Consome o componente**: a story importa de `components/ui/<slug>`; nenhuma reimplementa markup próprio.

---

### Passo 4 — Identificar gaps + corrigir

Para gaps diretos (adicionar play function, corrigir classe): corrija. Para gaps de criação inteira: descreva e crie se for parte do escopo do `stack`.

**Ao corrigir texto compartilhado**: varra TODAS as chaves pela afirmação
errada e confira **quais o container realmente renderiza** — chave não
consumida é correção que não chega ao usuário. Inclua `seo.*` na varredura.

**Story nova quebra paridade**: criar story só numa stack gera
`coverage_divergence`. Ou nasce nas 5, ou vira item do `FIXES-NEEDED.md`.

---

## Saída Esperada

Preencha cada célula com `✅` correto, `❌` ausente/bug, `⚠️` parcial. **Nunca deixe vazio**.

```
## Relatório de Qualidade — <component-slug>

### Cobertura de Stories
| Arquivo | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| <slug>.stories | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-states | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-compositions | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Play Functions
| Story | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| Playground completa | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Disabled (toBeDisabled + callback) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Sub-stories com play (100%) | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ |

### Controls + Actions
| Check | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| Playground tem args completos | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Playground tem callbacks com fn() | ✅/❌/N/A | ✅/❌/N/A | ✅/❌/N/A | ✅/❌/N/A |
| Variações com controls.disable | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Variações com actions.disable | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### API Reference
| Check | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| argTypes cobre a API real da lib | ✅ N/N | ✅ N/N | ✅ N/N | ✅ N/N |
| table.type + table.defaultValue preenchidos | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Sem control morto (control:false onde não encaminha) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Snippet acompanha os controls | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

> Use ratio `declaradas/props reais da lib` na primeira linha.

### Cobertura Documentada vs Implementada
| Categoria | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| testes.functional.item* → play steps | ✅ N/N | ⚠️ X/N | ✅ N/N | ✅ N/N |
| testes.accessibility (ARIA/teclado) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| testes.visual.item* → story existe | ✅ N/N | ✅ N/N | ✅ N/N | ✅ N/N |

> Use ratio `cobertos/total documentados` para mostrar progresso.

### Cobertura de Código (`vitest run --coverage <slug>`)
| Métrica | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| Linhas (≥90) | N% | N% | N% | N% |
| Funções (≥90) | N% | N% | N% | N% |
| Ramos (≥80) | N% | N% | N% | N% |
| Ramos descobertos ainda abertos | 0 | 0 | 0 | 0 |

> Última linha é o que importa: 0 significa "todo caminho alcançável tem teste,
> o resto está declarado com `c8 ignore` e motivo". Diferente de 0 → liste cada
> um em Gaps com o arquivo:linha e por que não foi fechado.

### Docs Page
| Check | React | Vue | Svelte | Vanilla |
|---|---|---|---|---|
| testes ≥4+4+4 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Acessibilidade completa | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Props 5 cols + extensibilidade | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokens + customizationTitle | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Semântica HTML + links | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokenização dimensões | ✅/❌ | ✅/❌ | ✅/❌ | N/A |
| Tipografia + tabelas | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Higiene .nds-* (redundância/style inline) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Gaps Encontrados
| Item | Stack | Problema | Ação |
|---|---|---|---|

### Score: X/10
```

---

## Commit

```bash
# Stage SÓ os seus caminhos. `git add -A` varre o que outra sessão
# deixou na árvore — já levou 55 arquivos de outra stack para um commit,
# e nesta casa reincidiu seis vezes numa campanha só. Liste os caminhos:
git commit -- <caminhos exatos que você tocou> -m "skill(quality): $ARGUMENTS"
```
