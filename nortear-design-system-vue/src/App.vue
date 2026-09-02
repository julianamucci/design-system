<script setup lang="ts">
import { ref, watch, defineAsyncComponent, shallowRef } from 'vue'
import {
  Moon, Sun, Home,
  FileText, MessageSquare, Sparkles
} from 'lucide-vue-next'
import HomePage from './components/HomePage.vue'
import ThemeSelector from './components/ThemeSelector.vue'
import { Toaster } from 'vue-sonner'

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
  // `tema-default` entra na remoção e a aplicação é incondicional: os 39
  // tokens de cor só existem dentro de `.tema-<id>`, e o default deixou de ser
  // ausência de classe. Antes funcionava por acidente da ordem dos @import.
  html.classList.remove('dark', 'tema-default', 'tema-warm', 'tema-cold')
  if (isDark.value) html.classList.add('dark')
  html.classList.add(`tema-${currentTheme.value}`)

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
  <div class="nds-app">
    <!-- Skip to content -->
    <a
      href="#main-content"
      class="nds-skip-link nds-focus-shadow-md nds-focus-ring-inset"
    >
      Pular para conteúdo principal
    </a>

    <!-- Sidebar -->
    <aside
      class="nds-app-sidebar nds-shrink-0 nds-overflow-hidden"
      aria-label="Sidebar de navegação"
    >
      <!-- Sidebar header -->
      <div class="nds-app-sidebar-header nds-shrink-0">
        <div
          class="nds-app-sidebar-logo nds-inline-center"
          aria-hidden="true"
        >
          <span class="nds-text-primary-foreground nds-font-bold">S</span>
        </div>
        <span class="nds-text-3xl">Design System</span>
      </div>

      <!-- Sidebar nav -->
      <div class="nds-app-sidebar-nav">
        <nav aria-label="Navegação de componentes">
          <div
            class="nds-stack"
            data-spacing="sm"
          >
            <!-- Home -->
            <button
              class="nds-app-nav-item"
              :data-active="currentPage === 'home'"
              @click="navigateTo('home')"
            >
              <Home
                class="nds-icon"
                aria-hidden="true"
              />
              <span>Home</span>
            </button>

            <!-- Categories accordion -->
            <div
              v-for="category in componentCategories"
              :key="category.name"
            >
              <button
                class="nds-app-nav-item"
                :aria-expanded="isCategoryOpen(category.name)"
                @click="toggleCategory(category.name)"
              >
                <component
                  :is="category.icon"
                  class="nds-icon"
                  aria-hidden="true"
                />
                <span>{{ category.name }}</span>
                <!-- Chevron para BAIXO: `.nds-chevron` gira 180° com
                     `aria-expanded="true"`, que é o idioma do disclosure em
                     todas as stacks. O ícone que estava aqui apontava para a
                     direita e girava 90° por classe condicional — meia volta
                     num chevron lateral aponta para o lado errado. -->
                <svg
                  class="nds-icon nds-shrink-0 nds-spacer-start nds-transition-transform nds-chevron"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                v-if="isCategoryOpen(category.name)"
                class="nds-ml-6 nds-mt-1 nds-stack"
                data-spacing="xs"
              >
                <button
                  v-for="item in category.items"
                  :key="item.path"
                  class="nds-app-nav-item"
                  :data-active="currentPage === item.path"
                  @click="navigateTo(item.path)"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>

            <!-- Theme selector -->
            <div class="nds-mt-4 nds-pt-4 nds-border-t">
              <div
                class="nds-cluster nds-px-2 nds-py-1"
                data-justify="between"
              >
                <span class="nds-text-caption">Theme</span>
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
    <div class="nds-app-main nds-min-w-0">
      <!-- Top header -->
      <header class="nds-app-header nds-shrink-0">
        <!-- Empurra a ação para a direita: o header da shell alinha à esquerda,
             e este sandbox só tem o alternador de modo. -->
        <span class="nds-app-header-title"></span>
        <button
          class="nds-icon-button nds-hover-text-accent-foreground nds-focus-ring"
          :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
          @click="isDark = !isDark"
        >
          <Sun
            v-if="isDark"
            class="nds-icon"
            aria-hidden="true"
          />
          <Moon
            v-else
            class="nds-icon"
            aria-hidden="true"
          />
        </button>
      </header>

      <!-- Content -->
      <main
        id="main-content"
        class="nds-app-content"
      >
        <HomePage
          v-if="currentPage === 'home'"
          @navigate="navigateTo"
        />

        <Suspense v-else-if="currentComponent">
          <template #default>
            <component :is="currentComponent" />
          </template>
          <template #fallback>
            <div
              class="nds-app-loading nds-text-muted-foreground"
              aria-live="polite"
            >
              <span class="nds-animate-pulse nds-text-caption">Carregando...</span>
            </div>
          </template>
        </Suspense>

        <HomePage
          v-else
          @navigate="navigateTo"
        />
      </main>
    </div>

    <Toaster position="top-right" />
  </div>
</template>
