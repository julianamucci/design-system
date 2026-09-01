# Arquitetura do Projeto — Documentação (Vue)

Este documento descreve a arquitetura técnica, estrutura de pastas e padrões organizacionais do projeto de documentação para Vue 3.

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
│   ├── ui/                          # Componentes base (Reka UI)
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

```
div            (moldura da aplicação, altura da janela, sem rolagem própria)
├── link de pular para o conteúdo   (visível só no foco)
├── aside      (sidebar: logo, nav de categorias em accordion, ThemeSelector)
└── div        (área principal)
    ├── header (alternância de modo claro/escuro)
    └── main#main-content
        └── página inicial, ou a docs page carregada sob demanda com fallback
```

O vocabulário do design system para esta forma é a família `.nds-app-*` (`.nds-app`, `.nds-app-sidebar`, `.nds-app-main`, `.nds-app-content`, `.nds-app-header`), na folha `app-shell.css`. O `App.vue` desta stack ainda não a adota por inteiro — é sandbox, não produto, e por isso não passou pela migração. Vale registrar a diferença em vez de descrevê-la como se já estivesse feita.

---

### 2. HomePage.vue — Landing Page

**Props**: nenhuma
**Emits**: `navigate(path: string)`

**Seções**:
1. Header com logo e descrição
2. "Por que usar o Design System?" (3 cards)
3. Componentes Populares (grid de 6 botões)
4. Como Navegar na Documentação (4 etapas)
5. CTA final

---

### 3. ComponentDemo.vue — Wrapper para Demos

Um `Card` com a classe `.nds-docs-demo` e o marcador `data-docs-preview="demonstracao"`, envolvendo o slot. A moldura — respiro, borda, raio e elevação — é da folha `docs-demo.css`; o wrapper não declara nada por conta própria.

---

### 4. DocsNav.vue — Navegação Lateral de Seções

**Localização**: `src/components/docs/shared/DocsNav.vue`
**Props**: `groups: Array<{ label, sections: Array<{ id, label }> }>`, `activeSection: string`

Navegação lateral das seções, montada dentro do `<nav>` que o `DocsPageLayout` já provê. As duas colunas e a fixação da navegação são de `.nds-sidebar-layout[data-sidebar-sticky="true"]` — a folha faz o sticky, a largura da coluna e o alinhamento ao topo; o `<nav>` só carrega `.nds-stack` com `data-spacing="md"` e o `aria-label`. Usa `IntersectionObserver` via `onMounted`/`onUnmounted` para detectar a seção ativa.

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
