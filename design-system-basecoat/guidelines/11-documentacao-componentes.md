# Estrutura Padronizada de Documentação de Componentes (Basecoat)

## Visão Geral

A documentação é composta de duas partes:

1. **ComponentDocs** — função TypeScript que retorna `HTMLElement` com a documentação visual.
2. **Stories** — arquivos `@storybook/html` que expõem o componente.

**Referência**: `STORYBOOK-ARCHITECTURE.md`

---

## Parte 1 — ComponentDocs (arquivo TypeScript)

### Arquivo e exportação

```
src/components/docs/NomeComponenteDocs.ts
```

```ts
import { applyStorybookSeo } from '@/lib/use-seo';

export function createNomeComponenteDocs(): HTMLElement {
  applyStorybookSeo({
    title: 'NomeComponente — Categoria · Design System',
    description: 'Documentação do NomeComponente: [N] variantes, estados interativos e exemplos.',
    locale: 'pt-BR',
    componentSlug: 'nome-componente',
  });

  const root = document.createElement('div');
  root.className = 'p-8 max-w-5xl mx-auto';

  root.appendChild(createHeader());
  root.appendChild(createContent());

  return root;
}

function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'ds-docs mb-12 border-b pb-8 border-border/50';

  // Badges
  const badges = document.createElement('div');
  badges.className = 'flex items-center gap-2 mb-4';
  // ... adicionar badge de categoria e tipo

  // Título
  const h1 = document.createElement('h1');
  h1.className = 'text-4xl font-bold tracking-tight text-foreground';
  h1.textContent = 'NomeComponente';

  // Descrição
  const desc = document.createElement('p');
  desc.className = 'text-muted-foreground max-w-3xl';
  desc.textContent = 'Descrição do componente.';

  header.append(badges, h1, desc);
  return header;
}
```

### SEO — `applyStorybookSeo` obrigatório

Todo ComponentDocs **deve** chamar `applyStorybookSeo` de `@/lib/use-seo.ts`. Ele detecta o iframe do Storybook e escreve metatags no documento pai automaticamente.

> Ver `../../docs/shared/guidelines/06-seo-geo.md`.

---

## As 14 Seções

Cada seção é uma função que retorna `HTMLElement`:

```ts
function createSection(id: string, title: string, content: HTMLElement): HTMLElement {
  const section = document.createElement('section');
  section.id = id;

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = title;

  section.append(h2, content);
  return section;
}

// Seção 2 — Demonstração
function createDemoSection(): HTMLElement {
  const demo = document.createElement('div');
  demo.className = 'rounded-md border border-border p-6';
  demo.appendChild(createButton({ label: 'Exemplo', variant: 'default' }));
  return createSection('demonstracao', 'Demonstração Padrão', demo);
}
```

**Seções obrigatórias** (mesmas 14 do padrão React):
1. Header (Hero)
2. Demonstração Padrão
3. Anatomia
4. Quando e Como Usar (tabela de cenários + UX Writing)
5. Do & Don't
6. Importação
7. Exemplos de Código
8. Variantes e Tamanhos
9. Estados
10. Propriedades / Opções
11. Design Tokens
12. Acessibilidade
13. Componentes Relacionados
14. Notas e Dicas
(15. Critérios de Teste)

---

## Parte 2 — Stories (`@storybook/html`)

### Estrutura de arquivos

```
src/components/ui/
  ├── nome-componente.ts                      (função createNomeComponente)
  ├── nome-componente.stories.ts              (meta + Playground)
  ├── nome-componente-variantes.stories.ts
  ├── nome-componente-tamanhos.stories.ts
  ├── nome-componente-composicoes.stories.ts
  └── nome-componente-estados.stories.ts
```

### Arquivo Principal

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { fn, userEvent, within, expect } from '@storybook/test';
import { createNomeComponente, type NomeComponenteOptions } from './nome-componente';
import { createNomeComponenteDocs } from '../../components/docs/NomeComponenteDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type Args = NomeComponenteOptions;

const meta: Meta<Args> = {
  title: 'UI/NomeComponente',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createNomeComponenteDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost'],
      description: 'Estilo visual do componente',
    },
    label: {
      control: 'text',
      description: 'Texto exibido no componente',
    },
  },
  args: {
    label: 'Botão',
    variant: 'default',
  },
  render: (args) => {
    return createNomeComponente(args);
  },
};

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('button');

    await step('Elemento está acessível', async () => {
      await expect(element).toBeInTheDocument();
      await expect(element).toBeEnabled();
    });

    await step('Recebe foco via teclado', async () => {
      element.focus();
      await expect(element).toHaveFocus();
    });
  },
};
```

### Variantes

```ts
import type { Meta, StoryObj } from '@storybook/html';
import { createNomeComponente, type NomeComponenteOptions } from './nome-componente';

const meta: Meta<NomeComponenteOptions> = {
  title: 'UI/NomeComponente/Variantes',
  render: (args) => createNomeComponente(args),
  args: { label: 'Exemplo' },
};

export default meta;
type Story = StoryObj<NomeComponenteOptions>;

export const Default: Story = {
  args: { variant: 'default' },
  parameters: { docs: { description: { story: 'Variante padrão para ações primárias.' } } },
};
```

---

## Checklist de implementação

- [ ] `translations.json` criado em `src/components/docs/content/{slug}/`
- [ ] `createNomeComponenteDocs()` com as 14 seções
- [ ] `applyStorybookSeo` chamado com `{ title, description, locale, componentSlug }`
- [ ] 5 arquivos de stories (ou menos se não aplicável)
- [ ] Story principal com `parameters.docs.page: withAutoDocsTab(createNomeComponenteDocs)`
- [ ] Playground com play function
- [ ] Todos os argTypes com description em pt-BR
- [ ] `render` retorna `HTMLElement` criado pela função de componente
