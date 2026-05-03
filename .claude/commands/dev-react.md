---
description: Dev React — cria stories, docs pages e exemplos para componentes React seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev React — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em React para design systems. Crie stories, docs pages e exemplos de documentação para componentes React.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`, `input`)

---

## Leituras obrigatórias (antes de começar)

1. **`_dev-shared.md`** (`.claude/commands/_dev-shared.md`) — padrões compartilhados das 4 stacks (regras, 15 seções, SEO, audits, checklist). **Esta skill complementa com o que é específico de React.**
2. UI primitive: `design-system-react/src/components/ui/<slug>.tsx` (ou `<slug>/index.tsx`)
3. `docs/shared/content/<slug>/translations.json`
4. `.pipeline-context/<slug>.md` (se existir)

---

## Stack Técnica

- **React 19** + TypeScript
- **Storybook 10** (`@storybook/react-vite`)
- **Tailwind CSS 4** + **class-variance-authority**
- **base-ui/react** (primitivos a11y) + **lucide-react** (ícones)
- **Zustand** (i18n store)

---

## Imports da Docs Page

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/<slug>/translations.json';

// Section containers (15) — todos de @/components/docs/shared/sections/
import { DocsHeader, DocsPageLayout, DocsDemonstration, DocsAnatomy, DocsWhenToUse,
  DocsDoDont, DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
  DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes
} from '@/components/docs/shared/sections';
```

Hooks reativos:

```tsx
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations);

useSeoEffect({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale,
  componentSlug: '<slug>',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/<categoria>' },
    { name: tContent('title') },
  ],
});

useEffect(() => {
  track('docs_page_view', { component_name: '<slug>', locale, page_title: `${tContent('title')} · Design System` });
}, [locale, tContent]);
```

---

## Padrões React-specific

### Render de Story Playground

```tsx
export const Playground: Story = {
  args: { onClick: fn(), variant: 'default' },
  render: (args) => <Button {...args}>Botão</Button>,
};
```

### Props de montagem precisam de key

```tsx
// ✅ CORRETO — re-monta quando control muda
<Collapsible key={String(args.defaultOpen)} {...args}>
```

### `disabled` propagado ao filho interativo

```tsx
// ✅ CORRETO — Trigger e Button ambos
<CollapsibleTrigger asChild disabled={args.disabled}>
  <Button disabled={args.disabled}>...</Button>
</CollapsibleTrigger>
```

### `dangerouslySetInnerHTML` em compostos base-ui/Radix

Componentes que renderizam `{children}` internamente não aceitam `dangerouslySetInnerHTML` direto — use `<span>` wrapper:

```tsx
// ✅ CORRETO
<AccordionContent>
  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('content')) }} />
</AccordionContent>
```

### Props booleanas inválidas em compostos

```tsx
// ✅ omite com undefined
<Accordion type="single" collapsible={mode !== 'multiple' ? true : undefined} />

// ❌ vaza atributo DOM inválido
<Accordion type="single" collapsible={false} />
```

---

## IntersectionObserver para `docs_section_viewed`

```tsx
function useActiveSection(ids: string[], onSectionChange?: (id: string) => void) {
  const [activeId, setActiveId] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
          onSectionChange?.(entry.target.id);
          break;
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids, onSectionChange]);
  return activeId;
}
```

---

## Audit + Commit

Veja `_dev-shared.md` (Audit Inline + Commit). Mensagem: `skill(dev-react): $ARGUMENTS`.
