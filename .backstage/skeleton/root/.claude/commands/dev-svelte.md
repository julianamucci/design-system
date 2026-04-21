---
description: Dev Svelte — cria stories, docs pages e exemplos para componentes Svelte 5 seguindo os padrões do projeto
argument-hint: <component-slug>
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Dev Svelte — Especialista em Desenvolvimento

Você é um desenvolvedor especialista em Svelte 5 para design systems. Seu trabalho é criar stories, docs pages e exemplos para componentes Svelte, seguindo rigorosamente os padrões do projeto.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)

---

## Stack Técnica

- **Svelte 5** + TypeScript
- **Vite** + `@sveltejs/vite-plugin-svelte`
- **Storybook 10** (`@storybook/svelte-vite`)
- **Tailwind CSS 4**
- **shadcn-svelte** (Bits UI + `tailwind-variants` — todos os componentes UI)
- **lucide-svelte** (ícones)

---

## Componentes Disponíveis

Todos instalados em `src/components/ui/<slug>/index.ts`. Use **sempre** import de pasta:

```svelte
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Chart } from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { InputGroup } from '@/components/ui/input-group';
import { InputOtp } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Resizable, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Sidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
```

### Button — tamanhos

| Size | Altura |
|------|--------|
| xs | h-6 |
| sm | h-7 |
| default | h-8 |
| lg | h-9 |
| icon | size-8 |
| icon-xs | size-6 |
| icon-sm | size-7 |
| icon-lg | size-9 |

---

## Ordem de Execução Obrigatória

**Sempre nesta sequência — nunca pule o Passo 0:**

### Passo 0 — Verificar e completar o componente em `components/ui`

Antes de criar qualquer story ou docs page, verifique se o componente já existe e está completo:

```bash
ls design-system-svelte/src/components/ui/<slug>/
```

**Se a pasta não existir** — instale via CLI do shadcn-svelte:
```bash
cd design-system-svelte && npx shadcn-svelte add -y -o <slug>
```

**Se a pasta existir** — leia o `index.ts` para confirmar quais exports estão disponíveis antes de usar nos artefatos.

O componente em `components/ui` é a fonte de verdade. Stories e docs page **consomem** esse componente — nunca criam HTML paralelo ignorando-o.

### Passo 1 — Criar o Wrapper de Story

Wrapper `.svelte` que importa do componente UI instalado. Ver seção "PADRÃO CRÍTICO" abaixo.

### Passo 2 — Criar as Stories

5 arquivos: Playground + Variantes + Tamanhos + Estados + Composições.

### Passo 3 — Verificar que os Section Containers existem

Antes de criar a docs page, confirme que os 16 containers em `shared/sections/` existem. **Se não existirem, rode `/docs-sections --stack svelte` antes de continuar.** A docs page é composta EXCLUSIVAMENTE por esses containers + componentes de `components/ui/` — nunca HTML inline replicando layout de seção.

### Passo 4 — Criar a Docs Page

A docs page importa e usa o componente real nas seções de Demonstração e Exemplos, **com args idênticos aos das stories**:
```svelte
import { Component } from '@/components/ui/<slug>';
import ComponentStory from '@/components/ui/<slug>/ComponentStory.svelte';
<!-- seção demonstracao: renderiza ComponentStory com os mesmos props das stories -->
```

---

## REGRA CENTRAL — Paridade Stories ↔ Docs Page

**O componente renderizado em CADA seção da docs page (Demonstração, Variantes, Estados, Exemplos, Do/Don't previews) DEVE usar os mesmos props/args da story correspondente.** Zero divergência.

Exemplo concreto — Alert com variante `destructive`:

```ts
// alert-variantes.stories.ts
export const Destructive: Story = {
  render: () => ({
    Component: AlertStory,
    props: {
      variant: 'destructive',
      title: 'Erro ao salvar',
      description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
      showIcon: true,
      icon: 'error',
    },
  }),
};
```

```svelte
<!-- AlertDocs.svelte — seção Demonstração ou Variantes -->
<!-- ✅ CORRETO: mesmos props -->
<AlertStory
  variant="destructive"
  title="Erro ao salvar"
  description="Não foi possível salvar. Verifique sua conexão e tente novamente."
  showIcon
  icon="error"
/>

<!-- ❌ ERRADO: props divergentes da story -->
<Alert variant="destructive">
  <AlertCircle class="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>  <!-- ≠ "Erro ao salvar" da story -->
  <AlertDescription>...</AlertDescription>
</Alert>
```

### Fonte de verdade única — escolha UMA abordagem e mantenha

**Opção A (preferida): examples em `translations.json`**

Adicione ao `translations.json` uma estrutura `demonstration.examples` com os dados de cada variante exibida:
```json
"demonstration": {
  "examples": {
    "default":     { "variant": "default",     "title": "...", "description": "...", "icon": "info" },
    "destructive": { "variant": "destructive", "title": "...", "description": "...", "icon": "error" },
    "success":     { "variant": "default", "icon": "success", "class": "bg-success/10 text-success border-success/30", "descriptionClass": "text-success/90", "title": "...", "description": "..." },
    "warning":     { ... }
  }
}
```

Stories e docs page **iteram sobre as mesmas chaves** via `$tStore('demonstration.examples.destructive.title')`. Qualquer mudança no conteúdo vive em um lugar só.

**Opção B: reuso direto do wrapper de story**

A docs page importa `ComponentStory.svelte` do diretório do componente e o usa com props literais idênticos aos da story. Funciona quando o conteúdo é estável e pequeno.

**Opção C: presets em `<slug>.examples.ts`**

Arquivo `src/components/ui/<slug>/<slug>.examples.ts` exporta `export const DESTRUCTIVE = { variant: 'destructive', ... }` consumido por stories E docs page.

**Nunca misture abordagens** — se escolher A, todas as variantes vêm de translations; se B, todas usam o wrapper.

### Validação antes de commit

Para cada variante exibida na docs page, confirme que:
- [ ] Existe uma story com o mesmo nome (ex: `Variantes/Destructive`)
- [ ] O título, descrição, ícone e classes batem byte-a-byte
- [ ] Se a story usa `AlertStory`, a docs page também usa `AlertStory` (não `<Alert>` inline com markup diferente)

Se a docs page mostra Alert destructive com "Erro ao salvar" mas a story mostra com "Atenção", **a story está certa** — ela é a fonte de verdade visual. Alinhe a docs page à story.

---

## Fontes de Referência — Leia ANTES de qualquer ação

1. `design-system-svelte/src/components/ui/alert/alert.stories.ts` — Playground + play functions (REFERÊNCIA)
2. `design-system-svelte/src/components/ui/alert/alert-variantes.stories.ts` — variantes
3. `design-system-svelte/src/components/ui/alert/alert-estados.stories.ts` — estados
4. `design-system-svelte/src/components/ui/alert/alert-composicoes.stories.ts` — composições
5. `design-system-svelte/src/components/ui/alert/AlertStory.svelte` — wrapper para stories
6. `design-system-svelte/src/components/docs/AlertDocs.svelte` — docs page completa (REFERÊNCIA)
7. `design-system-svelte/src/lib/withAutoDocsTab` — bridge para docs tab
8. `design-system-svelte/.storybook/preview.ts` — configuração global
9. `docs/shared/guidelines/08-docs-pages-foundations.md` — checklist

---

## PADRÃO CRÍTICO — Slot Content em Storybook 10

Storybook 10 para Svelte 5 **não** suporta `slot` na render function. `SvelteStoryResult` aceita apenas `Component`, `props` e `decorator` — qualquer `slot` property é ignorada silenciosamente.

### Solução: Wrapper Component

Para cada componente que precisa de children nas stories, crie um wrapper Svelte 5:

```svelte
<!-- ComponentStory.svelte -->
<script lang="ts">
  import { Component, type ComponentVariant, type ComponentSize } from '@/components/ui/<slug>';

  let {
    label = 'Label',
    variant = 'default' as ComponentVariant,
    size = 'default' as ComponentSize,
    disabled = false,
    ...rest
  } = $props();
</script>

<Component {variant} {size} {disabled} {...rest}>
  {@html label}
</Component>
```

### Uso nas Stories

```ts
import { Component } from '@/components/ui/<slug>';
import ComponentStory from './ComponentStory.svelte';

// Story principal — component real para argTypes, wrapper para render
const meta = {
  title: 'UI/Component',
  component: Component,
  args: { variant: 'default', size: 'default', disabled: false, onClick: fn() },
} satisfies Meta<typeof Component>;

export const Playground: Story = {
  render: (args) => ({
    Component: ComponentStory,
    props: { ...args, label: 'Component' },
  }),
};

// Sub-stories — wrapper direto no meta, sem render function
const variantsMeta = {
  title: 'UI/Component/Variantes',
  component: ComponentStory,
  args: { label: 'Botão', variant: 'default' },
} satisfies Meta<typeof ComponentStory>;
```

### Para HTML complexo (ícones, composições)

O `{@html label}` no wrapper renderiza HTML inline:

```ts
export const WithIcon: Story = {
  args: { label: `<svg ...></svg> Enviar email` },
};
```

---

## Artefatos a Criar

### 1. Wrapper de Story (`<ComponentName>Story.svelte`)

- Localização: `src/components/ui/<slug>/<ComponentName>Story.svelte` (dentro da pasta do componente)
- Svelte 5 syntax (`$props()`)
- Props: desestruturar variantes do componente + `label` para children
- Render: `{@html label}` como children do componente

### 2. Story Principal (`<slug>.stories.ts`)

**Localização**: `src/components/ui/<slug>/<slug>.stories.ts` (todos os arquivos de story ficam dentro da pasta do componente, igual ao Vue)

```ts
import type { Meta, StoryObj } from '@storybook/svelte';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Component } from '@/components/ui/<slug>';
import ComponentStory from './ComponentStory.svelte';
import ComponentDocs from '@/components/docs/ComponentDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Component',
  component: Component,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(ComponentDocs) },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', ...] },
    size: { control: 'select', options: ['default', 'sm', 'lg', ...] },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  args: { variant: 'default', size: 'default', disabled: false, onClick: fn() },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: ComponentStory,
    props: { ...args, label: 'Component' },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByRole('button');

    await step('Clica no botão habilitado', async () => {
      await userEvent.click(el);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
    // + estado, foco, Enter, Space
  },
};
```

### 3–5. Variantes, Tamanhos, Estados, Composições

```ts
const meta = {
  title: 'UI/Component/Variantes',
  component: ComponentStory,
  args: { label: 'Botão', variant: 'default', disabled: false },
} satisfies Meta<typeof ComponentStory>;

export const Default: Story = { args: { variant: 'default' } };
export const Outline: Story = { args: { variant: 'outline' } };
```

Stories de **Estados** devem ter play functions testando o DOM:

```ts
export const Disabled: Story = {
  args: { disabled: true, label: 'Desabilitado' },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const el = canvas.getByRole('button');
    await step('Botão está desabilitado', async () => {
      await expect(el).toBeDisabled();
      await userEvent.click(el, { pointerEventsCheck: 0 });
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
};
```

### 6. Docs Page (`ComponentDocs.svelte`)

**REGRA OBRIGATÓRIA: Use o componente real de `components/ui/`.** Todos os demos e exemplos DEVEM importar o componente instalado via shadcn-svelte e usá-lo diretamente. Nunca recrie com HTML ou classes Tailwind inline.

```svelte
<!-- ✅ CORRETO -->
<script lang="ts">
  import * as Alert from '@/components/ui/alert';
</script>
<Alert.Root variant="destructive">
  <Alert.Title>Erro ao salvar</Alert.Title>
  <Alert.Description>Verifique sua conexão e tente novamente.</Alert.Description>
</Alert.Root>

<!-- ❌ ERRADO -->
<div class="bg-destructive/10 text-destructive border rounded-md px-4 py-2">Erro ao salvar</div>
```

**REGRA CRÍTICA: Cada stack deve ser independente.** A docs page Svelte DEVE renderizar TODO o conteúdo das 15 seções usando `translations.json`. NUNCA use placeholders ou mensagens referindo a outras stacks.

**Referência obrigatória**: Leia `design-system-svelte/src/components/docs/AlertDocs.svelte` inteiro antes de criar qualquer docs page. É o modelo completo para Svelte.

```svelte
<script lang="ts">
  import * as Alert from '@/components/ui/alert';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import uiTranslations from '@/i18n/ui.json';
  import componentTranslations from '@shared/content/<slug>/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(componentTranslations);

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('seo.description'),
      locale: l,
      componentSlug: '<slug>',
    });
    track('docs_page_view', { component_name: '<slug>', locale: l, page_title: `${t('title')} · Design System` });
    return cleanup;
  });

  let activeSection = $state('demonstracao');

  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')    },
        { id: 'variantes',    label: tNav('nav.variants')  },
        { id: 'estados',      label: tNav('nav.states')    },
        { id: 'propriedades', label: tNav('nav.props')     },
        { id: 'tokens',       label: tNav('nav.tokens')    },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });
</script>
```

#### Layout obrigatório — duas colunas com nav sticky

```svelte
<div class="ds-docs p-8 max-w-5xl mx-auto">
  <header class="mb-12 border-b pb-8 border-border/50">
    <!-- badges, LanguageSwitcher, h1, description -->
  </header>

  <div class="flex gap-16 items-start">
    <nav aria-label="Navegação das seções do componente"
         class="sticky top-8 w-52 shrink-0 self-start space-y-5">
      <!-- NAV_GROUPS inline — ver AlertDocs.svelte como referência -->
    </nav>

    <div class="flex-1 min-w-0 space-y-12">  <!-- min-w-0 obrigatório: sem ele tabelas e code blocks vazam para fora do container -->
      <section id="demonstracao">...</section>
      <!-- demais seções -->
    </div>
  </div>
</div>
```

#### Seções obrigatórias (TODAS com conteúdo real do translations.json)

1. **Header** — badges (`<Badge>`), `<LanguageSwitcher />`, h1, description, install badge
2. **Demonstração** (`id="demonstracao"`) — demos interativos com o componente real
3. **Anatomia** (`id="anatomia"`) — lista numerada + bloco ASCII de estrutura
4. **Quando Usar** (`id="quando-usar"`) — guidelines, tabela de cenários, UX Writing, Do/Don't
5. **Do & Don't** (`id="do-dont"`) — **layout obrigatório: dois grids separados (um por par), cada um com DO à esquerda e DON'T à direita, dentro de card wrapper**

  **ERRO COMUM**: usar `{#each [1, 2] as i}` em um único grid — empilha DO+DON'T na mesma coluna, produzindo DO|DO em cima e DON'T|DON'T em baixo. Isso está ERRADO.

  ```svelte
  <!-- ✅ CORRETO: dois grids separados -->
  <section id="do-dont">
    <h2 class="text-xl font-semibold mb-4">{$tStore('doDont.title')}</h2>
    <!-- card wrapper obrigatório -->
    <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
      <div class="space-y-8 w-full">

        <!-- Pair 1: grid próprio -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-green-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-xs font-bold flex-shrink-0">✓</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.do')}</span>
            </div>
            <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
              <!-- preview visual com componente real -->
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.do')}</p>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-red-600">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-xs font-bold flex-shrink-0">✗</span>
              <span class="text-sm font-semibold uppercase tracking-wider">{$tNavStore('common.dont')}</span>
            </div>
            <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
              <!-- preview visual -->
            </div>
            <p class="text-sm text-muted-foreground italic px-1">{$tStore('doDont.pair1.dont')}</p>
          </div>
        </div>

        <!-- Pair 2: segundo grid separado — mesma estrutura -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- ... -->
        </div>

      </div>
    </div>
  </section>

  <!-- ❌ ERRADO: each gera layout invertido -->
  <!-- {#each [1, 2] as i}<div class="space-y-3">DO + DON'T empilhados</div>{/each} -->
  ```

  - Labels via `$tNavStore('common.do')` / `$tNavStore('common.dont')` (requer `const { tStore: tNavStore } = useTranslation(uiTranslations)`)
  - Preview boxes contêm o componente real (`<Alert.Root>`, etc.) ou texto semântico
6. **Importação** (`id="importacao"`) — blocos de código
7. **Variantes** (`id="variantes"`) — cards com título/descrição + preview real + toggle de código por variante (DocsVariants absorveu a antiga seção Exemplos)
8. **Estados** (`id="estados"`) — tabela
9. **Propriedades** (`id="propriedades"`) — tabela de props
10. **Tokens** (`id="tokens"`) — tabela de tokens CSS
11. **Acessibilidade** (`id="acessibilidade"`) — lista + cards de teclado
12. **Relacionados** (`id="relacionados"`) — cards com links
13. **Notas** (`id="notas"`) — callouts
14. **Analytics** (`id="analytics"`) — tabela de eventos GA4
15. **Testes** (`id="testes"`) — 3 sub-seções: funcional, acessibilidade, visual

#### Padrões Svelte para conteúdo

```svelte
<!-- Texto com HTML de translations -->
{@html sanitizeHtml($tStore('anatomy.item1'))}

<!-- Loops -->
{#each [1, 2, 3] as i}
  <li>{@html sanitizeHtml($tStore(`usage.guidelines.item${i}`))}</li>
{/each}

<!-- Links internos Storybook (nunca <a href="#">) -->
<div role="link" tabindex="0"
  onclick={() => { (window.top ?? window).location.href = path; }}
  onkeydown={(e) => { if (e.key === 'Enter') (window.top ?? window).location.href = path; }}>
```

---

## Regras Críticas de Renderização

### Blocos de código — NUNCA `<pre>`

```svelte
<!-- ✅ CORRETO -->
<div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
  <code class="whitespace-pre">{`import * as Alert from '@/components/ui/alert';`}</code>
</div>

<!-- ❌ ERRADO -->
<pre class="..."><code>...</code></pre>
```

Exceção: `<pre>` apenas para diagramas ASCII (`anatomy.structureCode`), sempre com wrapper `overflow-x-auto`:
```svelte
<div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
  <pre class="font-mono text-sm whitespace-pre">{$tStore('anatomy.structureCode')}</pre>
</div>
```

### Tabelas — card wrapper obrigatório

```svelte
<!-- ✅ CORRETO -->
<div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
  <table class="w-full text-sm">...</table>
</div>

<!-- ❌ ERRADO — overflow-hidden corta o conteúdo -->
<div class="rounded-lg border border-border overflow-hidden">
  <div class="overflow-x-auto"><table>...</table></div>
</div>
```

### Tabela de estados — nome em texto plano

```svelte
<!-- ✅ CORRETO -->
<td class="p-3 border-r border-border font-medium">{$tStore(`states.${key}.label`)}</td>

<!-- ❌ ERRADO — nunca badge/pill no nome do estado -->
<td><span class="inline-flex rounded-full border px-2 ...">...</span></td>
```

### Badges — sempre `<Badge>` do componente

```svelte
<!-- Header -->
<Badge variant="secondary" class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
  {$tStore('category')}
</Badge>
<Badge variant="outline" class="rounded-md text-muted-foreground font-normal px-2 py-0">
  {$tStore('type')}
</Badge>

<!-- Prioridade em testes -->
{@const isHigh = $tStore(`testes.functional.item${i}.priority`) === 'high'}
<Badge class={isHigh
  ? "rounded-md bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 font-medium text-[11px]"
  : "rounded-md bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 font-medium text-[11px]"}>
  {isHigh ? $tNavStore('common.high') : $tNavStore('common.medium')}
</Badge>
```

### CSS obrigatório em `storybook-docs.css`

```css
/* Remove margin-block que o Storybook injeta em <table> */
.ds-docs table { margin: 0; }
```

---

## Regras Absolutas

- **NUNCA** use `slot: 'text'` na render function — ignorado pelo Storybook 10
- **NUNCA** use `createRawSnippet` para children — não funciona via spread props
- **SEMPRE** use wrapper `.svelte` para conteúdo children nas stories
- **SEMPRE** use `{@html label}` no wrapper (não `{label}`) para suportar SVG
- **SEMPRE** importe de pasta: `from '@/components/ui/<slug>'`
- Play functions usam `storybook/test` (mesma API que React e Vue)

---

## Section Components — Uso Obrigatório na Docs Page

**ANTES de escrever qualquer template inline na docs page**, verifique se os section containers genéricos existem:

```bash
ls design-system-svelte/src/components/docs/shared/sections/ 2>/dev/null
```

Se existirem (`DocsDoDont.svelte`, `DocsVariants.svelte`, etc.), **use-os**. Se não existirem, rode `/docs-sections --stack svelte` primeiro.

**Imports na docs page:**
```svelte
<script lang="ts">
  import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.svelte';
  import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.svelte';
  import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.svelte';
  import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.svelte';
  import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.svelte';
  import DocsImport        from '@/components/docs/shared/sections/DocsImport.svelte';
  import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.svelte';
  import DocsStates        from '@/components/docs/shared/sections/DocsStates.svelte';
  import DocsProps         from '@/components/docs/shared/sections/DocsProps.svelte';
  import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.svelte';
  import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.svelte';
  import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.svelte';
  import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.svelte';
  import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.svelte';
  import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.svelte';
</script>
```

Previews visuais (DoDont, Variants, Demonstration) são passados como **Snippets Svelte 5** via `{#snippet}` + `{@render}`. Ver API completa em `docs-sections.md`.

---

## Checklist Final

- [ ] **Passo 0**: componente existe em `src/components/ui/<slug>/` (instalado via CLI se necessário)
- [ ] **Passo 0**: `index.ts` lido — exports conhecidos antes de criar stories/docs
- [ ] **Passo 3**: containers em `shared/sections/` existem (ou rode `/docs-sections --stack svelte`)
- [ ] **Docs page composta apenas por `Docs*` de `shared/sections/` + componentes de `components/ui/`** — zero HTML inline replicando layouts de seção
- [ ] **Paridade stories ↔ docs page**: cada Alert/etc mostrado em Demonstração/Variantes/Estados usa os MESMOS props da story correspondente (título, descrição, ícone, classes batem byte-a-byte)
- [ ] Fonte de verdade única escolhida (translations.json / wrapper reuse / examples.ts) e mantida em todas as seções
- [ ] Wrapper `ComponentStory.svelte` com Svelte 5 syntax + import de pasta
- [ ] Story principal com `component: Component` (real) + render com wrapper
- [ ] Sub-stories com `component: ComponentStory` no meta, sem render function
- [ ] Play functions (Playground + Estados) testadas
- [ ] Docs page com bridge via `withAutoDocsTab`
- [ ] `translations.json` de `@shared/content/<slug>/`
- [ ] SEO + Analytics com `$effect()`
- [ ] **TODAS as 15 seções com conteúdo real**
- [ ] `sanitizeHtml` em todo `{@html}` com conteúdo de translations
- [ ] `<LanguageSwitcher />` no header
- [ ] `<Badge>` para badges de header e prioridade (nunca raw `<span>`)
- [ ] `<nav>` sticky com `sticky top-8 w-52 shrink-0 self-start` no layout `flex gap-16`
- [ ] Blocos de código com `<div><code>`, nunca `<pre><code>`
- [ ] Conteúdo visualmente idêntico ao React

---

## Commit de Rastreabilidade

Ao finalizar todos os artefatos, execute:

```bash
git add -A
git commit -m "skill(dev-svelte): $ARGUMENTS"
```

Se nenhum arquivo foi criado ou modificado, não faça commit.
