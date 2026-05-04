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
- `render` consome `(args)` (não `render: () => ` sem args)
- Props de montagem têm re-mount: React `key={String(args.x)}`, Vue `:key="String(args.x)"`, Svelte `{#key args.x}`, Basecoat re-execução natural
- `disabled` propagado ao filho interativo (não só root)

**2c. Play functions**: Playground completo (presença, clique, disabled, focus, Enter/Space). Disabled verifica `toBeDisabled()` (ou `aria-disabled` em base-ui). Sub-stories sem play = violação.

**2d. a11y.disable**: nenhuma story sem comentário de justificativa.

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
| Sub-stories com play | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ | ✅/❌/⚠️ |

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
