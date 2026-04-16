# Categoria Showcase — Estrutura e Instruções (Svelte)

## Visão Geral

Cada categoria (Layout, Navigation, Form, Feedback, Display, Disclosure, Overlay) pode ter uma página "Showcase" com **todas as variantes** dos seus componentes em uma única página navegável.

## Estrutura Obrigatória

### Arquivo

```
src/components/docs/[Categoria]ShowcaseDocs.svelte
```

### Componente exportado (default export)

```svelte
<!-- src/components/docs/LayoutShowcaseDocs.svelte -->
<script lang="ts">
  import { Separator } from '$lib/components/ui/separator';
  import { Card, CardContent } from '$lib/components/ui/card';
  // Importar componentes da categoria
</script>

<div class="flex-1 h-full">
  <div class="p-8 space-y-12 max-w-6xl mx-auto">
    <header>
      <h1>Layout Components — Showcase</h1>
      <p class="text-muted-foreground">
        Visualização completa de todas as variantes dos componentes de Layout.
      </p>
    </header>

    <Separator />

    <!-- Seção por componente -->
    <section class="space-y-6">
      <div>
        <h2 class="mb-2">Card</h2>
        <p class="text-sm text-muted-foreground">Variantes do Card.</p>
      </div>

      <div class="rounded-md border border-border p-6">
        <div class="space-y-6">
          <div>
            <h4 class="mb-2">Padrão</h4>
            <Card class="bg-card text-card-foreground">
              <CardContent class="p-4">Exemplo de Card</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>

    <Separator />

    <!-- Seção Final: Exemplo Combinado (obrigatória) -->
    <section class="space-y-6">
      <div>
        <h2 class="mb-2">Exemplo Combinado</h2>
        <p class="text-sm text-muted-foreground">
          Demonstração de múltiplos componentes de Layout trabalhando juntos.
        </p>
      </div>
      <div class="rounded-md border border-border p-6">
        <!-- Composição de componentes da categoria -->
      </div>
    </section>
  </div>
</div>
```

## Regras de Estilo

- ❌ Sem classes de tipografia proibidas: `text-xl`, `text-2xl`, `font-bold`, `leading-*`
- ✅ Exceção: `text-sm` é permitido
- ✅ `text-muted-foreground` para textos secundários
- ✅ `space-y-12` entre seções, `space-y-6` entre variantes

## Integração com Storybook (obrigatória)

### 1. Arquivo MDX unattached

```mdx
{/* src/components/docs/LayoutShowcaseDocs.mdx */}
import { Meta } from '@storybook/blocks';
import LayoutShowcaseDocs from './LayoutShowcaseDocs.svelte';

<Meta title="UI/Layout/Showcase" />
<LayoutShowcaseDocs />
```

### 2. Stub de stories

```ts
// src/lib/components/ui/layout-showcase.stories.ts
export default { title: 'UI/Layout/Showcase' };
```

**Resultado na sidebar**:
```
UI / Layout
  └── Showcase
```

## Integração com App.svelte (opcional — sandbox)

```ts
// Apenas para desenvolvimento local no sandbox
import LayoutShowcaseDocs from './components/docs/LayoutShowcaseDocs.svelte';
```

## Checklist

- [ ] Arquivo segue padrão: `[Categoria]ShowcaseDocs.svelte`
- [ ] Header com título h1 e descrição `text-muted-foreground`
- [ ] `Separator` após o header
- [ ] Uma seção por componente com `space-y-6`
- [ ] Pelo menos 3 variantes por componente
- [ ] `Separator` entre seções
- [ ] Seção "Exemplo Combinado" ao final
- [ ] Arquivo MDX unattached criado
- [ ] Stub de stories criado
- [ ] Sem classes de tipografia proibidas (exceto `text-sm`)
