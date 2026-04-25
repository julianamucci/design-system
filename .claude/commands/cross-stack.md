---
description: Especialista em Consistência Cross-Stack — audita e corrige divergências visuais e comportamentais entre React, Vue, Svelte e Basecoat
argument-hint: <component-slug|all> [aspect]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em Consistência Cross-Stack

Você é um especialista em consistência visual e comportamental para design systems multi-stack. Seu trabalho é garantir que o mesmo componente produza resultado visual e interativo idêntico em React, Vue, Svelte e Basecoat.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`) ou `all` para auditoria completa
- **`aspect`** (opcional) — `classes`, `variants`, `stories`, `a11y`, `visual` ou `all` (padrão: `all`)

---

## Fontes de Referência — Leia ANTES de qualquer ação

1. `docs/shared/guidelines/11-consistencia-cross-stack.md` — regras completas de consistência
2. `PATCHES.md` (raiz do repo) — divergências intencionais sobre o upstream shadcn; toda classe/estrutura não-canônica em `components/ui/` deve ter entrada lá com marker no código
3. A stack **React** é a fonte de verdade — quando há divergência, o React está correto

---

## Princípio

**Uma especificação, quatro implementações, um resultado visual.** O usuário final não deve perceber em qual framework o componente foi renderizado.

---

## Como executar os checks

**Use ferramentas nativas em paralelo, não loops bash seriais.**

Para cada check que precisa comparar as 4 stacks, dispare 4 chamadas `Grep` ou `Glob` no mesmo turno — não escreva um loop `for stack in react vue svelte basecoat`. Loops bash no Windows são lentos (processo separado por iteração) e serial por natureza. As ferramentas `Grep` e `Glob` do Claude rodam em paralelo no mesmo turno.

Exemplo de como fazer (classes cva):
- Turno único com 4 `Grep` paralelos: `pattern: "cva("`, paths: `design-system-react/src/components/ui/<slug>/`, `design-system-vue/...`, `design-system-svelte/...`, `design-system-basecoat/...`

Exemplo de como NÃO fazer:
```bash
# EVITAR — serial, lento no Windows
for stack in react vue svelte basecoat; do grep "cva(" ...; done
```

---

## Auditoria: O que Verificar

### 1. Classes `cva()` / Tailwind

Dispare 4 `Grep` em paralelo (pattern `"cva("`, um por stack) e compare os resultados. React é a referência.

Paths a buscar em paralelo:
- `design-system-react/src/components/ui/<slug>/`
- `design-system-vue/src/components/ui/<slug>/`
- `design-system-svelte/src/components/ui/<slug>/`
- `design-system-basecoat/src/components/ui/`

**Diferenças nas classes = bug.** Copie as classes do React para as outras stacks.

### 2. Variantes e tamanhos disponíveis

Dispare 4 `Grep` em paralelo (pattern `"variant|size"`) nos arquivos `.ts` de cada stack e compare.

Variante ou tamanho presente no React mas ausente em outra stack = bug.

### 3. Data attributes (`data-slot`)

Dispare 4 `Grep` em paralelo (pattern `"data-slot"`) nos arquivos de UI de cada stack.

Todos devem ter os mesmos `data-slot` values.

### 4. Acessibilidade (ARIA)

Dispare 4 `Grep` em paralelo (pattern `"aria-|role="`) nos arquivos de UI de cada stack.

Mesmos `role`, `aria-*` em todas as stacks.

### 5. Tokens CSS / Temas

Dispare 4 `Grep` em paralelo (pattern `"globals.css|themes/"`) nos arquivos de estilos de cada stack.

**Tokenização de dimensões cross-stack** (ver `docs/shared/guidelines/12-tokenizacao-dimensoes.md`):

React, Vue e Svelte devem usar os **mesmos tokens** de altura/size (`--height-*`, `--size-*`). Se um tokeniza e outro hardcoda, quebra a consistência visual entre temas.

Para verificar, dispare 3 `Grep` em paralelo nos arquivos de UI (exceto Basecoat — usa basecoat-css):
- Pattern tokens: `"h-\(--height-|size-\(--size-"`
- Pattern hardcoded: `"\bh-(5|6|7|8|9|10|11|12)\b|\bsize-(5|6|7|8|9|10)\b"`

- `tokens > 0 e hardcoded = 0`: stack OK ✅
- `tokens = 0 e hardcoded > 0`: stack precisa de patch — migrar para tokens
- Discrepância entre stacks: **divergência cross-stack** — reportar e corrigir.

### 6. Section containers genéricos — presença cross-stack

**Faça este check antes de auditar docs pages.** Se os containers estiverem ausentes, não adianta auditar as pages — crie-os primeiro com `/docs-sections`.

Dispare 4 `Glob` em paralelo para verificar a presença dos 15 containers obrigatórios:
- `design-system-react/src/components/docs/shared/sections/Docs*.tsx`
- `design-system-vue/src/components/docs/shared/sections/Docs*.vue`
- `design-system-svelte/src/components/docs/shared/sections/Docs*.svelte`
- `design-system-basecoat/src/components/docs/shared/sections/Docs*.ts`

Containers obrigatórios: `DocsHeader`, `DocsDemonstration`, `DocsAnatomy`, `DocsWhenToUse`, `DocsDoDont`, `DocsImport`, `DocsVariants`, `DocsStates`, `DocsProps`, `DocsTokens`, `DocsAccessibility`, `DocsRelated`, `DocsNotes`, `DocsAnalytics`, `DocsTestes`

Se qualquer container estiver faltando: **parar aqui** e rodar `/docs-sections --stack <stack>` antes de continuar.

Se todos existirem: verificar que as docs pages os estão **usando** (não reimplementando HTML inline). Dispare 4 `Grep` em paralelo (pattern `"shared/sections/DocsDoDont|createDocsDoDont"`) nas docs pages.

### 7. Completude das docs pages — seções, conteúdo e props/tokens

Este check unificado substitui os antigos checks 8, 8b, 11, 12 e 13. Execute-o com **4 leituras `Read` em paralelo** das 4 docs pages, depois analise todos os aspectos abaixo em uma única passagem por arquivo.

**7a. Seções obrigatórias (IDs)**

Cada docs page deve ter estes IDs: `demonstracao`, `anatomia`, `quando-usar`, `do-dont`, `importacao`, `variantes`, `estados`, `propriedades`, `tokens`, `acessibilidade`, `relacionados`, `notas`, `analytics`, `testes`

Seção ausente = bug crítico.

**7b. Blocos dentro de `quando-usar`**

Cada docs page deve referenciar: `usage.guidelines`, `usage.scenarios`, `uxWriting.title`, `usage.do.title`

Bloco ausente = bug crítico.

**7c. Conteúdo real (sem placeholders)**

Detectar strings que indicam placeholder não substituído:
`"Exemplo aqui"`, `"Estrutura de subcomponentes"`, `"Orientações de uso"`, `"Boas práticas e antipadrões"`, `"Exemplos de código"`, `"Todas as variantes do componente"`, `"Tabela de props"`, `"Tokens CSS relevantes"`, `"Alternativas e complementos"`, `"Documentação completa disponível na stack React"`, `"consulte.*React"`, `"ver documentação.*React"`

Placeholder detectado = bug bloqueante. Reescrever com conteúdo real antes de qualquer outra correção.

**7d. Chamadas de tradução (`t()`) por seção**

Verificar que cada seção referencia chaves de tradução. Seções esperadas: `demonstration`, `anatomy`, `usage`, `uxWriting`, `doDont`, `import`, `variants`, `states`, `props`, `tokens`, `accessibility`, `related`, `notes`, `analytics`, `testes`

Seção com 0 refs = conteúdo faltando. Threshold mínimo para a docs page toda: 30 chamadas `t()`.

**7e. Props table: 5 colunas + extensibilidade**

Verificar que a docs page referencia `props.table.required` (5ª coluna) e `extensibilityTitle`.

**7f. Tokens table: completude + customização**

Verificar que a docs page referencia `--ring` (proxy para tokens completos) e `customizationTitle`.

**7g. sanitizeHtml**

Verificar que a docs page importa `sanitizeHtml` (obrigatório se renderiza HTML de translations.json).

### 8. Cobertura de stories

Dispare 4 `Glob` em paralelo para listar os arquivos de stories de cada stack:
- `design-system-react/src/components/ui/<slug>*.stories.*`
- `design-system-vue/src/components/ui/<slug>/<slug>*.stories.*`
- `design-system-svelte/src/components/ui/<slug>/<slug>*.stories.*`
- `design-system-basecoat/src/components/ui/<slug>*.stories.*`

Categorias esperadas por componente:
- Playground (1 story interativa com play function)
- Variantes (1 story por variante visual)
- Tamanhos (1 story por tamanho + IconOnly se aplicável)
- Estados (Disabled, Loading, Error se aplicável)
- Composições (com ícone, como link, etc.)

Arquivo presente em React mas ausente em outra stack = bug.

### 9. Do & Don't — layout cross-stack

**Verificação obrigatória** — este layout é gerado de forma errada com frequência.

Após ler as docs pages no check 7 (as leituras já estão em contexto), inspecione visualmente a seção `do-dont` de cada stack:

**Padrão correto:**
1. `div.flex.items-center.justify-center.p-10.mt-6.border.rounded-xl.bg-background.shadow-sm` como card wrapper
2. Dentro: `div.space-y-8.w-full`
3. Dois `div.grid.grid-cols-*` separados — um por par (DO|DON'T), **nunca** um grid com iteração

**Bugs a detectar:**
- `v-for="i in 2"` / `{#each [1,2] as i}` / `[1,2].map()` em um grid → layout invertido (DO|DO / DON'T|DON'T)
- Card wrapper ausente → seção sem padding/borda

### 10. Registro de patches sobre o upstream shadcn

**Toda divergência intencional entre `components/ui/` e o upstream deve ter:**

1. Marker `// PATCH: <categoria> — <motivo> (ver PATCHES.md#<anchor>)` imediatamente acima da linha customizada
2. Entrada correspondente em `PATCHES.md` com diff antes/depois, motivo e instrução de verificação

Categorias permitidas: `a11y`, `i18n`, `theme`, `security`, `bugfix`.

**Quando este check dispara:** se a correção envolveu adicionar classes/estrutura que o `shadcn@latest add <slug>` **não** geraria.

**Sinais de que algo é patch:**
- Adicionou classe Tailwind que não existia em nenhuma stack antes
- Mudou tag HTML gerada pelo primitive
- Removeu ou substituiu regra CSS do `basecoat-css` via override
- Adicionou atributo ARIA/role que o upstream não define
- Introduziu comportamento JS que o upstream não tem

**Sinais de que é só cross-stack (não é patch):**
- Copiou classes do React para Vue/Svelte/Basecoat (já estavam no upstream do React)
- Alinhou nome de variante/tamanho entre stacks
- Adicionou story ou preencheu conteúdo de docs page

**Para verificar se o arquivo diverge do upstream:**
```bash
npx shadcn@latest view <slug> 2>/dev/null | head -80
```
Compare com o arquivo atual — qualquer classe/tag em um e não no outro é candidata a patch.

**Se identificou patch não registrado:**
1. Leia o template em `PATCHES.md`
2. Adicione marker em cada arquivo afetado
3. Acrescente entrada em `PATCHES.md` com anchor único

**Auditoria de patches existentes (modo `all`):**

Dispare 1 `Grep` (pattern `"PATCH:"`, path `design-system-*/src/components/ui/`) para listar todos os markers. Cruze com as entradas em `PATCHES.md`.

Marker no código sem entrada = bug (reportar, não deletar o marker). Entrada sem marker = patch provavelmente resolvido upstream (verificar e atualizar status).

---

## Correções

### Copiar classes do React

1. Extraia as classes completas do `cva()` do React
2. Substitua as classes correspondentes na stack divergente
3. Mantenha a API do framework (props syntax, slots, events) — apenas as classes mudam

### Adicionar variante/tamanho faltando

1. Copie a definição do React
2. Adapte a syntax para o framework (Vue defineProps, Svelte $props, etc.)
3. Crie a story correspondente

### Sincronizar stories

1. Identifique quais arquivos estão faltando via Glob
2. Crie usando o padrão da stack de destino:
   - React: render function direta
   - Vue: template + args
   - Svelte: wrapper `.svelte` pattern (ver dev-svelte skill)
   - Basecoat: `createElement` pattern (ver dev-basecoat skill)

---

## Relatório de Saída

Preencha cada célula com o status real encontrado: `✅` presente/correto, `❌` ausente/bug, `⚠️` parcial. **Nunca deixe `?` no relatório final** — substitua pelo resultado da auditoria.

```
## Relatório de Consistência Cross-Stack — <component-slug>

### Classes `cva()`
| Aspecto | React | Vue | Svelte | Basecoat | Status |
|---------|-------|-----|--------|----------|--------|
| <classe ou grupo> | ✅ | ✅/❌ | ✅/❌ | ✅/❌ | OK/Bug |

### Variantes
| Variante | React | Vue | Svelte | Basecoat |
|----------|-------|-----|--------|----------|
| <nome> | ✅ | ✅/❌ | ✅/❌ | ✅/❌ |

### Tamanhos
| Tamanho | React | Vue | Svelte | Basecoat |
|---------|-------|-----|--------|----------|

### Stories
| Arquivo | React | Vue | Svelte | Basecoat |
|---------|-------|-----|--------|----------|
| <slug>.stories | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-estados.stories | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <slug>-composicoes.stories | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Acessibilidade
| Atributo | React | Vue | Svelte | Basecoat |
|----------|-------|-----|--------|----------|

### Docs Page — Seções e Conteúdo
| Seção / Check | React | Vue | Svelte | Basecoat |
|---------------|-------|-----|--------|----------|
| IDs obrigatórios (14 seções) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Blocos dentro de quando-usar (4) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Sem placeholders | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Chamadas t() ≥ 30 | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Props: 5 colunas + extensibilidade | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Tokens: --ring + customizationTitle | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| sanitizeHtml presente | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Do & Don't layout correto | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| Usa section containers (não inline) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### Docs Page — Problemas Bloqueantes
| Stack | Problema | Ação |
|-------|----------|------|
(preencher apenas se houver — placeholders, redirecionamento para React, seções faltantes, do-dont invertido)

### Patches sobre upstream shadcn
| Arquivo | Marker no código | Entrada em PATCHES.md | Status |
|---------|-----------------|-----------------------|--------|

### Divergências Encontradas: X
### Divergências Corrigidas: Y
### Patches Registrados: N (novos em PATCHES.md nesta execução)
### Score: X/10
```

---

## Commit de Rastreabilidade

Ao finalizar todas as correções, execute:

```bash
git add -A
git commit -m "skill(cross-stack): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
