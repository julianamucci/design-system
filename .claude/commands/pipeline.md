---
description: Pipeline de qualidade — descobre componentes em components/ui e executa as skills na sequência correta, com paralelismo e cache de contexto
argument-hint: [component-slug|all] [mode]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Pipeline de Qualidade

Você é o orquestrador do design system. Seu trabalho é descobrir componentes e executar as skills especializadas na sequência certa, **paralelizando etapas independentes** e **evitando leituras redundantes**.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (opcional) — slug específico (ex: `button`) ou `all` para todos (padrão: `all`)
- **`mode`** (opcional):
  - `new` — componente novo: dev + content + quality + audit
  - `full` — igual a `new`, mas pula dev-skills de stacks que já existem e pula ux-writer se `translations.json` já existe (padrão)
  - `audit` — apenas auditoria (scripts + agents com julgamento), sem criar arquivos
  - `content` — apenas conteúdo: ux-writer + seo-geo + analytics

---

## Princípios (ordem de impacto)

1. **Scripts antes de agents — mas o gate depende do TIPO de check.** `scripts/audit.mjs` roda em <1s e cobre o que é grep+regex. Dispare um `Agent` quando o check exige julgamento. Atenção ao que o scan consegue ver:
   - **Checks negativos** (código errado *presente*: XSS, wildcard import, evento não tipado) → scan limpo significa OK. Pode pular o agent.
   - **Checks de presença** (instrumentação, asserção real, paridade entre stacks) → **scan limpo não significa nada**: grep não encontra o que nunca foi escrito. Componente novo sem tracking e com asserção vazia gera scan limpo. Estes agents rodam SEMPRE em modo `new` (ver Fase D).
2. **Inline checks nos dev-skills.** Cada `/dev-<stack>` roda `audit.mjs --category security,performance,analytics,quality` antes de commitar — elimina ~1 rodada inteira de auditoria em modo `new`.
3. **Cross-stack por último.** Compara as 5 implementações pós-fix; rodá-lo antes gera cascata redundante.
4. **Paralelize à vontade — o que se economiza é SUÍTE, não agent.** Dev-skills das 5 stacks e os auditores por componente são independentes; dispare quantos couberem, entre skills e entre componentes. O gargalo real nunca foi o número de agents, e sim rodar teste a cada correção: dentro de cada agent vale a mesma ordem — diagnosticar tudo, corrigir tudo, UM run em bloco, re-corrigir só o que falhou.

   Com agents concorrentes, dois cuidados que não são opcionais: **nunca `git stash`** (é global — um agent apaga a entrada do outro) e **stage só dos próprios caminhos** (`git add -A` varre o que outra sessão deixou na árvore, e já levou 55 arquivos de outro stack para um commit). Nome de arquivo no scratchpad leva o nome da stack, porque ele também é compartilhado.
5. **Context-cache por componente = contrato, não resumo.** `.pipeline-context/<slug>.md` ≤160 linhas. Além de variantes, props, tokens e lista de arquivos, ele **fixa o conteúdo dos exemplos** (ver Fase A.2). Os 4 dev-agents rodam em paralelo e não se veem: o que não estiver escrito ali, cada um inventa do seu jeito — foi assim que a mesma composição virou 4 demos diferentes.

   **A pasta é apagada no início de toda execução** (Fase A.0) e regenerada. Não existe reaproveitamento entre execuções: cache é contrato, e contrato velho é pior que contrato nenhum — descreve uma API que mudou, cita classe que não existe mais, e os dev-agents seguem literalmente. Caches de maio deste projeto ainda diziam "Basecoat" e mandavam alinhar overlays com `bg-black/80`. Como a pasta nasce vazia a cada rodada, ela também não precisa entrar nas varreduras de vocabulário morto do `audit.mjs`.
6. **Audit-mode é report-only.** Agents chamados pela pipeline em `audit` reportam; fixes vão para `FIXES-NEEDED.md`. Skills isoladas (`/quality` fora de pipeline) continuam em fix-mode.
7. **Glob e Grep nativos, não loops bash.** No Windows loops são lentos; tools do Claude já varrem em paralelo.
8. **Prompts auto-contidos.** Passe slug, modo, caminho do context-cache, lista exata de arquivos. Nunca delegue "descubra o que fazer".
9. **Nunca pule uma skill sem registrar.** Script limpo → registre `script-clean, agent skipped`. Erro em uma skill não bloqueia as próximas da mesma fase.
10. **Mostre progresso fase a fase.** `✓ Fase B concluída (5 stacks paralelas, 3 min)`.
11. **Vanilla é o teste de fumaça do contrato.** Toda divergência de comportamento encontrada até hoje tinha o Vanilla certo e as outras três com markup herdado do shadcn. Ele não tem lib headless para esconder o contrato: o que está lá é o que o design system realmente define. Ao comparar stacks, comece por ele.

---

## Passo 1 — Descobrir Componentes

### Se `component-slug` for `all` ou omitido:

Dispare 4 `Glob` em paralelo no mesmo turno:

- `nortear-design-system-react/src/components/ui/*.tsx`
- `nortear-design-system-vue/src/components/ui/*/index.ts`
- `nortear-design-system-svelte/src/components/ui/*/index.ts`
- `nortear-design-system-vanilla/src/components/ui/*.ts`

Extraia basename, filtre `*.stories.*` e sufixos de variação (`-variants`, `-sizes`, `-states`, `-compositions`, `-modes`, `-layouts`), intersecte com os demais.

**Slugs a ignorar**: `index`, `utils`, `cn`, `icons`

### Se `component-slug` for um slug específico: pule a descoberta.

---

## Passo 2 — Verificar Estado Atual

Dispare estes `Glob` em paralelo (um por stack × tipo):

```
nortear-design-system-react/src/components/ui/<slug>*
nortear-design-system-react/src/components/docs/*<Slug>Docs.*
nortear-design-system-react/src/components/ui/<slug>*.stories.*

nortear-design-system-vue/src/components/ui/<slug>/*
nortear-design-system-vue/src/components/docs/*<Slug>Docs.*
nortear-design-system-vue/src/components/ui/<slug>/<slug>*.stories.*

nortear-design-system-svelte/src/components/ui/<slug>/*
nortear-design-system-svelte/src/components/docs/*<Slug>Docs.*
nortear-design-system-svelte/src/components/ui/<slug>/<slug>*.stories.*

nortear-design-system-vanilla/src/components/ui/<slug>*
nortear-design-system-vanilla/src/components/docs/*<Slug>Docs.*
nortear-design-system-vanilla/src/components/ui/<slug>*.stories.*

docs/shared/content/<slug>/translations.json
```

Derive o estado: completo / falta X stack / sem translations / sem docs page.

---

## Passo 3 — Plano de Execução

Tabela com o plano. Se o usuário já disse "pode seguir" / "execute tudo", não pergunte — siga direto.

```
## Plano de Execução — Pipeline <mode>

| Componente | Estado | Skills a executar |
```

---

## Passo 4 — Audit Determinístico (script)

Antes de qualquer agent:

```bash
node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json
# ou para todos:
node scripts/audit.mjs --all --json > .pipeline-context/scans.json
```

Categorias cobertas:
- **security**: HTML dinâmico sem sanitize, href sem validação
- **performance**: wildcard lucide imports, dimensões hardcoded em cva, top-level Date em stories
- **quality**: seções obrigatórias faltando, a11y.disable, sub-stories sem play, `play_without_assertion`, `noop_assertion`, `coverage_divergence`, `legacy_class_in_story`, vocabulário de lib removida (`dead_lib_reference`), token inexistente (`unknown_token_reference`), classe `.nds-*` inexistente (`unknown_class_reference`)

> `legacy_class_in_story` e `unknown_class_reference` parecem a mesma coisa e não são. O primeiro acusa classe FORA do vocabulário `nds-` (resíduo do Tailwind). O segundo acusa classe COM o prefixo certo e sem regra por trás — `nds-p-3`, `nds-skeleton-line`. Prefixo válido passava no primeiro check e não pintava nada em runtime; o TypeScript não vê, o teste não vê, o axe não vê. Cobre também os snippets do `translations.json`, que é o caso mais caro: ninguém executa bloco de documentação, e o erro só aparece quando alguém copia.
- **analytics**: eventos não tipados em AnalyticsEvents, `@/lib/analytics` importado em UI primitive, `_infra` (mount ausente/condicional, demo sem container), `i18n_text_in_payload`

Exit codes: 0 = limpo, 1 = high, 2 = medium/low.

**Regra de ouro (só para checks negativos)**: categoria vazia no scan → NÃO dispare o agent dessa categoria. Reporte `script-clean, agent skipped`.

**Exceção (checks de presença)**: em modo `new`, `/quality` e `/analytics` rodam mesmo com scan limpo. Componente recém-criado sem instrumentação e com asserção vazia produz scan limpo — o grep não acha o que nunca foi escrito. Ver Princípio 1.

---

## Passo 5 — Executar Skills

### Sequência `new`

```
Fase A (serial):
  0. Apagar .pipeline-context/ inteira e recriar vazia — o cache não sobrevive
     entre execuções (ver Princípio 5)
  1. /ux-writer <slug>
  2. Escrever .pipeline-context/<slug>.md — ver "Contrato do context-cache" abaixo
  3. node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json

Fase B (5 agents em PARALELO — dev-skills):
  /dev-react <slug>
  /dev-vue <slug>
  /dev-svelte <slug>
  /dev-vanilla <slug>
  /dev-angular <slug>

Fase C (serial):
  node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json  (re-scan pós-dev)

Fase C2 (serial — PORTÃO, bloqueia o avanço):
  npm test -- <slug>   em cada uma das 5 stacks
  Falha em qualquer stack → não avance. Corrija (dev-skill da stack) e repita.

Fase D (até 5 agents em PARALELO):
  /quality <slug>      (SEMPRE em modo `new` — check de presença)
  /analytics <slug>    (SEMPRE em modo `new` — check de presença)
  /seo-geo <slug>      (sempre)
  /security <slug>     (só se scan.security.length > 0)
  /performance <slug>  (só se scan.performance.length > 0)

Fase E (1 agent — último):
  /cross-stack <slug>  (sempre — compara estado pós-fix)

Fase F (serial):
  Consolidar FIXES-NEEDED.md e APLICAR (ver Passo 6)
```

### Contrato do context-cache (Fase A.2)

`.pipeline-context/<slug>.md` deve conter, além do inventário técnico (categoria, variantes, tamanhos, props, tokens, lista de arquivos das 5 stacks):

**Spec de exemplos — obrigatória.** Uma lista fechada de qual conteúdo cada demo, story e composição renderiza, derivada de `demonstration.*` e `variants.*` do `translations.json`:

- para cada story a criar: nome exportado, **o ARQUIVO em que ela mora**, chave de tradução dos rótulos, e estado inicial (aberto/fechado, selecionado, disabled)
- para cada composição: quais elementos compõem (ícone? badge? qual?) e a chave do rótulo
- classes `.nds-*` do wrapper de cada exemplo

**O arquivo é parte do contrato, não detalhe de organização.** Ele decide o
grupo da barra lateral, e os cinco dev-agents rodam em paralelo sem se ver: o
que a spec não fixa, cada um decide sozinho e as cinco árvores de menu divergem.
Não quebra teste, não aparece no build — só quem abre o Storybook vê. Medido no
repositório: 45 stories em grupos diferentes conforme a stack, cinco delas no
mesmo componente, com todos os portões verdes. O critério de qual arquivo está
em `_dev-shared.md` → "Em qual arquivo a story entra"; a regra que cobra é
`story_group_divergent`.

**Cubra TODAS as seções que renderizam exemplo — não só Demonstração, Variantes e
Composições.** O buraco recorrente é o **Do & Don't**: a seção é obrigatória, os
previews são código como qualquer outro, e o `translations.json` só traz a legenda.
Sem spec, cada stack inventa o próprio par e as 5 divergem. No code-block saíram
três exemplos diferentes para o mesmo par, e um deles contradizia a legenda que
ilustrava ("metade das linhas destacadas" com todas destacadas).

Também fixe o que **vira dado**, não só o que vira pixel: o `name` de cada card de
Variantes/Composições é o que o `DocsVariants` transforma em `snippet_id` do
`docs_code_copy`. Nome traduzido ou diferente por stack = mesmo evento com valores
distintos. Especifique a chave estável.

Quando o `translations.json` tiver formato que o container não comporta (ex.: tabela
em N grupos contra um container de tabela única), **decida no contrato** e escreva a
decisão. As 5 stacks batem na mesma parede ao mesmo tempo e, sem decisão, cada uma
inventa a sua — inclusive traduções, que passam a viver em 4 arquivos.

Os dev-skills consomem essa spec **literalmente**. É proibido inventar rótulo, valor ou estado inicial de exemplo — se faltar na spec, pare e reporte, não improvise. As 5 stacks precisam renderizar o mesmo exemplo com as mesmas classes; divergência aqui só é detectável tarde, na Fase E.

**Vocabulário proibido.** Nomeie explicitamente as libs que NÃO existem mais no projeto (Radix, shadcn, Tailwind utilitário fora do prefixo `nds-`) — elas não podem aparecer em `translations.json`, docs page nem story. Ver Princípio 11.

### Sequência `full`

Igual a `new`, com duas diferenças:
- Fase A: pula `/ux-writer` se `translations.json` já existe
- Fase B: pula `/dev-<stack>` se a stack já tem docs page + stories completas

### Sequência `audit`

```
Fase A (serial):
  0. Apagar .pipeline-context/ inteira e recriar vazia (ver Princípio 5)
  1. node scripts/audit.mjs --all --json > .pipeline-context/scans.json
  2. Gerar .pipeline-context/<slug>.md para cada componente

Fase B (paralelo entre skills E entre componentes):
  Para cada <slug>:
    /security | /performance (só se scan reportou)
    /quality | /analytics    (só se scan reportou OU se o componente nunca passou
                              por auditoria de presença — registre qual dos dois)
    /seo-geo  (sempre)

Fase C:
  /cross-stack <slug>  (por último)

Fase D:
  Consolidar FIXES-NEEDED.md
  > N violações em X componentes. Aplicar: [1] críticos / [2] críticos+médios / [3] todos / [4] nenhum?
```

### Sequência `content`

```
Fase A: /ux-writer <slug>
Fase B (paralelo): /seo-geo <slug>, /analytics <slug>
```

---

## Prompts dos Dev-Agents

Cada dev-agent recebe prompt auto-contido com:

1. Skill a invocar (`/dev-react <slug>`)
2. `Leia .pipeline-context/<slug>.md PRIMEIRO` — contém variantes, props, tokens, lista de arquivos e a **spec de exemplos**. A spec é contrato: renderize exatamente os exemplos, rótulos, estados iniciais e classes `.nds-*` descritos ali. Se algo que você precisa não estiver na spec, **pare e reporte** — não invente, porque as outras 3 stacks estão sendo construídas em paralelo a partir do mesmo arquivo.
3. **Inline audit check antes de commit:**

```
ANTES DE COMMITAR, rode:
  node scripts/audit.mjs <slug> --category security,performance,analytics,quality --json

Para cada violação da sua stack, corrija ANTES do commit. Se não puder corrigir
(ex: exige mudar o UI primitive), inclua no commit message: "ciência: <rule> em <file> — <motivo>".
```

4. Lista exata dos arquivos a produzir
5. Commit: `skill(dev-<stack>): <slug>`

**Não use `isolation: "worktree"`** — os 4 agents precisam do mesmo repo.

---

## Prompts dos Audit-Agents (report-only)

Cada audit-agent recebe:

1. Skill a invocar (`/security <slug>`, `/cross-stack <slug>`, etc.)
2. Conteúdo de `.pipeline-context/scan-<slug>.json` — o que o script já detectou
3. Conteúdo de `.pipeline-context/<slug>.md` — contexto do componente
4. Instrução:

```
Você é chamado pelo pipeline em MODO AUDIT (report-only). O script determinístico
já rodou — seu trabalho é cobrir o que o script NÃO pega (julgamento, contexto,
consistência visual, UX writing).

NÃO re-detecte o que o script já encontrou. Foque em:
- <listar áreas específicas da skill que exigem olho humano>

NÃO edite, NÃO commite. Reporte em ≤150 palavras:
- Violações novas (não listadas no scan)
- Score /10
- Arquivo:linha das violações
```

**Cross-stack prompt adicional** (é o último agent — compara estado pós-fix):

```
O script já verificou: classes cva(), variantes disponíveis, tokens CSS.
Foque em:
- Comportamento interativo cross-stack e atributos ARIA que diferem entre libs
  (base-ui vs reka-ui vs bits-ui vs factory).
- Divergências de docs page (seção presente numa stack e ausente em outra).
- PARIDADE DE EXEMPLO: cada story e cada demo da docs page renderiza o MESMO
  conteúdo nas 5 stacks — mesmos rótulos, mesmo estado inicial, mesma composição.
  Compare também story <-> docs page dentro da mesma stack: a story deve mostrar
  o exemplo da docs page, consumindo components/ui, com as mesmas classes .nds-*.
- PARIDADE DE MARKUP dos wrappers de UI: mesma árvore de elementos e mesmas
  classes. Diferença de markup entre stacks é bug até prova em contrário —
  costuma ser resíduo de shadcn numa stack e não nas outras.
- MATRIZ DE COBERTURA DE TESTE: para cada story, quantos expect() em cada stack.
  Contagem desproporcional (1 numa stack, 5 em outra) significa placeholder na
  de menor contagem, não teste enxuto.

Comece a comparação pelo Vanilla — ele não tem lib headless escondendo o
contrato, então é o que expõe o que o design system realmente define.

Reporte divergências aceitáveis (diferenças idiomáticas entre libs) separadas
de divergências reais que exigem alinhamento.
```

---

## Passo 6 — Relatório + FIXES-NEEDED.md

### Relatório (chat)

```
## Relatório Pipeline — <mode> — <data>

### Componentes Processados: X

| Componente | Script scan | Fase B dev | Fase C2 testes | Fase D audits | Fase E cross-stack |
|------------|-------------|------------|----------------|---------------|--------------------|
| calendar   | 4 high, 3 low | ✓ 5 stacks | ✓ 5/5 verdes | 2 agents disparados | 1 divergência |
```

### FIXES-NEEDED.md

Agrupa apenas violações reportadas por agents (as determinísticas já foram corrigidas inline):

```md
# Fixes Pendentes — Pipeline <mode> <data>

## Críticos
- [ ] <slug>: <descrição> (`file.tsx:42`) — skill: `/security <slug>`

## Médios
...

## Baixos
...
```

Ao fim: **"N violações em X componentes. Aplicar: [1] críticos / [2] críticos+médios / [3] todos / [4] nenhum?"**

### Quem aplica os fixes

Aprovado o batch, a aplicação é do **orquestrador**, não fica pendente esperando outra invocação:

| Tipo de fix | Quem aplica |
|---|---|
| Mecânico e localizado (classe errada, `controls.disable`, import) | Orquestrador, direto |
| Exige julgamento de conteúdo (texto, exemplo, cobertura de teste) | Re-invoca a skill de origem em **fix-mode**, passando o item do FIXES-NEEDED |
| Toca as 5 stacks (markup, classe compartilhada, `.nds-*` CSS) | Orquestrador, num único commit — nunca 5 agents paralelos no mesmo arquivo |

Depois de aplicar: re-rode `audit.mjs <slug>` e a Fase C2. Item aplicado sem re-verificação não conta como resolvido.

**Commits**: fase A/B geram commits próprios (`skill(ux-writer): <slug>`, `skill(dev-react): <slug>`); fase F agrupa fixes em batches (`fix(<slug>): <resumo do batch>`).
