---
description: Padrões compartilhados pelas dev-skills (react/vue/svelte/basecoat). Não invoque diretamente — leia em conjunto com a dev-<stack>.md específica.
---

# Padrões Compartilhados — Dev Skills

> Este arquivo contém regras idênticas para todas as 4 stacks. Cada `dev-<stack>.md` complementa com o que é stack-specific (sintaxe, lib upstream, hooks idiomáticos).

---

## Regra Central — Sempre use componentes reais

Stories e docs pages **NUNCA** recriam variantes com HTML/JSX/Tailwind inline. Sempre importe e use o componente real de `@/components/ui/<slug>`.

---

## Leituras obrigatórias antes de criar arquivos

Em paralelo:
1. UI primitive da stack: `design-system-<stack>/src/components/ui/<slug>.<ext>` (ou `<slug>/index.<ext>`)
2. `docs/shared/content/<slug>/translations.json` — fonte única de conteúdo
3. `.pipeline-context/<slug>.md` (se existir) — contexto preparado pelo pipeline

Para padrão de docs page, consulte `AlertDocs.<ext>` da mesma stack **só se precisar** — não leia upfront.

---

## Regras Anti-Boilerplate

- Apenas `<slug>.stories.<ext>` (story principal) carrega `tags: ['autodocs']`. Sub-stories nunca.
- Docs page injetada via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` apenas no arquivo principal.
- Sub-stories têm apenas `title`, `component`, `parameters.layout`, `parameters.docs.description.component`, `parameters.controls: { disable: true }`.
- Categorias de sub-story dependem da categoria do componente — overlays de confirmação não têm `-variantes` nem `-tamanhos`.

---

## Tokenização de Dimensões

**Proibido** classes hardcoded de altura/size em UI, stories e docs:

- ❌ `h-8`, `h-9`, `h-10`, `size-6`, `size-8`
- ✅ `h-(--height-default)`, `h-(--height-sm)`, `h-(--height-lg)`, `size-(--size-default)`

Exceções: `px-*`/`gap-*`/`py-*` (spacing), `[&_svg]:size-4` (ícones decorativos), `min-h-16` (Textarea). Tabela completa em `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

---

## Artefatos a Criar (todas as stacks)

| Arquivo | Conteúdo |
|---------|----------|
| `<slug>.stories.<ext>` | Playground + `tags: ['autodocs']` + `withAutoDocsTab` + play functions |
| `<slug>-variantes.stories.<ext>` | Uma story por variante (sem play functions complexas) |
| `<slug>-tamanhos.stories.<ext>` | Uma story por tamanho (se aplicável) |
| `<slug>-estados.stories.<ext>` | Disabled, Loading, Error — com play functions |
| `<slug>-composicoes.stories.<ext>` | Com ícone, asChild, em formulário etc. |
| `<Slug>Docs.<ext>` | Docs page completa com todas as 15 seções |

---

## Section Containers — Use Sempre

A docs page é composta exclusivamente por section containers + componentes reais de `@/components/ui/`. **Nunca** escreva JSX/template/createElement inline replicando layout de seção.

Containers em `design-system-<stack>/src/components/docs/shared/sections/`. Se ausentes, rodar `/docs-sections --stack <stack>` antes.

Use `DocsPageLayout` para o layout de duas colunas com sidebar sticky — não monte `flex gap-16` manualmente. Previews visuais (DoDont, Variants, Demonstration) são passados como props/children.

### Do & Don't — bug comum

`DocsDoDont` recebe pares de previews. **Nunca** use `[1,2].map()` em um único grid — produz DO|DO em cima e DON'T|DON'T em baixo. O container monta dois grids separados corretamente.

---

## Docs Page — Seções Obrigatórias (15)

Toda docs page renderiza TODAS estas seções com conteúdo real de `translations.json`. **Nunca** use placeholders ("Exemplo aqui.", "Estrutura...").

1. **Header** — badges (category, type), `<LanguageSwitcher />`, h1, description
2. **Demonstração** (`id="demonstracao"`) — demos interativos com componente real
3. **Anatomia** (`id="anatomia"`) — lista numerada + bloco de estrutura. **`structureCode` SEMPRE de `t('anatomy.structureCode')` — nunca hardcoded**
4. **Quando Usar** (`id="quando-usar"`) — 4 blocos: guidelines, cenários, UX Writing, Do/Don't cards
5. **Do & Don't** (`id="do-dont"`) — via `DocsDoDont` com previews reais
6. **Importação** (`id="importacao"`) — blocos de código
7. **Variantes** (`id="variantes"`) — cards com preview + toggle de código
8. **Estados** (`id="estados"`) — tabela de estados
9. **Propriedades** (`id="propriedades"`) — tabelas de props completas
10. **Tokens** (`id="tokens"`) — tabela de tokens CSS + customização
11. **Acessibilidade** (`id="acessibilidade"`) — lista + cards de teclado
12. **Relacionados** (`id="relacionados"`) — grid de cards com links
13. **Notas** (`id="notas"`) — callouts. **Documentar divergências idiomáticas Basecoat aqui (notes.item1)**
14. **Analytics** (`id="analytics"`) — tabela de eventos GA4
15. **Testes** (`id="testes"`) — 3 sub-seções: funcional, acessibilidade, visual

---

## SEO/GEO Obrigatório

`useSeoEffect`/`applySeo` deve passar **todos** os campos:

- `title`: `tContent('seo.title')`
- `description`: `tContent('seo.description')`
- `locale`: reativo
- `componentSlug`: `'<slug>'`
- `aiSummary`: `tContent('seo.aiSummary')`
- `aiEntities`: `tContent('seo.aiEntities')`
- `aiIntent`: `tContent('seo.aiIntent')` (`'informational'` | `'navigational'`)
- `breadcrumb`: `[{name:'Components',item:'/components'}, {name:tContent('category'),item:'/components/<categoria>'}, {name:tContent('title')}]`

**`breadcrumb` usa `tContent('category')` dinâmico — NUNCA hardcode 'Form'/'Navigation'/etc.**

---

## Analytics Obrigatório na Docs Page

- `track('docs_page_view', { component_name, locale, page_title })` no mount, reativo ao locale
- IntersectionObserver chamando `track('docs_section_viewed', { section_id, component_name, locale })` em cada seção

---

## Controls da Story Playground

A story `Playground` deve ter controls funcionais visíveis no painel.

**Regras:**
- `meta` com `argTypes` para ao menos 1 control por prop relevante
- Componentes sem props visuais: expor props de comportamento (`loop`, `shouldFilter`, `filter`)
- **Props de montagem** (`defaultOpen`, `initialValue`): usar `key` derivado do arg para forçar re-mount quando control muda
- **`disabled`**: passar explicitamente ao filho interativo (Trigger/Button), não só ao root — root frequentemente não propaga visual de disabled
- Sem props controláveis: `parameters.controls: { disable: true }` com justificativa

---

## Play Functions

```ts
import { fn, userEvent, within, expect } from 'storybook/test';

play: async ({ canvasElement, step, args }) => {
  const canvas = within(canvasElement);
  await step('clique dispara callback', async () => {
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  });
};
```

- Step descriptions em **português**
- `fn()` nos args para callbacks testáveis
- `userEvent` (não `fireEvent`)
- `pointerEventsCheck: 0` ao clicar em elemento disabled

**Sub-stories (variantes/estados/composicoes) também precisam de play function** (mesmo simples — verifica role, classes, atributos). Sem play em sub-story = violação `substory_no_play` no audit.

---

## Regras Críticas de Renderização

### Blocos de código — nunca `<pre>`

```tsx
// ✅ CORRETO
<div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code className="whitespace-pre">{`...`}</code>
</div>

// ❌ ERRADO
<pre><code>...</code></pre>
```

Exceção: diagramas ASCII em `anatomy.structureCode` podem usar `<pre>` dentro de `<div className="overflow-x-auto">`.

### Tabelas — wrapper obrigatório

```tsx
// ✅ card com p-4 e overflow-x-auto
<div className="rounded-lg border p-4 shadow-sm overflow-x-auto">
  <table className="w-full text-sm">...</table>
</div>
```

Primeira coluna da tabela de estados: `font-medium` simples, nunca badge/pill.

### HTML dinâmico — sempre sanitizar

Sempre passar conteúdo de `translations.json` por `sanitizeHtml()` antes de renderizar como HTML:
- React: `dangerouslySetInnerHTML={{ __html: sanitizeHtml(t(...)) }}`
- Vue: `v-html="sanitizeHtml(t(...))"`
- Svelte: `{@html sanitizeHtml(t(...))}`
- Basecoat: `el.innerHTML = sanitizeHtml(t(...))` (apenas com sanitizeHtml; ou createElement + textContent quando possível)

**Basecoat: NUNCA `innerHTML` com string interpolada de fonte dinâmica sem sanitize. Preferir `createElement` + `textContent`.**

---

## Containment para Portais (overlays)

Componentes que renderizam Content em portal (Dialog, DropdownMenu, Popover, Tooltip, HoverCard, Sheet, Drawer, Sonner): **sempre** envolver previews em wrapper com `contain: layout` para confinar fixed positioning ao container do Storybook.

- React: `style={{ contain: 'layout' }}` no wrapper
- Vue/Svelte: `style="contain: layout"`
- Basecoat: `wrapper.style.contain = 'layout'`

Ver `PATCHES.md#sidebar` para racional CSS Containment.

---

## Trigger asChild + Button

Componentes com Trigger (DropdownMenuTrigger, DialogTrigger, etc.) devem usar `asChild` (React/Vue) ou `child` snippet (Svelte) com `<Button>` para evitar `<button><button>` aninhado (NestedInteractive ARIA violation).

```tsx
// ✅ CORRETO
<DropdownMenuTrigger asChild>
  <Button>Abrir</Button>
</DropdownMenuTrigger>

// ❌ ERRADO — gera <button><button>
<DropdownMenuTrigger>
  <Button>Abrir</Button>
</DropdownMenuTrigger>
```

---

## Documentação de Divergências Idiomáticas (Basecoat)

Quando a factory custom Basecoat **não suporta** uma feature da lib upstream (submenu, CheckboxItem, RadioItem, props específicas), documentar em **3 camadas**:

1. `translations.notes.item1` — descrever divergência
2. DocsProps notes inline — para cada prop não suportada
3. Story afetada (se omitida): nota explícita em `parameters.docs.description.component`

Ver `navigation-menu` e `menubar` como referências exemplares.

---

## Audit Inline — antes de commitar

```bash
node scripts/audit.mjs <slug> --category security,performance,analytics,quality --json
```

Para cada violação da sua stack, corrija ANTES do commit. Se não puder corrigir (exige mudar UI primitive), inclua no commit message:
```
ciência: <rule> em <file> — <motivo>
```

---

## Checklist Final

- [ ] `min-w-0` no container de conteúdo (sem ele tabelas e code blocks transbordam)
- [ ] `sanitizeHtml()` em todo HTML dinâmico
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>` (exceto ASCII diagrams)
- [ ] `useSeoEffect`/`applySeo` COMPLETO com aiSummary/aiEntities/aiIntent/breadcrumb
- [ ] `breadcrumb` usa `tContent('category')` — NUNCA hardcode
- [ ] `track('docs_page_view')` reativo ao locale
- [ ] `<LanguageSwitcher />` no header
- [ ] Todas as 15 seções com conteúdo real (sem placeholders)
- [ ] `structureCode` lê de `t('anatomy.structureCode')` — NÃO hardcoded
- [ ] Sub-stories têm play function + `controls.disable: true`
- [ ] Wrappers com `contain: layout` em previews que abrem portal
- [ ] Trigger sempre `asChild` + `Button` (evita NestedInteractive)
- [ ] Audit inline limpo antes do commit
- [ ] Nenhum `console.log` ou `TODO` nos arquivos entregues

---

## Commit de Rastreabilidade

```bash
git add -A
git commit -m "skill(dev-<stack>): $ARGUMENTS"
```

Se nenhum arquivo foi criado/modificado, não fazer commit.
