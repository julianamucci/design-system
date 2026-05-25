---
description: Dev Basecoat — cria stories e exemplos para componentes Vanilla TS/HTML seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Basecoat — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Vanilla TypeScript + basecoat-css para design systems. Crie stories, docs pages e factories para componentes Basecoat.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente

---

## Leituras obrigatórias (antes de começar)

1. **`_dev-shared.md`** — padrões compartilhados das 4 stacks. **Esta skill complementa com o que é específico de Basecoat (vanilla TS).**
2. UI primitive: `nortear-design-system/src/components/ui/<slug>.ts`
3. `docs/shared/content/<slug>/translations.json`
4. `.pipeline-context/<slug>.md` (se existir)

---

## Stack Técnica

- **Vanilla TypeScript** (sem framework)
- **Storybook 10** (`@storybook/html-vite`)
- **Tailwind CSS 4** + **basecoat-css** (classes semânticas)
- **lucide** (ícones vanilla)
- HTML nativo + `document.createElement`

---

## Tokenização de Dimensões

Basecoat usa **basecoat-css** para componentes primitivos — dimensões já estão tokenizadas via `basecoat-theme-overrides.css`. Nenhuma intervenção nos UI primitives.

Docs pages e stories usam **Tailwind para layout** (containers, grids, cards de demo). Nessas partes, evite `h-8`, use `h-(--height-default)`. Ver `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

---

## Padrões Basecoat-specific

### Render de Story

`render` recebe `(args)` e constrói o DOM com base nos valores de `args`. Props de montagem não são problema — `render` re-executa a cada mudança de control:

```ts
render: (args) => {
  const root = createCollapsible(args);
  const trigger = root.querySelector('[data-slot="collapsible-trigger"]');
  if (trigger && args.disabled) trigger.setAttribute('disabled', '');
  return root;
}
```

`disabled` deve ser passado explicitamente ao filho interativo (trigger/button) — root frequentemente não propaga.

### Implementando UI primitive

Se factory ainda não existe, criar `src/components/ui/<slug>.ts`:

```ts
const ROOT = 'rounded-xl border bg-card text-card-foreground shadow';

export type CardOptions = { class?: string };

export function createCard(options: CardOptions = {}): HTMLDivElement {
  const el = document.createElement('div');
  el.className = options.class ? `${ROOT} ${options.class}` : ROOT;
  return el;
}
```

**Regras:**
1. Prefira classe semântica basecoat-css (`.btn`, `.badge`, `.alert`, `.card`, `.input`) como base.
2. Sem classe semântica → extraia do `cva()` React equivalente.
3. ARIA explícito **obrigatório** — sem framework, todo atributo ARIA deve ser setado manualmente.
4. Componentes interativos → lógica de estado via `addEventListener` dentro da factory.
5. Para padrão complexo, consulte `accordion.ts` como referência.

### `createElement` + `textContent` (NUNCA innerHTML com dinâmico)

```ts
// ✅ CORRETO — sem risco XSS
const span = document.createElement('span');
span.textContent = item.label;  // textContent escapa automaticamente
trigger.appendChild(span);

// ❌ ERRADO — XSS risk
trigger.innerHTML = `<span>${item.label}</span>`;
```

**Exceção**: HTML literal interno (sem variáveis dinâmicas) pode usar innerHTML, mas marca de PATCH no código:

```ts
// PATCH: security — CHEVRON_SVG é string literal segura
const chevronWrapper = document.createElement('span');
chevronWrapper.innerHTML = CHEVRON_SVG;
trigger.appendChild(chevronWrapper.firstElementChild!);
```

### sanitizeHtml para conteúdo de translations

```ts
anatomyContent.innerHTML = sanitizeHtml(`
  <ol class="space-y-3 list-none p-0 m-0">
    ${[1, 2, 3].map(i => `<li>${t(`anatomy.item${i}`)}</li>`).join('')}
  </ol>
`);
```

---

## Imports da Docs Page

```ts
import { sanitizeHtml } from '@/lib/sanitize-html';
import { t, getLocale, subscribe, onLocaleChange } from '@/lib/i18n';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import componentTranslations from '@shared/content/<slug>/translations.json';

// Section containers (15) — todos de @/components/docs/shared/sections/
import { createDocsHeader } from '@/components/docs/shared/sections/DocsHeader';
import { createDocsPageLayout } from '@/components/docs/shared/sections/DocsPageLayout';
import { createDocsDemonstration } from '@/components/docs/shared/sections/DocsDemonstration';
// ... + 12 demais (createDocsAnatomy, createDocsWhenToUse, createDocsDoDont,
//      createDocsImport, createDocsVariants, createDocsStates, createDocsProps,
//      createDocsTokens, createDocsAccessibility, createDocsRelated, createDocsNotes,
//      createDocsAnalytics, createDocsTestes)
```

Skeleton da docs page:

```ts
export function create<Slug>Docs(): HTMLElement {
  const cleanups: Array<() => void> = [];
  const container = document.createElement('div');

  function rerenderTexts() {
    const locale = getLocale();
    const seo = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: '<slug>',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/<categoria>' },
        { name: t('title') },
      ],
    });
    cleanups.push(seo);

    track('docs_page_view', {
      component_name: '<slug>',
      locale,
      page_title: `${t('title')} · Design System`,
    });

    // Monta todas as seções aqui ...
  }

  rerenderTexts();
  cleanups.push(onLocaleChange(rerenderTexts));

  // IntersectionObserver para active section + docs_section_viewed
  // ...

  return container;
}
```

> **`structureCode` SEMPRE de `t('anatomy.structureCode')`** — não hardcode.

---

## Documentação de Divergências Idiomáticas

Basecoat factory custom frequentemente NÃO suporta features das libs upstream (submenu, CheckboxItem nativo, RadioItem nativo, props específicas de delays/portals).

**3 camadas obrigatórias** (ver `_dev-shared.md`):
1. `translations.notes.item1` — descrever divergência
2. DocsProps notes inline — para cada prop não suportada
3. Story afetada (se omitida): `parameters.docs.description.component` com nota explícita

`navigation-menu` e `menubar` Basecoat são referências exemplares.

---

## Audit + Commit

Veja `_dev-shared.md` (Audit Inline + Commit). Mensagem: `skill(dev-basecoat): $ARGUMENTS`.
