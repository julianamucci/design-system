# Pipeline Audit — Otimizações

Este diretório contém templates de prompt para os auditores (cross-stack, quality, security, performance) rodando em modo **audit-only** via `/pipeline <slug> audit` ou `/pipeline all audit`.

## Como a pipeline usa

### 1. Pre-scan global (otim 4)

Antes de disparar auditores, a pipeline gera **um único** `scans.json` com **todos** os hits de padrões conhecidos, para **todos** os componentes. Estrutura:

```json
{
  "accordion": {
    "html_dynamic_unsanitized": ["file:line", ...],
    "hardcoded_dimensions": ["file:line", ...],
    "onunmounted_nested": false,
    "wildcard_imports": [],
    "style_inline": [],
    "text_below_12px": [],
    "href_unvalidated": [],
    "intersection_observer_no_cleanup": []
  },
  "alert": { ... }
}
```

Cada auditor consulta **só o seu slug** em vez de fazer grep em runtime. Evita 5-10 tool calls por agent.

### 2. Context-cache por componente (otim 1)

`.pipeline-context/<slug>.md` com ~80 linhas:
- Categoria, variantes, sizes, props, tokens
- Stacks implementadas
- Seções especiais da guideline 11
- Lista de arquivos (usada pelos templates como `{{*_files}}`)

Reusa o cache do modo `new`/`full` se já existir e for do mesmo dia.

### 3. Templates com placeholders (otim 2, 6)

- `cross-stack.md`, `quality.md`, `security.md`, `performance.md`
- Placeholders: `{{slug}}`, `{{category}}`, `{{context_cache_path}}`, `{{prescan_path}}`, `{{react_files}}`, etc.
- Pipeline substitui antes de chamar o Agent.

### 4. Early-exit (otim 3)

Cada template tem bloco **EARLY-EXIT**: o agent consulta o pre-scan primeiro. Se limpo, retorna 10/10 em 1-2 tool calls.

### 5. Audit-mode puro (otim 7)

Templates instruem "NÃO edite, NÃO commite, apenas reporte". Pipeline agrupa violações no final. Invocações isoladas de `/quality <slug>` (fora de pipeline) continuam em fix-mode.

### 6. Commits em batch (otim 8)

A pipeline, ao consolidar os relatórios, produz um único `FIXES-NEEDED.md` com grupos de mudanças por categoria. Usuário aprova; pipeline faz commits semânticos.

## Convenção de geração

A pipeline chama um helper interno:

```ts
function fillTemplate(skill: 'cross-stack' | 'quality' | 'security' | 'performance', slug: string): string {
  const template = read(`.pipeline-context/audit-prompts/${skill}.md`);
  const ctx = read(`.pipeline-context/${slug}.md`);
  const scan = JSON.parse(read(`.pipeline-context/scans.json`));
  // substitui {{slug}}, {{category}}, {{*_files}}, etc.
  return fillPlaceholders(template, { slug, category: ctx.category, ...scan[slug] });
}
```

## Resultado estimado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tokens de input por agent | ~15k | ~7k |
| Tool calls por agent | ~25 | ~12 |
| Agents com 0 achados | 20+ calls cada | 2 calls (early-exit) |
| Tokens totais em audit completo (7 comp × 4 skills) | ~1.5M | ~700k |

**~50% de economia** sem perda de qualidade.
