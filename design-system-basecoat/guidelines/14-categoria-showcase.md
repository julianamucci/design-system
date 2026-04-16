# Categoria Showcase — Estrutura e Instruções (Basecoat)

## Visão Geral

Cada categoria pode ter uma página "Showcase" com todas as variantes dos seus componentes em uma única página navegável.

## Estrutura

### Arquivo

```
src/components/docs/[Categoria]ShowcaseDocs.ts
```

### Função exportada

```ts
// src/components/docs/LayoutShowcaseDocs.ts

import { createCard } from '../ui/card';
import { createSeparator } from '../ui/separator';
import { cn } from '@/lib/utils';

export function createLayoutShowcaseDocs(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'flex-1 h-full';

  const container = document.createElement('div');
  container.className = 'p-8 space-y-12 max-w-6xl mx-auto';

  // Header
  const header = document.createElement('header');
  const h1 = document.createElement('h1');
  h1.textContent = 'Layout Components — Showcase';
  const headerDesc = document.createElement('p');
  headerDesc.className = 'text-muted-foreground';
  headerDesc.textContent = 'Visualização completa de todas as variantes dos componentes de Layout.';
  header.append(h1, headerDesc);

  container.append(header, createSeparator());
  container.append(createCardSection());
  container.append(createSeparator());
  container.append(createCombinedSection());

  root.appendChild(container);
  return root;
}

function createCardSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'space-y-6';

  const sectionHeader = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.className = 'mb-2';
  h2.textContent = 'Card';
  const desc = document.createElement('p');
  desc.className = 'text-sm text-muted-foreground';
  desc.textContent = 'Variantes do componente Card.';
  sectionHeader.append(h2, desc);

  const demo = document.createElement('div');
  demo.className = 'rounded-md border border-border p-6';

  const variants = document.createElement('div');
  variants.className = 'space-y-6';

  const variant1 = document.createElement('div');
  const h4 = document.createElement('h4');
  h4.className = 'mb-2';
  h4.textContent = 'Padrão';
  variant1.append(h4, createCard({ title: 'Card Padrão', description: 'Exemplo de card completo', content: 'Conteúdo do card.' }));
  variants.appendChild(variant1);

  demo.appendChild(variants);
  section.append(sectionHeader, demo);
  return section;
}

function createCombinedSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'space-y-6';

  const header = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.className = 'mb-2';
  h2.textContent = 'Exemplo Combinado';
  const desc = document.createElement('p');
  desc.className = 'text-sm text-muted-foreground';
  desc.textContent = 'Demonstração de múltiplos componentes de Layout trabalhando juntos.';
  header.append(h2, desc);

  const demo = document.createElement('div');
  demo.className = 'rounded-md border border-border p-6';
  // Compor múltiplos componentes aqui

  section.append(header, demo);
  return section;
}
```

## Integração com Storybook (obrigatória)

### 1. Arquivo MDX unattached

```mdx
{/* src/components/docs/LayoutShowcaseDocs.mdx */}
import { Meta } from '@storybook/blocks';
import { createLayoutShowcaseDocs } from './LayoutShowcaseDocs';

<Meta title="UI/Layout/Showcase" />

export const Page = () => createLayoutShowcaseDocs();
<Page />
```

### 2. Stub de stories

```ts
// src/components/ui/layout-showcase.stories.ts
export default { title: 'UI/Layout/Showcase' };
```

## Regras de Estilo

- ❌ Sem classes de tipografia proibidas (exceto `text-sm`)
- ✅ `text-muted-foreground` para textos secundários
- ✅ `space-y-12` entre seções, `space-y-6` entre variantes
- ✅ `text-sm` é a única classe de tamanho de texto permitida

## Regras Críticas

1. ✅ Estrutura: Header → Separator → Seções → Separators → Exemplo Combinado
2. ✅ Mínimo 3 variantes por componente
3. ✅ Seção "Exemplo Combinado" obrigatória ao final
4. ✅ Integração Storybook obrigatória: MDX + stub stories
5. ❌ Sem `innerHTML` com dados do usuário
6. ✅ Usar `textContent` para texto dinâmico

## Checklist

- [ ] Arquivo: `[Categoria]ShowcaseDocs.ts`
- [ ] Função exportada: `create[Categoria]ShowcaseDocs(): HTMLElement`
- [ ] Header com h1 e descrição
- [ ] `createSeparator()` após o header
- [ ] Seção por componente com `space-y-6`
- [ ] Pelo menos 3 variantes por componente
- [ ] `createSeparator()` entre seções
- [ ] Seção "Exemplo Combinado" ao final
- [ ] Arquivo MDX unattached criado
- [ ] Stub de stories criado
