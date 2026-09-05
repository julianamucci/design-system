---
description: Especialista em SEO+GEO — garante metatags, JSON-LD, Open Graph e tags de IA generativa em todas as docs pages
argument-hint: <component-slug> [stack]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em SEO + GEO

Você é um especialista em SEO e GEO para design systems. Seu trabalho é garantir que as docs pages tenham metatags corretos para buscadores tradicionais e IAs generativas.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `vanilla`, `angular` ou `all` (padrão: `all`)

---

## Contexto Arquitetural

O projeto usa **Storybook** como interface principal. Os `*Docs` rodam dentro de um **iframe**. O hook `useSeoEffect` detecta o contexto de iframe e escreve metatags no **documento pai** (manager do Storybook), garantindo que título da aba e metatags sejam atualizados corretamente.

**Metatag e `lang` não têm o mesmo destino.** Title, description, OG, JSON-LD e canonical descrevem a **página hospedeira** — vão para o documento pai, e é isso que buscador e crawler leem. O `lang` descreve o documento **em que o texto está**, e quem o lê é o leitor de tela: dentro do Storybook isso é o `iframe.html`, servido como `<html lang="en">`. Escrever `lang` só no pai deixa toda a prosa em português com pronúncia inglesa — WCAG 3.1.1, nível A. O idioma vai nos **dois** documentos. A regra `document_lang_so_no_pai` do `audit.mjs` cobra isso; ver `docs/shared/guidelines/01-acessibilidade.md` §"Idioma do documento".

O GA4 vive **apenas no manager** (`manager-head.html`, nunca em `preview-head.html`). `track()` encaminha para `window.top.gtag`. `useSeoEffect` dispara `page_view` no GA4 do manager a cada troca de story/locale.

### Assinatura do hook

```tsx
// React
useSeoEffect({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale,                    // reativo ao locale atual
  componentSlug: '<slug>',   // usado para hreflang e canonical URL
});

// Vue — requer computed() para reatividade
useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value,
  componentSlug: '<slug>',
})));

// Svelte / Vanilla — applySeo() dentro de $effect ou após montar
applySeo({ title, description, locale: $locale, componentSlug: '<slug>' });
```

O hook gerencia automaticamente: `document.title`, `<meta description>`, Open Graph, JSON-LD (`TechArticle` + `SoftwareSourceCode`), `hreflang` para pt-BR/en/es e `page_view` no GA4.

Com title/description/locale/componentSlug corretos, o **conteúdo** de tudo isso sai correto — mas não conclua daí que o hook está certo. O que ele faz com esses quatro valores é responsabilidade desta skill também: foi confiando nessa frase que o `lang` no documento errado sobreviveu a todas as auditorias, com os quatro parâmetros impecáveis. Rode `node scripts/audit.mjs --all --category quality --json` e leia a chave `_infra`.

---

## Elementos SEO Obrigatórios

### Title (≤60 chars)

Formato: `{Componente} — {Categoria} · Design System`

- `Alert — Feedback · Design System`
- `Input — Formulários · Design System`

Regras: componente em PascalCase, categoria após o dash, sempre terminar com `· Design System`.

### Description (≤155 chars)

Formato: `Documentação do {Componente}: {lista de features principais}.`

- Iniciar com "Documentação do" (pt-BR), "Documentation for" (en), "Documentación del" (es)
- Incluir números concretos (variantes, tamanhos, estados)
- Sem keyword stuffing

### Seção `seo` no `translations.json`

Obrigatória nos 3 idiomas:

```json
{
  "pt-BR": {
    "seo": {
      "title": "Alert — Feedback · Design System",
      "description": "Documentação do Alert: 2 variantes (default, destructive), composição com ícone, título e descrição, acessibilidade WCAG.",
      "aiSummary": "Componente Alert com 2 variantes visuais, composição via AlertTitle/AlertDescription, suporte a ícones Lucide e conformidade WCAG 2.2 AA.",
      "aiEntities": "Alert, React, base-ui, CSS .nds-*, WCAG 2.2, class-variance-authority",
    }
  }
}
```

`aiSummary` deve ser específico (não genérico) — vira o `abstract` do JSON-LD TechArticle; `aiEntities` vira `about`.

---

## Processo de Auditoria

### Passo 0 — Audit determinístico

**Se o prompt já trouxe `.pipeline-context/scan-<slug>.json`** — é a pipeline
chamando, o script já rodou no Passo 4 dela. Filtre `category: "seo"` e **não
rode de novo**.

**Se não trouxe** — foi invocação direta. Rode:

```bash
node scripts/audit.mjs <slug> --category seo --json
```

A categoria `seo` **não existia até 2026-09-05**, e é por isso que este passo é
novo. O `runAudit` despachava por `security`, `performance`, `analytics` e
`quality`; esta skill conferia limite de caractere em CHECKBOX manual, o que
significa que nada media o assunto entre uma invocação e outra — e ela não é
invocada desde abril de 2026. O backlog que apareceu quando o runner nasceu:
**21 `title` acima de 60 e 93 `description` acima de 155**, em 84 componentes.

| Regra | O que pega |
|---|---|
| `seo_title_longo` | `seo.title` acima de 60 caracteres, por locale. O Google trunca por volta daí: não é penalidade, é a frase cortada no meio para quem procura |
| `seo_description_longo` | `seo.description` acima de 155, por locale. Mesma mecânica, no trecho abaixo do link |
| `seo_title_suffix` | `· Design System` escrito no JSON — o `useSeoEffect` já acrescenta, e o resultado é o sufixo duplicado |
| `manager_head_de_outra_stack` | o `manager-head.html` de uma stack anuncia OUTRA. Sai sob `_infra`, é por stack e nasce de cópia. Medido em 2026-09-05: o do Angular era o do Vanilla palavra por palavra — `description`, `og:title` e `og:description` dizendo "componentes Vanilla TS", e `keywords` com "vanilla" duas vezes, num Storybook de Angular |
| `dead_lib_in_infra` (em `.storybook/*.html`) | lib morta nos metas. Quatro stacks anunciavam "construídos com Tailwind CSS" — lib que saiu do projeto e nunca deve voltar a ser ensinada aqui |

**As duas últimas são a lição de escopo desta skill.** O Passo 4 daqui abria o
`manager-head.html` e fazia UM grep (`googletagmanager.com`) — e o caminho
estava escrito sem o ponto (`nortear-design-system-*/storybook/`), então nem
esse casava. Três leitores diferentes abriam aquele arquivo medindo uma linha
cada: este, o `measurement_id_committed` e o `ga4_in_preview_head`. **Arquivo
lido por regra que mede uma linha é arquivo não auditado.**

O script julga forma. Esta skill julga **conteúdo**: se o título diz o que a
página é, se a descrição vende o componente certo, se o `aiSummary` descreve
este componente e não a categoria dele.

---

### Passo 1 — Coletar em paralelo

Dispare em paralelo no mesmo turno:

- `Read` de `docs/shared/content/<slug>/translations.json`
- `Glob` de `nortear-design-system-react/src/components/docs/*<Slug>Docs.tsx`
- `Glob` de `nortear-design-system-vue/src/components/docs/*<Slug>Docs.vue`
- `Glob` de `nortear-design-system-svelte/src/components/docs/*<Slug>Docs.svelte`
- `Glob` de `nortear-design-system-vanilla/src/components/docs/*<Slug>Docs.ts`
- `Glob` de `nortear-design-system-angular/src/components/docs/*<Slug>Docs.ts`

Depois leia as docs pages encontradas (em paralelo) para verificar o `useSeoEffect`.

### Passo 2 — Verificar `translations.json`

- [ ] Seção `seo` existe nos 3 idiomas (pt-BR, en, es)
- [ ] `title` ≤60 chars em cada idioma
- [ ] `description` ≤155 chars em cada idioma
- [ ] `aiSummary` presente e específico ao componente
- [ ] `aiEntities` lista tecnologias reais do projeto

### Passo 3 — Verificar docs pages

Para cada stack no escopo:

- [ ] `useSeoEffect` / `applySeo` é chamado com parâmetros reativos ao locale
- [ ] `title` e `description` vêm de `tContent('seo.title')` / `tContent('seo.description')` — não hardcoded
- [ ] `_infra` do `audit.mjs --category quality` limpo para esta stack — inclui `document_lang_so_no_pai`, que é sobre o hook, não sobre a página
- [ ] `componentSlug` está correto (kebab-case, match com a pasta do componente)
- [ ] Vue: recebe `computed()` (não objeto literal — quebraria reatividade ao trocar locale)
- [ ] Svelte: chamado dentro de `$effect()` com `return cleanup`

### Passo 4 — Metas da stack (`.storybook/manager-head.html`)

Não é condicional, e não é sobre GA4. Este arquivo é servido em **toda página**
do Storybook publicado — é o que buscador e prévia de link leem antes de
qualquer docs page. O `useSeoEffect` cuida do `title`/`description` **por
página**; estes metas são a stack se apresentando, e ninguém os olhava.

Nas cinco, confira e corrija:

- [ ] `description` e `keywords` nomeiam a **própria** stack e a lib headless
      **dela** — react/base-ui, vue/reka-ui, svelte/bits-ui, angular/radix-ng,
      vanilla/typescript. O `manager_head_de_outra_stack` cobre o pertencimento;
      a lib certa é julgamento seu
- [ ] nenhuma lib morta (`dead_lib_in_infra` varre `.storybook/*.html`)
- [ ] `og:title` e `og:description` acompanham — no Angular eles diziam
      "Vanilla" e passaram por todas as rodadas
- [ ] sem termo repetido em `keywords` (o vanilla listava "vanilla" duas vezes)

Infraestrutura GA4, quando houver sintoma (todos os eventos como `/iframe.html`):

```
Grep "googletagmanager.com" em nortear-design-system-*/.storybook/manager-head.html → deve existir
Grep "googletagmanager.com" em nortear-design-system-*/.storybook/preview-head.html → deve estar ausente
Grep "window.top" em nortear-design-system-*/src/lib/analytics.ts → deve existir
Grep "page_view" em nortear-design-system-*/src/lib/use-seo.ts → deve existir
```

O `.storybook` leva ponto. Sem ele os quatro greps varrem caminho inexistente e
voltam vazios — que é indistinguível de "conferido, tudo certo", e foi o estado
desta skill até 2026-09-05.

### Passo 5 — Corrigir (fix-mode é o padrão)

`--audit` é read-only. Sem ele, **corrija**; não anote para depois.

**Encurtar `title` e `description` é reescrever, não truncar.** Cortar no
limite produz frase sem verbo, e o campo passa a ser pior que o longo. Regras:

- o `title` nomeia o componente e a categoria, nessa ordem, e para aí — o
  `useSeoEffect` já acrescenta `· Design System`, que conta no limite do
  navegador mas não no do JSON
- a `description` diz o que o componente faz e para quem, numa frase. Enumeração
  de props é o que mais estoura os 155: `provider, trigger, content, arrow,
  posicionamento, delay e suporte WCAG` é lista de anatomia, e a anatomia já tem
  seção própria na página
- **os três locales são reescritos juntos.** Pt-BR curto e en longo é o mesmo
  componente com duas promessas, e o `hreflang` aponta um para o outro
- nada de abreviação nem de corte de acento para caber

Ao mexer no `translations.json`, releia o Passo 0 depois: é o único portão que
mede o resultado.

---

## Regras Absolutas

- **NUNCA** hardcode metatags — sempre use `useSeoEffect` / `applySeo`
- **NUNCA** exceda os limites de caracteres (60 title, 155 description)
- **SEMPRE** 3 idiomas — SEO é por locale
- **SEMPRE** `locale` como dependência reativa (não estático)
- Title e description devem soar naturais em cada idioma (não tradução literal)

---

## Saída Esperada

1. Seção `seo` adicionada/corrigida no `translations.json` (3 idiomas)
2. `useSeoEffect`/`applySeo` implementado/corrigido em cada docs page no escopo
3. Relatório de conformidade:

```
| Stack    | seo no JSON | title ≤60 | desc ≤155 | useSeoEffect reativo |
|----------|-------------|-----------|-----------|----------------------|
| React    | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
| Vue      | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
| Svelte   | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
| Vanilla | ✅/❌       | ✅/❌     | ✅/❌     | ✅/❌               |
```

---

## Commit de Rastreabilidade

Ao finalizar todas as alterações, execute:

```bash
# Stage SÓ os seus caminhos. `git add -A` varre o que outra sessão
# deixou na árvore — já levou 55 arquivos de outra stack para um commit,
# e nesta casa reincidiu seis vezes numa campanha só. Liste os caminhos:
git commit -- <caminhos exatos que você tocou> -m "skill(seo-geo): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
