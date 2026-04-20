<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ComponentDocsNav from '../ComponentDocsNav.vue'


onMounted(() => {
  document.title = `Theming — Design System`
  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', `Documentação do componente Theming para Vue 3 com Shadcn/UI e Tailwind CSS.`)
})
onUnmounted(() => { document.title = 'Design System — Nortear (Vue)' })

const sections = [
  { id: 'demonstracao',   label: 'Demonstração',  block: 1 },
  { id: 'anatomia',       label: 'Anatomia',       block: 1 },
  { id: 'quando-usar',    label: 'Quando Usar',    block: 1 },
  { id: 'do-dont',        label: 'Do & Don\'t',    block: 1 },
  { id: 'importacao',     label: 'Importação',     block: 2 },
  { id: 'exemplos',       label: 'Exemplos',       block: 2 },
  { id: 'variantes',      label: 'Variantes',      block: 2 },
  { id: 'estados',        label: 'Estados',        block: 2 },
  { id: 'propriedades',   label: 'Propriedades',   block: 2 },
  { id: 'tokens',         label: 'Tokens',         block: 2 },
  { id: 'acessibilidade', label: 'Acessibilidade', block: 3 },
  { id: 'relacionados',   label: 'Relacionados',   block: 3 },
  { id: 'notas',          label: 'Notas',          block: 3 },
  { id: 'testes',         label: 'Testes',         block: 4 },
] as const
</script>

<template>
  <div class="flex-1 h-full overflow-auto">
    <div class="p-8 max-w-4xl mx-auto">
      <div class="flex gap-8">
        <ComponentDocsNav :sections="sections" />
        <main id="main-content" class="flex-1 min-w-0 space-y-16">
          <section>
            <h1 class="text-4xl font-extrabold tracking-tight">Theming</h1>
            <p class="mt-2 text-muted-foreground">Documentação do componente Theming.</p>
          </section>
          <section id="demonstracao">
            <h2 class="text-2xl font-semibold mb-4">Demonstração</h2>
            <div class="flex items-center justify-center p-10 border rounded-xl bg-background shadow-sm">
              <p class="text-muted-foreground text-sm">Exemplo aqui.</p>
            </div>
          </section>
          <section id="anatomia"><h2 class="text-2xl font-semibold mb-4">Anatomia</h2><p class="text-muted-foreground">Estrutura de subcomponentes.</p></section>
          <section id="quando-usar"><h2 class="text-2xl font-semibold mb-4">Quando Usar</h2><p class="text-muted-foreground">Orientações de uso.</p></section>
          <section id="do-dont"><h2 class="text-2xl font-semibold mb-4">Do &amp; Don&#39;t</h2><p class="text-muted-foreground">Boas práticas e antipadrões.</p></section>
          <section id="importacao"><h2 class="text-2xl font-semibold mb-4">Importação</h2><pre class="rounded-md bg-muted p-4 text-sm overflow-x-auto"><code>import { ... } from '@/components/ui/...'</code></pre></section>
          <section id="exemplos"><h2 class="text-2xl font-semibold mb-4">Exemplos</h2><p class="text-muted-foreground">Exemplos de código.</p></section>
          <section id="variantes"><h2 class="text-2xl font-semibold mb-4">Variantes</h2><p class="text-muted-foreground">Todas as variantes do componente.</p></section>
          <section id="estados"><h2 class="text-2xl font-semibold mb-4">Estados</h2><p class="text-muted-foreground">Default, hover, focus, disabled, error.</p></section>
          <section id="propriedades"><h2 class="text-2xl font-semibold mb-4">Propriedades</h2><p class="text-muted-foreground">Tabela de props.</p></section>
          <section id="tokens"><h2 class="text-2xl font-semibold mb-4">Design Tokens</h2><p class="text-muted-foreground">Tokens CSS relevantes.</p></section>
          <section id="acessibilidade"><h2 class="text-2xl font-semibold mb-4">Acessibilidade</h2><p class="text-muted-foreground">ARIA, navegação por teclado, WCAG 2.2 AA.</p></section>
          <section id="relacionados"><h2 class="text-2xl font-semibold mb-4">Componentes Relacionados</h2><p class="text-muted-foreground">Alternativas e complementos.</p></section>
          <section id="notas"><h2 class="text-2xl font-semibold mb-4">Notas e Dicas</h2><p class="text-muted-foreground">Boas práticas e avisos.</p></section>
          <section id="testes"><h2 class="text-2xl font-semibold mb-4">Critérios de Teste</h2><p class="text-muted-foreground">Funcional, acessibilidade e analytics.</p></section>
        </main>
      </div>
    </div>
  </div>
</template>
