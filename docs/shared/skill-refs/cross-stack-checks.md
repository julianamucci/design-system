# Cross-Stack Checks — Catálogo

Referência usada por `/cross-stack`. **Leia apenas se precisar do detalhe de um check específico.**

---

## Como executar

**Use ferramentas nativas em paralelo, não loops bash.** No Windows, loops são lentos (processo separado por iteração) e seriais. `Grep`/`Glob`/`Read` rodam em paralelo no mesmo turno.

---

## Check 1 — Classes `cva()` / Tailwind

4 `Grep` paralelos, pattern `"cva("`, um por stack. React é referência. Diferença = bug. Copie classes do React para a stack divergente.

Paths:
- `nortear-design-system-react/src/components/ui/<slug>/`
- `nortear-design-system-vue/src/components/ui/<slug>/`
- `nortear-design-system-svelte/src/components/ui/<slug>/`
- `nortear-design-system-vanilla/src/components/ui/`

---

## Check 2 — Variantes e tamanhos

4 `Grep` paralelos, pattern `"variant|size"` nos arquivos `.ts`. Variante presente no React e ausente em outra stack = bug.

---

## Check 3 — Data attributes (`data-slot`)

4 `Grep` paralelos, pattern `"data-slot"` nos arquivos UI. Mesmos values em todas as stacks.

---

## Check 4 — Acessibilidade (ARIA)

4 `Grep` paralelos, pattern `"aria-|role="`. Mesmos `role`/`aria-*` em todas as stacks.

---

## Check 5 — Tokens CSS / Temas + Tokenização de dimensões

React/Vue/Svelte devem usar **mesmos tokens** de altura/size (`--height-*`, `--size-*`). Vanilla consome os mesmos tokens via CSS `.nds-*` compartilhado.

3 `Grep` paralelos (excluir Vanilla):
- Tokens: `"h-\(--height-|size-\(--size-"`
- Hardcoded: `"\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b"`

- `tokens > 0 e hardcoded = 0`: stack OK
- `tokens = 0 e hardcoded > 0`: stack precisa migrar para tokens
- Discrepância: divergência cross-stack → corrigir

Tabela completa: `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

---

## Check 6 — Section containers genéricos (15)

**Antes** de auditar docs pages, verificar que os containers existem nas 4 stacks. Se ausentes → rodar `/docs-sections --stack <stack>` antes.

4 `Glob` paralelos:
- `nortear-design-system-react/src/components/docs/shared/sections/Docs*.tsx`
- `nortear-design-system-vue/src/components/docs/shared/sections/Docs*.vue`
- `nortear-design-system-svelte/src/components/docs/shared/sections/Docs*.svelte`
- `nortear-design-system-vanilla/src/components/docs/shared/sections/Docs*.ts`

15 obrigatórios: `DocsHeader`, `DocsDemonstration`, `DocsAnatomy`, `DocsWhenToUse`, `DocsDoDont`, `DocsImport`, `DocsVariants`, `DocsStates`, `DocsProps`, `DocsTokens`, `DocsAccessibility`, `DocsRelated`, `DocsNotes`, `DocsAnalytics`, `DocsTestes`.

Se todos existem: 4 `Grep` paralelos, pattern `"shared/sections/DocsDoDont|createDocsDoDont"` nas docs pages — verificar uso.

---

## Check 7 — Completude de docs pages

4 `Read` paralelos das 4 docs pages. Em **uma única passagem** por arquivo, verificar:

**7a. Seções obrigatórias (IDs)**: 14 IDs em cada docs page — `demonstracao`, `anatomia`, `quando-usar`, `do-dont`, `importacao`, `variantes`, `estados`, `propriedades`, `tokens`, `acessibilidade`, `relacionados`, `notas`, `analytics`, `testes`. Seção ausente = crítico.

**7b. Blocos em `quando-usar`**: referencia `usage.guidelines`, `usage.scenarios`, `uxWriting.title`, `usage.do.title`. Bloco ausente = crítico.

**7c. Conteúdo real (zero placeholders)**: detectar strings de placeholder não substituído:

```
"Exemplo aqui", "Estrutura de subcomponentes", "Orientações de uso",
"Boas práticas e antipadrões", "Exemplos de código",
"Todas as variantes do componente", "Tabela de props",
"Tokens CSS relevantes", "Alternativas e complementos",
"Documentação completa disponível na stack React",
"consulte.*React", "ver documentação.*React"
```

Placeholder = bug bloqueante. Reescrever antes de qualquer outra correção.

**7d. Chamadas de tradução (`t()`)**: cada seção referencia chaves. Threshold mínimo: 30 calls `t()` na docs page toda.

**7e. Props table**: referencia `props.table.required` (5ª coluna) e `extensibilityTitle`.

**7f. Tokens table**: referencia tokens completos e `customizationTitle`.

**7g. sanitizeHtml**: importado se renderiza HTML de translations.

**7h. structureCode lê de translations**: `t('anatomy.structureCode')` — não hardcoded por stack.

**7i. breadcrumb dinâmico**: usa `tContent('category')` — não hardcoded "Form"/"Navigation"/etc.

**7j. SEO completo**: `useSeoEffect`/`applySeo` passa todos os campos GEO (title, description, locale, componentSlug, aiSummary, aiEntities, breadcrumb).

---

## Check 8 — Cobertura de stories

4 `Glob` paralelos:
- `nortear-design-system-react/src/components/ui/<slug>*.stories.*`
- `nortear-design-system-vue/src/components/ui/<slug>/<slug>*.stories.*`
- `nortear-design-system-svelte/src/components/ui/<slug>/<slug>*.stories.*`
- `nortear-design-system-vanilla/src/components/ui/<slug>*.stories.*`

Categorias esperadas: Playground, Variantes, Tamanhos (se aplicável), Estados, Composições. Arquivo presente em uma stack mas ausente em outra = bug.

`parameters.controls.disable: true` em sub-stories (variantes/estados/composicoes/tamanhos).

---

## Check 9 — Do & Don't layout (bug recorrente)

Após ler docs pages no check 7, inspecionar seção `do-dont`:

**Padrão correto:**
1. `div.flex.items-center.justify-center.p-10.mt-6.border.rounded-xl.bg-background.shadow-sm` como card wrapper
2. Dentro: `div.space-y-8.w-full`
3. **Dois** `div.grid.grid-cols-*` separados — um por par (DO|DON'T), **nunca** um grid com iteração

**Bugs:**
- `v-for="i in 2"` / `{#each [1,2] as i}` / `[1,2].map()` em um grid → layout invertido (DO|DO em cima, DON'T|DON'T em baixo)
- Card wrapper ausente → seção sem padding/borda

---

## Check 10 — Patches sobre libs primitivas/externas

**Toda divergência intencional em relação ao comportamento das libs primitivas (`@base-ui/react`, `reka-ui`, `bits-ui`) ou libs externas de componente (`sonner`, `cmdk`, `react-day-picker`, `lucide`) deve ter:**

1. Marker `// PATCH: <categoria> — <motivo> (ver PATCHES.md#<anchor>)` imediatamente acima da linha customizada
2. Entrada correspondente em `PATCHES.md` com diff antes/depois, motivo e instrução de verificação

Categorias: `a11y`, `i18n`, `theme`, `security`, `bugfix`.

**Quando dispara:** correção contorna/sobrescreve comportamento vindo de uma dessas libs (ARIA, foco, eventos, DOM) — não escolhas visuais das classes `.nds-*` (essas são o design do próprio sistema, não patch).

**Sinais de patch:**
- Mudou tag HTML/role/ARIA que a lib primitiva define
- Contornou comportamento JS da lib (foco, teclado, portal)
- `a11y.disable`/regra desabilitada por limitação de lib externa (exige justificativa)
- Alteração via `patch-package` em `node_modules/`

**Sinais de cross-stack (não é patch):**
- Copiou classes do React para Vue/Svelte/Vanilla (React é referência)
- Alinhou nome de variante/tamanho entre stacks
- Adicionou story ou preencheu docs

**Auditoria geral (mode `all`):** 1 `Grep` (pattern `"PATCH:"`, path `nortear-design-system-*/src/`). Cruze com `PATCHES.md`.

- Marker no código sem entrada = bug (reportar, não deletar marker)
- Entrada sem marker = patch resolvido upstream (atualizar status)

---

## Check 11 — Divergências idiomáticas Vanilla (3 camadas)

Quando factory custom Vanilla **não suporta** feature da lib upstream (submenu, CheckboxItem nativo, RadioItem, props específicas), verificar documentação em **3 camadas**:

1. `translations.notes.item1` — descreve divergência
2. DocsProps notes inline — para cada prop não suportada
3. Story afetada (se omitida): `parameters.docs.description.component` com nota explícita

`navigation-menu` e `menubar` Vanilla são referências exemplares.

---

## Check 12 — Higiene `.nds-*` + paridade estrutural

Regras completas em `.claude/commands/_dev-shared.md` §"Higiene de classes `.nds-*`" e guideline 08 §14. Greps por stack (docs pages + shared):

```
nds-text-h[1-4][^"']*nds-(font-(bold|semibold)|tracking-tight)   → redundante (composta já traz)
nds-text-body[^"']*nds-text-foreground                            → redundante (body já traz --foreground)
<p [^>]*nds-text-body[^>]*nds-text-muted-foreground               → corpo de texto não é muted
style=  /  \.style\.                                              → proibido em docs/foundation (criar utility)
<h2[^>]*nds-text-h3                                               → usar nds-text-h2
nds-(border-soft|rounded)[^"']*>  em wrapper de <Table>           → Table já provê .nds-table-wrapper
```

Estrutural: items-objeto → componente Card (`CardTitle as="h3"`) em `nds-grid data-cols="2" data-fixed`; items-string → `ul.nds-stack.nds-list-none data-spacing="md"` + `li.nds-accent-start`. Divergência entre stacks = bug.

Raio aninhado: filho arredondado com inset dentro de pai arredondado deve seguir `Rᵢ = Rₑ − inset` (tokens: pai `--radius`+4px→`--radius-sm`; +2px→`--radius-md`). `border-radius` do filho igual ao do pai, ou valor mágico (`0.25rem`, `calc(... - 3px)`), = bug.

---

## Correções comuns

### Copiar classes do React → outras stacks
1. Extrair classes completas do `cva()` React
2. Substituir nas demais stacks
3. Manter API do framework (apenas classes mudam)

### Adicionar variante/tamanho faltante
1. Copiar definição do React
2. Adaptar syntax (Vue defineProps, Svelte $props, etc.)
3. Criar a story correspondente

### Sincronizar stories
- React: render function direta
- Vue: template + args
- Svelte: wrapper `.svelte` pattern (ver `dev-svelte.md`)
- Vanilla: `createElement` pattern (ver `dev-vanilla.md`)

---

## Relatório (template)

Preencha cada célula com `✅` correto, `❌` ausente/bug, `⚠️` parcial. **Nunca deixe `?`.**

```
## Relatório Cross-Stack — <component-slug>

### Classes cva()
| Aspecto | React | Vue | Svelte | Vanilla | Status |

### Variantes / Tamanhos
| Variante | React | Vue | Svelte | Vanilla |

### Stories
| Arquivo | React | Vue | Svelte | Vanilla |

### Acessibilidade
| Atributo | React | Vue | Svelte | Vanilla |

### Docs Page
| Check | React | Vue | Svelte | Vanilla |
| IDs (14 seções) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Blocos quando-usar (4) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Sem placeholders | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Chamadas t() ≥ 30 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| structureCode de translations | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| breadcrumb tContent('category') | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| SEO/GEO completo | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Props 5 cols + extensibilidade | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokens + customizationTitle | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| sanitizeHtml | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Do & Don't layout correto | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Section containers (não inline) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Patches sobre libs primitivas/externas
| Arquivo | Marker no código | Entrada em PATCHES.md | Status |

### Divergências idiomáticas Vanilla
| Feature ausente | translations.notes | DocsProps note | Story omitida com nota |

### Divergências encontradas: X
### Divergências corrigidas: Y
### Patches registrados: N
### Score: X/10
```
