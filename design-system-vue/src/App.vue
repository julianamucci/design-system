<script setup lang="ts">
import { ref, watch, defineAsyncComponent, shallowRef } from 'vue'
import {
  Moon, Sun, Home,
  FileText, Database, MessageSquare, Sparkles
} from 'lucide-vue-next'
import HomePage from './components/HomePage.vue'
import ThemeSelector from './components/ThemeSelector.vue'
import { Toaster } from 'vue-sonner'
import DocsEditor from './admin/DocsEditor.vue'

const isAdminView = new URLSearchParams(window.location.search).get('view') === 'admin'

// ─── Lazy-loaded documentation pages ────────────────────────────────────────
const lazyDocs: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'alert':        defineAsyncComponent(() => import('./components/docs/AlertDocs.vue')),
  'checkbox':     defineAsyncComponent(() => import('./components/docs/CheckboxDocs.vue')),
  'icons':        defineAsyncComponent(() => import('./components/docs/IconsDocs.vue')),
}

// ─── State ───────────────────────────────────────────────────────────────────
const currentPage = ref('home')
const isDark = ref(false)
const currentTheme = ref('default')
const sidebarOpen = ref(true)
const openCategories = ref<string[]>([])
const currentComponent = shallowRef<ReturnType<typeof defineAsyncComponent> | null>(null)

watch([currentPage, isDark, currentTheme], () => {
  const html = document.documentElement
  html.classList.remove('dark', 'tema-warm', 'tema-cold')
  if (isDark.value) html.classList.add('dark')
  if (currentTheme.value !== 'default') html.classList.add(`tema-${currentTheme.value}`)

  if (currentPage.value !== 'home' && lazyDocs[currentPage.value]) {
    currentComponent.value = lazyDocs[currentPage.value]
  } else {
    currentComponent.value = null
  }
}, { immediate: true })

function navigateTo(path: string) {
  currentPage.value = path
}

// ─── Navigation categories ───────────────────────────────────────────────────
const componentCategories = [
  {
    name: 'Foundations',
    icon: Sparkles,
    items: [
      { name: 'Icons', path: 'icons' },
    ],
  },
  {
    name: 'Feedback',
    icon: MessageSquare,
    items: [
      { name: 'Alert', path: 'alert' },
    ],
  },
  {
    name: 'Form',
    icon: FileText,
    items: [
      { name: 'Checkbox', path: 'checkbox' },
    ],
  },
]

function toggleCategory(name: string) {
  const idx = openCategories.value.indexOf(name)
  if (idx === -1) {
    openCategories.value.push(name)
  } else {
    openCategories.value.splice(idx, 1)
  }
}

function isCategoryOpen(name: string) {
  return openCategories.value.includes(name)
}
</script>

<template>
  <DocsEditor v-if="isAdminView" />
  <div v-else class="flex h-screen overflow-hidden bg-background text-foreground">
    <!-- Skip to content -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Pular para conteúdo principal
    </a>

    <!-- Sidebar -->
    <aside
      class="w-[280px] shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-full overflow-hidden"
      aria-label="Sidebar de navegação"
    >
      <!-- Sidebar header -->
      <div class="h-16 px-6 border-b border-sidebar-border flex items-center shrink-0">
        <div class="flex items-center gap-2">
          <div
            class="h-8 w-8 bg-primary rounded-md flex items-center justify-center"
            aria-hidden="true"
          >
            <span class="text-primary-foreground font-bold">S</span>
          </div>
          <span class="font-semibold text-[30px] text-sidebar-foreground">Shadcn/UI</span>
        </div>
      </div>

      <!-- Sidebar nav -->
      <div class="flex-1 overflow-y-auto p-4">
        <nav aria-label="Navegação de componentes">
          <div class="space-y-2">
            <!-- Home -->
            <button
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors"
              :class="currentPage === 'home'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'"
              @click="navigateTo('home')"
            >
              <Home class="h-4 w-4" aria-hidden="true" />
              <span>Home</span>
            </button>

            <!-- Categories accordion -->
            <div
              v-for="category in componentCategories"
              :key="category.name"
            >
              <button
                class="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sidebar-foreground"
                :aria-expanded="isCategoryOpen(category.name)"
                @click="toggleCategory(category.name)"
              >
                <span class="flex items-center gap-2">
                  <component :is="category.icon" class="h-4 w-4" aria-hidden="true" />
                  <span>{{ category.name }}</span>
                </span>
                <svg
                  class="h-4 w-4 transition-transform shrink-0"
                  :class="isCategoryOpen(category.name) ? 'rotate-90' : ''"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div v-if="isCategoryOpen(category.name)" class="ml-6 mt-1 space-y-1">
                <button
                  v-for="item in category.items"
                  :key="item.path"
                  class="w-full flex items-center justify-start px-2 h-7 rounded-md text-sm transition-colors"
                  :class="currentPage === item.path
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'"
                  @click="navigateTo(item.path)"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>

            <!-- Theme selector -->
            <div class="mt-4 pt-4 border-t border-sidebar-border">
              <div class="flex items-center justify-between px-2 py-1">
                <span class="text-sm text-sidebar-foreground">Theme</span>
                <ThemeSelector
                  :current-theme="currentTheme"
                  @theme-change="(t) => (currentTheme = t)"
                />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top header -->
      <header class="h-16 border-b border-border bg-background flex items-center justify-end px-6 shrink-0">
        <button
          class="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
          :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
          @click="isDark = !isDark"
        >
          <Sun v-if="isDark" class="h-4 w-4" aria-hidden="true" />
          <Moon v-else class="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <!-- Content -->
      <main id="main-content" class="flex-1 overflow-auto">
        <HomePage v-if="currentPage === 'home'" @navigate="navigateTo" />

        <Suspense v-else-if="currentComponent">
          <template #default>
            <component :is="currentComponent" />
          </template>
          <template #fallback>
            <div
              class="flex items-center justify-center h-64 text-muted-foreground"
              aria-live="polite"
            >
              <span class="animate-pulse text-sm">Carregando...</span>
            </div>
          </template>
        </Suspense>

        <HomePage v-else @navigate="navigateTo" />
      </main>
    </div>

    <Toaster position="top-right" />
  </div>
</template>
