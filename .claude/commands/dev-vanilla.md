---
description: Dev Vanilla — cria stories e exemplos para componentes Vanilla TS/HTML seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Vanilla — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Vanilla TypeScript + CSS standalone `.nds-*` para design systems. Crie stories, docs pages e factories para componentes Vanilla.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente

---

## Leituras obrigatórias (antes de começar)

1. **`_dev-shared.md`** — padrões compartilhados das 5 stacks. **Esta skill complementa com o que é específico de Vanilla (vanilla TS).**
2. UI primitive: `nortear-design-system-vanilla/src/components/ui/<slug>.ts`
3. `docs/shared/content/<slug>/translations.json`
4. `.pipeline-context/<slug>.md` (se existir)

---

## Stack Técnica

- **Vanilla TypeScript** (sem framework)
- **Storybook 10** (`@storybook/html-vite`)
- **CSS standalone `.nds-*`** (compartilhado em `docs/shared/styles/nds/`)
- **lucide** (ícones vanilla)
- HTML nativo + `document.createElement`

---

## Tokenização de Dimensões

Os primitives Vanilla consomem as classes `.nds-<slug>-*` do CSS compartilhado — dimensões já tokenizadas nas próprias classes (`--height-*`/`--size-*`). Nenhuma intervenção nos UI primitives.

Docs pages e stories usam as primitivas de layout `.nds-*` (`nds-stack`, `nds-cluster`, `nds-grid`). Ver `docs/shared/guidelines/12-tokenizacao-dimensoes.md`.

---

## Padrões Vanilla-specific

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
export type CardOptions = { class?: string };

export function createCard(options: CardOptions = {}): HTMLDivElement {
  const el = document.createElement('div');
  el.dataset.slot = 'card';
  el.className = 'nds-card';
  if (options.class) el.classList.add(...options.class.split(' ').filter(Boolean));
  return el;
}
```

**Regras:**
1. Use as classes semânticas de `docs/shared/styles/nds/` (`.nds-button`, `.nds-badge`, `.nds-alert`, `.nds-card`, `.nds-input`). Classe sem prefixo `nds-` é resíduo do Tailwind, que saiu do projeto — não tem efeito em runtime e o audit acusa (`legacy_class_in_story`).
2. Falta uma classe para o caso → crie a regra no CSS compartilhado. Não copie de outra stack: **esta stack é a referência cross-stack**, as outras três se alinham a ela.
3. **Registre a configuração na raiz** como `data-*` (ex.: `data-type`, `data-collapsible`). Opção que vive só no closure é invisível para CSS, teste, devtools — e congela o snippet da aba API Reference (ver abaixo).
4. ARIA explícito **obrigatório** — sem framework, todo atributo ARIA deve ser setado manualmente.
5. Componentes interativos → lógica de estado via `addEventListener` dentro da factory.
6. Para padrão complexo, consulte `accordion.ts` como referência.

### API Reference: nesta stack a fonte do snippet é o DOM

O renderer `html` monta a caixa de código a partir do `outerHTML` do elemento
devolvido pelo `render`, e **só reemite quando esse HTML muda**. Daí duas regras.

**1. Declare `docs.source.transform` na Playground.** Um dump de DOM não é o que
o consumidor escreve — ele chama a factory. O transform devolve a chamada real
(`createX({ … })`), montada a partir de `storyContext.args`.

**2. Garanta que o elemento devolvido reflita os args.** O `transform` só
re-executa quando o `outerHTML` muda; se ele sai idêntico, o snippet congela e
mexer nos controls não altera nada. **Nenhum erro é emitido** — a caixa de código
simplesmente mente sobre o que a story renderiza. Há dois jeitos de cair nisso:

- **Configuração no closure.** `type`, `collapsible` e afins ficam só na variável
  da factory e não viram atributo. Resolve-se com a regra 3 acima: registre na
  raiz como `data-*`. Foi o caso do Accordion.
- **Conteúdo portalado para fora do wrapper.** Overlays devolvem um wrapper que
  contém só o trigger — painel, título e botões nascem no `open()` e vão para o
  `document.body`. Metade dos controls não toca o wrapper. Resolve-se dando à
  raiz um atributo que identifique a instância (`data-<slug>-id`), que também é o
  que liga o trigger ao painel que ele comanda. Foi o caso do AlertDialog.

Antes de fechar a Playground, troque **cada** control e confirme que o snippet
mudou. Dois de seis reagindo parece funcionando.

Como não há componente de framework para introspectar, a aba API Reference sai
**só** do `argTypes` — inclusive as opções sem control precisam estar declaradas.
Ver as regras gerais em `_dev-shared.md`.

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

### DOMPurify para conteúdo de translations

```ts
import DOMPurify from 'dompurify';

anatomyContent.innerHTML = DOMPurify.sanitize(`
  <ol class="nds-stack nds-list-none" data-spacing="sm">
    ${[1, 2, 3].map(i => `<li>${t(`anatomy.item${i}`)}</li>`).join('')}
  </ol>
`);
```

`DOMPurify.sanitize` vai **direto no call site**, com o import no próprio arquivo.
Não existe `src/lib/sanitize-html.ts` em nenhuma stack e não crie um: wrapper
esconde o sanitizador do SAST, que passa a reportar o fluxo inteiro como XSS.
Ver guideline `09-seguranca-xss.md`.

---

## Imports da Docs Page

```ts
import DOMPurify from 'dompurify';
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

Vanilla factory custom frequentemente NÃO suporta features das libs upstream (submenu, CheckboxItem nativo, RadioItem nativo, props específicas de delays/portals).

**3 camadas obrigatórias** (ver `_dev-shared.md`):
1. `translations.notes.item1` — descrever divergência
2. DocsProps notes inline — para cada prop não suportada
3. Story afetada (se omitida): `parameters.docs.description.component` com nota explícita

`navigation-menu` e `menubar` Vanilla são referências exemplares.

---

## Audit + Commit

Veja `_dev-shared.md` (Audit Inline + Commit). Mensagem: `skill(dev-vanilla): $ARGUMENTS`.
