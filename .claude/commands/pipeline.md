---
description: Pipeline de qualidade — descobre componentes em components/ui e executa as skills na sequência correta, com paralelismo e cache de contexto
argument-hint: [component-slug|all] [mode]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Pipeline de Qualidade (otimizada)

Você é o orquestrador do design system. Seu trabalho é descobrir componentes e executar as skills especializadas na sequência certa, **paralelizando etapas independentes** e **evitando leituras redundantes**.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (opcional) — slug específico (ex: `button`) ou `all` para todos os componentes (padrão: `all`)
- **`mode`** (opcional):
  - `full` — pipeline completo: dev → content → quality → audit (padrão)
  - `audit` — apenas auditoria: cross-stack + security + performance + quality
  - `content` — apenas conteúdo: ux-writer + seo-geo + analytics
  - `new` — componente novo: dev (todas as stacks) + content + quality + audit

---

## Princípios de Performance

Siga estes princípios em TODO o fluxo — eles cortam ~50% do consumo de tokens em relação à execução ingênua, além de ~40-50% de wall-clock:

1. **Paralelize entre skills, serial entre componentes.** Dev-skills das 4 stacks e os 4 auditores por componente são independentes — rode em paralelo no mesmo `Agent` batch. Mas rode serial entre componentes (accordion → alert → …) para evitar colisão de commits concorrentes no git.
2. **Context-cache por componente.** Em `new`/`full`/`audit`, escreva `.pipeline-context/<slug>.md` com o subset relevante (variantes, props, tokens, **lista de arquivos por stack**). Agents leem só esse resumo. Reuse se existir e for do mesmo dia.
3. **Pre-scan global** (modo `audit`). Antes de disparar auditores, gere **um único** `.pipeline-context/scans.json` varrendo padrões conhecidos (HTML dinâmico, dimensões hardcoded, onUnmounted aninhado, etc.) para **todos** os componentes. Agents consultam JSON em vez de fazer grep — economiza 5-10 tool calls/agent.
4. **Templates de prompt** (`.pipeline-context/audit-prompts/<skill>.md`). Preenche placeholders `{{slug}}`, `{{context_cache_path}}`, `{{prescan_path}}`, `{{*_files}}`. Agents recebem instruções concisas (~60 palavras) em vez de prompts inflados (~200 palavras).
5. **Early-exit via pre-scan.** Se `scans.json[slug]` está limpo em todas as categorias relevantes, **não dispare o agent**. A pipeline reporta direto `10/10 — pre-scan limpo`.
6. **Audit-mode report-only.** Em modo `audit`, agents NUNCA editam ou commitam — só relatam. Fixes são agrupados em `FIXES-NEEDED.md` e aplicados em batch pela pipeline ao final. Skills isoladas (fora de pipeline) continuam em fix-mode.
7. **Use Glob e Grep nativos.** Evite `for stack in ...; do ls ...` e outros loops bash no Windows — use Glob que varre 4 diretórios de uma vez.
8. **Regras anti-boilerplate explícitas** nos prompts dos dev-agents.
9. **Agents recebem briefing auto-contido.** Passe no prompt: slug, modo, caminho do context-cache, lista exata de arquivos a criar/editar. Não delegue "descubra o que fazer".

---

## Passo 1 — Descobrir Componentes

### Se `component-slug` for `all` ou omitido:

Use `Glob` (não loops bash) para descobrir os slugs. Um `Glob` por stack:

- `design-system-react/src/components/ui/*.tsx`
- `design-system-vue/src/components/ui/*/index.ts`
- `design-system-svelte/src/components/ui/*/index.ts`
- `design-system-basecoat/src/components/ui/*.ts`

Os 4 `Glob` podem ser chamados em paralelo no mesmo turno. Para o React: extraia o basename, filtre `*.stories.*` e sufixos de variação (`-variantes`, `-tamanhos`, `-estados`, `-composicoes`), e intersecte com os demais.

**Slugs a ignorar** (não são componentes standalone): `index`, `utils`, `cn`, `icons`

### Se `component-slug` for um slug específico:

Use apenas esse slug — pule a descoberta.

---

## Passo 2 — Verificar Estado Atual

Para cada slug, faça **uma chamada** paralela com `Glob` em paralelo com `Read` de `docs/shared/content/<slug>/translations.json` (se existir). Não rode loops bash.

Os `Glob` a disparar em paralelo (um batch só):

- `design-system-{react,vue,svelte,basecoat}/src/components/ui/<slug>*`
- `design-system-{react,vue,svelte,basecoat}/src/components/docs/*<Slug>Docs.*`
- `design-system-{react,vue,svelte,basecoat}/src/components/ui/<slug>*.stories.*` (e `<slug>/<slug>-*.stories.*` para Vue/Svelte)
- `docs/shared/content/<slug>/translations.json`

Derive o estado (completo / falta X stack / sem translations / sem docs page) desses resultados direto.

---

## Passo 3 — Montar Plano de Execução

Mostre uma tabela com o plano. Para modo `new`, a tabela é sempre igual ao fluxo completo.

```
## Plano de Execução — Pipeline <mode>

| Componente | Estado | Skills a executar |
|------------|--------|-------------------|
| ...        | ...    | ...               |
```

Se o usuário já pediu "execute autonomously" / "execute tudo" na mensagem atual, **não pergunte** — siga direto. Caso contrário, aguarde confirmação.

---

## Passo 4 — Gerar Context Cache + Pre-scan global

### 4a. Context-cache por componente (modos `new`, `full`, **`audit`**)

Depois de rodar `/ux-writer <slug>` + `/product <slug> --from-content` (ou, em `audit`, antes de disparar auditores), escreva `.pipeline-context/<slug>.md` com:

- Slug, categoria do componente
- Variantes e tamanhos (extraídos do componente UI)
- Props e tipos (do componente UI)
- Tokens CSS usados
- Seções especiais exigidas pela guideline 11 da categoria
- Chaves críticas de `translations.json` (lista de seções presentes)
- **Lista de arquivos das 4 stacks** (para os templates usarem como `{{*_files}}`)

Esse arquivo é o briefing que os dev-agents e audit-agents leem. É tipicamente **≤120 linhas** — muito menor que reler 10 guidelines inteiras.

Reuse o cache se existir e for do mesmo dia. Caso contrário, regenere.

### 4b. Pre-scan global (apenas modo `audit`)

Antes de disparar qualquer auditor, gere **um único** `.pipeline-context/scans.json` varrendo **todos** os componentes alvo de uma vez. Estrutura:

```json
{
  "<slug>": {
    "html_dynamic_unsanitized": ["file:line", ...],
    "href_unvalidated": ["file:line", ...],
    "hardcoded_dimensions": ["file:line", ...],
    "missing_testes_section": false,
    "missing_accessibility_section": false,
    "text_below_12px": ["file:line", ...],
    "onunmounted_nested": false,
    "wildcard_imports": ["file:line", ...],
    "style_inline": ["file:line", ...],
    "intersection_observer_no_cleanup": ["file:line", ...]
  }
}
```

Use Grep nativo (não loops bash) em batches:
```
Grep "dangerouslySetInnerHTML|v-html|\\{@html|\\.innerHTML" em ui/ e docs/ sem sanitizeHtml()
Grep "\\bh-(5|6|7|8|9|10|11|12)\\b|\\bsize-(5|6|7|8|9|10)\\b" em cva/tv
Grep "onMounted.*\\n.*onUnmounted" multiline em .vue
Grep "from 'lucide-?.*'" sem "import {"
Grep "style=\\{\\{|:style=\"\\{" em .tsx/.vue
```

**Resultado**: um único arquivo JSON consultável por todos os 28 agents. Evita ~5-10 grep calls por agent.

Se `scans.json` existir e for do mesmo dia, reuse. Caso contrário, regenere.

---

## Passo 5 — Executar Skills

### Sequência `new` (otimizada)

```
Fase A (serial, obrigatoriamente nesta ordem):
  1. /ux-writer <slug>
  2. /product <slug> --from-content
  3. (Gerar .pipeline-context/<slug>.md — ver Passo 4)

Fase B (4 agents em PARALELO — dev-skills):
  /dev-react <slug>
  /dev-vue <slug>
  /dev-svelte <slug>
  /dev-basecoat <slug>

Fase C (4 agents em PARALELO — audit read-only):
  /cross-stack <slug>
  /quality <slug>
  /security <slug>
  /performance <slug>

Fase D (2 agents em PARALELO — content audit):
  /seo-geo <slug>
  /analytics <slug>

Fase E (serial):
  /product <slug>  (from-code fine-tuning)
```

**Como paralelizar fases B/C/D:** emita múltiplos `Agent` tool-uses no mesmo turno. Cada agent recebe um prompt auto-contido conforme "Prompts dos dev-agents" abaixo. O runtime aguarda os 4 terminarem antes de você avançar para a próxima fase.

### Sequência `full`

```
Fase A (se translations ausente): /ux-writer <slug> + gerar context-cache
Fase B (4 agents paralelos — só stacks ausentes): /dev-<stack> <slug>
Fase C (4 agents paralelos): /cross-stack, /quality, /security, /performance
Fase D (2 agents paralelos): /seo-geo, /analytics (se docs page existe)
```

### Sequência `audit` (otimizada)

```
Fase A (serial, 1x para a pipeline inteira):
  1. Gerar/reusar .pipeline-context/scans.json (Passo 4b)
  2. Gerar/reusar .pipeline-context/<slug>.md para cada componente alvo (Passo 4a)

Fase B (serial entre componentes, paralelo entre skills):
  Para cada <slug>:
    Disparar 4 agents em paralelo no MESMO turno:
      /cross-stack <slug>  (template audit-prompts/cross-stack.md)
      /quality <slug>      (template audit-prompts/quality.md)
      /security <slug>     (template audit-prompts/security.md)
      /performance <slug>  (template audit-prompts/performance.md)
    Aguardar os 4 terminarem antes de passar para o próximo <slug>.

Fase C (serial):
  Consolidar violações em FIXES-NEEDED.md agrupado por categoria.
  Usuário decide quais aplicar. Skills isoladas (/quality, /security) em fix-mode
  corrigem e commitam.
```

**Por que serial entre componentes?** Evita colisão de commits concorrentes no git quando múltiplos auditores corrigem o mesmo arquivo (ex: `basecoat-theme-overrides.css` sendo editado por 2 agents ao mesmo tempo).

**Por que paralelo entre skills?** Zero conflito: cross-stack/quality/security/performance olham coisas diferentes do mesmo componente. Ganho de wall-clock sem risco.

**Por que audit-mode report-only?** Agentes que apenas reportam terminam mais rápido e produzem menos tokens de output. Fixes são agrupados e aplicados no final pela pipeline (otim 7).

### Sequência `content`

```
Fase A (serial): /ux-writer
Fase B (2 agents paralelos): /seo-geo, /analytics
```

---

## Prompts dos dev-agents

Cada dev-agent (react/vue/svelte/basecoat) deve receber um prompt auto-contido com:

1. Nome do skill a invocar (ex: `/dev-react alert-dialog`)
2. Caminho do context-cache: `.pipeline-context/<slug>.md` (ler PRIMEIRO, antes de qualquer outra coisa)
3. **Regras anti-boilerplate obrigatórias** (copie literalmente no prompt):

```
REGRAS ANTI-BOILERPLATE:
- Apenas o meta principal (`<slug>.stories.*`) carrega `tags: ["autodocs"]`. Sub-stories (`<slug>-variantes`, `<slug>-tamanhos`, `<slug>-estados`, `<slug>-composicoes`) NUNCA incluem `tags: ["autodocs"]` — isso gera páginas Docs duplicadas na sidebar.
- A docs page principal é injetada via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` — apenas no arquivo `<slug>.stories.*`.
- Sub-stories têm apenas `title`, `component`, `parameters.layout`, `parameters.docs.description.component`.
- Categorias de sub-story a gerar dependem do tipo de componente: respeite o que a guideline da categoria manda (ex: overlays de confirmação como AlertDialog NÃO têm `-variantes` nem `-tamanhos`).
- Antes de escrever HTML inline, cheque se existe componente em `./components/ui/` que resolva.
```

4. Lista exata dos arquivos que o agent deve produzir (ex: `<Slug>Docs.tsx`, `<slug>.stories.tsx`, `<slug>-estados.stories.tsx`, `<slug>-composicoes.stories.tsx`)
5. Instrução de commit: `skill(dev-<stack>): <slug>` ao final.

**Não coloque `isolation: "worktree"`** — os 4 agents precisam do mesmo repo para que os commits apareçam em sequência.

---

## Prompts dos audit-agents (audit-mode report-only)

**Use os templates em `.pipeline-context/audit-prompts/<skill>.md`**. Cada template é auto-contido e incorpora:

- **Early-exit via pre-scan** (otim 3): agent consulta `scans.json` primeiro; se limpo, retorna em 1-2 tool calls
- **Lista de arquivos embutida** (otim 6): evita agent fazer Glob para descobrir arquivos
- **Audit-mode puro** (otim 7): instrução explícita "NÃO edite, NÃO commite, apenas reporte"
- **Sem auto-commit** (otim 8): templates proíbem emitir mensagens de commit — a pipeline agrupa fixes em `FIXES-NEEDED.md` no final

### Como preencher o template

Substitua placeholders antes de passar para o Agent:

| Placeholder | Valor |
|-------------|-------|
| `{{slug}}` | componente (ex: `button`) |
| `{{category}}` | categoria da guideline (ex: `Form`) |
| `{{context_cache_path}}` | `.pipeline-context/<slug>.md` |
| `{{prescan_path}}` | `.pipeline-context/scans.json` |
| `{{react_files}}` | lista separada por espaço dos arquivos React relevantes |
| `{{vue_files}}` | idem Vue |
| `{{svelte_files}}` | idem Svelte |
| `{{basecoat_files}}` | idem Basecoat |
| `{{ui_files}}` | só componentes `ui/` (security/performance) |
| `{{docs_files}}` | só docs pages (security/performance) |

Os valores saem do context-cache (seção "Arquivos").

### Regra de ouro

Se o pre-scan diz que o componente está limpo em todas as categorias relevantes, **não chame o agent**. A pipeline deve checar `scans.json` antes de disparar cada auditor. Reporta direto: "X/10 — pre-scan limpo, agente não disparado".

### Fallback (sem templates)

Se por algum motivo os templates em `.pipeline-context/audit-prompts/` não existirem, caia no modo legado:
1. Skill a invocar
2. Caminho do context-cache
3. "Apenas reporte; NÃO edite; NÃO commite. Resposta ≤150 palavras."

---

## Passo 6 — Relatório Consolidado + FIXES-NEEDED.md

### 6a. Relatório (chat)

```
## Relatório Pipeline — <mode> — <data>

### Componentes Processados: X

| Componente | Cross-stack | Quality | Security | Perf | Issues |
|------------|-------------|---------|----------|------|--------|

### Issues por Categoria
...

### Próximos passos sugeridos
```

### 6b. FIXES-NEEDED.md (apenas modo `audit`)

Agrupa todas as violações reportadas pelos agents em um único arquivo `.pipeline-context/FIXES-NEEDED.md`, organizado por categoria e ordenado por severidade:

```md
# Fixes Pendentes — Pipeline audit <data>

## Críticos (security, a11y grave)
- [ ] <slug>: <descrição curta> (`path/to/file.tsx:42`) — skill: `/security <slug>`
...

## Médios (performance, tokenização)
...

## Baixos (divergências cross-stack cosméticas)
...
```

Ao fim do audit, a pipeline exibe o resumo e pergunta:
> 28 violações em 7 componentes. Aplicar: [1] críticos / [2] críticos+médios / [3] todos / [4] nenhum?

Usuário escolhe; pipeline dispara skills em **fix-mode** (fora do audit-prompts) e commita em batch com mensagens `skill(<nome>): <slug>` agrupadas por componente.

---

## Regras de Operação

- **Nunca pule uma skill** sem registrar o motivo.
- **Paralelize sempre que possível.** Emita múltiplos `Agent` no mesmo turno para Fases B, C, D.
- **Cache de contexto é obrigatório em modo `new` e `full`.** Não delegue aos agents redescobrir o componente.
- **Anti-boilerplate no prompt.** A regra de `autodocs` só no meta principal é a mais importante — ela já causou bug em sessão anterior.
- **Erros em uma skill** não bloqueiam as próximas da mesma fase — registre e continue. Erros em Fase A (serial) bloqueiam Fase B.
- **Mostre progresso fase a fase:** `✓ Fase B concluída (4 stacks paralelas, 3 min)`.
- **Limpe `.pipeline-context/<slug>.md`** ao final do modo `new` (ou deixe para próxima execução — é cache, não verdade).
- **Paralelize entre skills, serial entre componentes.** Em modo `audit`, dispare os 4 auditores de um componente em paralelo, mas aguarde os 4 terminarem antes do próximo componente. Paralelizar entre componentes causa colisão de commits.
- **Use pre-scan + templates em modo `audit`.** Gere `scans.json` antes de tudo; consulte antes de disparar cada agent. Se pre-scan limpo, não dispare o agent — reporte `10/10` direto.
- **Audit-mode ≠ fix-mode.** Agents chamados pela pipeline em `audit` são report-only. Skills isoladas (`/quality <slug>` fora de pipeline) continuam em fix-mode normal.
- **Consolide fixes em FIXES-NEEDED.md.** Não peça ao auditor para commitar. A pipeline agrupa e aplica em batch no fim, permitindo ao usuário escolher severidade.
