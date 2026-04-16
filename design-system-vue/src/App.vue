<script setup lang="ts">
import { ref, watch, defineAsyncComponent, shallowRef } from 'vue'
import {
  Moon, Sun, Home, LayoutGrid, MousePointer, Palette,
  FileText, Settings, Database, MessageSquare, Sparkles
} from 'lucide-vue-next'
import HomePage from './components/HomePage.vue'
import ThemeSelector from './components/ThemeSelector.vue'
import { Toaster } from 'vue-sonner'
import DocsEditor from './admin/DocsEditor.vue'

const isAdminView = new URLSearchParams(window.location.search).get('view') === 'admin'

// ─── Lazy-loaded documentation pages ────────────────────────────────────────
const lazyDocs: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'accordion':           defineAsyncComponent(() => import('./components/docs/AccordionDocs.vue')),
  'alert-dialog':        defineAsyncComponent(() => import('./components/docs/AlertDialogDocs.vue')),
  'alert':               defineAsyncComponent(() => import('./components/docs/AlertDocs.vue')),
  'aspect-ratio':        defineAsyncComponent(() => import('./components/docs/AspectRatioDocs.vue')),
  'avatar':              defineAsyncComponent(() => import('./components/docs/AvatarDocs.vue')),
  'badge':               defineAsyncComponent(() => import('./components/docs/BadgeDocs.vue')),
  'breadcrumb':          defineAsyncComponent(() => import('./components/docs/BreadcrumbDocs.vue')),
  'button':              defineAsyncComponent(() => import('./components/docs/ButtonDocs.vue')),
  'button-group':        defineAsyncComponent(() => import('./components/docs/ButtonGroupDocs.vue')),
  'calendar':            defineAsyncComponent(() => import('./components/docs/CalendarDocs.vue')),
  'card':                defineAsyncComponent(() => import('./components/docs/CardDocs.vue')),
  'carousel':            defineAsyncComponent(() => import('./components/docs/CarouselDocs.vue')),
  'chart':               defineAsyncComponent(() => import('./components/docs/ChartDocs.vue')),
  'checkbox':            defineAsyncComponent(() => import('./components/docs/CheckboxDocs.vue')),
  'collapsible':         defineAsyncComponent(() => import('./components/docs/CollapsibleDocs.vue')),
  'command':             defineAsyncComponent(() => import('./components/docs/CommandDocs.vue')),
  'context-menu':        defineAsyncComponent(() => import('./components/docs/ContextMenuDocs.vue')),
  'design-tokens':       defineAsyncComponent(() => import('./components/docs/DesignTokensDocs.vue')),
  'dialog':              defineAsyncComponent(() => import('./components/docs/DialogDocs.vue')),
  'display-showcase':    defineAsyncComponent(() => import('./components/docs/DisplayShowcaseDocs.vue')),
  'drawer':              defineAsyncComponent(() => import('./components/docs/DrawerDocs.vue')),
  'dropdown-menu':       defineAsyncComponent(() => import('./components/docs/DropdownMenuDocs.vue')),
  'empty':               defineAsyncComponent(() => import('./components/docs/EmptyDocs.vue')),
  'feedback-showcase':   defineAsyncComponent(() => import('./components/docs/FeedbackShowcaseDocs.vue')),
  'field':               defineAsyncComponent(() => import('./components/docs/FieldDocs.vue')),
  'form':                defineAsyncComponent(() => import('./components/docs/FormDocs.vue')),
  'form-showcase':       defineAsyncComponent(() => import('./components/docs/FormShowcaseDocs.vue')),
  'hover-card':          defineAsyncComponent(() => import('./components/docs/HoverCardDocs.vue')),
  'icons':               defineAsyncComponent(() => import('./components/docs/IconsDocs.vue')),
  'input':               defineAsyncComponent(() => import('./components/docs/InputDocs.vue')),
  'input-group':         defineAsyncComponent(() => import('./components/docs/InputGroupDocs.vue')),
  'input-otp':           defineAsyncComponent(() => import('./components/docs/InputOtpDocs.vue')),
  'item':                defineAsyncComponent(() => import('./components/docs/ItemDocs.vue')),
  'kbd':                 defineAsyncComponent(() => import('./components/docs/KbdDocs.vue')),
  'label':               defineAsyncComponent(() => import('./components/docs/LabelDocs.vue')),
  'layout-showcase':     defineAsyncComponent(() => import('./components/docs/LayoutShowcaseDocs.vue')),
  'menubar':             defineAsyncComponent(() => import('./components/docs/MenubarDocs.vue')),
  'navigation-menu':     defineAsyncComponent(() => import('./components/docs/NavigationMenuDocs.vue')),
  'navigation-showcase': defineAsyncComponent(() => import('./components/docs/NavigationShowcaseDocs.vue')),
  'overlay-showcase':    defineAsyncComponent(() => import('./components/docs/OverlayShowcaseDocs.vue')),
  'pagination':          defineAsyncComponent(() => import('./components/docs/PaginationDocs.vue')),
  'popover':             defineAsyncComponent(() => import('./components/docs/PopoverDocs.vue')),
  'progress':            defineAsyncComponent(() => import('./components/docs/ProgressDocs.vue')),
  'radio-group':         defineAsyncComponent(() => import('./components/docs/RadioGroupDocs.vue')),
  'resizable':           defineAsyncComponent(() => import('./components/docs/ResizableDocs.vue')),
  'scroll-area':         defineAsyncComponent(() => import('./components/docs/ScrollAreaDocs.vue')),
  'select':              defineAsyncComponent(() => import('./components/docs/SelectDocs.vue')),
  'separator':           defineAsyncComponent(() => import('./components/docs/SeparatorDocs.vue')),
  'sheet':               defineAsyncComponent(() => import('./components/docs/SheetDocs.vue')),
  'sidebar':             defineAsyncComponent(() => import('./components/docs/SidebarDocs.vue')),
  'skeleton':            defineAsyncComponent(() => import('./components/docs/SkeletonDocs.vue')),
  'slider':              defineAsyncComponent(() => import('./components/docs/SliderDocs.vue')),
  'sonner':              defineAsyncComponent(() => import('./components/docs/SonnerDocs.vue')),
  'spinner':             defineAsyncComponent(() => import('./components/docs/SpinnerDocs.vue')),
  'stepper':             defineAsyncComponent(() => import('./components/docs/StepperDocs.vue')),
  'switch':              defineAsyncComponent(() => import('./components/docs/SwitchDocs.vue')),
  'table':               defineAsyncComponent(() => import('./components/docs/TableDocs.vue')),
  'tabs':                defineAsyncComponent(() => import('./components/docs/TabsDocs.vue')),
  'textarea':            defineAsyncComponent(() => import('./components/docs/TextareaDocs.vue')),
  'theming':             defineAsyncComponent(() => import('./components/docs/ThemingDocs.vue')),
  'toggle':              defineAsyncComponent(() => import('./components/docs/ToggleDocs.vue')),
  'toggle-group':        defineAsyncComponent(() => import('./components/docs/ToggleGroupDocs.vue')),
  'tooltip':             defineAsyncComponent(() => import('./components/docs/TooltipDocs.vue')),
  'use-mobile':          defineAsyncComponent(() => import('./components/docs/UseMobileDocs.vue')),
  'utilities-showcase':  defineAsyncComponent(() => import('./components/docs/UtilitiesShowcaseDocs.vue')),
  'utils':               defineAsyncComponent(() => import('./components/docs/UtilsDocs.vue')),
}

// ─── State ───────────────────────────────────────────────────────────────────
const currentPage = ref('home')
const isDark = ref(false)
const currentTheme = ref('default')
const sidebarOpen = ref(true)
const openCategories = ref<string[]>([])
const currentComponent = shallowRef<ReturnType<typeof defineAsyncComponent> | null>(null)

watch([currentPage, isDark, currentTheme], () => {
  document.documentElement.classList.remove('default', 'tema-personalizado', 'dark')
  if (currentTheme.value === 'tema-personalizado') {
    document.documentElement.classList.add('tema-personalizado')
  }
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }

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
      { name: 'Design Tokens', path: 'design-tokens' },
      { name: 'Theming', path: 'theming' },
      { name: 'Icons', path: 'icons' },
      { name: 'Utils', path: 'utils' },
    ],
  },
  {
    name: 'Layout',
    icon: LayoutGrid,
    items: [
      { name: 'Layout Showcase', path: 'layout-showcase' },
      { name: 'Aspect Ratio', path: 'aspect-ratio' },
      { name: 'Card', path: 'card' },
      { name: 'Resizable', path: 'resizable' },
      { name: 'Scroll Area', path: 'scroll-area' },
      { name: 'Separator', path: 'separator' },
      { name: 'Sidebar', path: 'sidebar' },
    ],
  },
  {
    name: 'Navigation',
    icon: MousePointer,
    items: [
      { name: 'Navigation Showcase', path: 'navigation-showcase' },
      { name: 'Breadcrumb', path: 'breadcrumb' },
      { name: 'Menubar', path: 'menubar' },
      { name: 'Navigation Menu', path: 'navigation-menu' },
      { name: 'Pagination', path: 'pagination' },
      { name: 'Stepper', path: 'stepper' },
      { name: 'Tabs', path: 'tabs' },
    ],
  },
  {
    name: 'Form',
    icon: FileText,
    items: [
      { name: 'Form Showcase', path: 'form-showcase' },
      { name: 'Button', path: 'button' },
      { name: 'Button Group', path: 'button-group' },
      { name: 'Calendar', path: 'calendar' },
      { name: 'Checkbox', path: 'checkbox' },
      { name: 'Field', path: 'field' },
      { name: 'Form', path: 'form' },
      { name: 'Input', path: 'input' },
      { name: 'Input Group', path: 'input-group' },
      { name: 'Input OTP', path: 'input-otp' },
      { name: 'Label', path: 'label' },
      { name: 'Radio Group', path: 'radio-group' },
      { name: 'Select', path: 'select' },
      { name: 'Slider', path: 'slider' },
      { name: 'Switch', path: 'switch' },
      { name: 'Textarea', path: 'textarea' },
      { name: 'Toggle', path: 'toggle' },
      { name: 'Toggle Group', path: 'toggle-group' },
    ],
  },
  {
    name: 'Feedback',
    icon: MessageSquare,
    items: [
      { name: 'Feedback Showcase', path: 'feedback-showcase' },
      { name: 'Alert', path: 'alert' },
      { name: 'Alert Dialog', path: 'alert-dialog' },
      { name: 'Badge', path: 'badge' },
      { name: 'Empty', path: 'empty' },
      { name: 'Kbd', path: 'kbd' },
      { name: 'Progress', path: 'progress' },
      { name: 'Skeleton', path: 'skeleton' },
      { name: 'Sonner', path: 'sonner' },
      { name: 'Spinner', path: 'spinner' },
    ],
  },
  {
    name: 'Display',
    icon: Palette,
    items: [
      { name: 'Display Showcase', path: 'display-showcase' },
      { name: 'Avatar', path: 'avatar' },
      { name: 'Carousel', path: 'carousel' },
      { name: 'Chart', path: 'chart' },
      { name: 'Item', path: 'item' },
      { name: 'Table', path: 'table' },
    ],
  },
  {
    name: 'Overlay',
    icon: Settings,
    items: [
      { name: 'Overlay Showcase', path: 'overlay-showcase' },
      { name: 'Command', path: 'command' },
      { name: 'Context Menu', path: 'context-menu' },
      { name: 'Dialog', path: 'dialog' },
      { name: 'Drawer', path: 'drawer' },
      { name: 'Dropdown Menu', path: 'dropdown-menu' },
      { name: 'Hover Card', path: 'hover-card' },
      { name: 'Popover', path: 'popover' },
      { name: 'Sheet', path: 'sheet' },
      { name: 'Tooltip', path: 'tooltip' },
    ],
  },
  {
    name: 'Utilities',
    icon: Database,
    items: [
      { name: 'Utilities Showcase', path: 'utilities-showcase' },
      { name: 'Accordion', path: 'accordion' },
      { name: 'Collapsible', path: 'collapsible' },
      { name: 'useIsMobile', path: 'use-mobile' },
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
