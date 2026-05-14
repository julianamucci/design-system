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
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Fontes de Referência (consultar pontualmente)

1. `docs/shared/skill-refs/test-criteria.md` — critérios de teste por categoria de componente, padrões `testes` no translations.json
2. `docs/shared/guidelines/01-acessibilidade.md` — critérios WCAG (consultar se precisar de detalhe específico)
3. `docs/shared/guidelines/08-docs-pages-foundations.md` — props/tokens table (§12, §13)
4. `docs/shared/guidelines/12-tokenizacao-dimensoes.md` — exceções aceitas

Não leia upfront. Consulte só se precisar.

---

## Tipos de Teste

1. **Funcionais (play functions)** — `storybook/test` (within + userEvent + expect). API uniforme nas 4 stacks.
2. **A11y (axe-playwright)** — automático via `postVisit` em `.storybook/test-runner.ts`. `a11y: { test: 'error' }` em `preview.ts` faz violations falharem CI. Stories podem desabilitar via `parameters.a11y.disable: true` (exige justificativa documentada).
3. **Visuais (Chromatic)** — automático. Basta a story existir.

Critérios por categoria de componente: ver `docs/shared/skill-refs/test-criteria.md`.

---

## Processo de Auditoria

### Passo 1 — Coletar arquivos em paralelo (1 turno)

**Glob** (4 paralelos): stories de cada stack — `<slug>*.stories.*`

**Read** (4 paralelos): docs pages — `<Slug>Docs.{tsx,vue,svelte,ts}`

**Read** (1): `docs/shared/content/<slug>/translations.json`

**Grep** (1): dimensões hardcoded — `\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b` em `design-system-{react,vue,svelte}/src/components/ui/<slug>*` (excluir Basecoat e `*.stories.*`)

**Grep** (1): tipografia inválida — `text-\[9px\]|text-\[10px\]` em `design-system-*/src/components/docs/*Docs.*`

**Grep** (1): tabela incorreta — `overflow-hidden shadow-sm|ComponentDemo` em `design-system-*/src/components/docs/*Docs.*`

**Grep** (1): a11y.disable — `a11y.*disable|disable.*a11y` em `design-system-*/src/components/ui/<slug>*.stories.*`

Após coletar, **não releia** nada nos passos seguintes.

---

### Passo 2 — Stories e play functions

**2a. Cobertura**: arquivo Playground existe em cada stack? Cada variante/estado/composição tem story dedicada?

**2b. Controls do Playground**:
- `meta` tem `argTypes` (painel não vazio)
- `meta.args` declara valores iniciais para TODAS as props listadas em `argTypes` (sem isso, controls aparecem vazios)
- `render` consome `(args)` e espalha via `{...args}` ou `v-bind="args"` (não `render: () => ` sem args)
- Props de montagem têm re-mount: React `key={String(args.x)}`, Vue `:key="String(args.x)"`, Svelte `{#key args.x}`, Basecoat re-execução natural
- `disabled` propagado ao filho interativo (não só root)

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
- Playground: presença, clique, disabled, focus, Enter/Space. Disabled verifica `toBeDisabled()` (ou `aria-disabled` em base-ui)
- Sub-stories (estados, modos, composições): no mínimo um teste de "renderiza e responde a interação básica"
- Composições com ícones/badges: testar acessibilidade via `getByRole("button", { name: /text/ })` (validando que o texto, não o ícone, é a label acessível)

**2f. a11y.disable**: nenhuma story sem comentário de justificativa.

---

### Passo 2.5 — Casos de teste documentados vs implementados (cruzamento)

**Crítico**. Compare o que está documentado em `translations.json` com o que está implementado nas play functions:

**2.5a. Funcionais — `testes.functional.item*`**:
Cada `action` listada na tabela funcional da docs page DEVE ter um `step()` correspondente em ALGUMA story do componente (Playground ou sub-story). Mapeamento típico:

| Tipo de ação documentada | Story onde implementar |
|---|---|
| "Clicar em X fechado/aberto" | Playground |
| "Modo X (default)" — comportamento padrão | Sub-story do modo (ex: `<slug>-modos`) |
| "Estado disabled/loading" — não responde | Sub-story de estado (ex: `<slug>-estados`) |
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
- "Navegação por teclado" → DEVE ter `userEvent.keyboard("{Enter}" / "{Space}" / "{ArrowDown}" / "{Escape}")` em play function

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

**3d. Tokens table**: referencia tokens completos + `customizationTitle`.

**3e. Semântica HTML**:
- Headings: `<h2>` seções, `<h3>` sub-divisões, nunca pular nível, nunca `<h1>`
- Tabelas: `<thead>` + `<th scope>`
- Listas: `<ul>`/`<ol>` semânticos
- Links internos Storybook: `window.top.location.href`
- Links externos: `target="_blank" rel="noopener noreferrer"`
- Toda âncora do `DocsNav` tem `<section id="...">`

**3f. Tokenização** (do Grep do Passo 1): zero `h-5` a `h-12` / `size-5` a `size-10` em UI primitives. Exceções: `[&_svg]:size-4`, `min-h-16`, `px/gap/py-*`. Ver `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

**3g. Tipografia + tabelas** (do Grep do Passo 1): zero `text-[9px]`/`text-[10px]` em corpo, zero tabelas dentro de `<ComponentDemo>`, zero wrappers com `overflow-hidden` (correto: `border rounded-xl overflow-x-auto p-4 shadow-sm`).

---

### Passo 4 — Identificar gaps + corrigir

Para gaps diretos (adicionar play function, corrigir classe): corrija. Para gaps de criação inteira: descreva e crie se for parte do escopo do `stack`.

---

## Saída Esperada

Preencha cada célula com `✅` correto, `❌` ausente/bug, `⚠️` parcial. **Nunca deixe vazio**.

```
## Relatório de Qualidade — <component-slug>

### Cobertura de Stories
| Arquivo | React | Vue | Svelte | Basecoat |
|---|---|---|---|---|
| <slug>.stories | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-estados | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-composicoes | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Play Functions
| Story | React | Vue | Svelte | Basecoat |
|---|---|---|---|---|
| Playground completa | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Disabled (toBeDisabled + callback) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Sub-stories com play (100%) | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ |

### Controls + Actions
| Check | React | Vue | Svelte | Basecoat |
|---|---|---|---|---|
| Playground tem args completos | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Playground tem callbacks com fn() | ✅/❌/N/A | ✅/❌/N/A | ✅/❌/N/A | ✅/❌/N/A |
| Variações com controls.disable | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Variações com actions.disable | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Cobertura Documentada vs Implementada
| Categoria | React | Vue | Svelte | Basecoat |
|---|---|---|---|---|
| testes.functional.item* → play steps | ✅ N/N | ⚠️ X/N | ✅ N/N | ✅ N/N |
| testes.accessibility (ARIA/teclado) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| testes.visual.item* → story existe | ✅ N/N | ✅ N/N | ✅ N/N | ✅ N/N |

> Use ratio `cobertos/total documentados` para mostrar progresso.

### Docs Page
| Check | React | Vue | Svelte | Basecoat |
|---|---|---|---|---|
| testes ≥4+4+4 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Acessibilidade completa | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Props 5 cols + extensibilidade | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokens + customizationTitle | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Semântica HTML + links | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokenização dimensões | ✅/❌ | ✅/❌ | ✅/❌ | N/A |
| Tipografia + tabelas | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Gaps Encontrados
| Item | Stack | Problema | Ação |
|---|---|---|---|

### Score: X/10
```

---

## Commit

```bash
git add -A
git commit -m "skill(quality): $ARGUMENTS"
```
