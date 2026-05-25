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

## Auditoria: O que Verificar

### 1. Classes `cva()` / Tailwind

Extraia e compare as classes de cada stack para o componente:

```bash
# React (referência)
grep -A 20 "cva(" design-system-react/src/components/ui/<slug>/*.ts 2>/dev/null
grep -A 20 "cva(" design-system-react/src/components/ui/<slug>/*.tsx 2>/dev/null

# Vue
grep -A 20 "cva(" design-system-vue/src/components/ui/<slug>/*.ts 2>/dev/null
grep -A 20 "cva(" design-system-vue/src/components/ui/<slug>/*.vue 2>/dev/null

# Svelte
grep -A 20 "cva(" design-system-svelte/src/components/ui/<slug>/*.ts 2>/dev/null
grep -A 20 "cva(" design-system-svelte/src/components/ui/*.svelte 2>/dev/null

# Basecoat
grep -A 20 "cva(" nortear-design-system/src/components/ui/<slug>/*.ts 2>/dev/null
```

**Diferenças nas classes = bug.** Copie as classes do React para as outras stacks.

### 2. Variantes disponíveis

Verifique que cada stack tem as mesmas variantes:

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  grep -oP "(?<=')[a-z]+(?=':)" design-system-$stack/src/components/ui/<slug>/*.ts 2>/dev/null | sort -u
done
```

Variante presente no React mas ausente em outra stack = bug.

### 3. Tamanhos disponíveis

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  grep -A 10 "size:" design-system-$stack/src/components/ui/<slug>/*.ts 2>/dev/null
done
```

### 4. Data attributes (`data-slot`)

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  grep "data-slot" design-system-$stack/src/components/ui/<slug>/* 2>/dev/null
done
```

Todos devem ter o mesmo `data-slot` value.

### 5. Cobertura de Stories

Verifique que todas as stacks têm as mesmas categorias:

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ls design-system-$stack/src/components/ui/<slug>*stories* 2>/dev/null || \
  ls design-system-$stack/src/components/ui/*<slug>*stories* 2>/dev/null
done
```

Categorias esperadas por componente:
- Playground (1 story interativa)
- Variantes (1 story por variante visual)
- Tamanhos (1 story por tamanho + IconOnly se aplicável)
- Estados (Disabled, Loading, Error se aplicável)
- Composições (com ícone, como link, etc.)

### 6. Acessibilidade (ARIA)

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  grep -n "aria-\|role=" design-system-$stack/src/components/ui/<slug>/* 2>/dev/null
done
```

Mesmos `role`, `aria-*` em todas as stacks.

### 7. Tokens CSS / Temas

Verifique que os temas compartilhados são importados corretamente:

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  grep -l "globals.css\|themes/" design-system-$stack/src/styles/*.css 2>/dev/null
done
```

### 8. Seções obrigatórias da docs page

Toda docs page deve ter **todas** as seguintes seções com IDs exatos. Use o React como referência canônica e verifique as demais stacks:

```bash
# Seções obrigatórias (IDs que devem existir em toda *Docs page)
REQUIRED_IDS="demonstracao anatomia quando-usar do-dont importacao variantes estados propriedades tokens acessibilidade relacionados notas analytics testes"

for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/<Slug>Docs.$ext"
  for id in $REQUIRED_IDS; do
    grep -q "id=\"$id\"" "$file" 2>/dev/null && echo "  ✓ $id" || echo "  ✗ MISSING: $id"
  done
done
```

Seção ausente = bug crítico. Adicione a seção com conteúdo equivalente ao React antes de qualquer outra correção.

### 8b. Blocos obrigatórios dentro de `quando-usar`

A seção `quando-usar` tem **4 blocos internos obrigatórios** em todas as stacks. Verifique cada um:

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/<Slug>Docs.$ext"

  # Bloco 1 — Guidelines (bg-muted/30 rounded-lg p-4)
  grep -q "usage.guidelines" "$file" 2>/dev/null && echo "  ✓ guidelines" || echo "  ✗ MISSING: guidelines block"

  # Bloco 2 — Cenários (usage.scenarios)
  grep -q "usage.scenarios" "$file" 2>/dev/null && echo "  ✓ cenários" || echo "  ✗ MISSING: cenários table"

  # Bloco 3 — UX Writing (uxWriting.title)
  grep -q "uxWriting.title" "$file" 2>/dev/null && echo "  ✓ ux writing" || echo "  ✗ MISSING: uxWriting block"

  # Bloco 4 — Use quando / Não use quando (usage.do + usage.dont)
  grep -q "usage.do.title" "$file" 2>/dev/null && echo "  ✓ do/dont cards" || echo "  ✗ MISSING: do/dont cards"
done
```

Bloco ausente = bug crítico. Adicione com conteúdo equivalente ao React.

### 9. Padrões de ícone ✓/✗ nas docs pages

Verifique que todos os ícones de certo/errado usam as classes de pill padrão (ver `docs/shared/guidelines/05-tom-de-voz.md`):

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  # Padrões problemáticos que precisam ser corrigidos:
  grep -n "font-bold text-lg.*[✓✗]\|[✓✗].*font-bold text-lg" design-system-$stack/src/components/docs/*Docs.$ext 2>/dev/null | head -5
  grep -n "bg-green-500/10\|bg-red-500/10" design-system-$stack/src/components/docs/*Docs.$ext 2>/dev/null | head -5
  grep -n "text-primary font-bold.*✓\|✓.*text-primary font-bold" design-system-$stack/src/components/docs/*Docs.$ext 2>/dev/null | head -5
done
```

Padrões corretos:
- `✓` certo/do: `inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0`
- `✗` errado/don't: mesmas classes com `bg-red-500/15 text-red-600 dark:text-red-400`
- `✓` feature/acessibilidade: `inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0`
- Em `<th>`: envolva ícone + texto em `<span class="flex items-center gap-1.5">`

### 10. Padrões de tabela nas docs pages

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  # Detectar tabelas com overflow-hidden (padrão errado — borda colada na tabela)
  grep -n "overflow-hidden shadow-sm" design-system-$stack/src/components/docs/*Docs.$ext 2>/dev/null | grep -v "border-border/60\|bg-card/50" | head -5
  # Detectar tabelas dentro de ComponentDemo (padrão errado — acumula p-10)
  grep -n "ComponentDemo" design-system-$stack/src/components/docs/*Docs.$ext 2>/dev/null | head -5
done
```

Regras (ver `docs/shared/guidelines/08-docs-pages-foundations.md` seção 3):
- Tabelas standalone: `border rounded-xl overflow-x-auto p-4 shadow-sm`
- Tabelas dentro de container externo da seção: apenas `overflow-x-auto` (sem borda própria)
- Nunca `overflow-hidden` em wrapper de tabela
- Nunca `ComponentDemo` envolvendo tabela de dados

### 11. Completude das tabelas Props e Tokens

Verifique que as seções **Propriedades** e **Tokens** seguem o padrão completo (ver `docs/shared/guidelines/08-docs-pages-foundations.md` §12 e §13):

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/<Slug>Docs.$ext"

  # Props: 5 colunas (required obrigatório)
  grep -q "props.table.required" "$file" 2>/dev/null && echo "  ✓ props: required column" || echo "  ✗ MISSING: props.table.required"

  # Props: extensibilidade
  grep -q "extensibilityTitle" "$file" 2>/dev/null && echo "  ✓ props: extensibility block" || echo "  ✗ MISSING: extensibilityTitle"

  # Tokens: 7 tokens (--ring como proxy)
  grep -q "\-\-ring" "$file" 2>/dev/null && echo "  ✓ tokens: --ring present (7 tokens)" || echo "  ✗ MISSING: --ring token (tokens table incomplete)"

  # Tokens: bloco de customização
  grep -q "customizationTitle" "$file" 2>/dev/null && echo "  ✓ tokens: customization block" || echo "  ✗ MISSING: customizationTitle"
done
```

Itens ausentes = bug de consistência. Use o React como referência para corrigir.

### 12. Conteúdo real renderizado (não placeholders)

**VERIFICAÇÃO CRÍTICA.** Cada docs page deve renderizar conteúdo real de `translations.json`, não placeholders ou mensagens de redirecionamento. Verifique:

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/<Slug>Docs.$ext"

  # Detectar placeholders genéricos — CADA UM é um bug crítico
  grep -n "Exemplo aqui\|Estrutura de subcomponentes\|Orientações de uso\|Boas práticas e antipadrões\|Exemplos de código\|Todas as variantes do componente\|Tabela de props\|Tokens CSS relevantes\|Alternativas e complementos\|Boas práticas e avisos\|Funcional, acessibilidade" "$file" 2>/dev/null && echo "  ✗ PLACEHOLDERS DETECTADOS!" || echo "  ✓ sem placeholders"

  # Detectar mensagens de redirecionamento — bug crítico
  grep -n "Documentação completa disponível na stack React\|consulte.*React\|ver documentação.*React" "$file" 2>/dev/null && echo "  ✗ REDIRECIONAMENTO PARA REACT!" || echo "  ✓ sem redirecionamento"

  # Verificar uso efetivo de translations.json — deve ter múltiplas chamadas
  count=$(grep -c "tContent\|tStore\|\bt(" "$file" 2>/dev/null || echo "0")
  echo "  Chamadas t(): $count"
  [ "$count" -lt 30 ] && echo "  ✗ POUCAS chamadas t() — conteúdo provavelmente incompleto" || echo "  ✓ número adequado de chamadas t()"

  # Verificar sanitizeHtml — deve existir se há conteúdo HTML
  grep -q "sanitizeHtml" "$file" 2>/dev/null && echo "  ✓ sanitizeHtml presente" || echo "  ✗ MISSING: sanitizeHtml (conteúdo HTML sem sanitização)"
done
```

**Placeholders detectados = bug BLOQUEANTE.** A docs page deve ser reescrita com conteúdo completo de `translations.json` antes de qualquer outra correção. Use a docs page React como referência para saber quais seções, tabelas, cards e demos devem existir.

### 13. Comparação seção-a-seção do conteúdo

Para cada seção, verifique que TODAS as stacks renderizam os mesmos dados:

```bash
# Extrair chaves de tradução usadas em cada stack
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/<Slug>Docs.$ext"

  # Seções de conteúdo — verificar que cada uma usa chaves de tradução
  # nota: 'variants' agora contém tanto descrição quanto code (DocsVariants absorveu a antiga seção Exemplos)
  for section in demonstration anatomy usage uxWriting doDont import variants states props tokens accessibility related notes analytics testes; do
    count=$(grep -c "$section\." "$file" 2>/dev/null || echo "0")
    [ "$count" -gt 0 ] && echo "  ✓ $section ($count refs)" || echo "  ✗ MISSING content: $section"
  done
done
```

**Seção faltando em uma stack mas presente no React = bug.** Adicione a seção com conteúdo equivalente.

### 15. Registro de patches sobre o upstream shadcn

**Toda divergência intencional entre `components/ui/` e o upstream (shadcn/ui, shadcn-vue, shadcn-svelte, basecoat-css) deve ter:**

1. Marker `// PATCH: <categoria> — <motivo> (ver PATCHES.md#<anchor>)` imediatamente acima da linha customizada
2. Entrada correspondente em `PATCHES.md` (raiz do repo) com diff antes/depois, motivo e instrução de verificação

Categorias permitidas: `a11y`, `i18n`, `theme`, `security`, `bugfix`.

**Quando este check dispara:** se a auditoria detectou divergência entre stacks (seções 1-7) e a **correção** envolveu adicionar classes/estrutura que o `shadcn@latest add <slug>` **não** geraria, a mudança é um patch. Não basta aplicar — precisa registrar.

**Sinais de que algo é patch (e não consistência cross-stack):**

- Adicionou classe Tailwind que não existia em nenhuma stack antes (ex: `object-cover`, `break-words`, `select-none`)
- Mudou tag HTML gerada pelo primitive (ex: `<div>` → `<section>`)
- Removeu ou substituiu regra CSS do `basecoat-css` via override
- Adicionou atributo ARIA/role que o upstream não define
- Introduziu comportamento JS (handler, effect) que o upstream não tem

**Sinais de que é só cross-stack (não é patch):**

- Copiou classes do React para Vue/Svelte/Basecoat porque já estavam no React (e estavam no upstream do React)
- Alinhou nome de variante/tamanho entre stacks
- Adicionou story ou preencheu conteúdo de docs page

**Como verificar se o arquivo de UI diverge do upstream:**

```bash
# 1. Ver o que shadcn geraria agora para o componente
npx shadcn@latest view <slug> 2>/dev/null | head -80

# 2. Comparar com o arquivo atual — qualquer classe/tag em um e não no outro é candidata a patch
```

**Se identificou patch não registrado:**

1. Leia o template em `PATCHES.md` (seção "Como adicionar uma nova entrada")
2. Adicione marker em cada arquivo afetado (4 stacks, se a divergência é consistente)
3. Acrescente uma entrada em `PATCHES.md` com anchor único (ex: `#avatar-object-cover`), diff, motivo e verificação pós-bump
4. Inclua no relatório final da auditoria uma linha: `**Patches registrados:** N novos em PATCHES.md`

**Auditoria de patches existentes (modo `all`):**

Se o argumento for `all`, percorra os markers já presentes no código e valide que cada um tem entrada viva em `PATCHES.md`:

```bash
# Buscar todos os markers PATCH no código
grep -rn "PATCH:" design-system-*/src/components/ui/ --include="*.ts" --include="*.tsx" --include="*.vue" --include="*.svelte"

# Extrair anchors referenciados e cruzar com PATCHES.md
grep -rhoP "PATCHES\.md#\K[a-z0-9-]+" design-system-*/src/components/ui/ | sort -u > /tmp/markers.txt
grep -oP "^### .*\{#\K[a-z0-9-]+" PATCHES.md > /tmp/entries.txt
diff /tmp/markers.txt /tmp/entries.txt
```

Marker no código sem entrada = bug (reportar, não deletar o marker). Entrada sem marker = patch provavelmente RESOLVIDO UPSTREAM (verificar e atualizar status em `PATCHES.md`).

---

## Correções

### Copiar classes do React

Quando encontrar divergência nas classes Tailwind:

1. Extraia as classes completas do `cva()` do React
2. Substitua as classes correspondentes na stack divergente
3. Mantenha a API do framework (props syntax, slots, events) — apenas as classes mudam

### Adicionar variante/tamanho faltando

1. Copie a definição de variante/tamanho do React
2. Adapte a syntax para o framework (Vue defineProps, Svelte $props, etc.)
3. Crie a story correspondente

### Sincronizar stories

Se uma stack tem stories que outra não tem:

1. Identifique quais stories estão faltando
2. Crie usando o padrão da stack de destino:
   - React: render function direta
   - Vue: template + args
   - Svelte: ButtonStory wrapper pattern (ver dev-svelte skill)
   - Basecoat: createElement pattern (ver dev-basecoat skill)

---

## Relatório de Saída

```
## Relatório de Consistência Cross-Stack — <component-slug>

### Classes `cva()`
| Aspecto | React | Vue | Svelte | Basecoat | Status |
|---------|-------|-----|--------|----------|--------|

### Variantes
| Variante | React | Vue | Svelte | Basecoat |
|----------|-------|-----|--------|----------|

### Tamanhos
| Tamanho | React | Vue | Svelte | Basecoat |
|---------|-------|-----|--------|----------|

### Stories
| Categoria | React | Vue | Svelte | Basecoat |
|-----------|-------|-----|--------|----------|

### Acessibilidade
| Atributo | React | Vue | Svelte | Basecoat |
|----------|-------|-----|--------|----------|

### Docs Page — Conteúdo por Seção
| Seção | React | Vue | Svelte | Basecoat |
|-------|-------|-----|--------|----------|
| Header (badges, LanguageSwitcher, h1, desc) | ✅ | ?  | ?  | ?  |
| Demonstração (demos interativos) | ✅ | ?  | ?  | ?  |
| Anatomia (lista numerada + estrutura) | ✅ | ?  | ?  | ?  |
| Quando Usar (4 blocos) | ✅ | ?  | ?  | ?  |
| Do & Don't (exemplos visuais) | ✅ | ?  | ?  | ?  |
| Importação (code blocks) | ✅ | ?  | ?  | ?  |
| Variantes (cards grid + toggle de código) | ✅ | ?  | ?  | ?  |
| Estados (tabela) | ✅ | ?  | ?  | ?  |
| Propriedades (tabelas props) | ✅ | ?  | ?  | ?  |
| Tokens (tabela + customização) | ✅ | ?  | ?  | ?  |
| Acessibilidade (lista + teclado) | ✅ | ?  | ?  | ?  |
| Relacionados (cards links) | ✅ | ?  | ?  | ?  |
| Notas (callouts) | ✅ | ?  | ?  | ?  |
| Analytics (tabela eventos) | ✅ | ?  | ?  | ?  |
| Testes (3 sub-seções) | ✅ | ?  | ?  | ?  |

### 14. Section Components Genéricos — Presença Cross-Stack

Antes de auditar docs pages individuais, verificar se os 15 containers genéricos existem em todas as stacks:

```bash
SECTIONS="DocsHeader DocsDemonstration DocsAnatomy DocsWhenToUse DocsDoDont DocsImport DocsVariants DocsStates DocsProps DocsTokens DocsAccessibility DocsRelated DocsNotes DocsAnalytics DocsTestes"

for stack in react vue svelte basecoat; do
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  dir="design-system-$stack/src/components/docs/shared/sections"
  echo "=== $stack ==="
  missing=0
  for s in $SECTIONS; do
    f="$dir/$s.$ext"
    [ -f "$f" ] && echo "  ✅ $s" || { echo "  ❌ MISSING: $s"; missing=$((missing+1)); }
  done
  [ "$missing" -gt 0 ] && echo "  ⚠️ $missing componentes ausentes — rode /docs-sections --stack $stack"
done
```

Se containers estiverem ausentes: **não auditar docs pages inline** — primeiro criar os containers com `/docs-sections`, depois os dev skills refatoram as docs pages para usá-los.

Se containers existirem: verificar que as docs pages de cada componente os estão usando (não reimplementando HTML inline):

```bash
for stack in react vue svelte basecoat; do
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/<Slug>Docs.$ext"
  echo "=== $stack ==="
  # Verificar que a docs page importa os section components
  grep -q "shared/sections/DocsDoDont\|createDocsDoDont" "$file" 2>/dev/null \
    && echo "  ✅ usa DocsDoDont do container" \
    || echo "  ⚠️ DocsDoDont: pode estar reimplementando inline — verificar"
done
```

### Do & Don't — Layout Cross-Stack

**Verificação obrigatória** — este layout é gerado de forma errada com frequência.

```bash
for stack in react vue svelte basecoat; do
  echo "=== $stack ==="
  ext="tsx"; [ "$stack" = "vue" ] && ext="vue"; [ "$stack" = "svelte" ] && ext="svelte"; [ "$stack" = "basecoat" ] && ext="ts"
  file="design-system-$stack/src/components/docs/<Slug>Docs.$ext"

  # ✅ Correto: dois grids separados (um por pair1, outro por pair2)
  grids=$(grep -c "grid grid-cols-1 md:grid-cols-2\|grid grid-cols-2" "$file" 2>/dev/null || echo "0")
  echo "  Grids encontrados na seção do-dont: verificar manualmente (esperado ≥2 dentro do section#do-dont)"

  # ❌ Erro: loop map/v-for/each gerando pares em colunas
  grep -n "v-for.*in 2\|v-for.*\[1.*2\]\|#each \[1.*2\]\|\[1.*2\]\.map" "$file" 2>/dev/null \
    | grep -i "dont\|doDont\|do-dont\|pair" \
    && echo "  ✗ LOOP DETECTADO em do-dont — layout provavelmente invertido (DO|DO / DON'T|DON'T)" \
    || echo "  ✓ sem loop de pares em do-dont"

  # ❌ Erro: ausência do card wrapper
  grep -A 5 'id="do-dont"' "$file" 2>/dev/null | grep -q "p-10.*border.*rounded-xl\|flex items-center justify-center p-10" \
    && echo "  ✓ card wrapper presente" \
    || echo "  ✗ MISSING card wrapper em do-dont (flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm)"
done
```

**Layout correto**: dentro de `section#do-dont`, deve haver:
1. Um `div.flex.items-center.justify-center.p-10...` como card wrapper
2. Dentro: `div.space-y-8.w-full`
3. Dois `div.grid.grid-cols-*` separados (um por par) — **nunca** um grid com iteração sobre pares
4. Cada grid: coluna DO (esquerda) + coluna DON'T (direita) com preview visual + `italic px-1` abaixo

**Bug específico**: `v-for="i in 2"` / `{#each [1,2] as i}` / `[1,2].map()` em um único grid produz DO|DO em cima e DON'T|DON'T em baixo — visualmente errado.

### Docs Page — Problemas Bloqueantes
| Stack | Problema | Ação |
|-------|----------|------|
(Placeholders genéricos, redirecionamento para React, seções faltantes, layout do-dont invertido)

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
