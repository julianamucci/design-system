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

Siga estes princípios em TODO o fluxo — eles cortam ~40-50% do wall-clock em relação à execução ingênua:

1. **Paralelize o que for independente.** Dev-skills das 4 stacks não dependem entre si depois que translations.json e guidelines estão prontos. Skills de auditoria read-only (cross-stack, quality, security, performance) também são mutuamente independentes. Rode-as como agentes paralelos no mesmo `Agent` tool-use batch.
2. **Escreva um context-cache.** Depois do `/product --from-content`, emita `.pipeline-context/<slug>.md` com o subset relevante das guidelines (variantes, props, tokens, seções especiais). Passe o caminho desse arquivo no prompt dos agents seguintes — eles leem só esse resumo em vez de relê-lo tudo.
3. **Use Glob e Grep nativos.** Evite `for stack in ...; do ls ...` e outros loops bash: são lentos no Windows/bash e o output é difícil de parsear. Prefira um `Glob` que varre os 4 diretórios de uma vez.
4. **Emita regras anti-boilerplate explícitas** nos prompts dos dev-agents (ver seção "Prompts dos dev-agents" abaixo).
5. **Agents recebem briefing auto-contido.** Passe no prompt: slug, modo, caminho do context-cache, lista exata de arquivos a criar/editar. Não delegue "descubra o que fazer".

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

## Passo 4 — Gerar Context Cache (apenas modo `new` e `full`)

Depois de rodar `/ux-writer <slug>` + `/product <slug> --from-content`, escreva `.pipeline-context/<slug>.md` com:

- Slug, categoria do componente
- Variantes e tamanhos (extraídos do componente UI)
- Props e tipos (do componente UI)
- Tokens CSS usados
- Seções especiais exigidas pela guideline 11 da categoria (ex: "AlertDialog não tem -variantes nem -tamanhos; usa open programático")
- Chaves críticas de `translations.json` (lista de seções presentes)

Esse arquivo é o briefing que os dev-agents e audit-agents leem. É tipicamente **≤120 linhas** — muito menor que reler 10 guidelines inteiras.

Se o arquivo `.pipeline-context/<slug>.md` já existir e for do mesmo dia, reuse-o. Caso contrário, regenere.

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

### Sequência `audit`

```
Fase única (4 agents paralelos): /cross-stack, /quality, /security, /performance
```

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

## Prompts dos audit-agents

Cada audit-agent recebe:

1. Skill a invocar (ex: `/cross-stack alert-dialog`)
2. Caminho do context-cache
3. Instrução: "Apenas reporte; só edite guidelines/código se houver violação real contra o context-cache ou as guidelines compartilhadas. Commit final: `skill(<nome>): <slug>`."
4. Instrução de verbosidade: "Resposta final ≤200 palavras. Liste só violations + ações tomadas."

---

## Passo 6 — Relatório Consolidado

```
## Relatório Pipeline — <mode> — <data>

### Componentes Processados: X

| Componente | Fases ok | Issues encontradas | Issues corrigidas | Wall-clock |
|------------|----------|--------------------|-------------------|------------|

### Issues por Categoria
...

### Próximos passos sugeridos
```

---

## Regras de Operação

- **Nunca pule uma skill** sem registrar o motivo.
- **Paralelize sempre que possível.** Emita múltiplos `Agent` no mesmo turno para Fases B, C, D.
- **Cache de contexto é obrigatório em modo `new` e `full`.** Não delegue aos agents redescobrir o componente.
- **Anti-boilerplate no prompt.** A regra de `autodocs` só no meta principal é a mais importante — ela já causou bug em sessão anterior.
- **Erros em uma skill** não bloqueiam as próximas da mesma fase — registre e continue. Erros em Fase A (serial) bloqueiam Fase B.
- **Mostre progresso fase a fase:** `✓ Fase B concluída (4 stacks paralelas, 3 min)`.
- **Limpe `.pipeline-context/<slug>.md`** ao final do modo `new` (ou deixe para próxima execução — é cache, não verdade).
