---
description: Especialista em Consistência Cross-Stack — audita e corrige divergências visuais e comportamentais entre React, Vue, Svelte, Vanilla e Angular
argument-hint: <component-slug|all> [aspect]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em Consistência Cross-Stack

Você é um especialista em consistência visual e comportamental para design systems multi-stack. Garanta que o mesmo componente produza resultado visual e interativo idêntico em React, Vue, Svelte, Vanilla e Angular.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente ou `all`
- **`aspect`** (opcional) — `classes`, `variants`, `stories`, `a11y`, `visual` ou `all` (padrão: `all`)

---

## Princípio

**Uma especificação, cinco implementações, um resultado visual.** O usuário final não deve perceber em qual framework o componente foi renderizado.

**A stack Vanilla é a fonte de verdade** — comece toda comparação por ela. Vanilla não usa lib headless: não há base-ui, reka-ui nem bits-ui injetando markup, atributo de estado ou comportamento por conta própria. O que está no Vanilla é o que o design system define; o que sobra nas outras três costuma ser resíduo do shadcn. Toda divergência de markup ou comportamento investigada até hoje terminou com o Vanilla certo.

Exceção: quando a divergência for de **API de framework** (nome de prop, forma de composição, sintaxe de evento), não há fonte de verdade — cada lib tem a sua. Registre em `patches.md` em vez de "alinhar".

---

## Fontes de Referência

1. **Catálogo de checks**: `docs/shared/skill-refs/cross-stack-checks.md` — todos os 11 checks com pseudocódigo e thresholds. **Use como playbook completo**.
2. `docs/shared/guidelines/11-consistencia-cross-stack.md` — regras gerais
3. `PATCHES.md` (raiz) — divergências intencionais sobre libs primitivas/externas
4. `docs/shared/guidelines/12-tokenizacao-dimensoes.md` — exceções aceitas

---

## Como executar — princípios

1. **Paralelizar tudo**. Não faça loops bash. Use `Grep`/`Glob`/`Read` em paralelo no mesmo turno (5 stacks simultâneas).
2. **Coletar uma vez**. Após a coleta inicial, **não releia** arquivos nos passos seguintes — todos já estão em contexto.
3. **Reportar tabela completa**. Cada célula com `✅`/`❌`/`⚠️` — nunca `?`.

---

## Os 11 Checks (resumo)

Detalhes em `docs/shared/skill-refs/cross-stack-checks.md`.

| # | Check | Tool | Severidade |
|---|---|---|---|
| 1 | Classes `cva()` / `.nds-*` | Grep × 5 | Bug |
| 2 | Variantes e tamanhos | Grep × 5 | Bug |
| 3 | Data attributes (`data-slot`) | Grep × 5 | Bug |
| 4 | Acessibilidade (ARIA) | Grep × 5 | Bug |
| 5 | Tokens CSS + tokenização de dimensões | Grep × 3 (sem Vanilla) | Bug |
| 6 | Section containers (15 obrigatórios) | Glob × 5 | Bloqueante |
| 7 | Completude de docs pages (10 sub-checks: IDs, blocos, placeholders, t() count, props/tokens, DOMPurify no call site, structureCode, breadcrumb, SEO completo) | Read × 5 | Variável |
| 8 | Cobertura de stories | Glob × 5 | Bug |
| 9 | Do & Don't layout (bug recorrente) | inspeção visual após Read | Bloqueante |
| 10 | Patches sobre libs primitivas/externas (markers + PATCHES.md) | Grep × 1 + leitura | Crítico |
| 11 | Divergências idiomáticas Vanilla (3 camadas: notes, DocsProps, story) | inspeção após Read | Bug |
| 12 | Higiene `.nds-*` + paridade estrutural (classes redundantes, style inline, wrapper de tabela, items→Card/lista) | Grep × 5 | Bug |
| 13 | **O que a docs page RENDERIZA** — seções, títulos, cartões, `trackId`, linhas de props e de tokens | **sonda de navegador** (Passo 0) | Bug |

O check 13 é o único que não se faz por `Grep`, e existe porque os outros doze
não alcançavam o que a leitora vê. Ele achou, na primeira rodada: tabela de
propriedades com 4 linhas no svelte e 23 no angular para o mesmo componente,
título de cartão como `<p>` em vez de `<h3>` em 102 páginas, e 67 páginas
chamando `DocsVariants` sem `componentSlug` — o que omite o `data-track-id` e faz
o observador IGNORAR o clique, então copiar código ali não gera evento nenhum.

---

## Processo

### Passo 0 — LER O FONTE NÃO RESPONDE sobre docs page. Rode a sonda.

Todos os checks abaixo são `Grep` e `Read` — leitura de **fonte**. Para markup de
primitivo isso basta. Para **docs page, não basta, e produz artefato**: as cinco
stacks montam a MESMA página de formas diferentes, então contar ocorrência no
código mede a forma de montar, não o que a leitora vê.

Medido em 2026-09-03, nas duas tentativas de responder isso por varredura:

| o que contei no fonte | o que deu | por quê |
|---|---|---|
| `data-docs-preview` | **0 nas cinco** | a âncora vem dos containers compartilhados (`DocsVariants`, `DocsDoDont`), não da página |
| `trackId:` no sheet | **8/8/8/8/2** | o Angular gera os cartões com `.map()` sobre uma lista; as outras quatro escrevem um a um — são oito nos cinco casos |

Ambos passariam por divergência gritante. Nenhum era.

**Antes de qualquer check de docs page, rode a sonda:**

1. O colhedor já existe e é compartilhado: `docs/shared/testing/docs-page-probe.ts`
   (`medirDocsPage(raiz, slug)` e `reportar(stack, medida)`). Leia o cabeçalho —
   ele registra os dois defeitos com que ele próprio nasceu, e por quê.
2. Crie uma story TEMPORÁRIA por stack (`docs-sonda.stories.*`) que renderiza a
   docs page, espera um quadro e chama `reportar()`. Cada uma reprova de
   propósito: **a exceção é o único canal que atravessa a instrumentação de
   console da `play`** — `console.log` não chega ao terminal.
3. `npm test -- docs-sonda` por stack, `grep` por `SONDA::`, e diff campo a campo.
4. **Apague as stories** ao terminar. O colhedor fica.

O que ela devolve: ids de seção na ordem, texto dos `<h2>`, nome e `trackId` de
cada cartão de variante e composição, contagem de previews, linhas da tabela de
props e da de tokens, e blocos de código.

**Seletor que não casa é ACHADO, não falha da sonda.** Se um campo vier vazio numa
stack, a divergência de vocabulário é o resultado — foi assim que se descobriu
que o título do cartão é `<h3>` no vanilla e no angular e `<p>` semibold no
react, vue e svelte, em 102 docs pages. Nunca adapte o colhedor em silêncio para
"arrumar" o número; mudança nele é item de relatório.

### Passo 1 — Coletar tudo em paralelo

Dispare em um único turno:
- 4 `Glob` (stories de cada stack)
- 4 `Read` (docs pages de cada stack)
- 1 `Read` (translations.json)
- 4 `Grep` para classes/variantes/data-slot/ARIA
- 1 `Grep` para tokenização hardcoded
- 1 `Grep` para PATCH markers (modo `all`)

**Um cruzamento que não é grep e tem instrumento próprio:** a tabela de tokens.
Rode `node scripts/tabela-tokens.mjs <slug>` — ele cruza a tabela das cinco docs
pages com as folhas de `docs/shared/styles/nds/`, nos dois sentidos, e a seção 3
dele É a divergência cross-stack. Não reconstrua esse parser: ele lê a linha em
seis formas diferentes, e por meio ano leu só uma — 121 das 236 docs pages com
tabela ficavam com ZERO linha comparada, imprimindo "nenhuma" por ausência.

### Passo 2 — Analisar em 1 passagem por arquivo

Cada docs page é lida **uma vez**. Aplique os sub-checks 7a–7j em ordem, com `Grep` adicional só se algum check exigir verificar conteúdo no DOM gerado.

### Passo 3 — Decidir: report-only vs fix

- **Modo pipeline (audit-only)**: reportar tabela com gaps, sem editar.
- **Modo skill isolada**: corrigir o que for direto (copiar classes do React, alinhar variantes, criar stories faltantes).

### Passo 4 — Registrar patches identificados

Se a correção introduziu divergência intencional do upstream → adicionar marker no código + entrada em `PATCHES.md` com diff antes/depois.

---

## Relatório (template completo em `docs/shared/skill-refs/cross-stack-checks.md`)

Preencher cada célula com `✅`/`❌`/`⚠️`. **Nunca `?`**.

Resumo final esperado:
```
### Divergências encontradas: X
### Divergências corrigidas: Y
### Patches registrados: N
### Score: X/10
```

---

## Commit

```bash
# Stage SÓ os seus caminhos. `git add -A` varre o que outra sessão
# deixou na árvore — já levou 55 arquivos de outra stack para um commit,
# e nesta casa reincidiu seis vezes numa campanha só. Liste os caminhos:
git commit -- <caminhos exatos que você tocou> -m "skill(cross-stack): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não fazer commit.
