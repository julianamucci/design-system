# Fixes Pendentes

> **Reconciliação de 2026-08-17.** Este arquivo é um log cronológico que ia de
> 2026-07-30 a 2026-08-09 e acumulou 41 itens marcados como abertos. Entre 11 e
> 17 de agosto rodou a revisão serial dos 50 componentes nas 5 stacks, e o
> arquivo ficou para trás: itens escritos no calor de uma rodada e nunca
> revisitados.
>
> Os 41 foram conferidos **um por um contra o código**, não contra o texto daqui.
> Resultado: **22 resolvidos**, **12 ainda abertos**, **7 mudaram de forma**. Um
> dos 12 foi medido e fechado no mesmo dia (o de `markup_in_text_surface`), então
> a lista abaixo tem **11**.
> Os resolvidos estão marcados `[x]` no corpo, com o commit que os fechou. Os
> que mudaram de forma estão anotados no corpo e reescritos abaixo — porque o
> texto antigo deles virou **falsidade ativa**, não apenas desatualização.
>
> Duas lições de método que o próprio arquivo ensinou:
>
> - **Um item guardava um diagnóstico errado como se fosse conclusão.** O de
>   foco inicial em Cancelar (L946) recomendava "corrigir o texto, não o código
>   — a implementação está certa nos 4 casos". Fez-se o oposto, e o oposto
>   estava certo: a sonda provou que o texto estava correto e a implementação
>   errada no Svelte.
> - **Um item afirmava uma política que não existe.** O do warning do Svelte
>   (L118) diz que "a política do projeto proíbe `svelte-ignore`", e a stack usa
>   `svelte-ignore` do exato rule em dois lugares.
>
> Registrar sem prazo de validade produz um arquivo em que não se pode confiar.
> Pendência que não cabe na rodada do componente que a descobriu deve nascer com
> dono e com forma de medir.

**Como ler este arquivo.** A lista de aberto abaixo é a **canônica**. Os mesmos
11 itens também continuam marcados `[ ]` mais abaixo, no log, no contexto em que
foram descobertos — então `grep -c "^- \[ \]"` conta 23, não 11. O log é
histórico; a lista de cima é o que está por fazer.

## Aberto de verdade — 8 itens

### Precisam de decisão da dona (2)

- [x] **`description` do alert-dialog: opcional no código, obrigatória na anatomia** (L73 do log). **Decidido pela dona (2026-08-17): a documentação alinha ao código — a descrição é opcional.** `anatomy.item6`, `usage.guidelines.item2`, `accessibility.item2`, `accessibility.aria.describedby` e `accessibility.screenReader.onOpen` reescritos nos três idiomas; os dois `v8 ignore` do Vanilla saíram; guidelines de react, vue e angular corrigidas. O caminho passou a ter contrato (`testes.accessibility.item8`) e story nas cinco (`WithoutDescription`). **Achado da medição**: das cinco, só o Vue quebrava — o `DialogContentImpl` do reka-ui gera o id da descrição sempre e ligava `aria-describedby` a um id inexistente (a própria lib avisa disso em dev). Corrigido no wrapper via registro da descrição.
- [x] **`defaultOpen` na tabela de props do alert-dialog, só no Svelte.** Medido em `bits-ui/dist/bits/dialog/types.d.ts`: a raiz expõe `open`/`onOpenChange`/`onOpenChangeComplete`, sem `defaultOpen`. As outras quatro têm a prop de verdade. **Resolvido (2026-08-17)**: a prop saiu dos dois lugares de `AlertDialogDocs.svelte` — a linha da tabela e o `interfaceCode` que o leitor copia — pela mesma convenção do `DropdownMenuDocs.svelte`, o comentário no lugar da linha. As outras quatro ficaram intactas.
- [ ] **Motor de múltiplos itens no carrossel Vanilla.** A fábrica desliza um slide por vez e não expõe base fracionária, com `coversNotApplicable` declarado. Trocar o motor, ou tirar o item do contrato das cinco.
- [x] **Dots do carrossel no Angular são botões numerados**; as outras quatro usam `.nds-carousel-dot`, classe que não aparece em arquivo nenhum do Angular. Alinhar muda a foto do Chromatic. **Resolvido (2026-08-18), junto com o redesenho da paginação aprovado pela dona.** O Angular passou a usar `.nds-carousel-dot` na story de composições E na docs page; as cinco montam a MESMA fileira. O padrão novo: o slide atual vira uma pílula rotulada ("Slide N") na própria posição da fileira, os demais continuam pontos, e a mudança de forma anima por `grid-template-columns: 0fr → 1fr` com `--duration-base`/`--ease-size` (mesmo mecanismo do painel do accordion, sem biblioteca de animação). Contrato novo nas cinco: `testes.functional.item8` e `testes.accessibility.item6`.

### Dívida de fundação, sem dono de componente (3)

- [ ] **Keyframes de dialog e select duplicam `nds-animate-in/out`.** Mesmo desenho (`opacity` + `scale(0.95)`), nomes distintos — por isso a regra de keyframes duplicadas não os pega. **Atenção: o timing difere.** As compartilhadas usam `--duration-spring`/`--ease-spring`; dialog usa `--duration-base`/`--ease-entrance` e select `--duration-fast`. Migrar **muda o movimento**, não só remove duplicação.
- [ ] **Classes de movimento não documentadas na foundation page de Motion.** `nds-animate-in`, `nds-animate-out`, `--ease-spring` e `--duration-spring` não aparecem no conteúdo compartilhado em nenhum dos três idiomas. Pior: o texto atual diz que spring existe "apenas via biblioteca", o que contradiz por omissão o token que o sistema passou a ter.
- [ ] **`test:coverage` fora do CI.** A justificativa antiga — "passaria vazio ou falharia por threshold" — **está obsoleta**: as quatro suítes de navegador estão 100% verdes (react 694, vue 685, svelte 693, vanilla 716 testes). Há duas ações destravadas no mesmo lugar: pôr `test:coverage` no CI, e remover o `continue-on-error: true` de `test.yml`, cujo próprio comentário diz "quando todas chegarem a 100%".
- [x] **A cobertura de `markup_in_text_surface` foi medida — os 10 prefixos bastam.** (Aberto e fechado em 2026-08-17.)

  Nasceu como "a regra não cobre `import.*`, `demonstration.*` e header, então está a zero por não olhar, não por medir". Hipótese razoável, e **falsa nos dois pontos**.

  **Primeiro:** `import.` tem 94 chaves e `demonstration.` 464, mas **nenhuma delas tem markup**, e `header.` não existe como prefixo. Rodei o auditor com os três adicionados: **0 achados novos**.

  **Segundo:** a superfície com markup que fica fora da lista é outra — `accessibility.` fora de `keyboard.` (447 chaves), `anatomy.` (290), `usage.` fora dos dois sub-prefixos cobertos (284), `variants.` (246), `notes.` (190). Mas **todas caem em `innerHTML` sanitizado**. Dentro dessas seções, o único caminho de textNode são `<secao>.title` e `anatomy.structureLabel` — varri os **2.175** campos desse tipo (3 idiomas × 48 componentes) e **zero têm markup**.

  Conclusão: os 10 prefixos cobrem a superfície de risco real. A regra estar em zero é **higiene**, não ponto cego. Envolver as famílias "descobertas" reintroduziria o defeito que a regra existe para pegar — foi o que a conferência já tinha provado em `accessibility.aria.*`.

  **Armadilha de método, para quem revisitar:** um filtro por sufixo de chave (`/\.label$/`) devolve 54 falsos "títulos com markup" — são `props.table.label` (descrição de uma prop chamada "label"), `variants.items.label` (variante chamada "label") e `accessibility.aria.label` (descrição do atributo). **Nome de chave não diz destino**; só o container diz.

### Divergência cross-stack do carrossel (3)

- [ ] **`class` do `CarouselContent` cai em nós diferentes.** Nas três stacks com lib vai para o **track**; no Vanilla e no Angular vai para o **recorte**. Três primitivos a mexer, com Chromatic a reboque.
- [x] **Track horizontal do Vanilla não declara `data-orientation`.** RESOLVIDO (2026-08-19, `230602c6`): a dona decidiu alinhar, e o atributo passou a ser escrito nos dois eixos.
- [ ] **Conteúdo compartilhado do carrossel descreve a API do Embla** — **parcialmente resolvido em `a9817257`**: saíram as menções em `description`, `accessibility.item5`, `notes.tip1`, `notes.tip4`, `props.table.opts` e `props.table.plugins`, e o `seo.*` foi limpo em `2752f0eb`. **O que resta**: `basis-*`, `-ml-4`, `pl-4` e `h-[400px]` em anatomia, guidelines, variantes e dicas — vocabulário do framework utilitário que saiu, não nome de lib. Nenhuma dessas chaves é `*Code`, então o auditor de literais segue cego a elas. Trabalho de `ux-writer`.

## Mudaram de forma — 7 itens reescritos

- **Warning `a11y_no_noninteractive_tabindex` no Svelte.** O item dizia "aceitar 1 warning por build, porque a política proíbe `svelte-ignore`". Hoje a stack faz as **três** coisas ao mesmo tempo: aceita o warning (`code-block.svelte`, `table.svelte`), usa `svelte-ignore` do exato rule (`drawer-body.svelte`, `sheet-body.svelte`) e usa `role="region"` (`DialogStory.svelte`). A afirmação de política é falsa. **Vira: uniformizar o tratamento da região rolável no Svelte.**
- **Icons sem folga de timeout.** Duas premissas caíram: não são 120s nas quatro (react é 60s), e o axe **não** está mais desligado no react — o comentário no código diz que o catálogo inteiro sob o axe cabe no timeout, "ao contrário do que a nota antiga supunha". O commit `6a045c28` atacou por outro caminho: catálogo em JSON compartilhado, bundle de 1.26MB para 595KB. **Vira: assimetria do Icons — svelte fora da fumaça e grid não virtualizado (2003 ladrilhos).**
- **"Foco inicial em Cancelar".** Ver a nota de método no topo. O código foi corrigido, não o texto, e as chaves citadas no item (`functional.item1`, `functional.item6`) não existem mais — a seção virou `testes.*`. **Vira: registro histórico, fechado por `b9975914`.**
- **Rótulos das composições do alert-dialog.** A divergência persiste, mas **os lados trocaram**: hoje as stories das cinco e o conteúdo compartilhado estão alinhados na forma imperativa, e quem diverge são as docs pages de Vue e Svelte, na forma interrogativa. "Publicar agora" desapareceu do repo. **Vira duas coisas: (a) Vue e Svelte alinham ao compartilhado; (b) react/vue/svelte/vanilla deveriam ler `demonstration.labels.*` como o Angular faz, em vez de cravar.**
- **Gap do `coverage_divergence`.** Foi feito **e superado**. A regra ganhou o gatilho de razão que o item pedia (com o comentário citando "12 asserções contra 21"), e depois o eixo mudou: a razão é **suprimida** quando o contrato está resolvido nas cinco, porque ali a contagem por story mede distribuição, não cobertura. `--contract-status` hoje: **48 de 48**. **Vira: registro de como a comparação por contagem foi aposentada em favor do contrato declarado.**
- **`toPlainText` container por container.** O auditor está a zero e o bloco grande do item **não descreve mais o código**: as 185 chaves `accessibility.aria.*` com markup alimentam `DocsAccessibility items`, que renderiza HTML sanitizado — ali **não envolver é o correto**, e envolver reintroduziria o bug que o item cita. **Vira regra fechada, não fila de 264 chaves.**
- **`aria-disabled` nas setas do carrossel.** Virou 3×2, não 2×3: o Svelte passou a escrever o par. A divergência a resolver é só em React e Vue — bem menor do que o item descreve.

---

## Log histórico — 2026-07-30 a 2026-08-09

O lote completo (opção 3) foi aplicado. Sobrou **um** item, e ele precisa de
decisão sua — não é trabalho parado por falta de tempo.

---

## Aberto — precisa de decisão

- [x] **RESOLVIDO (2026-08-07) — o idioma nunca chegava ao documento que o leitor
  de tela lê.** `langDocs = isIframe ? [targetDoc, document] : [document]` nas 4
  stacks: metatag segue no pai, `lang` vai nos dois. A suíte de fumaça passou a
  afirmar `document.documentElement.lang === 'pt-BR'` dentro do iframe — 63
  páginas no React, 62 no Svelte, 64 no Vanilla, 62 no Vue. A regra
  `document_lang_so_no_pai` do `audit.mjs` ficou verde, e ganhou irmã
  (`document_lang_sem_prova`) que acusa se a asserção da fumaça sumir.

  Marcação estrutural também aplicada: `lang="en"` no `<pre>` do CodeBlock (todo
  snippet do design system) e nas células monoespaçadas de `DocsProps` e
  `DocsTokens` (nome de prop, tipo, token, seletor). **Segue aberto** o passo 2:
  o glossário curado de ~20 termos na prosa do `translations.json`.

  Registro do que era, para não voltar: `useSeoEffect` resolvia o alvo assim:

  ```ts
  const targetDoc = isIframe ? window.parent.document : document;
  targetDoc.documentElement.lang = localeStr;
  ```

  Dentro do Storybook, `targetDoc` é o **manager**. O conteúdo das docs e das
  foundations vive no `iframe.html`, que o Storybook serve como
  `<html lang="en">` (conferido no `storybook-static`) e que nada nunca
  atualiza. Resultado: toda a prosa em português é anunciada com regras de
  pronúncia do inglês. É **WCAG 3.1.1, nível A**, no documento que importa.

  A guideline `01-acessibilidade.md` §"Idioma do documento" já manda fazer
  certo — quem diverge é a implementação, não a regra.

  O passo que segue aberto: glossário curado (~20 termos) marcado na prosa do
  `translations.json`. **Não** marcar os 87 termos que a varredura acha —
  `menu`, `link`, `card` e `mobile` já são lidos bem por voz em português, e
  forçar troca de idioma neles deixa a fala picotada. Volume medido: 5.185
  ocorrências no total, 1.179 em prosa contra 302 dentro de `<code>`.

- [x] **`slider > Em Formulario` reprova no axe por `target-size`, só em Vue e  
      **RESOLVIDO** (conferido 2026-08-17) — 87ee6a92
  Svelte (2026-08-07).** Medido nas quatro: react e vanilla passam, vue e svelte
  falham com "16px by 16px, should be at least 24px" e "insufficient space to
  its closest neighbors".

  O CSS compartilhado dá a hit-area por `.nds-slider-thumb::after { inset:
  -0.25rem }` — 16+8 = 24px, exatamente o que a guideline promete em WCAG 2.5.8.
  Como duas stacks passam com o mesmo CSS, a diferença está no DOM que cada lib
  monta em volta do thumb, não na regra. Achado ao rodar a suíte depois do lint;
  é anterior a esta rodada e não foi diagnosticado.

- [x] **Classe utilitária não vence CSS de componente — e a docs page prometia  
      **RESOLVIDO** (conferido 2026-08-17) — fb301ab1
  que sim (2026-08-07).** `utilities.css` é importado na linha 13 do bundle e o
  CSS dos componentes a partir da 31: mesma especificidade, quem vem depois
  ganha. Então `class="nds-max-w-sm"` num `.nds-alert-dialog-content` não muda
  a largura — medido, o painel continua em 512px.

  Corrigi o texto do alert-dialog, que prometia "ex.: uma largura máxima
  diferente", e a story nova (`ClasseExtra`, nas 4 stacks) passou a demonstrar
  propriedade que o componente **não** declara. Mas a regra vale para o design
  system inteiro e ninguém a documentou: **classe extra só alcança o que o
  componente não define**.

  Decisão sua: (a) deixar como está e documentar a regra na guideline de
  extensibilidade, ou (b) mover `utilities.css` para depois dos componentes —
  inverte a precedência em 48 componentes de uma vez, e o que hoje é ignorado
  passa a valer, inclusive onde ninguém esperava.

- [x] **`description` do alert-dialog: opcional no código, obrigatória na
  anatomia (2026-08-07).** A factory do Vanilla declara `description?: string`
  e a props table diz "Obrigatório: Não"; a anatomia (`anatomy.item6`, texto
  compartilhado) diz "descrição obrigatória. Fonte do aria-describedby". React,
  Vue e Svelte também permitem omitir — é um componente separado.

  **Fechado em 2026-08-17 pela decisão da dona: a documentação alinha ao
  código.** Ver o item correspondente na lista canônica, no topo do arquivo.

- [x] **92 cliques cegos em 14 componentes (2026-08-07).** Regra nova  
      **RESOLVIDO** (conferido 2026-08-17) — 7b88514c
  `play_nao_idempotente`. São plays que clicam e asseveram estado no mesmo alvo:
  passam no vitest (que remonta) e falham no replay do painel Interactions (que
  não remonta). Medido depois de corrigir o accordion, que zerou:

  ```
  collapsible 24 · toggle-group 16 · toggle 13 · switch 10 · radio-group 6
  select 6 · tabs 6 · checkbox 4 · navigation-menu 2 · carousel 1 · command 1
  dropdown-menu 1 · pagination 1 · popover 1
  ```

  O conserto é mecânico e está descrito em `/quality` §2e2b — o par
  `abrir`/`fechar`. Vale fazer componente a componente, junto da auditoria de
  cada um, e não num lote só: em toggle e collapsible o volume sugere que a
  story inteira precisa de releitura, não só a troca de chamada.

- [x] **`collapsible` do accordion — FECHADO (2026-08-17).** Decisão da dona: o
  comportamento é `true` nas cinco. Como `false` deixou de ser alcançável, a prop
  **saiu da API pública** — a alternativa (documentá-la como `true` fixo) manteria
  um booleano com um valor legal só, e a medição mostrou que ela nunca foi
  contrato: **três** libs de cinco não têm o conceito (`@base-ui/react`,
  `bits-ui` e `@radix-ng/primitives` fecham o item aberto incondicionalmente,
  conferido no `.d.ts` e no `dist`), e o item anterior deste arquivo errava ao
  contar o Svelte entre as que tinham. Só `reka-ui` a expunha, com `false` por
  omissão — e é por isso que a stack Vue passou a fixá-la por dentro, fora da
  API. O `v8 ignore` do ramo saiu junto com o ramo. O contrato
  `testes.functional.item2` passou a ser exercido também pela story
  `CloseOnSecondClick`, que monta o modo único **sem configuração nenhuma** e
  sobrevive ao replay do painel Interactions.

- [x] **Warning `a11y_no_noninteractive_tabindex` no primitivo Svelte.**  
      **MUDOU DE FORMA** (conferido 2026-08-17) — o texto deste item foi SUBSTITUÍDO na seção "Mudaram de forma", no topo. Não use o texto abaixo.
  A região de scroll do CodeBlock tem `tabindex="0"` de propósito: é o que
  permite rolar o bloco sem mouse (WCAG 2.1.1), e está documentado na própria
  docs page.

  Minha instrução era resolver com `role="region"`. **Não resolve** — conferi na
  fonte do compilador (`svelte/src/compiler/phases/2-analyze/visitors/shared/a11y/index.js:315`):
  a regra só aceita roles **interativos** (descendentes de `widget`), e `region`
  e `group` são não-interativos por definição.

  As saídas são três, todas com custo:
  1. **Aceitar o warning** (estado atual) — 1 warning por build na stack Svelte.
  2. `role="textbox"` ou `tabpanel` — silencia, mas é semanticamente errado, e
     repetido nos ~20 blocos da docs page ainda arriscaria o `landmark-unique`
     do axe.
  3. `svelte-ignore` documentado — a política do projeto proíbe.

  Aplicar qualquer role só no Svelte criaria divergência de árvore de
  acessibilidade contra as outras 3, que usam `<div tabindex="0">` sem role. Por
  isso ficou como está.

---

## Aplicado nesta rodada

Containers (nas 4 stacks): `trackId` estável no `DocsVariants` (o `snippet_id`
deixou de ser o nome traduzido), `extensibilityCode` no `DocsProps` (React, Vue
e Svelte — o Vanilla já tinha, e os overrides do Vue e do Svelte eram código
morto), `description` das 3 sub-seções no `DocsTestes` (o Vue declarava e nunca
renderizava; as outras nem declaravam).

Stories: 15 novas por stack — `code-block-variantes` (6), `-estados` (5),
`-composicoes` (4). Nomes idênticos nas 4. **16/16 verdes em cada.**

Play do Playground: `[role="status"]` em vez de seletor por classe,
`aria-live="polite"`, `aria-hidden` no gutter e no ícone, `Tab` + `{Enter}`
(não `click`), foco na região de scroll, reset em 2s.

Locais: Do & Don't par 2 alinhado ao Vanilla nas 4, `component-slug` no Vue,
toggle "Ver código" no Vue e no Vanilla, `footer` no transform do Svelte,
`nds-w-full` por bloco, nav lendo de `ui.json`, `block_empty` do Svelte
resolvido, segundo bloco de Importação restaurado no React.

Fora do componente: emoji removido de `accordion`, `alert` e `button` (os 3
últimos dos 48 fora da regra), `Vanilla` acrescentado ao `aiEntities`, e o
`ComponentDemo` do React trocando Tailwind inerte por `.nds-*`.

---

## Precisa de validação visual sua

Duas mudanças alteram pixels e não têm cobertura de regressão até o próximo
Chromatic:

- **`ComponentDemo` (React)** — as classes eram Tailwind inertes desde a
  migração: o container renderizava **sem** padding, centralização ou superfície.
  Agora renderiza com. Afeta 3 arquivos que o usam.
- **Reset global de `box-sizing`** (pendência anterior) — 34 regras com dimensão
  fixa + padding.

---

## Calendar — RESOLVIDO (2026-08-08)

A auditoria de qualidade deixou três itens registrados e eles foram fechados na
mesma data. Nenhum virou story-fantasma: story que renderiza uma coisa e diz
outra no texto é pior que story nenhuma — o Chromatic fotografa o nome de um
recurso ao lado da imagem de outro, e a play não tem o que afirmar. Foi assim
que `WithOutsideDays` e `RangeWithMiddle` no Vanilla e `RangeFallback` no Svelte
existiram; saíram, e voltaram só quando o recurso passou a existir.

- [x] **Vanilla: dias de fora do mês, intervalo e legenda com seletores.** A
  factory ganhou `showOutsideDays` (padrão ligado), `mode: 'single' | 'range'`
  com `data-range="start|middle|end"`, e `captionLayout: 'label' | 'dropdown'`.
  `functional.item3` e `item7` deixaram de ser "não aplicável" e passaram a ser
  verificados — a declaração de não-aplicável foi removida, porque com o
  recurso no lugar ela viraria mentira.

  De quebra: o CSS estilizava o dia escolhido por `[aria-selected="true"]`, e a
  factory nunca setou esse atributo. **O dia selecionado nunca teve destaque
  visual no Vanilla.** A chave passou a ser `data-selected` no botão, e o
  `aria-selected` foi para a célula, que é quem tem papel de `gridcell`.

- [x] **Composição Calendar dentro de Popover (DatePicker), nas 4 stacks.**
  `calendar-composicoes.stories.*` em react, vue, svelte e vanilla: botão que
  mostra a data escolhida, abre o calendário no popover, e fecha ao escolher.
  Cobre `visual.item5`, que estava documentado e sem story em stack nenhuma.

  A story do Vue pegou um erro de fuso na escrita: `toDate('UTC')` formatado no
  fuso de quem lê devolve o dia anterior a oeste de Greenwich.

- [x] **`coverage_divergence` em Selected, Disabled e Single.** Fechou junto: as
  asserções acrescentadas nas stacks mais magras equilibraram a proporção.

Resultado: `node scripts/audit.mjs calendar` zerado e contrato **18/18 nas
quatro**.

## Calendar: extras de stack que não são variante do sistema (2026-08-08)

A revisão de paridade deixou três stories que existem numa stack só. Nenhuma é
bug — são recursos que a lib daquela stack dá de graça e as outras não têm. O
registro existe para ninguém as promover a variante do sistema sem antes
entregá-las nas quatro.

- **`WithWeekNumber` (React).** `showWeekNumber` é do react-day-picker. Vue e
  Svelte não controlam a grade, então nem implementando no Vanilla chegaria a
  4/4. A promessa saiu do `translations.json` e da tabela de variantes; a story
  ficou, porque é ela que cobre o override do `WeekNumber` que corrige um
  `scope-attr-valid` do axe.
- **`WithFixedWeeks` (Vue).** Seis linhas de semana sempre, do reka-ui.
- **`Bordered` / `Bare` / `NavegacaoPorTeclado` (Vanilla).** As duas primeiras
  verificam a composição de classe da factory; a terceira prova a navegação por
  teclado que o Vanilla ganhou nesta série — nas outras três a prova mora no
  Playground.

Falta de verdade só uma: **`Range` e `RangeWithMiddle` no Svelte**, porque o
bits-ui não tem calendário de intervalo. Já está declarado com
`coversNotApplicable` em `functional.item3`.

## Tipografia: 13 tamanhos fora da escada (2026-08-08)

A escada de controle (`--text-control-xs…xl`) cobriu 155 das 168 declarações de
`font-size` do CSS compartilhado, sem mudar um pixel. Sobraram 13 valores que
não são degrau de nada, e snapá-los mudaria o desenho — por isso ficam aqui, e
não numa troca silenciosa:

| Valor | Onde | Degrau mais perto |
|---|---|---|
| `0.8125rem` (13px) | code-block, docs-swatches, select (6×) | 12 ou 14 |
| `0.8rem` (12.8px) | calendar (3×) | 12 |
| `1.875rem` (30px) | app-shell, utilities (2×) | prosa, não controle |
| `1.75rem` (28px) | docs-swatches (1×) | prosa, não controle |
| `0.6875rem` (11px) | kbd (1×) | 10 ou 12 |

Os dois de 28–30px são tamanho de display: provavelmente devem ler a escada de
**prosa** (`--text-h2`/`--text-h3`), não a de controle. Os outros três grupos
são off-grid de tipografia, o equivalente ao "px fora do grid de 8" que o
comentário do spacing já proíbe.

A regra `type_ramp_literal` do audit **não** acusa nenhum deles de propósito:
ela só pega literal que é exatamente um degrau, que é a regressão de verdade.

## Backlog anterior, não tocado aqui

- `button`: 53 violações de audit (39 `noop_assertion`), pré-existentes.
- Breadcrumb com `item: '/components/<categoria>'` fixo ao lado de `name`
  dinâmico, em 20+ docs pages — refatoração ampla, não cabia neste lote.
- Nav "Estados" (`ui.json`) × heading "Configurações" (`states.title`) no
  code-block: decisão de conteúdo, não de código. O `ui.json` é global (48
  componentes), então mudá-lo por causa de um componente seria pior.

## Lint svelte: RESOLVIDO (2026-08-01)

Os 271 warnings foram zerados em 2 commits (936a4897 docs, 80661d41 ui):
eslint . com 0 problems, svelte-check 750 -> 748.

## Backlog de testes — svelte (pré-existente, medido em 2026-08-01)

A suíte completa (vitest storybook) tem 50 de 180 arquivos falhando. Verificado
por restauração seletiva que NÃO é do lote de lint: tooltip e toggle-group
falham identicamente antes e depois (8/8). É o equivalente svelte dos 61
failures do React já registrados — backlog de correção de primitivos/stories,
não de lint.

## Skills órfãs pré-históricas — REMOVIDAS (2026-08-01, aprovado pela dona)

Os 4 arquivos de `nortear-design-system-react/guidelines/.claude/skills/`
(sistema anterior ao `.claude/commands/`, sem nenhuma referência, ensinando
"variantes customizadas sempre via className") foram apagados. Era o
reservatório mais antigo do padrão morto que regenerava as stories erradas.

## Achados da fumaça do AlertDocs (2026-08-01)

- ~~Violação axe heading-order (AlertTitle h5 sob seções h2)~~ — **RESOLVIDO**:
  `as` configurável no AlertTitle nas 4 stacks (aprovado pela dona), docs pages
  passam `as="h3"`. Axe da página do Alert zerou, com verificação negativa
  (reintroduzir o h5 reproduz exatamente heading-order).
- ~~nenhuma story monta docs pages~~ — **RESOLVIDO (2026-07-31)**: suíte de
  fumaça `docs-smoke.stories.*` nas 4 stacks (commits 49d8fd7b react, f0f9c1a4
  vue, 3a65c0d5 vanilla, 34080de9 svelte). Toda docs page agora monta no
  runner; crash de página é teste vermelho. Página limpa tem axe como PORTÃO;
  a dívida axe restante está catalogada em modo `todo` nas seções por stack
  abaixo e na consolidação.

## Fumaça das docs pages — react (2026-07-31)

`docs-smoke.stories.tsx` no runner: 63 páginas, 41 limpas (axe = portão),
21 em `a11y.test: 'todo'`, 1 com a11y desligado só na story (icons — abaixo),
0 fora. Crash real encontrado e CORRIGIDO:
DropdownMenuDocs usava `DropdownMenuLabel` (Base UI `Menu.GroupLabel`) fora de
`DropdownMenuGroup`/`DropdownMenuRadioGroup` — as previews `defaultOpen`
derrubavam a página inteira no mount.

Dívida axe catalogada (rule ids por página, modo todo — visível no painel a11y):

| Página | Rules |
| --- | --- |
| accordion | landmark-unique |
| alert-dialog | nested-interactive, target-size |
| avatar | aria-prohibited-attr |
| breadcrumb | landmark-unique |
| calendar | landmark-unique, scope-attr-valid |
| carousel | landmark-unique |
| checkbox | target-size |
| collapsible | nested-interactive, target-size |
| command | aria-required-children, button-name, color-contrast |
| dropdown-menu | aria-hidden-focus |
| icons | color-contrast — CASO À PARTE: o catálogo inteiro do lucide (~1600 ícones, sem virtualização) faz o axe estourar 60s de timeout; a story está com `a11y: { disable: true }` em vez de 'todo'. Virtualizar/paginar o grid destrava o axe |
| menubar | aria-required-children |
| navigation-menu | aria-hidden-focus, landmark-unique |
| pagination | landmark-unique |
| radio-group | aria-toggle-field-name |
| resizable | scrollable-region-focusable |
| select | color-contrast, select-name |
| sidebar | landmark-no-duplicate-main, landmark-unique |
| skeleton | aria-prohibited-attr |
| sonner | landmark-unique |
| switch | aria-toggle-field-name |
| textarea | label |

Top 3 rules: landmark-unique (8 páginas), target-size (3), color-contrast (3).

Nota de contrato: as 16 páginas Foundations (FoundationPage/ThemeColors/Icons)
renderizam `<section>` SEM `id` — a play da fumaça usa `querySelector('section')`
em vez de `section[id]` para não dar falso vermelho em página que monta bem.
Dar `id` às seções de Foundations (âncoras) é melhoria futura cross-stack.

Infra: `testTimeout: 60000` no projeto storybook do vite.config.ts — docs
pages inteiras sob axe estouravam os 15s default com os 4 runners em paralelo
(e um timeout no meio da suíte vazava landmarks pra story seguinte: o
`landmark-no-duplicate-banner` fantasma do input-otp era isso).

## Fumaça das docs pages — vue (2026-07-31, commit f0f9c1a4)

63 páginas · 39 limpas (axe = portão) · 24 em todo · 0 crash.
`testTimeout: 120s` (IconsDocs leva ~75s legítimos sob axe).

| Página | Rules |
| --- | --- |
| avatar | aria-prohibited-attr |
| breadcrumb | landmark-unique |
| button | scrollable-region-focusable |
| calendar | landmark-unique |
| carousel | landmark-unique |
| checkbox | empty-heading, target-size |
| command | aria-required-children, button-name, empty-heading |
| icons | color-contrast |
| input | label |
| label | empty-heading |
| navigation-menu | aria-hidden-focus, landmark-unique |
| pagination | landmark-unique |
| radio-group | empty-heading |
| select | empty-heading |
| sidebar | empty-heading, landmark-no-duplicate-main, landmark-unique |
| skeleton | aria-prohibited-attr |
| slider | empty-heading |
| sonner | landmark-unique |
| switch | button-name, empty-heading |
| textarea | empty-heading |
| theme-system | heading-order |
| toggle | empty-heading |
| toggle-group | button-name, empty-heading |
| tooltip | button-name |

Top 3: empty-heading (11 páginas — h3 vazio recorrente nas seções, padrão
sistêmico só do Vue), landmark-unique (7), button-name (4).

## Fumaça das docs pages — vanilla (2026-07-31, commit 3a65c0d5)

64 páginas · 44 limpas (axe = portão) · 20 em todo · 0 crash.
`testTimeout: 45s` (IconsDocs ~20s sob axe). Nenhum vazamento de
observers/subscriptions entre os 64 testes em sequência.

| Página | Rules |
| --- | --- |
| accordion, breadcrumb, carousel, navigation-menu, pagination | landmark-unique |
| calendar, icons | color-contrast |
| context-menu | aria-required-parent, color-contrast |
| select | color-contrast, select-name |
| sidebar | color-contrast, listitem |
| dropdown-menu, menubar | aria-required-parent |
| input, slider, textarea | label |
| switch, toggle-group | button-name |
| avatar, chart | aria-prohibited-attr |
| checkbox | aria-toggle-field-name |

Top 3: landmark-unique (5), color-contrast (5), aria-required-parent e label
(3 cada).

## Fumaça das docs pages — svelte (2026-07-31, commit 34080de9)

63 páginas · 43 limpas (axe = portão) · 19 em todo · 1 fora (Icons, excluída
por decisão da dona — o catálogo lucide completo falha por timeout mesmo com
360s; comentário `// FORA:` no arquivo). `testTimeout: 120s`. Alert saiu limpo
nas 3 execuções (sanidade do harness).

Crash real encontrado e CORRIGIDO: **InputOTPDocs nunca montava nesta stack**
— usava a API React do input-otp (`<InputOTPSlot index={N}/>`) enquanto o slot
Svelte (bits-ui PinInput) exige `cell` → `TypeError: reading 'isActive'`. Os 8
sites renderizados foram corrigidos para `{#snippet children({ cells })}`.
**Dívida remanescente**: as code strings didáticas da página (codeSixDigits
etc.) ainda ensinam a API `index={}`/`maxLength` que não existe nesta stack —
mesmo padrão de "docs ensinando API velha" já visto no alert; corrigir na
revisão do input-otp.

| Página | Rules |
| --- | --- |
| avatar | aria-prohibited-attr |
| breadcrumb | landmark-unique |
| calendar | landmark-unique |
| carousel | landmark-unique |
| checkbox | button-name, empty-heading, target-size |
| command | aria-required-attr, aria-required-children, button-name, nested-interactive, target-size |
| dialog | scrollable-region-focusable |
| label | label |
| navigation-menu | landmark-unique |
| pagination | landmark-unique |
| popover | label |
| radio-group | button-name |
| select | color-contrast |
| sidebar | landmark-unique |
| skeleton | aria-prohibited-attr |
| sonner | landmark-unique |
| switch | button-name, heading-order |
| toggle-group | aria-allowed-attr |
| tooltip | button-name |

Top 3: landmark-unique (7), button-name (5), aria-prohibited-attr e
target-size (2 cada).

Bônus do portão: svelte-check caiu de 735/748 para **689** erros (novo
baseline).

## Fumaça das docs pages — CONSOLIDAÇÃO 4 STACKS (2026-07-31)

253 páginas no runner · 167 limpas com axe como portão · 84 em todo ·
2 crashes reais de produção encontrados e corrigidos (DropdownMenuDocs react,
InputOTPDocs svelte) · 1 página excluída (Icons svelte).

**Rules sistêmicas — um fix nos containers compartilhados limpa dezenas de
páginas:**

1. **landmark-unique** — 27 páginas nas 4 stacks (accordion, breadcrumb,
   calendar, carousel, navigation-menu, pagination, sidebar, sonner…). O demo
   renderiza `<nav>`/`<aside>`/`<header>` repetidos sem `aria-label`
   distintivo. Provável fix único no padrão de demo/preview.
2. **empty-heading** — 11 páginas, SÓ no Vue: alguma seção do Vue renderiza
   `<h3>` vazio quando a chave não existe. Fix em um container Vue.
3. **color-contrast / button-name / label / aria-prohibited-attr** — padrões
   por componente (avatar e skeleton falham aria-prohibited-attr nas 4 stacks;
   select falha select-name/color-contrast em 3) — fix no primitivo vale para
   as 4 stacks de uma vez.

**Assimetria da página Icons (a decidir na revisão):** react = `a11y.disable`
justificado na story · vue = roda com timeout 120s (75s reais) · vanilla =
roda com 45s · svelte = excluída da fumaça. Padronizar quando o grid for
virtualizado/paginado — isso destrava axe nas 4.

**Melhoria cross-stack sugerida pelos 4 agents:** as 16 páginas Foundations
renderizam `<section>` sem `id` nas 4 stacks — a play da fumaça precisou de
seletor relaxado. Dar `id` às sections de Foundations ganha âncora de
deep-link de graça e devolve a play estrita `section[id]`.

## Lote landmark-unique — RESOLVIDO em 22 páginas (2026-08-01)

Commits: `c9e9b736` vanilla · `62443ee2` svelte · `9f873e45` vue ·
`5a735585` react. Páginas em `a11y: todo` (total 4 stacks): 84 → 64 (as
tabelas por stack acima ficam superadas na família landmark-*).

Canon aplicado (agora regra em `_dev-shared.md` §Landmarks repetidos):
aria-label por instância = título visível do bloco via t(); Toaster único por
página; `<main>` só na Demonstração; nav de mês do Calendar não é landmark.
Provas bidirecionais por stack (pagination/breadcrumb/sonner) — reverter o
fix faz a rule voltar. Nenhum pixel, nenhum arquivo de `docs/shared/`,
nenhuma string inventada.

Bônus svelte: `</script>` literal não escapado em template string no
`SidebarDocs.svelte` quebrava o svelte2tsx de meio arquivo — escapado;
**svelte-check: 689 → 353 erros (novo baseline)**.

### Restos do lote — RESOLVIDOS (2026-08-01, arbitrados pela dona)

- ~~accordion~~ — a hipótese "categoria 4" tinha DUAS causas distintas:
  - **vanilla (`cf45697a`)**: NÃO era conteúdo — bug real de id duplicado no
    factory (`accordion-trigger-${value}` sem escopo de instância; 3
    accordions com `item-1` na página → `aria-labelledby` resolvia para o 1º
    id do documento e igualava as accessible names). Ids agora com escopo por
    instância. Zero mudança de conteúdo.
  - **react (`9f8f0de6`)**: colisão real de conteúdo (Demonstração e variante
    single abriam `q1`). A single usa itens próprios `q2/q3` do pool
    existente — `translations.json` intocado. Prova bidirecional em ambos.
  - Vue/Svelte nunca flagaram accordion. Ambas as páginas agora são portão.
- ~~navigation-menu popup (react)~~ — **`135dbd9d`**: `render={<div/>}` no
  Popup (wrapper `navigation-menu.tsx`), alinhado à referência vanilla.
  Provado em modo portão: só resta `aria-hidden-focus` (outro lote).
- ~~Calendar svelte~~ — **`0ea14661`**: `nav`→`div` no
  `calendar-nav.svelte` (markup do próprio projeto, não do bits-ui); página
  virou portão; svelte-check estável em 353.

**Saldo final do lote landmark: 84 → 60 páginas em todo; famílias
`landmark-unique`/`no-duplicate-main` ZERADAS nas 4 stacks.**

Paridade pendente (pré-existente, fora do lote): os previews de variantes do
accordion divergem entre stacks (vanilla usa strings locais "Pergunta 1",
react usa chaves t()) — candidato para o `/cross-stack accordion` na revisão
do componente.

## Série serial de dívida axe (2026-08-01) — 3 lotes, 1 agent por vez

Processo novo (ordem da dona): corrigir tudo → testar em bloco 1x → re-corrigir
só falhas; sem provas bidirecionais/canários redundantes.

1. **empty-heading (vue)** — `aa3d02bc`. Causa única:
   `DocsAccessibility.vue:49` renderizava o `<h3>` do bloco de teclado
   incondicionalmente com `keyboardTitle` opcional vazio; `v-if` matou as 11
   páginas. 7 viraram portão (label, radio-group, select, sidebar, slider,
   textarea, toggle).
2. **aria-prohibited-attr (4 stacks)** — `c7a38579` react · `06fe2ee7` vue ·
   `e31d6d82` svelte · `95642e61` vanilla. `aria-label` em elemento genérico:
   fallback de avatar com ícone → `role="img"`; dot de status e containers de
   loading do skeleton → `role="status"` (o vanilla já fazia certo no
   skeleton); chart rotulado → `role="img"` no call site. Snippets didáticos
   atualizados para ensinar o padrão. 8 páginas viraram portão.
3. **select (react/vanilla/svelte)** — `ea279e7a` · `e379fec9` · `cbc748d5`.
   Dois achados de valor além do axe:
   - **color-contrast**: `color: var(--primary-foreground)` SEM `hsl()` —
     declaração inválida (tokens são triplets), texto herdava `--foreground`
     sobre `--primary` = 1.1:1. Fix: classe `nds-text-primary-foreground`
     (como o Vue, que já era portão). CANDIDATO A VARREDURA: outros
     `var(--…)` de cor sem `hsl()` em estilo inline podem existir no repo.
   - **select-name**: prosa/snippet com `<select>` literal passando por
     `innerHTML`/`dangerouslySetInnerHTML` virava um `<select>` DOM REAL sem
     nome (react passava snippet JSX como notes; vanilla, 2 call sites sem
     escape). Select agora é portão nas 4 stacks.

4. **button-name (4 stacks)** — `56ddc376` vue · `9c4b32cc` svelte ·
   `2e21eb3a` react · `f61722b6` vanilla. Rótulos via chaves t() existentes
   dos blocos; rule ZERADA nas 4 stacks. Achados de valor:
   - **`role="combobox"` não aceita name-from-content** — o texto visível do
     trigger não conta como nome; todo combobox precisa de aria-label
     (command nas 4 stacks tinha isso).
   - **Bug real no svelte: `asChild` NÃO existe no bits-ui** — em
     `CommandDocs.svelte` o `<PopoverTrigger asChild>` virava
     `<button aschild="true">` wrapper SEM nome (e gerava nested-interactive
     + target-size no mesmo node). Trocado pelo snippet `child`.
   - Bônus: `DocsAccessibility.svelte` tinha o mesmo `<h3>` incondicional do
     Vue (lote 1) — mesmo fix aplicado.

- [x] **`asChild` fantasma no svelte — VERIFICADO E JÁ RESOLVIDO (2026-08-09).**
  Medido: zero ocorrências de `asChild` sendo passado como prop em qualquer
  `.svelte` da stack, e `ButtonDocs.svelte` não tem nenhuma menção. O que
  restou é legítimo — a chave de tradução `props.table.asChild` reusada na
  descrição do prop `child` (o nome real no bits-ui) em AlertDialogDocs,
  AspectRatioDocs e BreadcrumbDocs, o `ABSENT_PROPS` do AccordionDocs que
  declara a prop como inexistente, e o comentário do CommandDocs que registra o
  conserto. A varredura aconteceu junto com o lote serial de axe.

5. **Sweep final (4 stacks em paralelo, 1 agent por stack)** — `76e26247`
   react · `8b5492b3` vue · svelte (2 commits) · `f35c5ae2` vanilla ·
   `4b389ade` alinhamento cross-stack. 19 páginas viraram portão. Padrões que
   se repetiram e valem como regra:
   - **Snippet virando DOM real** (3ª e 4ª ocorrência): `extensibilityCode`
     passado como `extensibilityNotes` (react textarea) e `<input
     type="range">`/`<textarea>` literais em prosa vanilla — o parser HTML é
     case-insensitive, então `<Textarea/>` de snippet vira campo real sem
     rótulo. REGRA: snippet vai por CodeBlock; tag literal em prosa exige
     escape `&lt;`.
   - **Elementos com role custom não pegam name-from-content**:
     `role="radio"/"switch"/"checkbox"/"combobox"` renderizados como
     `<span>`/`<div>` precisam de `aria-label` — `<label for>` não nomeia
     elemento não-rotulável.
   - **`opacity` inline derrubando contraste** (vanilla, 4 páginas): dim
     decorativo em texto já muted levava a 1.5–3.7:1. Removido; o card
     semântico já sinaliza o don't.
   - **Primitivos corrigidos** (todos sem mudança de API/pixel):
     `calendar.tsx` react (nosso override repassava `scope` para `<td>`),
     `toggle-group.svelte` (o `role="toolbar"` era letra morta — bits-ui
     sobrescreve com `role="group"` — e sobrava `aria-orientation` inválido),
     `Table` nas 4 stacks (`tabindex="0"` no wrapper com overflow).

- ~~Divergência `role="toolbar"` no toggle-group~~ — **RESOLVIDO
  (2026-08-01, decisão da dona: alinhar pelo COMPORTAMENTO, não removendo o
  role)**. Correção de um erro meu de levantamento: o vanilla **declarava**
  `role="toolbar"` (via `setAttribute`, que meu grep por `role="toolbar"`
  não pegou) mas **não implementava** o contrato de teclado do WAI-ARIA APG
  — o leitor de tela anunciava "barra de ferramentas" e as setas não faziam
  nada. O react declarava E cumpria (roving tabindex, coberto por story).
  Vanilla ganhou ArrowLeft/Right/Up/Down + Home/End circulares e roving
  tabindex, com story cobrindo o contrato.
  **Lição de método**: "vanilla é a referência" é heurística, não dogma —
  aqui a referência era justamente quem estava errada, e o grep por
  `role="toolbar"` não via `setAttribute('role','toolbar')`.
  - **Resta divergente** (não bloqueia): svelte e vue emitem `role="group"`
    imposto por bits-ui/reka-ui, embora suas stories testem navegação por
    setas — o comportamento existe, o que difere é o anúncio. Forçar
    `toolbar` exigiria renderizar a raiz via snippet `child`/`asChild`:
    refatoração de primitivo, decisão futura.
- ~~Cores inertes no vanilla~~ — **RESOLVIDO (2026-08-01)**: `SidebarDocs`
  passou a usar `hsl(var(--sidebar-foreground)[ / 0.7])` e a classe já
  existente `.nds-bg-destructive-soft` no lugar do `color-mix` com o token
  inexistente `--color-destructive`. docs-smoke 64/64 — o axe aprovou o
  contraste real, sem precisar de ajuste de cor.

**Placar da dívida axe em `a11y: todo`: 84 (colheita) → 17** (verificado por
grep nos 4 arquivos de fumaça, não por soma de reportes).
Por stack: react 7 · vue 4 · svelte 3 · vanilla 3 (+1 `a11y.disable` no
Icons react). O que resta é decisão, não varredura: `target-size` (muda
pixel/primitivo), `aria-required-children/parent` (estrutura de
command/menubar/context-menu/dropdown), `aria-hidden-focus` (focus guards
internos do Base UI — recomendação: exceção documentada, não é corrigível do
nosso lado sem gambiarra).

Histórico anterior ao sweep (para referência): 36 páginas.
Rules restantes mais frequentes: target-size, aria-required-children/parent,
aria-hidden-focus (focus guards Base UI — provável exceção documentada),
aria-toggle-field-name, label, color-contrast (icons/calendar/command),
nested-interactive, scrollable-region-focusable, scope-attr-valid,
heading-order, listitem, aria-allowed-attr.

### Pré-existências confirmadas fora do escopo (provadas com stash)

- react: `aria-hidden-focus` dos focus guards do Base UI em stories `ui/*` +
  `data-active` em pagination-variantes (6 falhas).
- vue: 12 falhas em stories de carousel/navigation-menu/sidebar + calendar
  Playground (`role "grid"` ausente).
- **vue MotionDocs — `color-contrast`: NÃO reproduz mais; não há o que
  corrigir.** Este item mudou de diagnóstico três vezes e as duas primeiras
  leituras foram minhas e erradas ("flaky sob carga"; depois "violação real
  de 1.88"). A terceira — que eu também escrevi — atribuía a violação ao
  congelamento de animação em headless. **Também errada**, e agora com
  evidência: a story `Motion` do docs-smoke do Vue nunca teve
  `a11y: { test: 'todo' }`, sempre rodou o axe completo e passa. O motivo
  técnico é que `motion-v` anima via JS/rAF, que **avança** em headless — o
  congelamento atinge keyframes CSS, não animação por script. Os números
  díspares (1.01, 1.02, 1.88) eram amostras de execuções sob carga que não se
  sustentam. Fechado por ausência de defeito, não por correção.
  **Lição de método**: três diagnósticos sucessivos sem reproduzir de forma
  controlada. O correto teria sido isolar a story antes de teorizar.
  **QUARTO diagnóstico — 2026-08-02, este correto e com medição.** O
  "fechado por ausência de defeito" também estava errado: o defeito existe e é
  uma **corrida**, não contraste. A play `mounted` do docs-smoke retornava no
  mesmo quadro da montagem e o axe (postVisit) media enquanto os elementos
  ainda estavam em `opacity: 0` — daí `1.01 (#fdfdfd sobre #ffffff)`. Passava
  por sorte, e por isso "não reproduzia": dependia do tempo de render das
  páginas anteriores da suíte. Medido em par: árvore em `HEAD~1` 63/63, árvore
  com a seção de leitor de tela 62/63, mesma máquina, falha determinística.
  Corrigido em `256af081` com uma play `settled` que só devolve quando nenhum
  elemento resta com `opacity` inline < 1. **Lição**: "não reproduz" sob uma
  suíte compartilhada não é ausência de defeito — é ausência de controle sobre
  o tempo. Teste racy fecha como corrigido, nunca como inexistente.
- svelte: 15 falhas de interação em stories de pagination/navigation-menu/
  sidebar (backlog dos 50/180).
- vanilla: `target-size` nos dots de 8px em `carousel-composicoes > Com Dots`.

## Lote alert — demo por capacidade + stories dismissible (2026-08-01)

Commits: `711b6c4e` vanilla · `3602dce3` svelte · `b468603b` vue ·
`f7950616` react (+ chave `demonstration.labels.warningAction` nos 3 locales).

Demo da AlertDocs deixou de repetir o mesmo alert 4×: default sem título,
destructive com título, success dismissible (emitindo `alert_dismiss` com o
payload já usado nas Variantes), warning com ação inline.

**As stories Dismissible/DismissibleTeclado "não carregavam" — causa real:**
a play function FECHAVA o alert e a asserção final era ele ter sumido. Como a
play roda sozinha ao abrir a story, o canvas ficava VAZIO — e o Chromatic
fotografava vazio. Agora um alert novo remonta após o fechamento, e a prova
ficou mais forte: guarda o nó ORIGINAL e assere `not.toBeInTheDocument()`
(o `queryByRole(...) === null` anterior não distinguia "fechou" de "nunca
montou").

### Divergências cross-stack abertas (decisão da dona)

- ~~Ação do alert: texto × comportamento~~ — **RESOLVIDO (2026-08-01)**:
  `1106b591` vanilla · `6347fa8a` svelte · `6d01486c` vue · `b6f2a73b` react.
  Não havia conflito: o texto ("alinhada à direita") sempre esteve certo. O
  componente tem o slot `AlertAction` (`.nds-alert-action` é
  `position: absolute; top; right`, e o próprio CSS documenta "quem precisa de
  ação usa a composição AlertAction"), e a story `ComAcao` sempre o usou. O
  erro foi meu: instruí os agents a empilhar o botão dentro da descrição, e as
  4 docs pages passaram a ensinar markup que quebra linha. Corrigido na demo e
  na composição (preview E snippet) das 4.
  **Lição**: quando story e docs page divergem, a story pode ser a certa —
  conferir qual das duas usa a API real do componente antes de "convergir".
- [x] **`AlertDescription` do Svelte renderiza `<section>`**, enquanto o  
      **RESOLVIDO** (conferido 2026-08-17) — 1ed7e51f
  vanilla (referência) usa `<div>`. Não há justificativa semântica para
  `<section>` dentro de um alert. Primitivo — ficou fora do escopo do lote.

## Motion — classes reutilizáveis de entrada/saída (2026-08-01)

Commits: `eccd694a` (tokens + classes + vanilla) · `f033037a` react ·
`ae9729f2` svelte · `109f4c6e` vue · `28c8db57` (guard na referência).

Referência aprovada pela dona: animação do popover do animate-ui
(spring stiffness 300, damping 25). Nenhuma biblioteca entrou.

- `--ease-spring: cubic-bezier(0.365, 0.565, 0.121, 1.163)` — **ajuste
  numérico**, não escolha visual: erro máximo de 3,1% contra a curva do
  spring, reproduzindo 2,7% dos 3,8% de overshoot. O otimizador está em
  `scratchpad/fit-spring2.mjs` e serve para traduzir qualquer outro spring.
- `--duration-spring: 400ms` — acomodação medida do spring (410ms).
- `.nds-animate-in` / `.nds-animate-out` em `utilities.css`, genéricas.

### Fato de ambiente que vale para TODA animação daqui em diante

**Em Chromium headless — o ambiente dos testes — animações de `opacity` e
`transform` não avançam**: ficam presas no quadro zero com
`playState: "running"` (animações de propriedades de layout, como o
`grid-template-rows` do accordion, avançam normalmente). Consequências:

1. Classe de animação de entrada tem de ser **transitória** (removida por
   `animationend` + timeout). Se persistir, o elemento fica invisível para
   sempre nesse ambiente — reproduzido: as stories dismissible falhavam em
   `toBeVisible`.
2. **Nunca depender só de `animationend`** para remover um nó: além do
   headless, `prefers-reduced-motion` suprime a animação e o evento jamais
   dispara. Timeout de segurança é obrigatório.
3. Asserção de visibilidade em elemento que anima precisa de `waitFor` — é
   racy em qualquer browser, não só no headless.
4. Explica o falso `color-contrast` do MotionDocs (acima).

### Próximos passos possíveis (não feitos)

- [ ] Dialog (`nds-dialog-zoom-in/out`) e Select (`nds-select-zoom-in/out`)
  já têm keyframes com exatamente o mesmo desenho (opacidade + escala 0.95).
  Podem migrar para as classes compartilhadas e eliminar a duplicação.
- [ ] Documentar as duas classes na foundation page de Motion das 4 stacks.

### Cobertura removida a pedido (2026-08-01)

- **Story `TokenIndivisivel`** saiu de `alert-composicoes.stories.ts` (vanilla)
  — a dona apontou, com razão, que não é composição. Mas era o **único guard**
  contra uma regressão real: sem o reset global de `box-sizing`, o
  `width: 100%` do `.nds-alert` media só a caixa de conteúdo e os 32px de
  padding-inline + 2px de borda saíam por fora, deixando o card 34px mais
  largo que o container e gerando rolagem horizontal (visível nas docs pages,
  onde o alert ocupa a largura toda). Como o CSS é compartilhado, a story
  guardava as 4 stacks. Se a cobertura importar, o lugar natural é
  `alert-estados` ou um teste de layout dedicado.

### Ruído pré-existente notado (fora de escopo, não tocado)

- react `alert-dialog`: console avisa `<button> cannot contain a nested
  <button>` e prop `asChild` vazando para o DOM. Não quebra teste, mas
  `asChild` inerte é o mesmo bug já varrido no svelte — candidato a lote.

## Lote alert-dialog (2026-08-01) — dois bugs reportados pela dona

`292c033e` react · `97456749` vue · `05332985` svelte · `b38d0582` react extra.

### 1. React: botão sem estilo por fora do botão correto

`AlertDialogTrigger` declarava `asChild?: boolean` e **nunca usava a prop** —
repassava tudo ao Base UI, que renderizava o próprio `<button>` envolvendo o
nosso, e ainda vazava `asChild` como atributo no DOM. Varredura achou **3
primitivos com o mesmo defeito**: `alert-dialog`, `dialog`, `collapsible`
(corretos: `popover`, `dropdown-menu`, `hover-card`).

**Resolveu dívida axe já catalogada**: as páginas alert-dialog e collapsible
tinham `nested-interactive` E `target-size` no modo todo — as duas rules eram
o mesmo bug (botão dentro de botão; o botão fantasma era pequeno demais).
**As duas viraram portão de axe.**

Achado adicional: `popover.tsx` e `dropdown-menu.tsx` passavam
`nativeButton={false}` com todos os 31 call sites usando `<Button>` nativo —
o Base UI logava `console.error` em dev e aplicava `role="button"` + handlers
de teclado redundantes. Removido. `pagination.tsx` mantém a prop: lá o render
é um `<a>`, que é o caso legítimo dela.

### 2. Vue e Svelte: dialogs abrindo sozinhos no load

Previews da docs page usavam `default-open` (vue, 6×) e `<AlertDialog open>`
(svelte, 6×). Como o componente renderiza em portal com overlay modal, cada
preview aberto cobria a página e eles empilhavam. React e Vanilla nunca
tiveram o problema porque seus previews mostram o **gatilho fechado**.
Convergido: vue ganhou `AlertDialogDemo.vue` (equivalente ao
`buildAlertDialogDemo` do vanilla) e svelte reusou o `AlertDialogStory.svelte`
que já existia.

### 3. `nds-bg-destructive` é inerte sobre botões (achado do lote)

`.nds-bg-destructive` (colors.css) e `.nds-button-default` (button.css) têm a
MESMA especificidade, e `button.css` é importado depois no `index.css` — a
variante do botão vence. O `AlertDialogAction class="nds-bg-destructive"` das
docs pages renderizava com fundo primary. Corrigido em react e vue com
`variant="destructive"` (inclusive nos snippets, que ensinavam a classe morta).

- [x] **Pendente**: a mesma classe é usada em `ContextMenuDocs`, `SidebarDocs`  
      **RESOLVIDO** (conferido 2026-08-17) — revisão serial
  e no container `DocsDoDont` de várias stacks. Sobre elemento que NÃO é botão
  a classe funciona — cada uso precisa ser verificado antes de trocar.

### Falhas pré-existentes confirmadas por stash (não regressões)

- react `dialog-composicoes > Profile Edit`: `input` presente mas não visível.
  **Provável mesma causa raiz da animação congelada em headless** — o
  `nds-dialog-zoom-in` anima opacidade 0 → 1 e trava no quadro zero, então o
  conteúdo do dialog nunca fica "visível" para o jest-dom. Fix provável:
  `waitFor` na asserção, como foi feito no alert.
- react `dropdown-menu-composicoes`: 4 falhas (Com Label, Com Checkbox Items,
  Com Radio Group) idênticas com o primitivo em stash.

## AlertDialog: confirmar não fechava (2026-08-01)

`8e2028af` react · `02a18c99` svelte. Vue e Vanilla nunca tiveram o bug.

Causa diferente em cada stack, mesmo sintoma:
- **react**: `AlertDialogAction` renderizava um `<Button>` puro, sem envolver
  `AlertDialogPrimitive.Close` — o `AlertDialogCancel`, no mesmo arquivo, já
  fazia certo. Corrigido espelhando o Cancel.
- **svelte**: o `AlertDialogPrimitive.Action` do bits-ui **não fecha** — a
  classe `DialogActionState` só expõe id e atributos; quem fecha é a
  `DialogCloseState`. Corrigido renderizando `Dialog.Close` (e não
  `AlertDialog.Cancel`, que sequestraria o `cancelNode` do root — marcação de
  foco inicial de alert dialog).

Em ambos, verificado na fonte da lib que o `onClick`/`onclick` do consumidor
continua disparando ANTES do fechamento (mergeProps encadeia handlers), então
o `track('dialog_confirm', …)` das docs pages segue intacto.

### O que deixou o bug passar: dois testes que codificavam o defeito

As duas stacks TINHAM story `Confirmed`, e as duas afirmavam o comportamento
errado:
- react: clicava e asseverava `toBeInTheDocument()` — ou seja, passava
  justamente por o diálogo continuar aberto. O spy do callback era criado
  dentro do `render`, inacessível ao `play`, então a confirmação nunca era
  checada.
- svelte: o comentário da story dizia explicitamente "bits-ui 2.18:
  AlertDialogAction não fecha automaticamente… validamos apenas que o handler
  foi disparado" — a limitação da lib foi documentada como se fosse contrato.

**Regra**: quando uma story documenta uma limitação de lib, ela precisa vir
com o item correspondente aqui no FIXES-NEEDED. Limitação aceita em silêncio
vira contrato por omissão.

Ambas reescritas: abrem, confirmam, e provam callback disparado + diálogo
fora do DOM (com `waitFor`, por causa do congelamento de animação no headless).

**Chromatic**: o snapshot da story `Confirmed` muda nas 2 stacks — o diálogo
agora fecha. A cobertura visual do aberto continua na story `Open`.

## Animação do alert-dialog + reduced-motion nos testes (2026-08-02)

`8d0c279c` CSS compartilhado + vanilla · `25e4b0b2` react · `98156a01` vue ·
`470d53c4` svelte.

Overlay e painel do alert-dialog passam a animar com o mesmo movimento do
alert dismissible (keyframes `nds-animate-in/out`, tokens `--duration-spring`
/ `--ease-spring`). O overlay só faz **fade**: escalar um backdrop
`fixed; inset: 0` encolheria a cortina e mostraria a página nas bordas — a
escala pertence ao painel, como na referência adotada.

Dois bugs encontrados no caminho:
- A animação de saída que já existia **nunca rodou em 3 das 4 stacks**: o CSS
  só tinha `[data-closed]` (convenção do base-ui), e Vue/Svelte/Vanilla usam
  `data-state`. As três convenções agora estão cobertas.
- O **Vanilla não emitia atributo de estado nenhum** e removia o nó direto.
  Passou a emitir `data-state` e a esperar a animação antes de remover (com
  timeout de segurança); sem animação ativa, remove na hora.

### Infra: `reducedMotion: 'reduce'` no browser dos testes (4 stacks)

`provider: playwright({ contextOptions: { reducedMotion: 'reduce' } })`.

Motivo medido: em Chromium headless animações de **keyframes CSS** de
`opacity`/`transform` não avançam — ficam presas no quadro zero com
`playState: "running"`. Diferente do caso do alert (onde a classe era
transitória e o JS a removia), aqui o `data-state="open"` **persiste**: o
elemento ficaria invisível para sempre e nenhum `waitFor` resolveria. Emular
reduced-motion aciona o `@media` que o CSS já tinha, o teste vira
determinístico e ainda exercita o caminho de quem pede menos movimento.

**Ganho colateral confirmado**: a falha pré-existente
`react dialog-composicoes > Profile Edit` (input presente mas não visível)
**sumiu** — era o `nds-dialog-zoom-in` congelado, como suspeitado.

**Onde NÃO ajudou** (medido, não suposto):
- vue: nada a ganhar — ver item do MotionDocs acima (animação por rAF avança).
- svelte: o backlog de ~46 falhas em suítes com animação é de outra natureza —
  26 são `Unable to find` e 15 `Timed out`, ou seja, o elemento não chega a
  renderizar. Comparação antes/depois idêntica fora do alert-dialog.

- [x] **Icons sem folga de timeout**: 120s nas 4 stacks, e a página mede  
      **MUDOU DE FORMA** (conferido 2026-08-17) — o texto deste item foi SUBSTITUÍDO na seção "Mudaram de forma", no topo. Não use o texto abaixo.
  ~75–112s sob carga concorrente. Falha de forma intermitente quando várias
  stacks rodam em paralelo (é o caso do CI). Virtualizar/paginar o grid
  resolveria de vez — e destravaria também o axe, hoje desligado nessa página
  no react.

## /quality alert-dialog (2026-08-02) — audit zerado, 4 stacks

`867cc2a5` vanilla · `70d0cf6c` vue · `a6b801ea` react · `969aef01` svelte
(auditoria) + `2888ffd3` `71369a7b` `3d5c4f39` (paridade das 2 stories novas).

10 stories por stack (paridade), 100% com play, `audit.mjs --category
quality` retorna `[]`. Asserções do componente: ~70 → ~180.

### Bug real encontrado — teclado inoperante no Svelte

`Enter` e `Espaço` **não ativavam** Action/Cancel: o `DialogCloseState` do
bits-ui trata as teclas no próprio `onkeydown`, fecha direto e **nunca emite
`click`** — o callback do consumidor só rodava com mouse. Confirmação
inoperável por teclado (WCAG 2.1.1), invisível para o axe. Corrigido com
ponte keydown→onclick nos dois primitivos. **Só apareceu porque a skill exige
verificar tecla a tecla** — a lista documentada tinha 5 teclas e só `Escape`
era testada nas 4 stacks.

### Padrões que se repetiram nas 4

- `fn()` criado dentro do `render`: invisível para a play E para a aba
  Actions. Vira spy de módulo.
- ARIA documentado mas verificado só por `toHaveAccessibleName` (indireto):
  agora resolve os ids e compara com o texto real.
- vue: a story `Open` **fechava o diálogo no fim da play** — o Chromatic
  fotografava o estado fechado justamente na story do estado aberto.

### PENDENTE — conteúdo compartilhado contradiz as 4 implementações

Cada stack verificou na fonte da sua lib. Precisa de decisão (recomendação:
**corrigir o texto, não o código** — a implementação está certa nos 4 casos):

- [x] **"Clique no overlay fecha"** (`functional.item6`, `accessibility.item5`,  
      **RESOLVIDO** (conferido 2026-08-17) — fb4e668a
  `states.cancelled.trigger`) — falso nas 4. react:
  `disablePointerDismissal = isAlertDialog || prop` · vue:
  `withModifiers(..., ['prevent'])` · svelte: `interactOutsideBehavior =
  "ignore"` · vanilla: decisão comentada na factory. É o comportamento
  CORRETO por WAI-ARIA APG (alert dialog exige escolha explícita).
- [x] **`aria-modal` documentado** — o Base UI não emite; isola o fundo com  
      **RESOLVIDO** (conferido 2026-08-17) — fb4e668a
  `aria-hidden` + `data-base-ui-inert` nos irmãos.
- [x] **"Foco inicial em Cancelar"** (`functional.item1`, `states.open.behavior`,  
      **MUDOU DE FORMA** (conferido 2026-08-17) — o texto deste item foi SUBSTITUÍDO na seção "Mudaram de forma", no topo. Não use o texto abaixo.
  `accessibility.item3`, `notes.tip1`) — as libs focam o painel
  (`tabindex=-1`); o primeiro Tab leva ao Cancelar.
- [ ] **`defaultOpen` na tabela de props** — não existe no bits-ui
  (`DialogRootProps` = open/onOpenChange/onOpenChangeComplete/children).

Conduta a uniformizar junto: vanilla, react e svelte **codificaram** o
comportamento real em asserção; o vue deixou sem, para não cristalizar a
contradição antes da decisão.

### Outras pendências levantadas (menores)

- [x] `docs/shared/styles/nds/alert-dialog.css` (cabeçalho) diz "sem  
      **RESOLVIDO** (conferido 2026-08-17) — 4c4af6fd
  Escape-to-close" — obsoleto, a factory fecha com Escape.
- [x] Vanilla não emite `data-slot` na descrição (só header/footer/content):  
      **RESOLVIDO** (conferido 2026-08-17) — c224b4f9
  seletor que funciona em 3 stacks falha na 4ª.
- [x] Rótulos das composições divergem entre stories e docs page nas 4  
      **MUDOU DE FORMA** (conferido 2026-08-17) — o texto deste item foi SUBSTITUÍDO na seção "Mudaram de forma", no topo. Não use o texto abaixo.
  stacks (stories: "Excluir sua conta?" / "Publicar agora"; docs page:
  "Excluir conta" / "Sair da conta"). O react alinhou os dele à docs page;
  as outras 3 mantiveram os próprios. Mexe em baseline do Chromatic.
- [x] Tabela de tokens lista utilitários Tailwind mortos (`bg-black/80`,  
      **RESOLVIDO** (conferido 2026-08-17) — c224b4f9
  `bg-background`, `border`, `sm:rounded-lg`) — resíduo da migração `.nds-*`,
  idêntico nas 4.
- [x] ~~`accessibility.aria.*` e `accessibility.screenReader.*` do JSON são
  conteúdo morto~~ — RESOLVIDO (2026-08-02). `aria.*` já era renderizado como
  `items`; o morto era `screenReader.*` (44 de 50 componentes) e `contrast`
  (só accordion). `DocsAccessibility` ganhou `screenReaderTitle`,
  `screenReaderItems` e `contrast` opcionais nas 4 stacks; 172 call sites
  fiados por script com dry-run. As chaves de `screenReader` não têm formato
  comum entre componentes, então o container recebe `Object.values(...)`.
  Sem a chave no JSON: avatar, badge, dialog (4 stacks) e form (vanilla).

## NVDA pulava para "Notas de Implementação" — RESOLVIDO (2026-08-02)

`d38c0bd0` vanilla (+vue absorvido) · `16043e20` svelte · `afeee31d` react ·
`fe26d0bf` conteúdo compartilhado.

**Sintoma** (reportado pela dona): ao abrir qualquer docs page, o NVDA pula
para a seção de Notas e fica preso ali.

**Causa**: o `DocsNotes` renderiza `Alert`, e o primitivo marcava
`role="alert"` FIXO na raiz nas 4 stacks. `role="alert"` é live region
ASSERTIVA — o leitor de tela interrompe e anuncia no carregamento. Varredura
confirmou que era a **única** live region das docs pages. Atingia **48 páginas
× 4 stacks**.

**O erro é semântico e valia além das docs**: por WAI-ARIA, `alert` é para
mensagem urgente que SURGE em runtime. Qualquer consumidor do DS com um Alert
estático na tela tinha a mesma interrupção.

**Correção**: Alert ganhou `role?: 'alert' | 'status' | 'note'`, default
`'alert'` (aditivo — nenhum call site muda de comportamento). `DocsNotes` usa
`'note'`. Story `SemAnuncio` nas 4 trava o default e o novo caso.

### O que quase deixou a correção invisível

O conteúdo compartilhado afirmava em **8 lugares** que o `role="alert"` é
automático. Eu corrigi primeiro `accessibility.aria.role` — e **nenhuma das 4
docs pages consome `accessibility.aria.*`**; elas renderizam
`accessibility.item1`. Sem a varredura completa, a página continuaria
ensinando o padrão que causou o bug. Também estava no **SEO**
(`seo.description`, `seo.aiSummary`), que é o que buscador e IA leem.

**Regra**: ao corrigir texto compartilhado, varrer TODAS as chaves por
ocorrência literal e conferir quais o container realmente renderiza — chave
não consumida é correção que não chega ao usuário.

### Achado lateral no Vue

Antes da mudança, `role` NÃO era prop no Vue: um `role` passado pelo consumidor
caía por fallthrough e **sobrescrevia silenciosamente** o `role="alert"` do
template. Declarar como prop fechou esse comportamento acidental.

### Hazard de processo — `git stash` com agents paralelos

O agent do React empilhou um stash para provar que uma falha era pré-existente
e **outro agent removeu a entrada**; as edições sumiram da árvore e da
`git stash list` (voltaram intactas, por sorte). O stash é global. Também
houve **absorção de commit**: o commit do Vue entrou dentro do commit do
Vanilla porque os agents compartilham o índice.
- [x] Proibir `git stash` nos prompts de agent paralelo; comparar baseline  
      **RESOLVIDO** (conferido 2026-08-17) — CLAUDE.md + prompts
  copiando o arquivo para o scratchpad.

## Foco na navegação das docs pages — RESOLVIDO (2026-08-02)

`67e09fe5` vanilla · `bcacf3c7` react · `b23ed990` vue · `ea685f3a` svelte.

**Sintomas** (reportados pela dona, com NVDA): (1) "Ir para o conteúdo" não
leva ao título; (2) Enter num item do menu rola até a seção mas a leitura não
continua, e o Tab seguinte vai para o próximo item do menu.

**Causa 1 — nenhuma docs page tinha `<main>`.** A sidebar era `<nav>` com
rótulo, o conteúdo era um `<div>` sem landmark: não havia "conteúdo" para
alcançar nem nome que dissesse de que página se trata. Agora
`<main tabindex="-1" aria-labelledby="docs-page-title">`, com o `<h1>` do
`DocsHeader` ganhando id estável. Ao cair no conteúdo o leitor anuncia
"principal, <título>". Zero mudança visual (só a tag e dois atributos).

**Causa 2 — o handler do menu só rolava.** `scrollIntoView` sem `focus()`: o
foco ficava no botão, então o cursor de leitura não se movia e o Tab seguia a
ordem do DOM a partir do menu. Agora `tabindex="-1"` no alvo (aplicado no
clique, sem tocar no HTML das seções) + `focus({ preventScroll: true })` — o
`preventScroll` deixa a rolagem suave acontecer com o foco já movido.

**Efeito colateral previsto e tratado**: o `<main>` novo recriava
`landmark-no-duplicate-main` na página do Sidebar em react, vue e svelte,
porque os demos renderizavam `<main>`/`SidebarInset`. Os demos passaram a usar
`<div>` pixel-idêntico; os snippets continuam ensinando `<SidebarInset>`, que
é a API correta num app real. O vanilla não tinha o problema (o
`createSidebarInset` já usava `div`).

**Provas novas** (arquivo `docs-nav-foco.stories.*` por stack, `tags:['!dev']`):
existe exatamente um `<main>` e ele tem o nome do `<h1>`; clicar num item do
menu deixa `document.activeElement` DENTRO da seção alvo. O vanilla percorre
os 16 itens; o react ainda prova que o Tab seguinte cai no conteúdo.

docs-smoke com axe: vanilla 64/64 · react 66/66 (com as provas) · vue 63/63 ·
svelte 62/62. svelte-check 351 (baseline).

### PENDENTE — as 16 páginas Foundations continuam sem `<main>`

As 4 stacks registraram isso independentemente. Elas não usam
`DocsPageLayout` nem `DocsNav` (layout próprio em `FoundationPage`/
`FoundationsRenderer`, sem menu de seções), então o bug 2 não existe lá — mas
o bug 1 continua: "Ir para o conteúdo" não tem alvo nessas páginas.
`IconsDocs` e `ThemeColorsDocs` estão na mesma situação.
- [x] Segundo passe nas 4 stacks para dar `<main>` nomeado às Foundations.  
      **RESOLVIDO** (conferido 2026-08-17) — 01c09bda

### Backlog de analytics encontrado no caminho

- [x] `AccordionDocs` (vue, e provavelmente outras) não passa `componentSlug`  
      **RESOLVIDO** (conferido 2026-08-17) — lote de contrato das docs pages
  ao `DocsPageLayout` — os botões do nav ficam sem `data-track-id`, então a
  navegação por seção não é rastreada nessas páginas.

## Foundations com landmark + rastreio de navegação — RESOLVIDO (2026-08-02)

`01c09bda` vanilla · `4b1bf502` svelte · `d97a44ea` vue · `4ee26e55` react.

### A. `<main>` nas Foundations (16/16 por stack)

Fecha a pendência do lote anterior. Descoberta comum às 4: as Foundations não
são um caminho só — o renderer cobre 14 páginas, e **`IconsDocs` e
`ThemeColorsDocs` montam layout próprio**. Corrigir só o renderer deixaria 2
páginas sem landmark; as 4 stacks varreram e pegaram as três formas.

Diferença de árvore registrada pelo vanilla: nas Foundations o `<header>` fica
DENTRO do `<main>` (no `DocsPageLayout` é irmão). Válido, e evita reordenar o
DOM só para criar o landmark.

### B. BUG DE ANALYTICS — `docs_nav_click` reportava sempre `section_id: 'nav'`

Encontrado ao medir o escopo dos slugs, não pelo sintoma. O contrato do id é
`{component}:{section}:{element}` e o exemplo canônico é `alert:nav:anatomia`
— o destino está no 3º segmento. Mas o `docs-tracking.ts` das 4 fazia:

```ts
const section = parts[1] ?? '';           // 'nav'
case 'nav': section_id: section || element
```

Ou seja, **todo evento de navegação reportava `'nav'`**. O evento disparava,
nada falhava, e o relatório era inútil: não dava para saber para qual seção o
usuário foi. Corrigido para `element || section` nas 4.

### B2. Nav sem `data-track-id` — corrigido SEM editar 108 páginas

Medição: 24 páginas em react, 20 em vue, 21 em svelte e 44 em vanilla não
passam `componentSlug` ao `DocsPageLayout`. A correção mecânica (editar as
108) seria ERRADA: a arquitetura define o slug como opcional e derivado do
`?id=` do iframe. O `DocsNav` passou a usar a mesma derivação
(`deriveSlugFromUrl`, agora exportada) como fallback e emite `data-track-id`
sempre.

**Armadilha de medição** (errei e corrijo aqui): o agent do react reportou "só
4 páginas sem slug" — falso. `componentSlug` aparece em quase toda página, mas
no `useSeoEffect` e nos section components (`DocsVariants`,
`DocsCompositions`), **não** no layout. O vue achou o mesmo na `AccordionDocs`.
Contar ocorrência no arquivo dá número errado; é preciso olhar a invocação do
layout.

### Provas novas (por stack, em `docs-nav-foco/focus.stories.*`)

As 4 chegaram independentemente à mesma ideia: **substituir o `gtag` por um
coletor** e provar que o `docs_nav_click` sai com o destino real, não com
`'nav'`. Não é asserção de atributo — é do evento que chegaria ao GA4. Como
nenhuma stack tem teste unitário de `docs-tracking`, essa é a única trava.
Também cobrem: um `<main>` nomeado nas Foundations e nas 2 de layout próprio,
e id de 3 partes em página que NÃO passa slug.

docs-smoke: vanilla 64/64 · react 63/63 · svelte 62/62 · vue 62/63 (Icons por
timeout sob carga — passa isolada em 64,7s). svelte-check 351 (baseline).

## Stories verdes no CI e vermelhas no Storybook — RESOLVIDO no alert-dialog (2026-08-02)

`04361284` vanilla · `999f2d80` svelte · vue e react abaixo.

**Sintoma** (dona): stories do alert-dialog com erro no painel Interactions,
enquanto `vitest` dava 10/10 nas 4 stacks.

**Causa**: as `play` afirmavam `toBeVisible()` logo após abrir o diálogo. O
alert-dialog passou a ter animação de entrada (opacidade 0 → 1 em 400ms); no
Storybook a asserção roda no primeiro quadro e reprova. No CI não aparece
porque o browser dos testes emula `prefers-reduced-motion`.

**A emulação que eu adicionei para estabilizar o CI mascarou o defeito.**

Corrigido com `waitFor` nas asserções sensíveis (visibilidade, foco
pós-abertura, remoção). Afetava as **4** stacks, não 3 — vanilla também tinha,
só não tinha sido aberta. React já era imune: tem `waitForPortal()`
(`src/lib/wait-for-portal.ts`), um `waitFor` que espera a opacidade passar de
0.9 antes de qualquer asserção. É o padrão que as outras 3 deveriam adotar.

### CORREÇÃO DE DIAGNÓSTICO MEU

Eu afirmei aqui e nas skills que "em Chromium headless animações de
`opacity`/`transform` não avançam, ficam presas no quadro zero". **Errado.**
Medido no ambiente real (não na sonda sintética que me induziu ao erro): a
animação avança e completa. Prova — depois do fix com `waitFor`, o detector
sem reduced-motion passa 10/10 no vue; e o react mediu `getAnimations()`
rodando e a story concluindo.

O problema nunca foi congelamento: era **asserção racy no quadro zero**.
Consequência: `waitFor` é a correção certa, e a emulação de reduced-motion é
instrumento cego — deixa o CI verde escondendo o que o usuário vê.

- [x] **Decisão pendente: manter ou remover a emulação de reduced-motion.**  
      **RESOLVIDO** (conferido 2026-08-17) — beedec2e
  Medido no vue (com → sem): dialog 2 → 12 falhas · sheet 2 → 2 · popover
  4 → 4 · tooltip 10 → 10. Ou seja, ela não causa falha; **esconde ~10
  asserções racy no dialog**. Manter = CI estável e Storybook com erro.
  Remover = testes batem com o que a dona vê, ao custo de corrigir essas
  asserções (dialog primeiro). As falhas de sheet/popover/tooltip são do
  backlog pré-existente do vue, sem relação com animação.

## Emulação de motion REMOVIDA dos testes (2026-08-02, decisão da dona)

`beedec2e` svelte · `5a55a8c8` react · `ad7ba55d` vanilla · `48c3dead` +
`0168c78f` vue.

Os testes voltam a rodar com animação, como o Storybook. Verificado por mim
depois dos 4 agents (o scratchpad compartilhado corrompeu um baseline —
ver abaixo): **alert-dialog 10/10 e alert 26/26 nas 4**; `dialog` falha 2 no
vue e 1 no svelte, iguais aos baselines → backlog, não regressão.

### O que fechou o problema NÃO foi remover a emulação

Foi o `wait-for-portal.ts`: um `waitFor` que gateia na **opacidade computada**
(> 0.9) antes de qualquer asserção, na abertura de todo portal — em vez de
`findBy*` (que resolve na montagem) ou sleep fixo. React e svelte já tinham; o
vanilla criou; o vue **tinha mas sem o gate de opacidade**, e por isso
retornava no meio da animação.

Delta por stack: **vue 10** (todas em `dialog`, fechadas por UMA correção na
lib — nenhuma story editada) · **react 1** (`dialog > Profile Edit`, a falha
antiga que a emulação mascarava, agora corrigida na causa) · **svelte 0** ·
**vanilla 0**.

Melhoria do vue sobre o modelo do react: ele percorre a cadeia de ancestrais
até o `<body>` e usa a **menor** opacidade — `toBeVisible()` reprova se
qualquer ancestral estiver em 0, e gatear só no nó deixava brecha com
overlay + wrappers de portal. Vale portar para as outras 3.

### A emulação estava quebrando um teste

`skeleton > Playground` no svelte depende do pulse, que o reduced-motion
desligava. Passou a passar.

### Nuance que explica por que o CI não acusava

`toBeVisible()` do jest-dom só reprova em opacidade **exatamente** 0. As
asserções eram racy de verdade — apareciam no painel Interactions — mas quase
nunca reprovavam no vitest. Delta zero numa stack não significava ausência de
risco.

### Paridade do Playground do alert-dialog — vue

12 `expect()` / 7 `step()` → **33 / 10** (react 21/9, vanilla 20/9,
svelte 18/9). Achado no caminho: os spies `onConfirm`/`onCancel` existiam no
`setup()` e **nunca eram asseverados** — spies mortos.

- [x] **Gap do auditor**: `coverage_divergence` compara story a story e não  
      **MUDOU DE FORMA** (conferido 2026-08-17) — o texto deste item foi SUBSTITUÍDO na seção "Mudaram de forma", no topo. Não use o texto abaixo.
  pegou 12 vs 21 no Playground. Reforçar a regra para comparar também o
  Playground entre stacks.

### BACKLOG GRANDE exposto pela medição

Falhas pré-existentes, sem relação com animação (falham com e sem emulação):
- **svelte**: 33 das 36 falhas do baseline estão em `tooltip`, `popover` e
  `drawer` — essas três famílias estão hoje praticamente sem cobertura
  funcional efetiva.
- **vue**: tooltip 10, popover 4, dialog 2, sheet 2, drawer 2.
- **vanilla**: 12, sobretudo `drawer` ("multiple elements with role dialog" —
  overlay vazando entre stories) e `target-size`.
- **react**: 8 (tooltip 7 + drawer axe).
- [x] Priorizar: `tooltip` e `drawer` são os piores em 3 das 4 stacks.  
      **RESOLVIDO** (conferido 2026-08-17) — 389eb249

### Processo

Os 4 agents compartilham o mesmo diretório de scratchpad: um baseline foi
sobrescrito por outro agent e houve stdout interleaved. Exigir nome de arquivo
por stack e conferir o cabeçalho `RUN … /<stack>` antes de concluir número.

## /quality button — 2026-08-04

Os quatro itens abertos aqui foram resolvidos em seguida: `xs`/`icon-xs`
implementados e documentados, rótulo do link saindo do `translations.json`,
rótulos dos snippets alinhados aos das stories e spy do Vanilla movido para o
`meta`. Ficou um achado novo, de outra natureza:

### Escape de entidades em superfície de texto — RESOLVIDO

`stripHtml` virou helper compartilhado (`src/lib/strip-html.ts` por stack) e as
179 docs pages passaram a importá-lo. As cópias locais sumiram.

O helper exporta **duas** funções, porque os destinos são dois e confundi-los
quebra em direções opostas:

- `toPlainText` tira tags **e** decodifica entidades — para quem escreve
  textNode (testes, tabela de props, tokens, estados, teclado, cenários,
  analytics). Sem isso a tabela mostrava "Elemento &lt;button&gt; nativo".
- `stripHtml` tira só as tags — para quem renderiza HTML sanitizado. Decodificar
  ali transforma texto em markup vivo: `&lt;img&gt;` virou um `<img>` real sem
  `alt` e o axe reprovou Avatar e Card. Foi assim que o erro apareceu.

### Markup literal em superfície de texto — 264 chaves ainda

A correção do `stripHtml` cobriu os containers que eu tinha verificado. Depois o
`DocsDoDont` apareceu na tela com `<code>default</code>` cru — e ele não estava
na minha lista, porque eu tinha classificado o bloco do/dont do `DocsWhenToUse`
(que renderiza HTML) e assumido que era o mesmo container. Não é.

Rodei então a classificação por container de verdade (contando
`dangerouslySetInnerHTML` em cada seção compartilhada):

| renderiza HTML | escreve textNode |
|---|---|
| DocsAccessibility (summary, items, contrast, screenReader), DocsWhenToUse (guidelines/do/dont), DocsVariants, DocsCompositions, DocsNotes, DocsProps (extensibilidade), DocsAnatomy | DocsTestes, DocsTokens, DocsStates, DocsRelated, DocsDoDont, DocsAnalytics, DocsImport, DocsHeader, DocsDemonstration, e as tabelas do DocsProps e do DocsWhenToUse |

`doDont.*` e `related.*` foram corrigidos. Sobram **264 chaves** com tag ou
entidade caindo em superfície de texto nas docs pages de componente:

```
188  accessibility.aria      19  props.items         14  analytics.description
  8  tokens.items             5  props.menuButton     3  props.sidebar
 26  cauda longa (aria.*, keyboard.*, screenReader.*, brand/axes, …)
```

`accessibility.aria` é o grosso e **não passa pelo `DocsAccessibility`** — o
container não tem prop `aria`. Cada docs page monta essa tabela por conta, então
o destino precisa ser conferido caso a caso antes de converter.

- [x] Verificar container por container antes de aplicar `toPlainText`.  
      **MUDOU DE FORMA** (conferido 2026-08-17) — o texto deste item foi SUBSTITUÍDO na seção "Mudaram de forma", no topo. Não use o texto abaixo.
  Converter por prefixo sem conferir foi o que transformou `&lt;img&gt;` num
  `<img>` sem alt no Avatar e no Card.
- [x] Regra  criada — ver secao abaixo.


### Cobertura de código: a suíte inteira não mede

O vitest não emite relatório de cobertura nenhum quando algum teste falha.
Verificado em par: fatia de 4 arquivos com 2 falhas (13s) não gera nada; a mesma
fatia verde gera. Como as 4 stacks têm o backlog aberto de tooltip/drawer/sheet,
`npm run test:coverage` volta vazio em todas.

Enquanto isso, a medição útil é por componente
(`npx vitest run --coverage <slug>`), que é o recorte que o `/quality` usa.

- [x] Fechar o backlog de tooltip/drawer/sheet destrava a cobertura agregada.  
      **RESOLVIDO** (conferido 2026-08-17) — rodadas 22/26/27
- [ ] Só então faz sentido pôr `test:coverage` em CI — hoje ele passaria vazio
  ou falharia por threshold sem produzir número.

### Ramos declarados como não testáveis

Inventário do que tem `c8 ignore` com motivo, para revisitar se a API mudar:

- `svelte/button.svelte` — `if (!url)` do `isSafeUrl`: inalcançável porque
  `safeHref` é `$derived` e só é lido dentro de `{#if href}`, com o ternário de
  `disabled` curto-circuitando antes.
- `svelte/button.svelte` — lados verdadeiros de
  `url.startsWith('#') || url.startsWith('/')` no `catch`: exigiriam uma string
  que estoure o `new URL` E comece com `#` ou `/`. Nenhum `#…` estoura.
### Args genéricos nas stories do Svelte — resíduo do fix de `Meta`

`Meta<typeof Componente>` fixava o renderer no primitivo e obrigava o `render` a
devolver `Component<PropsDoPrimitivo>` (455 props de HTML). Como essas stories
devolvem wrappers `*Story.svelte` de 10–15 props, toda story do arquivo errava:
178 erros, metade do baseline do svelte-check. Resolvido — a forma agora é
`const meta: Meta` + `type Story = StoryObj`, mantendo `component:`.

Custo assumido: nos ~25 arquivos que usam `args`, eles ficam com o tipo genérico
`Args` em vez das props do wrapper. Tentei três formas de preservar a tipagem e
nenhuma funciona com o `component:` no lugar:

- `satisfies Meta<Args>` — o `typeof meta` continua carregando `component`, e é
  dele que o `StoryObj` deriva os args; o parâmetro é ignorado.
- `const meta: Meta<Args> = …` — o `typeof meta` vira o próprio
  `ComponentAnnotations` e o `StoryObj` passa a tratá-lo como tipo de args.
- `satisfies` sem `component` — piora: os args passam a ser inferidos do
  literal de `meta.args`.

- [ ] Investigar se uma versão mais nova do `@storybook/svelte` separa
  `component` do tipo de args. Enquanto isso, `args` nesses arquivos não é
  verificado — e antes o arquivo inteiro não era.

Exceção correta: `code-block.stories.ts` renderiza o componente direto, sem
wrapper. Ali `Meta<typeof CodeBlock>` é o tipo certo e foi mantido.

### Suíte do Svelte: 101 falhas em famílias de portal

Medido depois do fix de tipos (que é só de tipo — 3 linhas por arquivo, e as
falhas são "portal nunca abriu", não erro de compilação ou indexação):
tooltip 13, popover 10, pagination 10, hover-card 10, drawer 10, menubar 9,
dropdown-menu 9, select 6, scroll-area 5, e cauda. Nenhuma em button, accordion
ou badge.

- [x] É o mesmo backlog já registrado, agora com número atual e por família.  
      **RESOLVIDO** (conferido 2026-08-17) — ba6a331c
  Enquanto ele existir, `npm run test:coverage` não emite cobertura no Svelte.

## Backlog de portais no Svelte — 2026-08-05

Três causas raiz encontradas e corrigidas. A suíte foi de **101 para 74 falhas**.

### 1. `defaultOpen` não existe (drawer, dropdown-menu, hover-card, popover)

Os wrappers `*Story.svelte` tinham `{#if open !== undefined} <X bind:open>
{:else} <X {defaultOpen}>`, com os **dois ramos idênticos** fora do `open`. Só
que `defaultOpen` não é prop nem do bits-ui nem do vaul-svelte: era passada,
ignorada, e o overlay nunca abria. Toda story que dependia dela falhava.

Corrigido colapsando para um ramo só, com `open = $bindable(defaultOpen)`.
Drawer 10 → 1, dropdown-menu 9 → 0.

### 2. Popover sem `role` e sem nome acessível

O bits-ui não emite role no conteúdo, mas põe `aria-haspopup="dialog"` no
trigger — o leitor anunciava "abre diálogo" e o que abria não era diálogo. O
Vanilla, que é a referência cross-stack, já definia `role="dialog"`.

Ao corrigir, o axe cobrou o passo seguinte: `role="dialog"` exige nome
acessível. Replicado o critério do Vanilla (heading interno vira
`aria-labelledby`, senão o texto do trigger vira `aria-label`), e o
`PopoverTitle` — que era um `<div>` sem semântica — virou heading, como já é no
React via `Popover.Title` do base-ui. Popover 10 → 0.

### 3. Classe morta escondendo defeito real

`max-h-[50vh]` no scroll do drawer é Tailwind, não existe: sem altura máxima
nada rolava, e por isso o axe nunca aplicava `scrollable-region-focusable`. Com
a altura de volta, a regra apareceu — a região rolável não tinha acesso por
teclado. Corrigido com `tabindex`, `role` e rótulo.

### Segunda rodada — 74 para 29 falhas

Mais causas raiz, todas do mesmo tipo: o teste estava certo e o componente
incompleto.

- **tooltip 13 → 0** — o bits-ui não emite `role="tooltip"` no conteúdo. O
  Vanilla já define. Sem ele o painel é um `<div>` qualquer, e o
  `aria-describedby` do trigger aponta para algo sem papel.
- **hover-card 10 → 0** — mesmo caso do popover (`role="dialog"` + nome
  acessível derivado). E o bits-ui força `role="button"` num trigger que é um
  `<a>` que navega; o Vanilla não mexe no role do trigger, então o `role="link"`
  foi restaurado depois do spread.
- **pagination 10 → 0** — o bits-ui **fixa** `aria-label="Page N"`, em inglês, e
  vence o que o consumidor passa. A paginação inteira era anunciada em inglês e
  a página atual não se distinguia. Resolvido pelo snippet `child`, única forma
  de escrever depois do merge da lib.
- **menubar 9 → 0** — `defaultValue` não existe no bits-ui (a API é `value`
  bindable). Mesma família do `defaultOpen`: prop ignorada, nenhum menu abria.
- **sheet 3 → 0** — o mesmo `max-h-[…]` morto do drawer, e o `waitForClose`
  liberava em `data-state="closed"` enquanto o overlay ainda segurava
  `pointer-events`. A espera passou a ser pela interação devolvida.

### Terceira rodada — 29 para 12 falhas

- **scroll-area 5 → 0** — as demos usavam `type="hover"`, em que a scrollbar só
  se materializa sob o ponteiro: a story existia para MOSTRAR a barra e não
  mostrava nada, nem no Chromatic. E a faixa horizontal usava `nds-cluster`
  (`flex-wrap: wrap`), então os itens quebravam linha em vez de transbordar —
  sem transbordo não há scrollbar. Passou a `nds-row`.
- **command 4 → 0** — três defeitos distintos: `aria-label="Abrir command
  palette"` num botão cujo texto visível é "Buscar..." (WCAG 2.5.3, Label in
  Name — quem usa voz fala o que vê e não aciona); `role="progressbar"` do
  Loading dentro de um `role="listbox"`, que não é filho permitido; e o estado
  vazio deixando o listbox sem nenhuma `option`.
- **navigation-menu 4 → 0** e **menubar** — `defaultValue` não existe no
  bits-ui (a API é `value` bindable). Mesma família do `defaultOpen`.
- **skeleton 2 → 0** — asserções contra `motion-reduce:animate-none` e `h-full`,
  ambas Tailwind morto; e o próprio componente usava `inset-0` inerte.
- **slider 4 → 1** — `let current = $derived(...)`: derivado é somente leitura e
  se recalcula, então `bind:value` nunca segurava a mudança e o slider não podia
  mudar de valor. Também um `text-primary-foreground` sem prefixo `nds-`, que
  dava contraste **1.1:1** no botão de submit.

### O que continua aberto — 12 falhas

```
select 5 · slider 1 · sidebar 1 · popover 1 · drawer 1
dialog 1 · data-table 1 · aspect-ratio 1
```

- [x] **slider (1)** — o thumb tem 16×16 e o axe cobra 24×24 (WCAG 2.5.8). O  
      **RESOLVIDO** (conferido 2026-08-17) — 87ee6a92
  CSS compartilhado tenta resolver com um `::after` de hit-area, mas o axe mede
  a caixa do elemento, não o pseudo. O arranjo atual presume um
  `<input type="range">` por baixo (modelo do Vanilla); no bits-ui o thumb **é**
  o alvo. Corrigir mexe em CSS compartilhado pelas 4 stacks e desloca o thumb —
  precisa de verificação visual no Chromatic, não de um ajuste às cegas.
- [x] **drawer (1)** — foco não entra no drawer ao abrir; medido, defeito real.  
      **RESOLVIDO** (conferido 2026-08-17) — b3449edf
- [x] **popover (1)** — passa isolado, falha na suíte: portal vazando.  
      **RESOLVIDO** (conferido 2026-08-17) — cad2cd06
- [x] sidebar, dialog, data-table, aspect-ratio: 1 cada, não diagnosticadas.  
      **RESOLVIDO** (conferido 2026-08-17) — 12eab069 · 237c3822 · 90886af4 · cefca288

## Regras de audit novas — 2026-08-05

### `markup_in_text_surface` (medium) — 214 achados em 25 componentes

Chave do `translations.json` com `<tag>` ou `&lt;` chegando a container que
escreve textNode, sem passar por `toPlainText()`. Nada mais pega isso: nem
teste, nem axe — só olhando a página, que foi como apareceu duas vezes.

O button foi zerado (12 achados, incluindo dois que a varredura manual anterior
tinha deixado passar: um com `stripHtml`, que resolve tags mas não entidades, e
um cru). Os outros 24 componentes seguem abertos.

### `nonexistent_lib_prop` (high) — 0 achados

`defaultOpen`/`defaultValue` indo para componente da lib no Svelte. Prop que não
existe é aceita e ignorada em silêncio; foi o que deixou overlays e menus
fechados em 40+ testes. Provada reintroduzindo o defeito e revertendo.

### Bug do próprio auditor: caminho no Windows

`filesForSlug` testava `caminho.includes('/slug/')`, mas no Windows os caminhos
vêm com `\`. **Todo arquivo aninhado na pasta do componente ficava invisível**
para todas as regras que usam essa função — o que atinge sobretudo Svelte e Vue,
que organizam por pasta. Corrigido normalizando a barra; o audit foi de 1070
para 1295, dos quais 214 são a regra nova e **11 estavam escondidos por isso**.

### `dead_class_in_component` (low) — 21 achados em 5 componentes

Eu tinha decidido não criar esta regra, com a justificativa de que
`legacy_class_in_story` já dispara 421 vezes e o que falta é triagem. Medi: os
três componentes que passaram pelo `/quality` estão em **zero**, e os 421 são os
45 componentes que nunca rodaram a skill. A fila é backlog, não desinteresse — a
justificativa estava errada.

O buraco real era outro: a regra existente varre stories e wrappers
`*Story.svelte`, e deixava de fora os arquivos de componente sem `Story` no nome
— sobretudo as fixtures do Svelte (`TableVarianteBasica.svelte` e irmãs) e os
primitivos. Medindo só literais (`class="…"`, sem expressão), são 21 achados.

Não é cosmético: `sr-only` estava entre eles, o que deixava **visível** uma
caption que só deveria existir para o leitor de tela — e o teste assertava
`toHaveClass('sr-only')`, passando justamente por causa do defeito. Ambos
corrigidos.

Restam: table 15, sonner 2, calendar 1, chart 1, select 1.

## `className` das factories do Vanilla — RESOLVIDO

Três componentes seguidos (avatar 78,7% de ramos, badge 90,9%, breadcrumb 71,9%)
bateram no mesmo ponto: cada factory carregava o seu próprio
`if (className) el.classList.add(...className.split(' ').filter(Boolean))`, e
cada cópia era um ramo que só fechava com um exercitador próprio.

Medido antes de decidir: 72 cópias do mesmo par de linhas em 45 arquivos, e
`lib/utils.ts` já exportava o `cn` que React, Vue e Svelte usam para exatamente
isso. Não era problema de teste — era duplicação.

A troca é `el.className = cn('nds-x', className)`. O ramo não passou a ser
testado: **deixou de existir**, porque a decisão saiu do componente e foi para
uma função que o card exercita 52 vezes. 45 arquivos, 144 linhas trocadas por
144, nenhuma mudança de comportamento — `cn` é clsx puro e ignora `undefined`.

| | antes | depois |
|---|---|---|
| condicionais de classe no Vanilla | 72 | 0 |
| avatar | 78,7% (37/47) | 85,7% (30/35) |
| badge | 90,9% | 95,0% (19/20) |
| breadcrumb | 71,9% (23/32) | 88,9% (16/18) |

A API não foi podada: `className` continua em todas as peças, e agora sem custo
— peça que ninguém customiza não cobra mais ramo, story nem nota aqui.

As 21 falhas da suíte do Vanilla são anteriores e não têm relação: medidas em
par nos cinco componentes envolvidos (carousel, drawer, dropdown-menu, popover,
sheet), dão 21 falhas dos dois lados. São o backlog de overlay.

---

## `ComponentDemo` do Vue e do Svelte ainda com Tailwind inerte (2026-08-08)

O React teve isso corrigido (seção acima). O Vue e o Svelte não:

```
<Card class="flex items-center justify-center p-4 mt-2 bg-background">
```

Nenhuma dessas classes existe desde a migração para `.nds-*` — o container da
seção Demonstração renderiza **sem** centralização nessas duas stacks. O Vanilla
usa `.nds-docs-demo`, que é a classe compartilhada feita para isso.

Não apareceu no calendar porque as quatro docs pages do componente embrulham a
demo num `nds-cluster data-justify="center"` por página, o que mascara o
container. Toda docs page que não faz esse embrulho está com a demo à esquerda
no Vue e no Svelte.

Correção: trocar as duas linhas por `class="nds-docs-demo"`. Fica fora deste
commit porque muda pixel em **todas** as docs pages dessas stacks, e o Chromatic
precisa fotografar a mudança de uma vez — não junto de um fix de calendar.

---

## `calendar-heading.svelte` não é renderizado por ninguém (2026-08-08)

Medido na cobertura do calendar no Svelte: `calendar-heading.svelte` fica em
**0% de linhas**. Não é média baixa — é peça que nenhuma story, nenhum
componente e nenhuma docs page monta. O `Calendar` e o `RangeCalendar` usam
`Calendar.Caption`, que faz o mesmo trabalho e ainda oferece o layout de
dropdown.

Saída: entregar (algum consumidor real) ou remover do `index.ts` junto do
arquivo. Fica registrado em vez de resolvido aqui porque é anterior ao
`RangeCalendar` e o `export_sem_story` não o pega — ele é exportado pelo
barril, então o auditor o vê referenciado.

---

## Achados do contrato das docs pages (2026-08-09)

O harness de fumaça ganhou uma camada de contrato de conteúdo
(`docs/shared/testing/docs-page-contract.ts`), e a primeira rodada sobre as 252
páginas achou 15 defeitos que a suíte não via. Cada um está declarado na story
correspondente em `docs-smoke.stories.*` via `parameters.contratoDocs.ignorar`,
com o motivo — some da lista quando for corrigido, não antes.

**`preview_vazio` — 6 páginas** (Vue: Button, DataTable, Dialog, Sheet; Svelte:
Dialog, Popover). O exemplo é um overlay que monta em portal, então o contêiner
fica vazio no DOM da página: quem abre a doc vê uma caixa em branco onde deveria
haver exemplo. Decisão pendente: a docs page mostra o GATILHO (e o overlay abre
por cima) ou renderiza o conteúdo inline? As quatro stacks precisam da mesma
resposta.

**`chave_i18n_visivel` — 6 páginas** (Svelte: Label, Sonner; Vanilla: Carousel,
Chart, CodeBlock, Sonner). A seção renderiza o CAMINHO da chave em vez do texto —
`states.single.label`, `props.table.config`. Falta a entrada no
`translations.json`, nos três idiomas. O Carousel do Vanilla tem a tabela de
estados inteira assim, 12 células.

**`valor_indefinido_visivel` — 2 páginas** (Vue: Sidebar; Svelte: Calendar). A
coluna Padrão da tabela de props imprime a palavra `undefined` em vez de `—`,
que é o que as outras stacks mostram.

Nenhum destes é regressão desta rodada: são anteriores, e ficaram invisíveis
porque a fumaça só provava que a página montava.

---

## Accordion — achados da sonda (2026-08-09)

Auditoria `/quality accordion`. O determinístico saiu zerado, contrato 17/17 nas
quatro, cobertura 100/100/100 e as quatro suítes verdes. O que a sonda achou não
aparece em nenhum desses números.

**1. RESOLVIDO — não era defeito, era o docblock.** As quatro stacks removem
`role="region"` e `aria-labelledby` DE PROPÓSITO, e três delas já registravam o
motivo no código: com o painel sempre montado (`hidden="until-found"`), o role
transforma todo item fechado em landmark — 41 painéis viraram 41 landmarks na
docs page, com colisão de axe landmark-unique. O defeito era o cabeçalho do
`accordion.css`, que prometia os dois atributos; foi corrigido para descrever o
que o produto faz e por quê.

**2. `aria-controls` divergente entre as quatro.**

    vanilla  sim / sim      (fechado / aberto)
    svelte   sim / sim
    react    não / sim
    vue      não / não

O do React tem explicação: a lib desmonta o painel fechado, e apontar para um id
inexistente é violação de ARIA. O do Vue não: os três painéis estão no DOM
(`conteudos: 3`) e o atributo não aparece em nenhum estado — mesmo o
`CollapsibleTrigger` do reka, que o `AccordionTrigger` compõe, emitindo
`aria-controls: contentId`.

CAUSA ENCONTRADA: o reka provê `contentId: ''` no contexto do Collapsible e só o
preenche quando o conteúdo se registra — depois de o gatilho já ter renderizado.
Tentativa de contornar cunhando um id nosso no `AccordionItem` FALHOU e foi
revertida: o painel do reka mantém o id próprio, então o `aria-controls` passou
a apontar para elemento inexistente e o axe reprovou com aria-valid-attr-value —
pior que não ter o atributo. A saída é fazer o painel aceitar o id de fora, o
que exige mexer em como o wrapper compõe o `AccordionContent`.

**3. Altura do painel aberto: 24px no Vanilla e no React, 40px no Vue e no
Svelte.** Mesmo conteúdo, mesma fonte, `padding: 0px` nos quatro — a diferença de
16px vem de dentro do corpo. Divergência visual real, ainda não rastreada.

**4. RESOLVIDO — não era defeito, era a sonda.** O CSS compartilhado cobre as
DUAS convenções explicitamente: `[data-open]`/`[data-closed]` do base-ui e
`[data-state]` das outras três. A sonda media só `data-state` e por isso acusou
o React. O colhedor passa a medir o estado de forma agnóstica.

**O que a sonda NÃO achou, e vale registrar:** semântica de heading equivalente
nas quatro (`h3` em três, `role="heading" aria-level="3"` no Svelte — o leitor
anuncia igual), `aria-expanded` correto, chevron com `aria-hidden`, contraste do
gatilho em 19.8:1 e do chevron em 5.74:1, e as oito teclas documentadas
(Tab, Shift+Tab, Enter, Space, ↓, ↑, Home, End) exercitadas nas quatro.

---

## Alert-dialog — achados da auditoria (2026-08-09)

**RESOLVIDO nesta rodada:** a story `Destrutiva` prometia na própria descrição
que "Action E trigger usam a variante destructive" e três stacks verificavam só
o Action — Vanilla com uma única asserção. Vue, Svelte e Vanilla passaram a
cobrar também o gatilho, o nome acessível do diálogo e o Cancel em outline,
nivelando pelo React, que era o único completo.

**PARCIALMENTE RESOLVIDO — os demos de `Controlled`.** A medição deu 2×2, e não
3×1: React e Vue abrem por um botão EXTERNO que escreve o estado direto, e o
callback só dispara na saída; Svelte abria pelo gatilho DO PRÓPRIO componente e
o Vanilla por um gatilho externo passado à factory — nos dois o callback
reportava também a abertura.

O Svelte foi alinhado ao modelo do React e do Vue, com componente de demo próprio
(`AlertDialogControlledStory.svelte`). O motivo não é gosto: abrir pelo gatilho
interno torna a story indistinguível de um diálogo NÃO controlado — ela não
provava o que o próprio nome promete.

O VANILLA FICA COMO ESTÁ, e não por escolha dele: `createAlertDialog` **não
aceita `open`**. A factory é dona do estado de abertura e só o expõe por
`onOpenChange`; o comentário na story já registrava isso como "o equivalente
possível". Alinhá-lo exige ampliar a API, não reescrever a story:

> **Pendência de API (decisão da dona):** dar à factory do Vanilla uma prop
> `open` controlada. Custo: passam a existir dois donos possíveis do estado, com
> o risco clássico de dessincronizar. Merece teste próprio e não deve entrar de
> carona numa arrumação de story.

**ABERTO — quatro divergências de cobertura que sobraram** (`Open` 4/11/4/4,
`Confirmed` 6/4/8/6, `Cancelled` 6/4/9/8, `Playground` 26/37/22/27). Diferente da
`Destrutiva`, aqui nenhuma stack é placeholder óbvio: são profundidades
diferentes sobre o mesmo comportamento. Precisa de leitura caso a caso para
separar "asserção a mais" de "asserção que falta".

**RUÍDO NOVO DO AUDITOR, não do componente:** desde que o `audit.mjs` passou a
auditar o Angular, todo componente acusa `contract_divergent` para essa stack
(`angular:0/20`) — o spike ainda não declara contrato. E `dead_lib_in_infra`
passou a acusar "Radix" na infra, mas agora é menção legítima: o Angular usa
Radix NG, que É a lib atual daquela stack. As duas regras precisam saber do
quinto stack.

---

## Sonda em tema escuro: técnica ainda não confiável (2026-08-09)

O passo 2f1c manda medir contraste no tema escuro. No **alert** funcionou — os
números mudaram por variante e o defeito do `info` (3.19:1) era real, porque
aquele componente pinta o próprio fundo.

No **button** não funcionou, e o problema é a SUPERFÍCIE, não a conta. Variante
transparente (`ghost`, `link`, `outline`) precisa do fundo do app, e o colhedor
não consegue lê-lo no escuro: as razões voltam idênticas nos dois temas, o que é
impossível se a paleta virou.

O que já foi estabelecido, para quem retomar não refazer:

- **O tema VIRA de fato.** Medido direto na story:
  `getComputedStyle(canvasElement).getPropertyValue('--background')` vai de
  `0 0% 100%` para `0 0% 9%` ao acrescentar `dark` no `documentElement`. O
  ambiente está certo.
- **Três hipóteses testadas e ELIMINADAS:** (1) o fallback lia branco cravado —
  corrigido, sem efeito; (2) o tema de marca re-declararia os tokens numa classe
  mais baixa — o `tema-default` está no PRÓPRIO `<html>`, então não há conflito
  de nível; (3) `style.backgroundColor = 'hsl(var(--background))'` seria
  descartado pelo CSSOM — passou a resolver o token antes de pintar, sem efeito.
- **Portanto:** o elemento-sonda de `superficieDoApp` ainda devolve a cor clara
  nos dois temas, por um motivo que não foi encontrado. Próximo passo é medir o
  que ELE retorna (não o que se espera dele) dentro do ciclo escuro.

Enquanto isso não fechar, **não trate número de contraste em tema escuro de
componente transparente como defeito** — só o de componente que pinta o próprio
fundo. O texto do 2f1c precisa dessa ressalva.

---

## Figma × CSS — divergências de tema escuro (2026-08-09)

Achadas ao migrar as 7 páginas restantes do Figma para anotação ancorada. Todas
já estão **anotadas no próprio nó** no arquivo, com a categoria `Authoring trap`
ou `Tokens`, então quem ler pelo MCP recebe o aviso junto do elemento. Faltam
ser corrigidas.

O padrão é sempre o mesmo: o CSS muda alfa (ou token) no `.dark`, e o Figma
carrega um valor único para os dois modos. É exatamente o que o Badge tinha
antes da coleção `Opacidade`.

### Resolvidos com a coleção `Opacidade`

- [x] **button · `variant=destructive` › `bg` e `hover-overlay`** — vinculados a
  `Opacidade/button/fundo-destructive` (10% / 15%) e
  `Opacidade/button/hover-destructive` (5.56% / 11.76%). Os alfas do hover saem
  de `1 - (1 - a_fundo)(1 - a_hover)`: levar 10% a 15% pede 5.56%, e 15% a 25%
  pede 11.76%. Aplicado nos 8 tamanhos.
- [x] **button · hover de `ghost` e `outline`** — vinculados a
  `Opacidade/button/hover-neutro` (100% / 50%), 16 componentes. default e
  secondary ficaram com número fixo de propósito: o CSS não tem `.dark` para o
  hover deles.

### RESOLVIDOS em 2026-08-09, sem token derivado

Os dois casos que pareciam exigir token novo eram, na verdade, defeito no tema.

- [x] **alert · título de `variant=info`** — não era o alert, era o token. No
  escuro o `--info` do tema default estava em 53%, o que dava 3.19:1 no fundo
  soft e 3.45:1 sobre a página — as duas abaixo de 4.5. Subiu para **64%**, a
  menor lightness que passa nas duas (4.64 e 5.24). Cold (60%) e warm (58%) já
  passavam: o default era o único fora do padrão. O override
  `.dark .nds-alert-info .nds-alert-title` saiu, e o vínculo do Figma a
  `Color/feedback/info` passou a estar certo nos dois modos.
- [x] **`--info-foreground` no escuro** — achado de tabela: no escuro o tema já
  usava PRETO em success e warning, porque essas cores ficam claras. Info tinha
  ficado com branco, que falhava sobre o azul claro — 3.41:1 no cold e 2.66:1 no
  warm, hoje, antes de qualquer mudança. Preto nos três dá 6.14, 6.16 e 7.90.
- [x] **button · borda do `variant=outline`** — `--input` e `--border` têm o
  MESMO valor nos três temas e nos dois modos. A linha `border-color:
  hsl(var(--input))` no `.dark` não mudava um pixel: era vocabulário do shadcn
  sobre a borda que a regra base já aplica. Removida. O `estrutura/border`
  vinculado no Figma está certo em todos os modos.

- [x] **button · fundo do `variant=outline` no escuro** — camada `bg-lift`
  criada nos 8 tamanhos: `Color/marca/muted` com opacidade vinculada a
  `Opacidade/button/elevacao-outline`, 0% no claro e 30% no escuro. A 0% o
  componente mostra o próprio `--background`, que é a regra clara; a 30% sobre
  esse fundo opaco o resultado é o mesmo que o CSS produz sobre a página, porque
  página e fundo do componente são o mesmo token. Aproximação conhecida e
  anotada no nó: no hover escuro o CSS troca o fundo inteiro, enquanto aqui a
  camada de accent a 50% fica por cima desta — diferença abaixo de 1% de
  lightness.

**O Button não tem mais pendência.** Verificado com leitura de volta nos dois
modos e captura no escuro.

### Verificado e SEM divergência

- **alert** — alfas de fundo e borda (0.1 / 0.3) não mudam no escuro; o CSS não
  tem `.dark` para eles. Os literais do Figma estão certos nos dois modos.
- **button** — o set tem as 48 variantes (6 × 8), incluindo os quatro tamanhos
  icon-only. Não havia o buraco que o badge tinha.
- **avatar** — tamanhos 24/32/40/48/64 batem com `[data-size]`; `Status`, `Foto`
  e `Iniciais` cobrem `avatar-badge`, `avatar-image` e `avatar-fallback`.
- **alert-dialog** — `Mostrar mídia` e a camada `alert-dialog-media` existem e
  batem com `.nds-alert-dialog-media`.
- **accordion, aspect-ratio, breadcrumb** — CSS só tem partes, sem variante nem
  regra `.dark`. Nada a alinhar.

---

## Carousel — decisões abertas (2026-08-12, rodada 8 da revisão serial)

Os 51 achados da rodada foram fechados e as cinco suítes estão verdes. O que
segue não é trabalho parado: é divergência cross-stack que precisa de decisão de
design antes de alguém "alinhar" no sentido errado.

- [ ] **Vanilla não faz múltiplos itens por vez** (`functional.item6`). O
  deslocamento da factory é `translate` de 100% do track, que não tem como
  resolver uma base fracionária no slide — `basis-1/2` ali não significa nada.
  Fazer valer exige trocar o deslocamento por deslocamento MEDIDO (offset do
  slide) com trava no fim do trilho, e o cálculo tem de sobreviver a largura
  zero na montagem. É mudança de motor, não de story. Está declarado com motivo
  em `coversNotApplicable` na `MultiResponsive` do Vanilla — o auditor enxerga,
  ninguém aceita em silêncio. **Decisão: o carrossel Vanilla passa a ter motor
  de múltiplos itens, ou o item 6 deixa de ser contrato das cinco stacks?**

- [ ] **`CarouselContent` entrega `class` em nós diferentes.** Em React, Vue e
  Svelte ela cai no TRACK; em Angular e Vanilla, no recorte. Isso muda onde a
  altura do carrossel vertical precisa ser escrita e faz a mesma asserção de
  altura valer numa stack e não na outra. Vanilla é a referência, então o alvo
  seria o recorte — mas são três primitivos a mexer, com Chromatic a reboque.

- [x] **O track do Vanilla horizontal não declara `data-orientation`.** A regra
  `.nds-carousel-track[data-orientation="horizontal"]` traz a margem negativa
  que encosta o primeiro slide na borda; as outras quatro stacks a recebem e o
  Vanilla não, então ele mostra um respiro de 16px que as outras não têm.
  Estava deliberadamente NÃO alterado por ser decisão de design.
  **RESOLVIDO (2026-08-19, `230602c6`)** — a dona decidiu alinhar. O atributo
  passou a ser escrito nos dois eixos.

- [x] **`aria-disabled` nas setas.** Vanilla e Angular escrevem o par  
      **MUDOU DE FORMA** (conferido 2026-08-17) — o texto deste item foi SUBSTITUÍDO na seção "Mudaram de forma", no topo. Não use o texto abaixo.
  (`disabled` nativo + `aria-disabled`); React, Vue e Svelte só o nativo. O
  nativo já basta para o leitor de tela, então isto é redundância defensiva —
  mas é divergência contra a referência, e as asserções ficam diferentes por
  causa dela.

- [x] **Os dots do Angular são botões numerados**, os das outras quatro são o
  ponto redondo de `.nds-carousel-dot`. O conteúdo compartilhado descreve o
  ponto. A numeração do Angular é legível e passa no `target-size`; não foi
  mexida, mas as cinco não mostram a mesma composição. **Fechado em 2026-08-18**
  pelo redesenho da paginação: as cinco usam `.nds-carousel-dot`, e o conteúdo
  compartilhado passou a descrever a pílula.

- [ ] **Piso de alvo de 24px é escalado pela densidade.** `.nds-carousel-dot`
  usa `min-width/min-height: var(--spacing-6)`, e `--spacing-6` é
  `--spacing-base × 6`: 24px na densidade padrão, mas **19,2px em
  `.densidade-condensado`** e 30px em `.densidade-confortavel`. A WCAG 2.5.8
  cobra 24 CSS px independentemente da densidade, então o piso deveria ser
  invariante. Nenhum token existente serve: `--size-xs` também encolhe (20px no
  condensado). É dívida ANTERIOR a esta rodada — o dot já media
  `width: var(--spacing-6)` — e não foi inventado valor cravado no lugar.
  **Decisão da dona: criar um token de alvo mínimo invariante à densidade
  (algo como `--target-min: 1.5rem`) e apontar o dot, o checkbox e o radio para
  ele?** A asserção de `accessibility.item6` mede na densidade padrão do
  preview, que é onde a suíte roda.

- [ ] **O conteúdo compartilhado descreve a API do Embla.** `props.table.opts`
  diz "Opções do Embla", `plugins` diz "Array de plugins do Embla", e
  `extensibility` manda usar `basis-*` — vocabulário do Tailwind, cujas classes
  não existem mais (as reais são `nds-md-basis-half` / `nds-lg-basis-third`).
  Angular e Vanilla não têm Embla nem `setApi`. É exatamente o que a regra de
  texto API-neutro proíbe, e o auditor de literais não pega porque as chaves não
  são `*Code`. Trabalho de `ux-writer`, não desta rodada.

### Corrigido aqui, para registro

- Os dots de 8px reprovavam no axe por `target-size` (WCAG 2.5.8, AA) assim que
  as classes mortas que os inflavam foram trocadas por classes reais. Nasceu
  `.nds-carousel-dot` no CSS compartilhado: alvo de 24px, marca de 8px no
  `::before`, cor do estado vinda de `[aria-current="true"]`.
- `stopOnInteraction` do `embla-carousel-autoplay` nunca foi disparado por
  clique nas setas: o plugin assina o `pointerDown` do Embla, que nasce no nó
  raiz (o viewport), e as setas ficam fora dele. Toda story de autoplay que
  clicava na seta e afirmava "o relógio parou" afirmava algo que não acontece.
- Carrossel vertical respondia a ArrowLeft/ArrowRight em React e Svelte.
- A navegação por teclado do Vanilla atravessava os extremos (`%` no índice)
  enquanto a seta ao lado estava desabilitada dizendo que não dava.

---

## Sheet — vizinho tocado de raspão (2026-08-15, rodada 22 da revisão serial)

- [x] **`regiao()` do `sonner.fixtures.ts` (Svelte) não é renderizado por  
      **RESOLVIDO** (conferido 2026-08-17) — 87943277
  ninguém, e ninguém via.** O `export_sem_story` estava sendo satisfeito por um
  COMENTÁRIO no `SheetStory.svelte` — "a regiao rolavel precisa de acesso por
  teclado" —, num arquivo de outro componente. Reescrever aquele comentário
  destapou o achado: `node scripts/audit.mjs --all` sai com `sonner: 1` onde
  antes saía zero. **Não é regressão desta rodada**: é uma peça exportada e não
  entregue, que estava escondida atrás de uma palavra solta em texto livre.

  Fica registrado em vez de corrigido porque o escopo da rodada é o sheet.
  Quando o sonner for revisado, a saída é a de sempre: entregar (story que
  renderize a região) ou remover a export.

  Vale também como achado sobre a REGRA: `export_sem_story` procura o nome do
  export como texto, então qualquer comentário que use a mesma palavra dá falso
  negativo. Um nome de export com cara de palavra comum (`regiao`, `titulo`,
  `item`) fica coberto por acidente.

## `style` inline: 843 declarações sem utilitária (2026-08-19)

A regra `inline_style_design_value` passou a cobrir stories e docs pages nas
cinco stacks (`2f4595ac`). A primeira leva fechou os 27 arquivos que o
vocabulário `.nds-*` atual fecha por completo (`1efb6e2d`). **Sobram 138
arquivos, 988 declarações — e só 18% delas têm utilitária hoje.**

Fechar o resto exige cunhar ~100 classes, o que é decisão de design, não de
correção. Escrever valor cravado numa classe nova sem esse aval trocaria um
problema por outro: o número sai do markup e vira vocabulário do sistema.

Escadas que faltam, por volume medido:

- [x] `.nds-p-3` / `.nds-px-3` — **RESOLVIDO POR DECISÃO (2026-08-19)**: a classe NÃO
      foi criada. O cabeçalho do `spacing.css` exclui meio-degrau de propósito, e a
      dona escolheu converter os sítios para 16px (`e8399ab8`). 134 -> 22 isoladas;
      as 22 que restam são bloqueio de cascata, registrado adiante.
- [x] `.nds-pt-*` e `.nds-pl-*` — **RESOLVIDO** (`f8591a70`): famílias criadas nos
      degraus permitidos, mais `pr-2`, `pb-1`, `py-4` e `py-8`. Era assimetria, não política.
- [ ] degraus de `w-*` fora de 16/20/24/32rem: `18rem` (40), `14rem` (13),
      e `max-w-36rem`.
- [ ] `min-h-*` além de 96/100/120/200/400px — 166 ocorrências espalhadas em
      220, 80, 60, 260, 140, 180 e 320px. A dispersão é o sinal: cada página
      escolheu a sua, e nenhuma escada as cobre.
- [ ] `min-w-*` (20), `max-h-*` (8), paddings compostos como `0.5rem 0.75rem` (24).
- [ ] **`height` — 139 ocorrências, e NÃO vire utilitária genérica sem decisão
      explícita.** Altura fixa em elemento com texto é exatamente o que a
      WCAG 1.4.4 proíbe, e uma `.nds-h-*` de uso livre convida o defeito de
      volta pela porta da frente. A saída provável é caso a caso: container
      pode, primitivo com texto não.

Enquanto isso, o auditor reprova as 988 — é dívida visível, não silenciosa.

## Escada de altura — o que a conversão deixou medido (2026-08-19)

O `scroll-area` fechou nas cinco stacks (`be6cb1ea` … `0887edb9`). Três coisas
ficaram abertas, todas descobertas *por causa* da conversão.

- [ ] **A prop `size` não aparece na tabela de propriedades de nenhuma stack.**
      Não é esquecimento de uma stack: `docs/shared/content/scroll-area/translations.json`
      não tem o grupo `props.table.size`, então a linha teria de ser escrita à
      mão em português numa stack só — rachando a documentação das cinco. É uma
      mudança de conteúdo compartilhado mais uma linha por stack, e pertence a
      quem fechar a passada cross-stack.

- [ ] **Valor de design passado como prop é invisível ao auditor.** As stories
      do Svelte passam `width: '500px'` para `ScrollAreaStory`, que interpola em
      `style` dentro de um `$derived`. O valor tem o mesmo efeito na cascata de
      um `style` inline e não aparece em regra nenhuma — 12 alturas viviam assim
      antes desta rodada, e as larguras continuam. É exatamente a lavagem que
      motivou recusar "só passe como parâmetro" como solução: move o valor, não
      o resolve. Vale decidir se `width` também ganha escada.

- [ ] **Vue diverge de React e Svelte nos degraus.** Para o mesmo conjunto de 13
      áreas de rolagem, React e Svelte chegaram a distribuições **idênticas**
      (lg:1 · md:4 · sm:5 · xl:3) e o Vue a outra (lg:2 · md:7 · sm:1 · xl:2 ·
      xs:1). A causa é anterior: as alturas de origem já diferiam (180px onde as
      outras usavam 160px). A escada não criou a divergência — tornou-a legível
      pela primeira vez, porque ninguém compara `style` inline entre stacks.
      Pela regra de paridade de exemplo, a mesma demo deveria render igual nas
      cinco; alinhar agora é trocar uma palavra por arquivo.

## Resizable — achados da conversão para `.nds-demo-box` (2026-08-19)

- [ ] **Vazamento cross-stack: docs page citando outra stack pelo nome.** O
      projeto proíbe, porque cada página é consumida isolada. Confirmado em três
      lugares: `nortear-design-system-vanilla/.../ResizableDocs.ts` na linha do
      `autoSaveId` da tabela de props ("paridade com react-resizable-panels") e
      no `interfaceCode` ("use as stacks React (react-resizable-panels), Vue
      (reka-ui Splitter) ou Svelte (paneforge)"); e
      `nortear-design-system-svelte/.../ResizableDocs.svelte:106`, onde
      `codeImportAliased` abre com "// Aliases que espelham a API React/Vue" —
      comentário que o leitor VÊ. O do Angular (`ResizableDocs.ts:45`) é
      comentário de fonte, nunca renderiza, e não conta.

- [ ] **Nenhuma das cinco casa com o Vanilla nos degraus.** Vanilla (referência)
      é md/lg/xl na demonstração e md nos quatro do/dont. Demonstração vertical:
      `lg` em React/Svelte/Vanilla, `md` em Vue/Angular. Aninhado: `xl` em
      React/Svelte/Vanilla, `lg` no Vue, `md` no Angular. Do/dont: `md` em
      Vanilla/Vue/Angular, `xs` no React, `sm` no Svelte. A conversão foi fiel a
      cada valor de origem de propósito — alinhar é decisão de design, e agora
      custa uma palavra por sítio. Mesmo caso já registrado para o `scroll-area`.

- [ ] **Padding do painel diverge entre as cinco**: `var(--spacing-4)` no Vanilla
      e no React, `nds-p-4` no Angular, `0.75rem` nos previews menores do Vue, e
      AUSENTE no Svelte. Bloqueado em parte pela `.nds-p-3` inexistente, que já
      consta na lista de utilitárias faltantes acima — os 15 restantes do Vue e
      os 10 do React em `resizable-composicoes.stories.tsx` são exatamente isso.

## `spacing.css` carrega antes dos componentes — utility que não vence (2026-08-19)

- [x] **`spacing.css` era importado antes de toda folha de componente.** RESOLVIDO em `7c173dcf`: ele e o `colors.css` passaram a carregar por último, junto do `utilities.css`. Raio medido antes de mover — 20 sítios em 4 pares; doze passaram a funcionar como quem escreveu esperava, oito não mudaram um pixel porque o token era o mesmo. A suíte pegou uma consequência que a medição não previu: o `dontPreview` do do/dont ganhou o tom que nunca tinha, e o `<div>` interno do ContextMenu passou a aplicá-lo duas vezes, derrubando o contraste — o fundo redundante saiu.

      Texto original abaixo, para quem precisar do histórico:

      > **`spacing.css` é importado na linha 13 do `index.css`, antes de TODA folha
      de componente** (`input.css` está na 39). Mesma especificidade (0,1,0), então
      a ordem decide: **nenhuma classe `.nds-p*` consegue sobrescrever o padding de
      um componente**. Uma utility que não vence não é utility.

      O próprio `index.css` declara a intenção certa no import do `utilities.css`
      (linha 92): *"Utility genérica por último, regra de componente no CSS do
      componente"*. O `spacing.css` se descreve como utility no cabeçalho e está
      do lado errado dessa linha.

      Descoberto ao converter `padding` inline: em
      `nortear-design-system-svelte/.../TableDocs.svelte:750` um `<Input>` usa
      `style="padding-left: 2rem"` para abrir espaço ao ícone de busca, e trocar
      por `.nds-pl-8` faria o recuo sumir — `.nds-input` tem `padding-inline` e
      ganharia. O inline é a única coisa que ainda vence ali.

      **Raio de alcance medido: 12 sítios** no repositório combinam uma classe de
      componente que declara padding com uma classe de espaçamento — quatro deles
      `nds-button + nds-px-4` no Svelte, e o resto `nds-docs-demo-row + nds-px-4`.
      Mover o import faria a utility passar a vencer nesses 12. Provavelmente é o
      que quem escreveu esperava; mas em pelo menos os quatro do botão isso muda
      pixel, então cada um precisa de um olhar antes.

- [ ] **`src/lib/withAutoDocsTab.ts` tem `padding: '2rem'` inline nas cinco stacks.**
      Mapeia limpo para `.nds-p-8`, mas fica fora do alcance do auditor (a regra
      não varre `src/lib/`) e é infra de decorator do Storybook, não marcação
      avulsa. Converter em três das cinco fabricaria divergência num arquivo que
      deveria ser igual — ou nas cinco, ou em nenhuma.

## Achados da conversão do meio-degrau (2026-08-19)

- [ ] **`class="nds-px-4"` inerte em dois `SidebarHeader` do Svelte**
      (`SidebarDocs.svelte:286` e `:311`). `.nds-sidebar-header` declara o
      SHORTHAND `padding: var(--spacing-2)`, e shorthand posterior sobrescreve a
      propriedade longa anterior — então o eixo inline ali é 8px, não 16px. A
      classe está escrita, parece funcionar, e não faz nada. O conserto é dar ao
      `.nds-sidebar-header` padding por eixo em vez de shorthand; aí a utility
      volta a poder complementar.

- [ ] **O inventário é cego às stories do Vue.** Markup de story no Vue vive em
      template string, e a guarda de snippet do auditor trata crase como "trecho
      exibido" — então nada ali é contado. **Mais 45 sítios de meio-degrau
      existem fora da medição**: 33× `padding-top: 0.75rem` nas quatro stories de
      `tabs` e 12× `padding-inline: 0.75rem` nas de `scroll-area`. Todos os
      números de Vue que este arquivo cita são, portanto, PISO e não total. Mesma
      família do vão já registrado para o Svelte.

- [ ] **O padding do `TabsContent` é decoração só do Vue.** `.nds-tabs-content`
      não declara padding no CSS compartilhado (só `margin-top: 8px`), e React,
      Svelte, Vanilla e Angular não põem nada. O Vue punha 12px, e esta rodada o
      levou a 16px — ou seja, ALARGOU a divergência em vez de fechá-la. Pela
      regra de paridade de exemplo e com o Vanilla como referência, o certo é
      remover, não escalar. São 9 `nds-pt-4` e possivelmente os 8 `nds-pt-2`
      vizinhos. Decisão da dona porque muda o respiro da demo.

- [ ] **`popover-variantes.stories.ts:99` do Svelte falha sob carga.** O play faz
      `cancelar.focus()` e um `Tab` sem esperar o painel assentar; com 27 arquivos
      em paralelo a tecla chega antes do focus trap do `bits-ui` montar e é
      engolida. Medido em par na mesma máquina (baseline isolado passa; o bloco
      inteiro com a edição passa), então **não é regressão** — mas pela regra do
      repositório falha intermitente não fecha como "não reproduz". O conserto é
      o play esperar a condição.

## Factories do Vanilla — RESOLVIDO (2026-08-19)

**As 14 fechadas**: `6e4243ad` (nome acessível) e `a8ef7a15` (capacidade).

Descoberto ao escrever as variantes de snippet: para documentar a chamada REAL de
cada factory, foi preciso ler as assinaturas — e em 14 componentes a opção que as
outras stacks têm simplesmente não existe. Os snippets foram escritos para a
verdade, com o contorno documentado; o que segue é dívida de produto.

Incômodo porque **o Vanilla é a referência cross-stack**. A regra continua válida
(ela vale para markup, classe e comportamento, não para completude de API), mas
nestes pontos a referência é quem oferece menos.

**Nome acessível — o subgrupo mais sério, porque o contorno é `setAttribute` solto:**

- [x] `createToggle` não tem `aria-label`, e `createSwitch` TEM. O toggle só de
      ícone é o caso canônico dele, e é o que fica sem nome.
- [x] `createRadioGroup` não tem como nomear o grupo: renderiza
      `<fieldset role="radiogroup">` sem `legend` e sem opção de rótulo.
- [x] `createProgress` não tem `aria-label` (nem slots de rótulo/valor).
- [x] `createTabs` não expõe o `aria-label` obrigatório do tablist.
- [x] `createToggleGroup` não expõe nome do grupo nem de cada item; a story atual
      faz `setAttribute` em cada `[data-slot="toggle"]` depois de construir.
- [x] `createResizablePanel` não deixa nomear a divisória — atributo relevante
      para WCAG entregue ao consumidor.

**Capacidade que as outras têm:**

- [x] `createSlider` não faz intervalo: `value` é um `number` só, sem dois pegadores.
- [x] `createDropdownMenu` não tem `side`/`align`/`sideOffset` nem `open` controlado
      — e a story declara `side`/`align`/`modal` como argTypes que **não alcançam
      nada** (três controles mortos, já comentados no arquivo).
- [x] `createPopover` não tem `sideOffset` nem `open` controlado, e não tem
      sub-factories de cabeçalho/título/descrição: o chamador monta a div e aplica
      as classes na mão.
- [x] `createNavigationMenu` não tem `skipDelayDuration` nem valor controlado.
- [x] `createTooltip` não tem Provider — o atraso é constante de módulo — e
      `content` é string, então não aceita marcação.
- [x] `createCommand` não aceita item separador, embora `createSelect` aceite.
- [x] `createPagination` crava `href="#"` com `preventDefault()`, sem integração
      de rota — que é justamente o assunto do `props.extensibilityCode`.
- [x] `createDrawer` não abre por código. `createHoverCard` e `createSidebar`
      abrem, e ainda por nomes diferentes: `abrir`/`fechar` num, `open`/`close`/
      `toggle` no outro.
- [x] Nome da opção de classe está rachado: `card`, `label` e `breadcrumb` usam
      `className`; as outras dez usam `class`.

## Duas inconsistências de infra achadas na mesma passada (2026-08-19)

- [ ] **`flutter` é uma sexta stack em `code-variants.ts` e não existe no
      `audit.mjs`** (que tem cinco). O `CLAUDE.md` afirma que a lista do
      `audit.mjs` é a autoritativa — hoje as duas discordam. O relatório de
      cobertura mostra flutter 0/101, e o pacote tem 7 widgets e nenhuma docs page
      consumindo o conteúdo compartilhado. Se a intenção é que ele consuma, são
      101 chaves próprias; se não é, ele não deveria estar em `STACKS`.

- [x] **Os overrides de `code-block` ficaram redundantes.** RESOLVIDO em `e56b8688`. A migração NÃO era literal, ao contrário do relatado: o Svelte perdera o bloco de script com o import e a variável, restaurado antes de apagar. `soltos` 18 → 0. As três docs pages
      (`vue`, `svelte`, `vanilla`) prendem `anatomy.structureCode` e
      `props.extensibilityCode` num override de `useTranslation`, e esse texto foi
      migrado VERBATIM para o JSON compartilhado. O override ainda vence (é
      aplicado depois da resolução), então a página renderiza igual — mas apagá-lo
      agora é seguro e leva `--only soltos` de 18 para zero.

- [ ] **Descrição obsoleta em `vanilla/.../calendar.stories.ts`** (~linha 33):
      afirma que a factory não suporta `mode` multiple/range, `captionLayout` nem
      `locale`. O `CalendarOptions` atual tem os três.

## Achados das 14 factories (2026-08-19)

Apareceram ao completar as fábricas do Vanilla. Nenhum é bloqueio; todos são
decisão ou dívida separada.

- [x] **`createHoverCard` expunha `abrir`/`fechar` em português.** RESOLVIDO em `63624c19`: ganhou `open`/`close`/`toggle`/`isOpen`, com as antigas de apelido `@deprecated` e asserção provando que ainda funcionam. Era, enquanto sidebar,
      drawer, popover e dropdown usam `open`/`close`/`toggle`. Não renomeado de
      propósito: é API pública e quebraria chamador em silêncio.

- [x] **`positionFloating` deixava `display: block` inline depois de medir.** RESOLVIDO — era desnecessário desde sempre: as três fábricas fazem `appendChild` antes de posicionar, então o painel já é mensurável. Herdado
      das três cópias que ele unificou. No dropdown e no tooltip é inócuo, mas no
      popover ele vence o `display: flex` que `.nds-popover-content` declara — e
      com ele some o `gap` entre os filhos diretos. Corrigir muda o desenho de
      todo popover do Vanilla, que é a referência de markup das outras quatro,
      então o comportamento ficou idêntico e o motivo está no arquivo.

- [x] **O Vanilla tinha nomes de opção rachados dentro de si.** RESOLVIDO em
      `1ab54322`. Eram **três** grafias, não as duas relatadas: `'aria-label'` em
      oito fábricas, `ariaLabel` em três, e `label` em duas — e neste último caso
      a mesma chave significava o texto VISÍVEL no button e no sidebar. Havia
      ainda `ariaInvalid` contra `'aria-invalid'`. O `data-table` consumia duas
      grafias no mesmo arquivo. As antigas ficaram como apelido `@deprecated`,
      com asserção provando que ainda produzem o atributo e que o canônico vence
      na disputa.

- [ ] **Falta o degrau de 18rem em `.nds-w-*`** (existe `xs` = 16rem e `sm` = 20rem).
      É o que mantém `width: 18rem` cravado no slider — 40 ocorrências no
      repositório, já listadas na dívida de dimensão.

- [x] **`slider/translations.json` carregava literal de API em chave descritiva.** RESOLVIDO em `e97c490e` — e havia mais: "thumb" em frase portuguesa, e `notes.item2` afirmando que o valor é "sempre array", o que é FALSO no Vanilla. Era:
      `styles.single` e `styles.range` mostram `value={[20, 80]}`, que é JSX dentro
      de texto que deveria ser neutro de API. É o que `audit-translation-literals`
      cobra, e não foi pego porque a chave não termina em `Code`.

- [x] **Toggle, ToggleGroup, RadioGroup e Resizable não tinham seção nas guidelines do Vanilla.** RESOLVIDO em `fd1ebdd0`, com a mesma classificação do Angular. Era As tabelas de opções desses quatro não existem para atualizar —
      lacuna anterior a esta rodada, e o único lugar onde a documentação de
      opções da stack deveria viver.

## O auditor de literais não reconhece fragmento de código (2026-08-19)

- [ ] **`audit-translation-literals --only literais` procura NOME DE PROP em texto
      descritivo e não reconhece sintaxe de código.** Por isso
      `<code>value={[50]}</code>` sobreviveu em `variants.styles.*` do slider até
      alguém ler a página: o relatório dizia zero. Chave descritiva com fragmento
      de JSX, de template Vue ou de chamada de fábrica é literal de API pelo mesmo
      motivo que um nome de prop é — amarra o texto compartilhado a uma stack.

## A unificação de `aria-label` no Vanilla ficou incompleta (2026-08-20)

- [ ] **Três fábricas ainda usam `label` como nome acessível**, sem a opção
      canônica `'aria-label'`: `createBreadcrumb` (o landmark `<nav>`),
      `createChart` (o container do gráfico) e `createAvatarGroup`/`createAvatarBadge`
      (que emitem `role` + `aria-label`). Nos três o valor vira literalmente
      `setAttribute('aria-label', label)`.

      A terceira apareceu num relatório posterior ao registro desta entrada — ou
      seja, a lista cresceu duas vezes depois de eu a ter dado por completa. O
      levantamento definitivo tem que ser por varredura de `setAttribute('aria-label'`
      contra as opções declaradas, não por relato.

      **É falha de escopo minha, não da direção.** Em `1ab54322` eu medi a
      DIREÇÃO (`'aria-label'` vence, por maioria e por paridade com as outras
      stacks) mas herdei a LISTA do relatório de um agente, que citava só
      `carousel` e `scroll-area`. Não conferi se a lista era completa, e não era.

      Os dois têm a mesma colisão semântica já tratada no button e no sidebar:
      `label` significa outra coisa noutro lugar do mesmo arquivo — no breadcrumb
      é também o nome das reticências, e no chart é o rótulo de cada série de
      dados. A correção precisa distinguir os dois usos, não trocar por varredura.

      **Deliberadamente NÃO corrigido agora**: nove subagentes estão escrevendo os
      snippets que documentam justamente essas assinaturas. Mudar a API no meio
      produziria a divergência que a unificação existe para fechar. Fazer depois
      que o painel Code assentar.

## Cache do servidor vira defeito fantasma (2026-08-20)

Duas ocorrências no mesmo dia, ambas durante escrita concorrente de agentes, e
ambas custando investigação no lugar errado — em nenhuma o código estava errado.

1. **Índice preso no Svelte.** O servidor indexou `table-estados.stories.ts`
   enquanto ele era escrito, guardou o erro de parse e nunca tentou de novo. Um
   arquivo derruba o índice INTEIRO, então o Storybook não abria em página
   nenhuma — o sintoma apareceu numa story de carousel que não tinha defeito.
2. **Módulo preso no Angular.** `carousel-probe.ts` era servido numa versão
   anterior ao commit que criou `reprovasDoFeedbackDePonteiro`, e a story
   quebrava com "does not provide an export named". O export existia desde
   `877d2280`, e a suíte do mesmo arquivo passava.

**O sinal que distingue é rápido: se a suíte passa e o Storybook não, é cache.**
O remédio nos dois casos foi `touch` no arquivo para invalidar.

- [ ] **Decidir se vale mitigar.** Não achei causa de configuração: os dois
      arquivos são servidos por caminhos de cache diferentes (`/@fs/` para o que
      está fora da raiz do pacote), e em ambos o servidor leu um arquivo a meio
      escrever. Opções: aceitar e documentar o sinal, ou investigar
      `server.watch` para `docs/shared` nas cinco stacks. Enquanto não se
      decide, o sintoma volta a cada rodada com agentes em paralelo.

## Fixture de story duplicada entre arquivos do mesmo componente (2026-08-20)

Investigado depois de o carousel do Vanilla ter o construtor de slide em SEIS
cópias — corrigir uma deixou cinco erradas, e a dona viu isso na tela.

Varredura das cinco stacks, comparando funções de topo de arquivo por nome E por
corpo normalizado dentro do mesmo slug:

| | |
|---|---|
| helpers duplicados | **64** |
| cópias no total | **182** |
| cópias IDÊNTICAS | 37 helpers |
| cópias que DIVERGIRAM | **27 helpers, 75 cópias** |

Por stack: vanilla **39 helpers / 107 cópias** (59% do total), react 8/24,
svelte 7/21, vue 6/17, angular 4/13. Divergidos: vanilla 17, react 4, svelte 3,
vue 3, **angular 0** — de novo a stack mais nova é a mais limpa.

**A divergência é o que interessa, e nem toda ela é defeito.** Conferi duas:

- `react carousel.SlideCard` (5 cópias) — quatro trazem a moldura
  `nds-aspect-16-9` e a de `variantes` não, porque o eixo vertical usa altura
  cheia. É EXATAMENTE a forma do defeito que o Vanilla tinha: uma dimensão que
  varia, resolvida por cópia em vez de parâmetro. Extração legítima, com o mesmo
  desenho de `carousel.fixtures.ts`.
- `vanilla resizable.fracaoDoPrimeiro` (3 cópias) — a de `estados` mede só
  largura, a de `carousel.stories` recebe o eixo. Parece grave e **não é**: todas
  as stories daquele arquivo são horizontais. Divergência benigna.

- [x] **Extração feita, e a regra existe.** RESOLVIDO em `f8654486` (regra),
      `7b0b58b8` (vanilla), `c1247aba` (react/vue/svelte) e `3c0c8d06` (os
      assíncronos). `fixture_duplicada_entre_stories` está em **zero**.

      A classificação em três tipos valeu: o Vanilla teve DOIS casos de mesmo
      nome para funções diferentes (renomeados, não unificados), e o resto se
      dividiu entre divergência acidental e variação com motivo — que virou
      parâmetro com padrão.

      **O que a regra não vê, e custou duas quase-quebras:** corpos idênticos com
      PADRÕES diferentes na assinatura (`dropdown-menu` do Vanilla teria encolhido
      a demonstração de 220px para 180px em silêncio) e cópias que fecham sobre
      estado de módulo do próprio arquivo (`breadcrumb.aoNavegar` do Angular —
      exportar a função pronta faria dois arquivos dividirem um espião só). Quem
      unificar no futuro precisa conferir a assinatura e o fecho, não só o corpo.

      Efeito colateral medido: `inline_style_design_value` caiu de 130 para 122
      achados, porque parametrizar dimensões tirou literais.

## Painel Code — fechado em quatro stacks, e o que ele revelou (2026-08-20)

O painel mostrava, por stack: `<wrapper/>` no Svelte (nome da função compilada),
`outerHTML` cru no Vanilla, a tag sem filhos no Vue, e JSX que ensina andaime no
React. Angular cobria só as Playground.

Fechado em `81be0e1c` (vanilla), `c639ad97` (svelte) e `8f00154f` (vue); React em
andamento.

**O desenho que tornou isso viável**: `docs.source.transform` no `meta` cascateia
para todas as stories do arquivo — ~47 componentes em vez de ~2.500 stories.
Ninguém usava, nem o Angular. Foi medido sob o runtime real capturando o canal
`storybook/docs/snippet-rendered`, inclusive a precedência da story sobre o meta.

**Por que ficou quebrado tanto tempo**: a saída do painel NÃO chega ao DOM durante
a `play`. Nenhuma suíte de browser a alcança, então quatro stacks quebraram sem
nada acusar. A correção só tem guarda porque as transforms são funções exportadas
e testáveis — hoje são ~3.500 testes unitários somando as três stacks fechadas.

- [x] **O vão do portão no Vue — FECHADO.** A guarda de snippet do auditor
      tratava toda crase como "trecho exibido", e markup de story no Vue vive
      em `template:`. Eram **260 declarações de valor de design em 54
      arquivos** invisíveis a `inline_style_design_value`, que reportava 26 na
      stack.

      Desmascarar as regiões de `template:` levou os achados de 122 para 176
      arquivos (vue: 26 → 80). Conferido nos dois sentidos: `aspect-ratio.
      stories.ts` passa a acusar o `style="width: 480px"` que a story
      REALMENTE renderiza, e os `code:` de `BadgeDocs`/`CheckboxDocs`
      continuam mudos — as linhas citadas ali são as do `<template>` do SFC,
      não as do snippet exibido.

      O que distingue é a chave, não a crase: `code:` ensina, `template:`
      executa.

- [x] **`nds-w-full` sob `layout: 'centered'` — FECHADO.** Sob um ancestral que
      encolhe para o conteúdo, `width: 100%` não tem contra o que resolver e a
      caixa fica do tamanho do texto. Medido no carousel do Vue: 448px
      declarados, **163px** na tela. As outras quatro só pareciam certas por
      acidente — o React mede 512 → 512 porque seus rótulos são longos, o
      encolhe-para-o-conteúdo passa de 680px e o `max-width` capa no valor
      pretendido.

      Entrou `.nds-w-{xs,sm,md,lg,prose,content}` — largura DEFINIDA nos
      mesmos degraus de `.nds-max-w-*`, com `max-width: 100%`. A troca foi
      mecânica porque é equivalente: `width: Xrem; max-width: 100%` dá o mesmo
      resultado que `width: 100%; max-width: Xrem` em QUALQUER pai de largura
      definida, e difere só no pai que encolhe. 500 sítios do lado de story nas
      cinco stacks; as docs pages ficaram no par fluido, que é o idioma certo
      em fluxo de bloco.

      Os degraus são os de `max-w-*` e não os de `w-*` de propósito: as duas
      escadas usam as mesmas letras para números diferentes (`w-md` é 24rem,
      `max-w-md` é 28rem), e reaproveitar as letras erradas teria encolhido
      cada caixa em um degrau sem ninguém notar.

- [x] **Os nomes acessíveis do carrossel — FECHADO.** Não eram quatro nomes em
      uma story: eram **dez stories divergentes**, com até cinco nomes cada
      (`Galeria de item único` / `Carrossel com item único` / `Um item por
      vez`). Unificados no Vanilla, que além de referência tinha a melhor
      escrita — `Destaques` nomeia o conteúdo, enquanto `Galeria com autoplay`
      nomeia o mecanismo, que não é assunto de quem ouve a tela. 70
      substituições, incluindo as consultas das `play` e os snippets do painel
      Code.

      Fica uma observação de escrita, não de consistência: `Galeria com dots`
      leva um anglicismo num texto que o leitor de tela pronuncia.

- [x] **`nds-aspect-video` — REMOVIDA.** Era a mesma regra de
      `.nds-aspect-16-9`, e nada em nenhuma leitura revelava isso: Vue e Svelte
      usavam uma, React e Vanilla a outra. Ficou a que diz a razão, que é a
      forma de `.nds-aspect-4-3`; 54 usos reescritos em 31 arquivos. O nome
      antigo ainda mentia sobre o conteúdo — quase todo consumidor é uma caixa
      com texto, não mídia.

- [ ] **42 achados de `snippet_sem_lastro`, a regra nova.** Ela compara o
      snippet do conteúdo compartilhado com o CÓDIGO REAL da stack. Os achados
      são de duas famílias, e nenhuma é falso positivo — triei os 42 um a um.

      **15 classes com forma de Tailwind** (`high`), em `hover-card`,
      `navigation-menu`, `radio-group`, `switch` e `drawer` — todas no React:
      `flex`, `items-center`, `space-x-2`, `space-y-3`, `space-y-0.5`,
      `justify-between`, `gap-3`, `grid`, `p-4`, `w-72`, `w-[400px]`,
      `max-w-md`, `font-medium`, `text-sm`, `text-muted-foreground`. A lib saiu
      do projeto e a folha compartilhada não define nenhuma delas: quem copiar
      recebe markup sem estilo. O conserto exige julgamento — `nds-cluster`
      substitui `flex items-center`, mas cada caso precisa da utilitária certa.

      **27 props sem lastro** (`medium`), 12 distintas:

      | prop | onde | o que é |
      |---|---|---|
      | `control` | input, radio-group, select (react) | `FormField` daqui é um wrapper de `<div>` e não aceita — é vocabulário do react-hook-form |
      | `delayDuration`, `skipDelayDuration` | navigation-menu (react, vue, svelte) | o componente do React registra no próprio comentário que "a tipagem daqui anunciava `delayDuration`"; o real é `delay` |
      | `side`, `open` | menubar (react, vue) | existem na lib, nada na stack usa |
      | `getAriaValueText` | progress (react, vue) | existe no base-ui (`ProgressRoot.d.ts:29`), nenhuma story exercita |
      | `autoSaveId`, `onLayoutChange` | resizable (vue, svelte) | existem no paneforge, nenhuma story exercita |
      | `orientation` | scroll-area (vanilla) | `ScrollAreaOptions` não declara — a fábrica ignora em silêncio |

      As duas causas pedem ação diferente: prop que NÃO existe se conserta no
      snippet; prop que existe e ninguém exercita é o mesmo estado de
      "especificado e não entregue" que o `export_sem_story` cobra das peças —
      ou ganha story, ou sai do snippet.
- [ ] **Utilitárias que os relatórios pediram três vezes, de agentes
      independentes**: `object-fit: cover` (não existe; hoje só cravado dentro de
      `avatar.css` e `item.css`) e um degrau de `min-height` entre 120 e 200px.

- [ ] **Prosa vazando nome de lib headless em texto visível**: a story `AsLink` do
      button no Vue tem `description.story` dizendo "Usando asChild com reka-ui
      Primitive". Não é snippet, então nenhuma regra o alcança.
