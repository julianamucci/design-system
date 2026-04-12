<script setup lang="ts">
import { BookOpen, Palette, Code, Zap, Users, Heart } from 'lucide-vue-next'

const emit = defineEmits<{
  navigate: [path: string]
}>()

const popularComponents = [
  { name: 'Button', path: 'button', description: 'Botões para todas as ações' },
  { name: 'Card', path: 'card', description: 'Containers para agrupar conteúdo' },
  { name: 'Input', path: 'input', description: 'Campos de entrada de dados' },
  { name: 'Dialog', path: 'dialog', description: 'Modais e dialogs' },
  { name: 'Form', path: 'form', description: 'Construção de formulários' },
  { name: 'Table', path: 'table', description: 'Tabelas de dados' },
]
</script>

<template>
  <div class="w-full">
    <div class="p-8 space-y-12 max-w-4xl mx-auto">

      <!-- Hero -->
      <header class="text-center space-y-4">
        <div class="flex justify-center mb-6">
          <div class="h-16 w-16 bg-primary rounded-xl flex items-center justify-center">
            <span class="text-primary-foreground text-2xl font-bold">S</span>
          </div>
        </div>
        <h1 class="text-5xl font-extrabold tracking-tight">Documentação Shadcn/UI</h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Biblioteca de componentes reutilizáveis construída com Vue 3 e Tailwind CSS.
          Copie e cole os componentes que precisar em seu projeto.
        </p>
        <div class="flex justify-center gap-4 pt-4">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            @click="emit('navigate', 'button')"
          >
            <Code class="h-4 w-4" aria-hidden="true" />
            Começar
          </button>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            @click="emit('navigate', 'accordion')"
          >
            <BookOpen class="h-4 w-4" aria-hidden="true" />
            Ver Componentes
          </button>
        </div>
      </header>

      <!-- Por que usar -->
      <section class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-semibold">Por que usar Shadcn/UI?</h2>
          <p class="text-muted-foreground">
            Uma biblioteca moderna e flexível para desenvolvimento rápido
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="rounded-xl border border-border bg-card text-card-foreground p-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                <Zap class="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 class="font-semibold">Rápido</h3>
            </div>
            <p class="text-sm text-muted-foreground">
              Componentes prontos para uso que aceleram o desenvolvimento.
            </p>
          </div>

          <div class="rounded-xl border border-border bg-card text-card-foreground p-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                <Palette class="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 class="font-semibold">Personalizável</h3>
            </div>
            <p class="text-sm text-muted-foreground">
              Sistema de design flexível baseado em variáveis CSS.
            </p>
          </div>

          <div class="rounded-xl border border-border bg-card text-card-foreground p-6">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                <Users class="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 class="font-semibold">Acessível</h3>
            </div>
            <p class="text-sm text-muted-foreground">
              Construído seguindo diretrizes WCAG 2.2 AA de acessibilidade.
            </p>
          </div>
        </div>
      </section>

      <!-- Componentes Populares -->
      <section class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-semibold">Componentes Populares</h2>
          <p class="text-muted-foreground">
            Comece com os componentes mais utilizados
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="component in popularComponents"
            :key="component.path"
            role="button"
            class="text-left rounded-xl border border-border bg-card text-card-foreground p-4 hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            @click="emit('navigate', component.path)"
          >
            <p class="font-semibold mb-1">{{ component.name }}</p>
            <p class="text-sm text-muted-foreground">{{ component.description }}</p>
          </button>
        </div>
      </section>

      <!-- Como Navegar -->
      <section class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-semibold">Como Navegar na Documentação</h2>
          <p class="text-muted-foreground">
            Guia rápido para aproveitar ao máximo esta documentação
          </p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(step, i) in [
              { title: 'Sidebar de Navegação', desc: 'Use a sidebar à esquerda para navegar entre componentes. Os componentes estão organizados por categorias para facilitar a busca.' },
              { title: 'Estrutura das Páginas', desc: 'Cada componente tem uma estrutura padronizada: demonstração, guidelines, casos de uso, exemplos de código, propriedades e dicas.' },
              { title: 'Código Pronto para Usar', desc: 'Todos os exemplos mostram o código completo. Você pode copiar e colar diretamente em seu projeto.' },
              { title: 'Guidelines Obrigatórias', desc: 'Preste atenção às seções &quot;Guidelines Obrigatórias&quot; e &quot;Quando e Como Usar&quot;. Elas contêm regras importantes para usar os componentes corretamente.' },
            ]"
            :key="i"
            class="rounded-xl border border-border bg-card text-card-foreground p-5"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{{ i + 1 }}</span>
              <h3 class="font-semibold">{{ step.title }}</h3>
            </div>
            <p class="text-sm text-muted-foreground" v-html="step.desc" />
          </div>
        </div>
      </section>

      <!-- CTA final -->
      <section class="text-center space-y-4">
        <div class="flex justify-center">
          <Heart class="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        <h3 class="text-xl font-semibold">Pronto para começar?</h3>
        <p class="text-muted-foreground max-w-md mx-auto">
          Explore os componentes na sidebar ou comece com os componentes populares acima.
        </p>
        <button
          class="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
          @click="emit('navigate', 'button')"
        >
          Explorar Componentes
        </button>
      </section>

    </div>
  </div>
</template>
