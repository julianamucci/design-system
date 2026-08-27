# Fixes pendentes — Pipeline `new` · editor · 2026-08-27

Fase F da pipeline. Consolidado dos quatro auditores (`/quality`, `/analytics`,
`/seo-geo`, `/cross-stack`) mais o que os cinco dev-agents reportaram como
decisão tomada por omissão do contrato.

O padrão da rodada: **as cinco implementações convergiram; o que divergiu foi o
contrato escrito para elas.** Dezoito dos 27 itens são do conteúdo compartilhado
ou da infraestrutura, não das stacks.

---

## Críticos — dado errado, acessibilidade, ou cobertura que mente

- [ ] **`docs_demo_click` dispara em dobro, e o segundo leva rótulo traduzido.**
  `EditorDocs.vue:171`, `EditorDocs.svelte:130`, `angular/EditorDocs.ts:392`.
  Os controles da demo não têm marcação própria, então o `closest()` do
  observador sobe até o container auto-instrumentado e emite um segundo evento
  com `element_id` vindo de `textContent`. No GA4 a contagem infla ao dobro em
  três das cinco stacks, e o mesmo controle vira três identificadores conforme o
  idioma. Nenhum portão pega: o evento existe, é tipado, e o payload é string
  válida. **Certas: vanilla e react.**

- [ ] **Cobertura fantasma no angular.** `editor-compositions.stories.ts:44`
  declara `covers: ['functional.item7']` (colar e arrastar) numa play que só
  chama `insertImage`, sem um `ClipboardEvent` ou `DragEvent`;
  `editor-states.stories.ts:51` declara `visual.item1` (ordem dos blocos e
  divisória) sem verificar nem uma coisa nem outra. Item declarado e não
  verificado é pior que item não declarado — o auditor de contrato passa a
  afirmar cobertura com aval.

- [ ] **A caixa da lista de tarefas mede 13×13 e reprova `target-size`**
  (WCAG 2.5.8). Vale para as cinco: é a folha compartilhada
  `docs/shared/styles/nds/editor.css` que não dimensiona o alvo. O `preview.ts`
  liga a regra explicitamente, então o axe reprova de verdade — o agente do
  react contornou tirando a lista do quadro final, e fez certo em não escrever
  CSS. Correção preserva o tamanho visual e expande só a área de toque por
  pseudo-elemento; inflar a caixa para 24px desalinha a lista.

- [ ] **Em somente leitura a barra ainda aplica comando.** `editor.commands`
  funciona com `editable: false`: clicar em Negrito acende o botão sem mudar o
  HTML, contradizendo o que `states.readOnly` promete. **Só o svelte guarda**
  (`editor.svelte:943`); vanilla (`editor.ts:1124`), react, vue e angular não.
  Quatro com o defeito e uma com a correção é pior que cinco iguais.

- [ ] **A docs page do vanilla remonta o editor a cada clique de controle**
  (`EditorDocs.ts:234`) — texto digitado na demonstração desaparece. As outras
  quatro trocam a configuração sem remontar.

- [ ] **Svelte omite `trackId` em `DocsVariants`** (`EditorDocs.svelte:302`), e o
  `snippet_id` do `docs_code_copy` passa a ser o nome traduzido do card. Mesmo
  evento com três valores diferentes conforme o idioma.

---

## Médios — o contrato que escrevi

- [ ] **O `translations.json` desvia do schema canônico em quatro pontos**, e é o
  único componente do repositório assim:

  | seção | forma canônica | o que está lá |
  |---|---|---|
  | `states.cols` | `{ state, trigger, behavior }` | `{ state, description }` |
  | `tokens.table` | `{ token, value, description }` | `{ token, usage }` |
  | `usage` | `guidelines.items[]` + `scenarios.cols{scenario,use,alternative}` | parágrafo solto, frases sem coluna |
  | `doDont.pairN` | sem `reason` | `reason` por par |

  Quatro dev-agents relaxaram os mesmos containers compartilhados, em paralelo e
  sem se ver, para acomodar isso — `DocsStates.cols.trigger/behavior`,
  `DocsWhenToUse.scenarios`, `DocsTokens.cols.value` viraram opcionais. A
  mudança é aditiva e as 66 páginas seguem verdes, mas **o contrato de 66
  páginas foi afrouxado por causa de um conteúdo escrito errado**: a partir de
  agora um componente novo pode declarar tabela de estados sem gatilho nem
  comportamento e nenhum portão reclama.

  Ordem obrigatória: corrigir o conteúdo PRIMEIRO, e só então avaliar se as
  relaxações voltam atrás. Desfazer o container antes quebra as cinco docs pages
  ao mesmo tempo.

- [ ] **Os 38 rótulos da barra não têm chave no conteúdo compartilhado.** Só os
  quatro controles da demonstração têm. Hoje as cinco stacks carregam o mesmo
  objeto local em pt-BR, então **a barra inteira aparece em português também em
  en e es**. É a maior lacuna de conteúdo, e o `/seo-geo` amarrou o efeito:
  `aiEntities` trilíngue apontando para uma interface monolíngue — o dado
  estruturado promete o que a página não entrega.

- [ ] **`seo.description` passa de 155 caracteres nos três idiomas**
  (168 / 157 / 175). Entre 52 slugs, só o editor e o `skeleton` fazem isso; a
  SERP trunca.

- [ ] **`seo.title` foge do padrão `{Componente} — {Categoria}`** que 49 de 52
  slugs seguem. "Editor de texto rico" perde "Formulário".

- [ ] **`description` não abre com "Documentação do / Documentation for /
  Documentación del"**, como 48 de 52 abrem.

- [ ] **`import.basicCode.svelte` usa `$lib/components/ui/editor`**, e o alias
  real daquela stack é `@/`. A seção Importação diverge do painel Code.

- [ ] **`props.extensibilityCode` só tem variante `vanilla`.** React, vue,
  svelte e angular caem no fallback — é o "1 sem variante" que o
  `--only cobertura` reporta. Ou ganha as cinco, ou vira neutro.

- [ ] **A spec do Do & Don't par 1 estava furada.** Mandei trocar
  `labels.actions.link` e `labels.actions.table` para contrastar rótulo verbal
  com substantivo, mas `table` não existe no conjunto básico e o conteúdo não
  traz o rótulo verbal do link — o vue teve de inventar "Inserir link". Ou o
  conteúdo ganha os dois rótulos, ou o par muda de exemplo.

- [ ] **API Reference com 4 linhas de 7 em vanilla e angular.** Medido: os
  `argTypes` do Playground trazem `content`, `editable`, `preset` e o callback;
  faltam `labels` (obrigatória), `resolveImage` e `describeImage`. React tem 8,
  vue 7, svelte 9. Atenção ao falso alívio: a seção "Propriedades" da docs page
  lê a tabela do conteúdo compartilhado e mostra as 7 linhas nas cinco — são
  coisas diferentes com o mesmo nome, e foi por isso que dois auditores se
  contradisseram.

- [ ] **Angular sem `editor.source.ts`**: 1 de 8 stories tem `transform` de
  snippet, então o painel Code imprime o `template` de andaime com bindings de
  args em vez do uso real. As outras quatro têm 8 de 8.

- [ ] **`props.table.onChange.name` sem override em vanilla e react**
  (`EditorDocs.ts:81`, `EditorDocs.tsx:57`): a tabela mostra "callback de
  mudança" onde deveria mostrar o nome real da prop daquela stack.

- [ ] **`doDont.pairN.reason` só renderiza no vue** (`EditorDocs.vue:520`). Os
  outros quatro `DocsDoDont` não conhecem o campo, e o texto do porquê some.

- [ ] **Svelte: a demonstração é um grupo de escolha única de três**
  (`EditorDocs.svelte:168`), então `readOnly` exclui o conjunto escolhido. Nas
  outras quatro são alternadores independentes.

- [ ] **Svelte não sobrescreve `editorField`** com `demonstration.labels.content`
  (`:179`): o nome acessível da área editável não acompanha o idioma.

- [ ] **Vue escreve `data-slot="toggle-group-item"`** nos alternadores da barra;
  as outras quatro escrevem `"toggle"`. **Vanilla é a régua.**

- [ ] **Angular: o agrupamento de controles da demo não tem `role` nem
  `aria-label`** (`EditorDocs.ts:208`).

---

## Baixos

- [ ] **Três estados finais não fotografam o que declaram.** `WithImage` declara
  `visual.item3` (anel de foco e alça visíveis) e fecha com a imagem no tamanho
  natural de 1×1 em vue, svelte e angular; react e vanilla fecham entre 170 e
  200px de propósito. O Chromatic fotografa o fim.

- [ ] **`AiImageDescription` fecha em `<p>correção</p>`**, sobra do teste, em
  react, vue, vanilla e angular. Só o svelte restaura o conteúdo da demo.

- [ ] **Asserção que não pode falhar** no vue
  (`editor-states.stories.ts:246`): `expect(first).toBeGreaterThanOrEqual(48)`
  contra um piso que é exatamente 48.

- [ ] **`markup_in_text_surface` é falso positivo contra genérico de
  TypeScript.** `Promise<string | null>` em `props.table.*.type` é tratado como
  tag, e a correção que a regra sugere (`toPlainText()`) APAGARIA
  `<string | null>`, deixando a documentação mentindo o tipo. `code-block` e
  `skeleton` têm genérico igual no mesmo campo. O detector precisa distinguir
  generico de tag — `<…>` com espaço, `|` ou `=>` dentro não é markup.

- [ ] **Guideline de teste: arquivo de fixture com bytes iguais vira o mesmo
  `data:` URL.** O resolvedor padrão embute o arquivo, o cache de descrição é
  por `src` (e está certo), e dois arquivos de mesmo conteúdo com nomes
  diferentes compartilham descrição. **Quatro agentes independentes bateram
  nisso na mesma rodada**, cada um perdendo tempo achando que era defeito de
  colar ou de arrastar. Isso pertence à guideline de teste, não à cabeça de quem
  escreve a story: fixture binária deriva os bytes do nome.
