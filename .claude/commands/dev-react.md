---
description: Dev React — cria stories, docs pages e exemplos para componentes React seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev React — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em React para design systems. Seu trabalho é criar stories, docs pages e exemplos de documentação para componentes React, seguindo rigorosamente os padrões estabelecidos no projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`, `input`)

---

## Leituras obrigatórias — leia em paralelo antes de criar qualquer arquivo

Dispare estas 2 leituras no mesmo turno:

1. `design-system-react/src/components/ui/<slug>.tsx` (ou `<slug>/index.tsx`) — o componente a documentar
2. `docs/shared/content/<slug>/translations.json` — todo o conteúdo vem daqui

Se precisar de referência de padrão específico (estrutura de docs page, play function, seção específica), consulte `design-system-react/src/components/docs/AlertDocs.tsx` pontualmente — não leia upfront.

---

## Regra Central — Sempre use componentes reais

**Stories e docs pages NUNCA recriam variantes com JSX ou classes Tailwind inline.** Importe e use os componentes de `@/components/ui/<slug>`:

```tsx
// ✅ CORRETO
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

<Alert variant="destructive">
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>Verifique sua conexão.</AlertDescription>
</Alert>

// ❌ ERRADO
<div className="bg-destructive/10 text-destructive border border-destructive/50 ...">
  Erro ao salvar
</div>
```

---

## Stack Técnica

- **React 19** + TypeScript
- **Storybook 10** (`@storybook/react-vite`)
- **Tailwind CSS 4** + **class-variance-authority**
- **lucide-react** (ícones)
- **Zustand** (i18n store)

---

## Regras Anti-Boilerplate

- Apenas `<slug>.stories.tsx` (story principal) carrega `tags: ["autodocs"]`. Sub-stories nunca.
- Docs page injetada via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` apenas no arquivo principal.
- Sub-stories têm apenas `title`, `component`, `parameters.layout`, `parameters.docs.description.component`.
- Categorias de sub-story dependem da categoria do componente — overlays de confirmação não têm `-variantes` nem `-tamanhos`.

---

## Tokenização de Dimensões

**Proibido usar classes hardcoded** de altura/size em componentes UI, stories e docs pages:

- ❌ `h-8`, `h-9`, `h-10`, `size-6`, `size-8`
- ✅ `h-(--height-default)`, `h-(--height-sm)`, `h-(--height-lg)`, `size-(--size-default)`

Exceções aceitas: `px-*`/`gap-*`/`py-*` (spacing interno), `[&_svg]:size-4` (ícones decorativos), `min-h-16` (Textarea). Tabela completa em `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

---

## Artefatos a Criar

| Arquivo | Conteúdo |
|---------|----------|
| `<slug>.stories.tsx` | Playground + `tags: ["autodocs"]` + `withAutoDocsTab` + play functions |
| `<slug>-variantes.stories.tsx` | Uma story por variante (sem play functions) |
| `<slug>-tamanhos.stories.tsx` | Uma story por tamanho (se aplicável) |
| `<slug>-estados.stories.tsx` | Disabled, Loading, Error — com play functions |
| `<slug>-composicoes.stories.tsx` | Com ícone, asChild, em formulário etc. |
| `<Slug>Docs.tsx` | Docs page completa com todas as 15 seções |

---

## Paridade Stories ↔ Docs Page

**O componente renderizado em cada preview da docs page deve usar os mesmos props da story correspondente.** Use `translations.json` como fonte única:

```tsx
// story e docs page consomem a mesma chave
tContent('demonstration.examples.destructive.title')
tContent('demonstration.examples.destructive.description')
```

Se houver divergência, **a story é a fonte de verdade visual** — alinhe a docs page à story.

---

## Imports e Hooks Obrigatórios na Docs Page

```tsx
// Componente documentado
import { Button } from '@/components/ui/button';

// Utilitários
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';

// UI compartilhada
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';

// Conteúdo
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/<slug>/translations.json';

// Section containers (todos os 15)
import { DocsHeader }        from '@/components/docs/shared/sections/DocsHeader';
import { DocsPageLayout }    from '@/components/docs/shared/sections/DocsPageLayout';
import { DocsDemonstration } from '@/components/docs/shared/sections/DocsDemonstration';
import { DocsAnatomy }       from '@/components/docs/shared/sections/DocsAnatomy';
import { DocsWhenToUse }     from '@/components/docs/shared/sections/DocsWhenToUse';
import { DocsDoDont }        from '@/components/docs/shared/sections/DocsDoDont';
import { DocsImport }        from '@/components/docs/shared/sections/DocsImport';
import { DocsVariants }      from '@/components/docs/shared/sections/DocsVariants';
import { DocsStates }        from '@/components/docs/shared/sections/DocsStates';
import { DocsProps }         from '@/components/docs/shared/sections/DocsProps';
import { DocsTokens }        from '@/components/docs/shared/sections/DocsTokens';
import { DocsAccessibility } from '@/components/docs/shared/sections/DocsAccessibility';
import { DocsRelated }       from '@/components/docs/shared/sections/DocsRelated';
import { DocsNotes }         from '@/components/docs/shared/sections/DocsNotes';
import { DocsAnalytics }     from '@/components/docs/shared/sections/DocsAnalytics';
import { DocsTestes }        from '@/components/docs/shared/sections/DocsTestes';
```

Hooks obrigatórios dentro do componente docs:
- `useTranslation(componentTranslations)` + `useTranslation(uiTranslations)`
- `useSeoEffect({ title, description, locale, componentSlug })` — reativo ao locale
- `useEffect(() => track('docs_page_view', ...), [locale])`
- `useActiveSection()` com `track('docs_section_viewed', ...)`

---

## Section Containers — Use Sempre

**Nunca escreva JSX inline replicando layout de seção.** A docs page é composta exclusivamente por section containers + componentes reais de `@/components/ui/`.

Verifique os containers disponíveis com `Glob` em `design-system-react/src/components/docs/shared/sections/`. Se não existirem, rode `/docs-sections --stack react` primeiro.

Use `DocsPageLayout` para o layout de duas colunas com sidebar sticky — não monte `flex gap-16` manualmente.

Previews visuais (DoDont, Variants, Demonstration) são passados como **props/children** para os containers.

### Do & Don't — bug comum

`DocsDoDont` recebe pares de previews. **Nunca** use `[1,2].map()` em um único grid — produz DO|DO em cima e DON'T|DON'T em baixo. O container já monta dois grids separados corretamente.

---

## Docs Page — Seções Obrigatórias (15)

Toda docs page deve renderizar TODAS estas seções com conteúdo real de `translations.json`. **Nunca** use placeholders como "Exemplo aqui." ou "Estrutura de subcomponentes.":

1. Header — badges (category, type), `<LanguageSwitcher />`, h1, description
2. Demonstração (`id="demonstracao"`) — demos interativos com componente real
3. Anatomia (`id="anatomia"`) — lista numerada + bloco de estrutura
4. Quando Usar (`id="quando-usar"`) — 4 blocos: guidelines, cenários, UX Writing, Do/Don't cards
5. Do & Don't (`id="do-dont"`) — via `DocsDoDont` com previews reais
6. Importação (`id="importacao"`) — blocos de código
7. Variantes (`id="variantes"`) — cards com preview + toggle de código
8. Estados (`id="estados"`) — tabela de estados
9. Propriedades (`id="propriedades"`) — tabelas de props completas
10. Tokens (`id="tokens"`) — tabela de tokens CSS + customização
11. Acessibilidade (`id="acessibilidade"`) — lista + cards de teclado
12. Relacionados (`id="relacionados"`) — grid de cards com links
13. Notas (`id="notas"`) — callouts
14. Analytics (`id="analytics"`) — tabela de eventos GA4
15. Testes (`id="testes"`) — 3 sub-seções: funcional, acessibilidade, visual

---

## Play Functions

```tsx
import { fn, userEvent, within, expect } from 'storybook/test';

export const Playground: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByRole('button');

    await step('clique dispara callback', async () => {
      await userEvent.click(el);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};
```

- Step descriptions em português
- `fn()` nos args para callbacks testáveis
- `userEvent` para interações (não `fireEvent`)
- `pointerEventsCheck: 0` ao clicar em elemento disabled

---

## Regras Críticas de Renderização

### Blocos de código — nunca `<pre>`

```tsx
// ✅ CORRETO
<div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code className="whitespace-pre">{`import { Button } from '@/components/ui/button';`}</code>
</div>

// ❌ ERRADO
<pre className="..."><code>...</code></pre>
```

Exceção: diagramas ASCII (`anatomy.structureCode`) podem usar `<pre>` dentro de `<div className="... overflow-x-auto">`.

### Tabelas — wrapper obrigatório

```tsx
// ✅ card com p-4 e overflow-x-auto
<div className="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
  <table className="w-full text-sm">...</table>
</div>

// ❌ overflow-hidden sem padding
<div className="rounded-lg border border-border overflow-hidden">
```

Primeira coluna da tabela de estados: `font-medium` simples, nunca badge/pill.

### `dangerouslySetInnerHTML` em componentes Radix

Componentes que renderizam `{children}` internamente não aceitam `dangerouslySetInnerHTML` diretamente — use um `<span>` wrapper:

```tsx
// ✅ CORRETO
<AccordionContent>
  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('content')) }} />
</AccordionContent>

// ❌ ERRADO — React error: "Can only set one of children or props.dangerouslySetInnerHTML"
<AccordionContent dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('content')) }} />
```

### Props booleanas inválidas em compostos Radix

```tsx
// ✅ CORRETO — omite com undefined
<Accordion
  type={mode === 'multiple' ? 'multiple' : 'single'}
  collapsible={mode !== 'multiple' ? true : undefined}
/>

// ❌ ERRADO — vaza atributo DOM inválido
<Accordion type="multiple" collapsible={false} />
```

---

## Checklist Final

Itens fáceis de esquecer:

- [ ] `min-w-0` no container de conteúdo — sem ele tabelas e code blocks transbordam
- [ ] `sanitizeHtml()` em todo `dangerouslySetInnerHTML`
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>`
- [ ] `list-none p-0 m-0` em `<ul>` e `list-none` em `<li>` (reset obrigatório)
- [ ] `useSeoEffect` reativo ao locale (locale no array de dependências)
- [ ] `track('docs_page_view', ...)` com locale como dependência do `useEffect`
- [ ] `fn()` nos args de stories com callbacks
- [ ] `<LanguageSwitcher />` presente no header da docs page
- [ ] Todas as 15 seções com conteúdo real (sem placeholders)
- [ ] Nenhum `console.log` ou `TODO` nos arquivos entregues

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-react): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
