---
description: Dev Basecoat — cria stories e exemplos para componentes Vanilla TS/HTML seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Basecoat — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Vanilla TypeScript para design systems. Seu trabalho é criar stories e exemplos para componentes HTML/CSS/TS puros (sem framework), seguindo rigorosamente os padrões do projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)

---

## Stack Técnica

- **Vanilla TypeScript** (sem framework)
- **Storybook 10** (`@storybook/html-vite`)
- **Tailwind CSS 4** + **basecoat-css** (classes semânticas de componente)
- **Zod** (validação)
- **lucide** (ícones vanilla)
- HTML nativo + `document.createElement`

---

## Fontes de Referência — Leia ANTES de qualquer ação

1. `nortear-design-system/src/components/ui/alert.stories.ts` — Playground
2. `nortear-design-system/src/components/ui/alert-variantes.stories.ts` — variantes
3. `nortear-design-system/src/components/ui/alert-estados.stories.ts` — estados
4. `nortear-design-system/src/components/ui/alert-composicoes.stories.ts` — composições
5. `nortear-design-system/src/components/docs/AlertDocs.ts` — docs page completa (REFERÊNCIA)
6. `nortear-design-system/.storybook/preview.ts` — configuração global
7. `docs/shared/guidelines/08-docs-pages-foundations.md` — checklist

---

## Classes Semânticas — basecoat-css

O projeto usa [`basecoat-css`](https://basecoatui.com) para classes semânticas de componentes. Cada componente tem uma classe CSS que encapsula todos os estilos, **sem** precisar montar strings de Tailwind manualmente.

### Button

A classe de button encoda **size + variant** em um único nome:

```
btn                   → default size + primary variant
btn-{variant}         → default size + variante específica
btn-sm                → sm size + primary variant
btn-sm-{variant}      → sm size + variante específica
btn-lg                → lg size + primary variant
btn-icon              → icon size + primary variant
btn-icon-{variant}    → icon size + variante específica
```

Variantes disponíveis: `primary` (padrão), `secondary`, `outline`, `ghost`, `link`, `destructive`

```ts
function btnClass(variant = 'default', size = 'default'): string {
  const prefix = size === 'icon' ? 'btn-icon' : size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn';
  return variant === 'default' ? prefix : `${prefix}-${variant}`;
}
```

### Badge

```
badge               → badge padrão (primary)
badge-secondary
badge-destructive
badge-outline
```

### Table

Aplique `.table` no elemento `<table>`. Os estilos para `th`, `td`, `tr`, `thead`, `tbody`, `tfoot`, `caption` são aplicados via CSS aninhado automaticamente.

**Override obrigatório para `th`**: basecoat usa `text-foreground` para `th`, mas o design system usa `text-muted-foreground` para consistência com as outras stacks.

```ts
th.className = 'text-muted-foreground'; // adicionar ao createTableHead()
```

### Componentes sem classe semântica (usar Tailwind diretamente)

- **Accordion** — usa `<div>/<button>` com ARIA manual (ver `accordion.ts`)
- **Sonner** — usa `sonner-js` diretamente
- **Qualquer outro** — extraia classes do `cva()` do componente React correspondente

---

## Padrão de Render — HTML Stories

**REGRA OBRIGATÓRIA: Importe as factory functions de `@/components/ui/<slug>`.** Todos os componentes Basecoat já estão implementados com factory functions tipadas. Stories e docs pages NUNCA devem recriar elementos com classes inline — use sempre as factories existentes.

```ts
// ✅ CORRETO — importa a factory do componente
import type { Meta, StoryObj } from '@storybook/html';
import { createAlert, createAlertTitle, createAlertDescription } from '@/components/ui/alert';

const meta: Meta = {
  title: 'UI/Alert/Variantes',
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const el = createAlert({ variant: 'default' });
    el.appendChild(createAlertTitle({ text: 'Atualização disponível' }));
    el.appendChild(createAlertDescription({ text: 'Uma nova versão está pronta para instalação.' }));
    return el;
  },
  parameters: { docs: { description: { story: '...' } } },
};

// ❌ ERRADO — recria o elemento inline
export const Default: Story = {
  render: () => {
    const el = document.createElement('div');
    el.className = 'alert'; // ← não faça isso
    el.textContent = 'Mensagem';
    return el;
  },
};
```

No Storybook para HTML cada story `render` retorna um `HTMLElement`. Use as factory functions para criá-lo:

```ts
// Múltiplos componentes na mesma story
export const WithBadge: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';
    wrapper.append(
      createAlert({ variant: 'default' }),
      createBadge({ variant: 'destructive', text: '3' }),
    );
    return wrapper;
  },
};
```

---

## Play Functions — Mesmo Padrão

```ts
import { userEvent, within, expect } from 'storybook/test';

export const Disabled: Story = {
  render: () => {
    const el = btn('default', 'Botão');
    el.disabled = true;
    return el;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('Botão possui atributo disabled', async () => {
      await expect(button).toBeDisabled();
    });
  },
};
```

---

## Implementando Componentes (`.ts` files)

Antes de criar stories ou docs pages, o componente `.ts` deve existir e exportar factory functions prontas para uso. O padrão:

```ts
// ─── Classes base (extraídas do cva() React ou de basecoat-css) ──────────────
const ROOT = 'rounded-xl border bg-card text-card-foreground shadow';
const HEADER = 'flex flex-col space-y-1.5 p-6';

// ─── Tipos ───────────────────────────────────────────────────────────────────
export type CardOptions = {
  class?: string;
};

// ─── Factories ───────────────────────────────────────────────────────────────
export function createCard(options: CardOptions = {}): HTMLDivElement {
  const el = document.createElement('div');
  el.className = options.class ? `${ROOT} ${options.class}` : ROOT;
  return el;
}

export function createCardHeader(options: { class?: string } = {}): HTMLDivElement {
  const el = document.createElement('div');
  el.className = options.class ? `${HEADER} ${options.class}` : HEADER;
  return el;
}
// ... createCardTitle, createCardDescription, createCardContent, createCardFooter
```

### Regras de Implementação

1. **Prefira classe semântica basecoat-css** — se o componente tem `.btn`, `.badge`, `.alert`, `.card`, `.input`, `.label`, `.textarea`, `.select`, `.dialog`, `.popover`, `.tabs`, `.toast` — use-a como base, não monte strings Tailwind.
2. **Componentes sem classe semântica** — extraia as classes do `cva()` do React equivalente.
3. **Um arquivo por componente** — `src/components/ui/<slug>.ts`
4. **Exports nomeados** — `export function create<ComponentName>(...)`, `export function create<ComponentName>Part(...)`
5. **Tipos exportados** — `export type <ComponentName>Options = { ... }`
6. **ARIA explícito** — sem framework para ajudar, todo atributo ARIA deve ser setado manualmente.
7. **Componentes interativos** — implemente a lógica de estado (open/close, checked, selected) via `addEventListener` dentro da factory.

### Referência: accordion.ts

O `accordion.ts` é o modelo mais completo de componente interativo Basecoat. Leia-o como referência antes de implementar dialogs, tabs, selects e outros com estado.

---

## REGRA CENTRAL — Paridade Stories ↔ Docs Page

**O elemento HTML renderizado em CADA seção da docs page (Demonstração, Variantes, Estados, Do/Don't previews) DEVE usar as mesmas opções da factory da story correspondente.** Zero divergência.

Exemplo concreto — Alert com variante `destructive`:

```ts
// alert-variantes.stories.ts
export const Destructive: Story = {
  render: () => {
    const alert = createAlert({ variant: 'destructive' });
    alert.appendChild(createAlertIcon('error'));
    alert.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
    alert.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }));
    return alert;
  },
};
```

```ts
// AlertDocs.ts — seção Demonstração ou Variantes
// ✅ CORRETO: mesmas factory calls da story
const destructive = createAlert({ variant: 'destructive' });
destructive.appendChild(createAlertIcon('error'));
destructive.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));
destructive.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }));

// ❌ ERRADO: título/descrição divergem da story
const destructive = createAlert({ variant: 'destructive' });
destructive.appendChild(createAlertIcon('error'));
destructive.appendChild(createAlertTitle({ text: 'Atenção' }));  // ≠ "Erro ao salvar"
destructive.appendChild(createAlertDescription({ text: 'Algum texto diferente' }));
```

### Fonte de verdade única — escolha UMA abordagem e mantenha

**Opção A (preferida): examples em `translations.json`**

```json
"demonstration": {
  "examples": {
    "default":     { "variant": "default",     "title": "...", "description": "...", "icon": "info" },
    "destructive": { "variant": "destructive", "title": "...", "description": "...", "icon": "error" },
    "success":     { "variant": "default", "icon": "success", "class": "...", "descriptionClass": "...", "title": "...", "description": "..." },
    "warning":     { ... }
  }
}
```

Stories e docs page iteram sobre as mesmas chaves via `t('demonstration.examples.destructive.title')`. Uma única fonte para ambas.

**Opção B: presets em `<slug>.examples.ts`**

```ts
// src/components/ui/alert.examples.ts
export const ALERT_EXAMPLES = {
  destructive: { variant: 'destructive', title: 'Erro ao salvar', description: '...', icon: 'error' as const },
  // ...
} as const;

export function buildAlertFromExample(key: keyof typeof ALERT_EXAMPLES): HTMLElement {
  const ex = ALERT_EXAMPLES[key];
  const el = createAlert({ variant: ex.variant });
  el.appendChild(createAlertIcon(ex.icon));
  el.appendChild(createAlertTitle({ text: ex.title }));
  el.appendChild(createAlertDescription({ text: ex.description }));
  return el;
}
```

Stories: `render: () => buildAlertFromExample('destructive')`. Docs page: `container.appendChild(buildAlertFromExample('destructive'))`. Uma única função gera o DOM em ambos os lados.

**Nunca misture abordagens** — se escolher A, toda demo/variante vem de translations; se B, todas usam o preset.

### Validação antes de commit

Para cada variante exibida na docs page, confirme que:
- [ ] Existe uma story com o mesmo nome/variante (ex: `Variantes/Destructive`)
- [ ] Título, descrição, ícone e classes batem byte-a-byte entre story e docs page
- [ ] Se o conteúdo vem de `translations.json`, ambas consomem a mesma chave

Se há divergência, **a story é a fonte de verdade visual** — alinhe a docs page à story.

---

## Docs Page Composta APENAS por Section Containers

**A docs page NUNCA monta `innerHTML` inline replicando layout de seção.** Ela é composta exclusivamente por:

1. Factories de `@/components/docs/shared/sections/createDocs*` — definem layout, tipografia, espaçamento
2. Factories reais de `@/components/ui/<slug>` — preenchem as previews/demos

Se um container ainda não existe em `shared/sections/`, rode `/docs-sections --stack basecoat` primeiro. Nunca monte `<section id="..."><h2>...</h2><table>...</table></section>` via `innerHTML` replicando o que `createDocsProps`, `createDocsStates`, `createDocsTokens` já fazem.

---

## Artefatos a Criar

### 1. Definir Classes Base

No topo do arquivo de stories, defina as classes base e variantes extraídas do `cva()` do componente.

### 2. Helper Function

Crie uma função factory que retorna o `HTMLElement` configurado:

```ts
function createComponent(options: {
  variant?: string;
  size?: string;
  disabled?: boolean;
  text?: string;
}): HTMLElement {
  const el = document.createElement('button');
  // aplicar classes, atributos, conteúdo
  return el;
}
```

### 3. Stories Organizadas

| Arquivo | Conteúdo |
|---------|----------|
| `<slug>.stories.ts` | Playground + play functions |
| `<slug>-variantes.stories.ts` | Uma story por variante |
| `<slug>-tamanhos.stories.ts` | Uma story por tamanho |
| `<slug>-estados.stories.ts` | Disabled, Loading (com play functions) |
| `<slug>-composicoes.stories.ts` | Com ícone, como link, etc. |

### 4. Docs Page (`ComponentDocs.ts`)

**REGRA OBRIGATÓRIA: Use as factory functions de `@/components/ui/<slug>`.** A seção Demonstração e todos os exemplos DEVEM importar e chamar as factories existentes. Nunca recrie elementos com classes Tailwind inline dentro da docs page.

```ts
// ✅ CORRETO — usa as factories do componente
import { createAlert, createAlertTitle, createAlertDescription } from '@/components/ui/alert';
import { createBadge } from '@/components/ui/badge';

// Na seção demonstracao:
const demoSection = document.createElement('div');
demoSection.className = 'flex flex-wrap gap-3';
demoSection.append(
  buildAlert({ variant: 'default', title: t('demo.default.title'), description: t('demo.default.description') }),
  buildAlert({ variant: 'destructive', title: t('demo.destructive.title'), description: t('demo.destructive.description') }),
);

// ❌ ERRADO — recria o componente inline
const a = document.createElement('div');
a.className = 'alert'; // ← não faça isso quando já existe createAlert()
```

**REGRA CRÍTICA: Cada stack deve ser independente.** A docs page Basecoat DEVE renderizar TODO o conteúdo das 15 seções usando `translations.json`. NUNCA exiba mensagens como "Documentação completa disponível na stack React" ou placeholders genéricos. Cada projeto será usado de forma independente.

**Referência obrigatória**: Leia `nortear-design-system/src/components/docs/AlertDocs.ts` inteiro antes de criar qualquer docs page. Ele é o modelo completo para Basecoat.

**Referência de conteúdo**: Leia a docs page React (`design-system-react/src/components/docs/<Slug>Docs.tsx`) para entender quais seções, tabelas, cards e demos existem. A versão Basecoat deve ter conteúdo IDÊNTICO usando as factory functions + `innerHTML` com `sanitizeHtml` para texto.

Localização: `src/components/docs/<ComponentName>Docs.ts`

O padrão Basecoat exporta uma função `create<ComponentName>Docs(): HTMLElement` que:

1. Cria o root element e todas as seções via `document.createElement`
2. **Cria o layout de duas colunas com sidebar sticky usando `createDocsNav`:**
   ```ts
   import { createDocsNav, type DocsNavHandle } from '@/components/docs/shared/DocsNav';

   const layout = document.createElement('div');
   layout.className = 'flex gap-16 items-start';

   const sidebar = document.createElement('nav');
   sidebar.className = 'sticky top-8 w-52 shrink-0 self-start space-y-5';
   sidebar.setAttribute('aria-label', 'Navegação das seções do componente');

   // Dentro do sidebar — SEMPRE via createDocsNav, NUNCA montando <ul>/<button> inline
   let navHandle: DocsNavHandle | null = null;
   function buildSidebar() {
     navHandle = createDocsNav({
       groups: NAV_GROUPS.map(g => ({
         label: tNav(g.labelKey),
         sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
       })),
     });
     sidebar.replaceChildren(navHandle.element);
   }
   // active tracking: navHandle?.setActiveSection(id) a partir do IntersectionObserver

   const main = document.createElement('div');
   main.className = 'flex-1 min-w-0 space-y-12'; // min-w-0 OBRIGATÓRIO — sem ele tabelas e code blocks transbordam

   layout.append(sidebar, main);
   ```
3. Implementa `rerenderTexts()` que atualiza TODO o conteúdo reativamente ao locale (inclusive rebuild do sidebar via `buildSidebar()`)
4. Usa `subscribe()` do i18n para reagir a mudanças de locale
5. Usa `sanitizeHtml()` em todo `innerHTML` com conteúdo de translations
6. Implementa IntersectionObserver chamando `navHandle?.setActiveSection(id)` para active section tracking
7. Faz cleanup de todos os listeners em `cleanups[]`

**⚠️ A `<nav>` com `sticky top-8` é obrigatória** — sem ela a navegação lateral rola junto com a página.

**⚠️ REGRA: nunca monte o conteúdo do sidebar inline** (`<ul>`, `<button>`, classes de active state). Use sempre `createDocsNav` de `@/components/docs/shared/DocsNav`. A estrutura dos grupos fica em `NAV_GROUPS` (array local com `labelKey`/`sections`), mas o rendering vem da factory compartilhada.

#### Seções obrigatórias (Header + 15 seções com `id`) no rerenderTexts():

Toda docs page Basecoat deve renderizar TODAS estas seções com conteúdo real:

1. **Header** — badges, language switcher manual, h1, description, install badge
2. **Demonstração** — botões/demos interativos com `addEventListener('click', ...)` e `track()`
3. **Anatomia** — lista numerada com `sanitizeHtml(t('anatomy.itemN'))` + bloco de estrutura
4. **Quando Usar** — 4 blocos: guidelines, cenários, UX Writing, Do/Don't
5. **Do & Don't** — **layout obrigatório: dois grids separados (um por par), cada um com DO à esquerda e DON'T à direita, dentro de card wrapper**

  **ERRO COMUM**: usar `[1, 2].map(i => ...)` em um único grid — empilha DO+DON'T na mesma coluna. Isso está ERRADO.

  ```ts
  // ✅ CORRETO: card wrapper + dois grids separados
  secDoDont.content.innerHTML = `
    <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
    <div class="space-y-8 w-full">

      <!-- Pair 1: grid próprio, DO esquerda | DON'T direita -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-green-600">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
            <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.do'))}</span>
          </div>
          <div class="border border-green-200 rounded-xl p-6 bg-green-50/50">
            <!-- preview visual com HTML do componente real -->
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.do'))}</p>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-red-600">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
            <span class="text-sm font-semibold uppercase tracking-wider">${sanitizeHtml(tNav('common.dont'))}</span>
          </div>
          <div class="border border-red-200 rounded-xl p-6 bg-red-50/50">
            <!-- preview visual -->
          </div>
          <p class="text-sm text-muted-foreground italic px-1">${sanitizeHtml(t('doDont.pair1.dont'))}</p>
        </div>
      </div>

      <!-- Pair 2: segundo grid separado — mesma estrutura -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- ... -->
      </div>

    </div>
    </div>`;

  // ❌ ERRADO: [1,2].map() em um grid = DO|DO em cima, DON'T|DON'T em baixo
  ```

  - Labels via `tNav('common.do')` / `tNav('common.dont')` (de uiTranslations via `createTranslation`)
  - Preview boxes: HTML inline com o componente real representando visualmente o conceito
6. **Importação** — blocos de código
7. **Variantes** — cards com título/descrição + preview real + toggle de código por variante (DocsVariants absorveu a antiga seção Exemplos)
8. **Estados** — tabela de estados
9. **Propriedades** — tabelas de props completas (2 se provider + API)
10. **Tokens** — tabela de tokens CSS + customização
11. **Acessibilidade** — lista + cards de teclado
12. **Relacionados** — cards com links
13. **Notas** — callouts
14. **Analytics** — tabela de eventos GA4
15. **Testes** — 3 sub-seções: funcional, acessibilidade, visual

#### Padrão innerHTML com sanitizeHtml

```ts
// Conteúdo HTML de translations
anatomiaContent.innerHTML = `
  <ol class="space-y-3 text-sm list-none p-0 m-0">
    ${[1, 2, 3].map(i => `<li class="flex gap-3 list-none">
      <span class="...">${i}</span>
      <span>${sanitizeHtml(t(\`anatomy.item\${i}\`))}</span>
    </li>`).join('')}
  </ol>`;

// Language switcher manual
localeDefs.forEach(({ value, label }) => {
  const b = document.createElement('button');
  b.addEventListener('click', () => {
    import('@/lib/i18n').then(({ setLocale }) => setLocale(value));
  });
});
```

#### Blocos de código — NUNCA usar `<pre>`

Blocos de código (import, exemplos) devem usar `<div><code>`, **nunca** `<pre><code>`. O `<pre>` causa renderização inconsistente no Storybook (margens e padding diferentes entre stacks).

```ts
// ✅ CORRETO — <div> com <code>
`<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">import { Toaster } from '@/components/ui/sonner';</code></div>`

// ❌ ERRADO — <pre> com <code>
`<pre class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code>...</code></pre>`
```

A única exceção é `<pre>` para diagramas ASCII (ex: `anatomy.structureCode`). O wrapper do `<pre>` DEVE ter `overflow-x-auto`:
```ts
`<div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
  <pre class="font-mono text-sm whitespace-pre">${sanitizeHtml(t('anatomy.structureCode'))}</pre>
</div>`
```

---

## Regras Críticas de Renderização

### Tabelas — card wrapper obrigatório

**Toda tabela deve estar dentro de um card com padding e overflow horizontal:**

```ts
// ✅ CORRETO — card com p-4 e overflow-x-auto
const card = document.createElement('div');
card.className = 'rounded-lg border border-border p-4 shadow-sm overflow-x-auto';
card.appendChild(buildTable(cols, rows)); // buildTable() retorna div.overflow-x-auto > table
tableSection.appendChild(card);

// ❌ ERRADO — overflow-hidden sem padding, ou wrapper externo sem padding
const wrapper = document.createElement('div');
wrapper.className = 'rounded-lg border border-border overflow-hidden';
```

> **Nota:** `buildTable()` já retorna um `div.overflow-x-auto` interno. O card wrapper apenas adiciona `p-4 shadow-sm overflow-x-auto` — o duplo `overflow-x-auto` é inofensivo.

### Tabela de estados — nome em texto plano, não badge

A primeira coluna das tabelas de estados (`id="estados"`) usa `font-medium` simples como texto. **Nunca** use HTML de badge/pill para o nome do estado:

```ts
// ✅ CORRETO
sanitizeHtml(t(`states.${key}.label`)),  // primeira coluna: texto puro

// ❌ ERRADO
`<span class="inline-flex items-center rounded-full border px-2 py-0.5 ...">${sanitizeHtml(t(`states.${key}.label`))}</span>`,
```

### CSS obrigatório — `.ds-docs table { margin: 0 }`

O arquivo `src/styles/storybook-docs.css` **deve** conter a regra abaixo. Sem ela, o Storybook injeta `margin-block` nas `<table>`, criando espaço extra entre a borda do card e a tabela:

```css
/* Remove margin-block que o Storybook injeta em <table>. */
.ds-docs table {
  margin: 0;
}
```

Confirme que esta regra existe no CSS antes de criar qualquer docs page.

---

## Convenções Basecoat-Específicas

- **Usar sempre as factory functions** — todos os componentes estão em `src/components/ui/<slug>.ts`; importe e use as factories, não recrie com classes inline
- **Sem framework** — tudo é `document.createElement` orquestrado pelas factories + classes CSS
- **Preferir basecoat-css** — as factories já usam as classes semânticas corretas; não duplique essa lógica nas stories
- **Sem state management** — cada story é independente
- **ARIA obrigatório** — as factories devem setar ARIA attributes; confirme que o componente importado já o faz

---

## Section Components — Uso Obrigatório na Docs Page

**ANTES de escrever qualquer `innerHTML` inline na docs page**, verifique se os section containers genéricos existem:

```bash
ls nortear-design-system/src/components/docs/shared/sections/ 2>/dev/null
```

Se existirem (`createDocsDoDont.ts`, `createDocsVariants.ts`, etc.), **use-os**. Se não existirem, rode `/docs-sections --stack basecoat` primeiro.

**Imports na docs page:**
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
```

Previews visuais (DoDont, Variants, Demonstration) são passados como **factory functions** `() => HTMLElement`. Ver API completa em `docs-sections.md`.

---

## Checklist Final

- [ ] **Stories importam as factory functions de `@/components/ui/<slug>`** — sem classes inline nas stories
- [ ] **Docs page importa factories para a seção Demonstração e Variantes** — sem `document.createElement` + classes manuais quando a factory existe
- [ ] **Docs page composta APENAS por factories de `shared/sections/createDocs*`** + factories de `components/ui/` — zero `innerHTML` inline replicando layout de seção
- [ ] **Paridade stories ↔ docs page**: cada elemento mostrado em Demonstração/Variantes/Estados usa as MESMAS factory calls da story correspondente (título, descrição, ícone, classes batem byte-a-byte)
- [ ] Fonte de verdade única escolhida (translations.json / examples.ts com `buildFromExample()`) e mantida em todas as seções
- [ ] Verificar se o componente tem classe semântica em basecoat-css; as factories já devem encapsular isso
- [ ] Para componentes sem factory ainda implementada, extrair classes do cva() do componente React
- [ ] Helper function para criar elementos
- [ ] 1 story por variante, tamanho, estado e composição
- [ ] `role`, `aria-*` attributes corretos em elementos não-nativos
- [ ] Play functions para estados (disabled, loading)
- [ ] Play function para aria-label em icon-only
- [ ] `innerHTML` usado apenas para SVG icons (nunca para user input)
- [ ] Descriptions de story em português
- [ ] **Docs page com TODAS as 15 seções renderizadas** (não placeholders ou "consulte React")
- [ ] **sanitizeHtml** em todo innerHTML com conteúdo de translations
- [ ] **Language switcher manual** com botões PT/EN/ES
- [ ] **rerenderTexts()** atualiza todo conteúdo reativamente ao locale
- [ ] **IntersectionObserver** para active section + analytics
- [ ] **Sidebar nav** com `sticky top-8 w-52 shrink-0 self-start` no layout `flex gap-16 items-start`
- [ ] **`min-w-0`** no container principal (`flex-1 min-w-0 space-y-12`) — sem ele tabelas e code blocks transbordam à direita
- [ ] **Blocos de código** usam `<div><code>`, nunca `<pre><code>`
- [ ] Conteúdo visualmente idêntico ao React (mesmas tabelas, cards, demos)

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-basecoat): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
