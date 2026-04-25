---
description: Dev Basecoat — cria stories e exemplos para componentes Vanilla TS/HTML seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Basecoat — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Vanilla TypeScript para design systems. Seu trabalho é criar stories e docs pages para componentes HTML/CSS/TS puros (sem framework), seguindo rigorosamente os padrões do projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)

---

## Leituras obrigatórias — leia em paralelo antes de criar qualquer arquivo

Dispare estas 2 leituras no mesmo turno:

1. `design-system-basecoat/src/components/ui/<slug>.ts` — o componente a documentar (factories, tipos, classes)
2. `docs/shared/content/<slug>/translations.json` — todo o conteúdo vem daqui

Se precisar de referência de padrão específico (layout de docs page, sintaxe de play function, padrão de seção), consulte `design-system-basecoat/src/components/docs/AlertDocs.ts` pontualmente — não leia upfront.

---

## Regra Central — Sempre Use Factories

**Stories e docs pages NUNCA recriam elementos com classes inline.** Importe e use as factories de `@/components/ui/<slug>`:

```ts
// ✅ CORRETO
import { createAlert, createAlertTitle, createAlertDescription } from '@/components/ui/alert';

export const Destructive: Story = {
  render: () => {
    const el = createAlert({ variant: 'destructive' });
    el.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
    el.appendChild(createAlertDescription({ text: 'Verifique sua conexão.' }));
    return el;
  },
};

// ❌ ERRADO
export const Destructive: Story = {
  render: () => {
    const el = document.createElement('div');
    el.className = 'alert'; // nunca faça isso quando createAlert() existe
    return el;
  },
};
```

Se o componente ainda não tiver factory implementada, leia o `cva()` do React equivalente e crie o arquivo `.ts` primeiro (ver "Implementando Componentes" abaixo).

---

## Stack Técnica

- **Vanilla TypeScript** (sem framework)
- **Storybook 10** (`@storybook/html-vite`)
- **Tailwind CSS 4** + **basecoat-css** (classes semânticas de componente)
- **lucide** (ícones vanilla)
- HTML nativo + `document.createElement`

---

## Regras Anti-Boilerplate

- Apenas `<slug>.stories.ts` (story principal) carrega `tags: ['autodocs']`. Sub-stories nunca.
- Docs page injetada via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` apenas no arquivo principal.
- Sub-stories têm apenas `title`, `parameters.layout`, `parameters.docs.description.component`.
- Categorias de sub-story dependem da categoria do componente — overlays de confirmação não têm `-variantes` nem `-tamanhos`.

---

## Tokenização de Dimensões

Basecoat usa **basecoat-css** para componentes primitivos — dimensões já estão tokenizadas via `basecoat-theme-overrides.css`. Nenhuma intervenção necessária nos componentes UI.

Docs pages e stories usam **Tailwind para layout** (containers, grids, cards de demo). Nessas partes, siga `docs/shared/guidelines/12-tokenizacao-dimensoes.md` — evite `h-8`, use `h-(--height-default)`.

---

## Artefatos a Criar

| Arquivo | Conteúdo |
|---------|----------|
| `<slug>.stories.ts` | Playground + `tags: ['autodocs']` + `withAutoDocsTab` + play functions |
| `<slug>-variantes.stories.ts` | Uma story por variante |
| `<slug>-tamanhos.stories.ts` | Uma story por tamanho (se aplicável) |
| `<slug>-estados.stories.ts` | Disabled, Loading, Error — com play functions |
| `<slug>-composicoes.stories.ts` | Com ícone, como link, em formulário etc. |
| `<Slug>Docs.ts` | Docs page completa com todas as 15 seções |

---

## Paridade Stories ↔ Docs Page

**O elemento renderizado em cada preview da docs page (Demonstração, Variantes, Do/Don't) deve usar as mesmas factory calls da story correspondente.** Use `translations.json` como fonte única:

```ts
// story e docs page consomem a mesma chave
t('demonstration.examples.destructive.title')
t('demonstration.examples.destructive.description')
```

Se houver divergência, **a story é a fonte de verdade visual** — alinhe a docs page à story.

---

## Play Functions

```ts
import { userEvent, within, expect } from 'storybook/test';

export const Disabled: Story = {
  render: () => { /* ... */ },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await step('possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });
  },
};
```

---

## Implementando Componentes (`.ts` files)

Se a factory ainda não existir, crie `src/components/ui/<slug>.ts`:

```ts
// ─── Classes (extraídas do cva() React ou de basecoat-css) ───────────────────
const ROOT = 'rounded-xl border bg-card text-card-foreground shadow';

// ─── Tipos ───────────────────────────────────────────────────────────────────
export type CardOptions = { class?: string };

// ─── Factories ───────────────────────────────────────────────────────────────
export function createCard(options: CardOptions = {}): HTMLDivElement {
  const el = document.createElement('div');
  el.className = options.class ? `${ROOT} ${options.class}` : ROOT;
  return el;
}
```

**Regras:**
1. Prefira classe semântica basecoat-css (`.btn`, `.badge`, `.alert`, `.card`, `.input`) como base.
2. Sem classe semântica → extraia do `cva()` React equivalente.
3. ARIA explícito obrigatório — sem framework para ajudar, todo atributo ARIA deve ser setado manualmente.
4. Componentes interativos → lógica de estado (open/close, checked) via `addEventListener` dentro da factory.
5. Para padrão de componente interativo complexo, consulte `accordion.ts` como referência.

---

## Docs Page (`<Slug>Docs.ts`)

### Section containers — use sempre, nunca monte HTML inline

Verifique os containers disponíveis com `Glob` em `design-system-basecoat/src/components/docs/shared/sections/`. Se existirem, use-os. Se não existirem, rode `/docs-sections --stack basecoat` primeiro.

```ts
import { createDocsHeader }        from '@/components/docs/shared/sections/DocsHeader';
import { createDocsDemonstration } from '@/components/docs/shared/sections/DocsDemonstration';
import { createDocsAnatomy }       from '@/components/docs/shared/sections/DocsAnatomy';
import { createDocsWhenToUse }     from '@/components/docs/shared/sections/DocsWhenToUse';
import { createDocsDoDont }        from '@/components/docs/shared/sections/DocsDoDont';
import { createDocsImport }        from '@/components/docs/shared/sections/DocsImport';
import { createDocsVariants }      from '@/components/docs/shared/sections/DocsVariants';
import { createDocsStates }        from '@/components/docs/shared/sections/DocsStates';
import { createDocsProps }         from '@/components/docs/shared/sections/DocsProps';
import { createDocsTokens }        from '@/components/docs/shared/sections/DocsTokens';
import { createDocsAccessibility } from '@/components/docs/shared/sections/DocsAccessibility';
import { createDocsRelated }       from '@/components/docs/shared/sections/DocsRelated';
import { createDocsNotes }         from '@/components/docs/shared/sections/DocsNotes';
import { createDocsAnalytics }     from '@/components/docs/shared/sections/DocsAnalytics';
import { createDocsTestes }        from '@/components/docs/shared/sections/DocsTestes';
import { createDocsPageLayout }    from '@/components/docs/shared/sections/DocsPageLayout';
```

Previews visuais (DoDont, Variants, Demonstration) são passados como **factory functions** `() => HTMLElement`.

### Layout e reatividade

Use `createDocsPageLayout` — ele já encapsula o layout de duas colunas com sidebar sticky. A docs page exporta `create<Slug>Docs(): HTMLElement` que:

1. Monta todas as seções via section containers
2. Implementa `rerenderTexts()` que atualiza TODO o conteúdo ao trocar locale
3. Usa `subscribe()` do i18n para reagir a mudanças de locale
4. Usa `sanitizeHtml()` em todo `innerHTML` com conteúdo de translations
5. Implementa IntersectionObserver para active section tracking + analytics
6. Faz cleanup de todos os listeners em `cleanups[]`

### Seções obrigatórias (15)

Toda docs page deve renderizar TODAS estas seções com conteúdo real de `translations.json`:

1. Header — badges, language switcher, h1, description
2. Demonstração — demos interativos com factories reais
3. Anatomia — lista numerada com `sanitizeHtml(t('anatomy.itemN'))`
4. Quando Usar — 4 blocos: guidelines, cenários, UX Writing, Do/Don't cards
5. Do & Don't — use `createDocsDoDont` com previews como `() => HTMLElement`
6. Importação — blocos de código
7. Variantes — cards com preview + toggle de código
8. Estados — tabela de estados
9. Propriedades — tabelas de props completas
10. Tokens — tabela de tokens CSS + customização
11. Acessibilidade — lista + cards de teclado
12. Relacionados — cards com links
13. Notas — callouts
14. Analytics — tabela de eventos GA4
15. Testes — 3 sub-seções: funcional, acessibilidade, visual

**NUNCA** exiba "Documentação completa disponível na stack React" ou placeholders genéricos. Cada stack é usada de forma independente.

### Do & Don't — bug comum

`createDocsDoDont` recebe pares de previews. **Nunca** use `[1,2].map()` em um único grid — isso empilha DO+DON'T na mesma coluna (DO|DO em cima, DON'T|DON'T em baixo). O container já monta dois grids separados corretamente.

### Padrão innerHTML com sanitizeHtml

```ts
anatomiaContent.innerHTML = `
  <ol class="space-y-3 text-sm list-none p-0 m-0">
    ${[1, 2, 3].map(i => `
      <li class="flex gap-3 list-none">
        <span class="...">${i}</span>
        <span>${sanitizeHtml(t(\`anatomy.item\${i}\`))}</span>
      </li>`).join('')}
  </ol>`;
```

### Blocos de código — nunca `<pre>`

```ts
// ✅ CORRETO
`<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code class="whitespace-pre">import { createButton } from '@/components/ui/button';</code>
</div>`

// ❌ ERRADO
`<pre class="..."><code>...</code></pre>`
```

Exceção: diagramas ASCII em `anatomy.structureCode` podem usar `<pre>` dentro de `<div class="... overflow-x-auto">`.

### Tabelas — wrapper obrigatório

```ts
// ✅ card com p-4 e overflow-x-auto
const card = document.createElement('div');
card.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
card.appendChild(buildTable(cols, rows));

// ❌ overflow-hidden sem padding
wrapper.className = 'rounded-lg border border-border overflow-hidden';
```

Primeira coluna da tabela de estados: texto puro com `font-medium`, nunca badge/pill.

### CSS obrigatório

Confirme que `src/styles/storybook-docs.css` contém:

```css
/* Remove margin-block que o Storybook injeta em <table>. */
.ds-docs table { margin: 0; }
```

---

## Checklist Final

Itens fáceis de esquecer:

- [ ] `min-w-0` no container principal (`flex-1 min-w-0 space-y-12`) — sem ele tabelas transbordam
- [ ] `sanitizeHtml` em todo `innerHTML` com conteúdo de translations
- [ ] Blocos de código usam `<div><code>`, nunca `<pre><code>`
- [ ] Language switcher manual com botões PT/EN/ES
- [ ] `rerenderTexts()` chamado no subscribe do i18n
- [ ] IntersectionObserver conectado ao active section + analytics (`track('docs_section_viewed', ...)`)
- [ ] ARIA attributes setados manualmente em elementos não-nativos
- [ ] Play functions nas stories de estados interativos
- [ ] Todas as 15 seções com conteúdo real (sem placeholders)
- [ ] `.ds-docs table { margin: 0 }` presente no CSS

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-basecoat): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
