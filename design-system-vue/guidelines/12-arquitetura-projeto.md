# Arquitetura do Projeto — Shadcn/UI Documentation (Vue)

Este documento descreve a arquitetura técnica, estrutura de pastas e padrões organizacionais do projeto de documentação Shadcn/UI para Vue 3.

---

## Estrutura de Diretórios

```
/
├── App.vue                          # Entry point e roteamento principal
├── styles/
│   └── globals.css                  # Design system, variáveis CSS, temas
├── components/
│   ├── HomePage.vue                 # Página inicial
│   ├── ComponentDemo.vue            # Wrapper para demos de componentes
│   ├── docs/shared/DocsNav.vue      # Navegação lateral sticky de seções
│   ├── ThemeSelector.vue            # Seletor de temas
│   ├── ui/                          # Componentes Shadcn Vue base
│   └── docs/                        # Páginas de documentação (.vue)
├── composables/                     # Composables reutilizáveis
│   └── use-mobile.ts
└── lib/
    └── utils.ts                     # cn() helper
```

---

## Componentes Principais

### 1. App.vue — Entry Point

**Responsabilidades**:
- Gerenciamento de roteamento baseado em estado (`currentPage` ref)
- Controle de tema claro/escuro (`isDark` ref)
- Controle de tema personalizado (`currentTheme` ref)
- Renderização da sidebar e conteúdo principal
- Aplicação de classes de tema no `<html>`

**Estrutura do template**:
```html
<div class="flex h-screen overflow-hidden">
  <!-- Sidebar (aside) -->
  <aside>
    <!-- Logo -->
    <!-- nav com botões de categoria accordion -->
    <!-- ThemeSelector -->
  </aside>

  <!-- Main area -->
  <div class="flex-1 flex flex-col">
    <header><!-- dark mode toggle --></header>
    <main id="main-content">
      <HomePage v-if="currentPage === 'home'" />
      <Suspense v-else-if="currentComponent">
        <component :is="currentComponent" />
        <template #fallback>...</template>
      </Suspense>
    </main>
  </div>
</div>
```

---

### 2. HomePage.vue — Landing Page

**Props**: nenhuma
**Emits**: `navigate(path: string)`

**Seções**:
1. Header com logo e descrição
2. "Por que usar Shadcn/UI?" (3 cards)
3. Componentes Populares (grid de 6 botões)
4. Como Navegar na Documentação (4 etapas)
5. CTA final

---

### 3. ComponentDemo.vue — Wrapper para Demos

```html
<template>
  <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
    <slot />
  </div>
</template>
```

---

### 4. DocsNav.vue — Navegação Lateral de Seções

**Localização**: `src/components/docs/shared/DocsNav.vue`
**Props**: `groups: Array<{ label, sections: Array<{ id, label }> }>`, `activeSection: string`

Navegação lateral (sidebar) que deve ser envolvida por um wrapper `<nav>` com `sticky top-8 w-52 shrink-0 self-start` no layout de duas colunas (`flex gap-16 items-start`). Usa `IntersectionObserver` via `onMounted/onUnmounted` para detectar seção ativa.

---

### 5. ThemeSelector.vue — Seletor de Temas

**Props**: `currentTheme: string`
**Emits**: `themeChange(theme: string)`

---

## Sistema de Roteamento

**Sem Vue Router** — roteamento via estado local no App.vue:

```ts
const currentPage = ref('home')
const currentComponent = shallowRef(null)

watch(currentPage, () => {
  if (currentPage.value !== 'home' && lazyDocs[currentPage.value]) {
    currentComponent.value = lazyDocs[currentPage.value]
  } else {
    currentComponent.value = null
  }
})
```

Lazy loading via `defineAsyncComponent` para todas as 66 páginas de documentação.

---

## Temas e Dark Mode

**Temas**: `default` | `tema-personalizado`

**Aplicação via `watch`**:
```ts
watch([currentPage, isDark, currentTheme], () => {
  document.documentElement.classList.remove('default', 'tema-personalizado', 'dark')
  if (currentTheme.value === 'tema-personalizado') {
    document.documentElement.classList.add('tema-personalizado')
  }
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
}, { immediate: true })
```

---

## Composables

### useIsMobile
```ts
import { useIsMobile } from '@/composables/use-mobile'
const { isMobile } = useIsMobile()
```

---

## Padrões de Código Vue 3

### Estrutura de arquivo .vue
```vue
<script setup lang="ts">
// 1. imports Vue
// 2. imports de componentes
// 3. imports de ícones (lucide-vue-next)
// 4. defineProps / defineEmits
// 5. refs e computed
// 6. composables
// 7. funções
// 8. lifecycle (onMounted/onUnmounted)
</script>

<template>
  <!-- HTML semântico -->
</template>
```

### Convenções de nomenclatura

**Arquivos**:
- Componentes: `PascalCase.vue` (ex: `AlertDocs.vue`)
- Composables: `use-camelCase.ts` (ex: `use-mobile.ts`)
- Utilitários: `camelCase.ts` (ex: `utils.ts`)

---

## Adicionar Novo Componente

1. **Criar página de documentação**:
   ```
   /components/docs/NewComponentDocs.vue
   ```
   Seguir template de 15 seções — ver `12-documentacao-componentes.md`.

2. **Registrar no App.vue** em `lazyDocs`:
   ```ts
   'new-component': defineAsyncComponent(() => import('./components/docs/NewComponentDocs.vue')),
   ```

3. **Adicionar em `componentCategories`** no App.vue.
