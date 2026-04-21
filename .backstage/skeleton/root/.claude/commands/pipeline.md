---
description: Pipeline de qualidade — descobre componentes em components/ui e executa as skills na sequência correta
argument-hint: [component-slug|all] [mode]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Pipeline de Qualidade

Você é o orquestrador do design system. Seu trabalho é descobrir componentes e executar as skills especializadas na sequência certa para garantir que cada componente atenda todos os padrões do projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (opcional) — slug específico (ex: `button`) ou `all` para todos os componentes (padrão: `all`)
- **`mode`** (opcional):
  - `full` — pipeline completo: dev → content → quality → audit (padrão)
  - `audit` — apenas auditoria: cross-stack + security + performance + quality
  - `content` — apenas conteúdo: ux-writer + seo-geo + analytics
  - `new` — componente novo: dev (todas as stacks) + content + quality + audit

---

## Passo 1 — Descobrir Componentes

### Se `component-slug` for `all` ou omitido:

Descubra os slugs disponíveis lendo as duas fontes:

**React** (arquivos `.tsx` sem `stories` e sem os sufixos de variação):
```bash
ls design-system-react/src/components/ui/*.tsx | \
  xargs -I{} basename {} .tsx | \
  grep -v "stories" | \
  sort -u
```

**Vue** (subdiretórios em `components/ui/`):
```bash
ls -d design-system-vue/src/components/ui/*/  2>/dev/null | \
  xargs -I{} basename {} | \
  sort -u
```

**Intersecção**: use os slugs que existem no React como lista canônica. Stacks mais novas (Svelte, Basecoat) podem ter subconjunto menor — isso é esperado.

**Slugs a ignorar** (não são componentes standalone): `index`, `utils`, `cn`, `icons`

### Se `component-slug` for um slug específico:

Use apenas esse slug.

---

## Passo 2 — Verificar Estado Atual de Cada Componente

Para cada slug, determine o estado atual antes de decidir o que executar:

```bash
# Verificar se existe em cada stack
for stack in react vue svelte basecoat; do
  echo -n "$stack: "
  ls design-system-$stack/src/components/ui/$slug* 2>/dev/null | head -1 || \
  ls design-system-$stack/src/components/ui/$slug/ 2>/dev/null || \
  echo "AUSENTE"
done

# Verificar se tem translations.json (shared entre todas as stacks)
ls docs/shared/content/$slug/translations.json 2>/dev/null || echo "translations: AUSENTE"

# Verificar se tem docs page
ls design-system-react/src/components/docs/*Docs.tsx 2>/dev/null | grep -i $slug || echo "docs page: AUSENTE"

# Verificar se tem stories em todas as stacks
for stack in react vue svelte basecoat; do
  echo -n "stories $stack: "
  ls design-system-$stack/src/components/ui/$slug*.stories.* 2>/dev/null | wc -l | tr -d ' '
  echo " stories"
done
```

---

## Passo 3 — Montar Plano de Execução

Com base no estado atual e no `mode`, monte uma tabela de execução antes de começar:

```
## Plano de Execução — Pipeline <mode>

| Componente | Estado | Skills a executar |
|------------|--------|-------------------|
| button     | completo | cross-stack, security, performance, quality |
| dialog     | sem translations | ux-writer, seo-geo, analytics, cross-stack, security |
| input      | sem Svelte/Basecoat | dev-svelte, dev-basecoat, cross-stack, quality |
```

**Mostre este plano para o usuário e aguarde confirmação antes de executar.**

---

## Passo 4 — Executar Skills por Componente

Para cada componente no plano, execute as skills na sequência abaixo de acordo com o `mode`.

### Sequência `full` (padrão)

Execute nesta ordem exata:

1. **Se stack ausente**: `/dev-react`, `/dev-vue`, `/dev-svelte`, `/dev-basecoat` (apenas as que faltam)
2. **Se translations ausente**: `/ux-writer <slug>`
3. **`/cross-stack <slug>`** — sempre
4. **`/quality <slug>`** — sempre
5. **`/seo-geo <slug>`** — se docs page existe
6. **`/analytics <slug>`** — se docs page existe
7. **`/security <slug>`** — sempre
8. **`/performance <slug>`** — sempre

### Sequência `audit`

1. `/cross-stack <slug>`
2. `/security <slug>`
3. `/performance <slug>`
4. `/quality <slug>`

### Sequência `content`

1. `/ux-writer <slug>`
2. `/seo-geo <slug>`
3. `/analytics <slug>`

### Sequência `new`

1. `/ux-writer <slug>` — gera translations.json com conteúdo trilíngue
2. `/product <slug> --from-content` — atualiza guidelines com as decisões do conteúdo
3. `/dev-react <slug>` — implementa docs page + stories (fonte de verdade visual)
4. `/dev-vue <slug>`
5. `/dev-svelte <slug>`
6. `/dev-basecoat <slug>`
7. `/cross-stack <slug>`
8. `/quality <slug>`
9. `/seo-geo <slug>`
10. `/analytics <slug>`
11. `/security <slug>`
12. `/performance <slug>`
13. `/product <slug>` — ajuste fino: código → guidelines após implementação

---

## Passo 5 — Relatório Consolidado

Após processar todos os componentes, gere o relatório final:

```
## Relatório Pipeline — <mode> — <data>

### Componentes Processados: X

| Componente | Skills executadas | Issues encontradas | Issues corrigidas | Score |
|------------|-------------------|--------------------|-------------------|-------|
| button     | 8/8               | 2                  | 2                 | 10/10 |
| dialog     | 6/8               | 5                  | 3                 | 7/10  |

### Issues por Categoria
| Categoria       | Total | Corrigidas | Pendentes |
|-----------------|-------|------------|-----------|
| Cross-stack     |       |            |           |
| Segurança (XSS) |       |            |           |
| Performance     |       |            |           |
| Qualidade       |       |            |           |
| Conteúdo        |       |            |           |
| SEO/GEO         |       |            |           |
| Analytics       |       |            |           |

### Componentes que precisam de atenção manual
(Liste componentes com issues não corrigidas e o motivo)

### Próximos passos sugeridos
```

---

## Regras de Operação

- **Nunca pule uma skill** sem registrar o motivo no relatório
- **Componentes novos** (modo `new`): sempre comece pelo React, só avance para outras stacks depois do React estar completo
- **Erros em uma skill** não bloqueiam as próximas — registre o erro e continue
- **Score por componente**: média dos scores individuais de cada skill (quando disponível)
- **Mostre progresso** a cada skill concluída: `✓ /security button — 0 vulnerabilidades`
