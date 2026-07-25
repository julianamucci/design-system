---
name: create-showcase
description: Cria uma página Showcase de categoria do design system Vue, exibindo todas as variantes de todos os componentes da categoria em uma única página navegável. Usar quando o usuário pedir para criar um showcase, uma página de demonstração de categoria, ou uma visão geral visual de componentes de uma categoria.
---

# Skill: Create Showcase (Vue)

Cria páginas `[Categoria]ShowcaseDocs.vue` que exibem todas as variantes de todos os componentes de uma categoria.

## Antes de criar

1. Ler `18-categoria-showcase.md` — contém a estrutura obrigatória e padrões de seção
2. Ler **todos** os arquivos de guideline dos componentes da categoria
3. Identificar todas as variantes de cada componente — nunca inventar variantes não documentadas

## Estrutura obrigatória

**Nome do arquivo**: `/components/docs/[Categoria]ShowcaseDocs.vue`

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
// imports de componentes da categoria

onMounted(() => {
  document.title = '[Categoria] — Design System'
})
onUnmounted(() => {
  document.title = 'Design System — Nortear (Vue)'
})
</script>

<template>
  <div class="space-y-16 p-8 max-w-4xl mx-auto">
    <!-- Cabeçalho -->
    <section>
      <h1>[Categoria] Components</h1>
      <p>Descrição da categoria.</p>
    </section>

    <!-- Uma seção por componente -->
    <section id="[componente]">
      <h2>[Componente]</h2>
      <p>Propósito em 1 frase.</p>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
        <!-- variantes com label -->
      </div>
    </section>
  </div>
</template>
```

## Regras de conteúdo

- **Todas as variantes** de todos os componentes da categoria
- Cada variante com label textual identificando o que é
- Estados interativos (hover, focus, disabled) quando relevantes
- Exemplos funcionais — não apenas visuais estáticos
- Nenhuma variante inventada — apenas as documentadas nos guidelines

## Regras de código Vue

- Imports de `@/components/ui/` e `lucide-vue-next`
- Tokens de cor corretos (não inventar classes)
- `aria-label` contextual em elementos interativos do showcase
- Sem lógica de negócio — apenas demonstração visual
- Estado local via `ref()` apenas quando necessário para interatividade

## Categorias e seus arquivos de referência

| Categoria | Guideline | Componentes |
|-----------|-----------|-------------|
| Layout | 04 | AspectRatio, Card, Resizable, ScrollArea, Separator, Sidebar |
| Navigation | 05 | Breadcrumb, Menubar, NavigationMenu, Pagination, Stepper, Tabs |
| Form | 06 | Button, Calendar, Checkbox, Form, Input, InputOTP, Label, RadioGroup, Select, Slider, Switch, Textarea, Toggle |
| Feedback | 07 | Alert, AlertDialog, Badge, Progress, Skeleton, Sonner |
| Display | 08 | Avatar, Carousel, Chart, Table |
| Disclosure | 09 | Accordion, Collapsible |
| Overlay | 10 | AlertDialog, Command, ContextMenu, Dialog, Drawer, DropdownMenu, HoverCard, Popover, Sheet, Tooltip |

## Output

Arquivo `.vue` completo, registrado no `lazyDocs` do App.vue com a chave correspondente.
