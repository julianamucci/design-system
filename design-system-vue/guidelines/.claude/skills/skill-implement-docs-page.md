---
name: implement-docs-page
description: Cria ou atualiza uma página de documentação interativa de componente Shadcn Vue no projeto, integrando ComponentDocsNav, exemplos ao vivo, código copiável e seções de acessibilidade e analytics. Usar quando o usuário pedir para criar ou atualizar a página de docs de um componente específico no projeto — esta skill gera o arquivo .vue funcional completo que será renderizado na aplicação.
---

# Skill: Implement Docs Page (Vue)

Cria o arquivo `.vue` completo de uma página de documentação interativa de componente para o projeto.

## Antes de implementar

1. Ler `12-documentacao-componentes.md` para a estrutura das 15 seções
2. Ler o guideline do componente (04–10) para ter toda a API, variantes e exemplos
3. Verificar se já existe um arquivo `[Componente]Docs.vue` em `/components/docs/` — se sim, preservar a estrutura e atualizar apenas o solicitado

## Estrutura do arquivo gerado

```vue
<!-- /components/docs/[Componente]Docs.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ComponentDocsNav from '../ComponentDocsNav.vue'
// imports dos componentes usados nos exemplos
// imports de lucide-vue-next

onMounted(() => {
  document.title = '[Componente] — Design System'
  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', 'Documentação do componente [Componente]...')
})
onUnmounted(() => {
  document.title = 'Design System — Nortear (Vue)'
})

const sections = [
  { id: 'demonstracao',   label: 'Demonstração',  block: 1 },
  // ...demais seções
] as const
</script>

<template>
  <div class="flex-1 h-full overflow-auto">
    <div class="p-8 max-w-4xl mx-auto">
      <div class="flex gap-8">
        <ComponentDocsNav :sections="sections" />

        <main id="main-content" class="flex-1 min-w-0 space-y-16">
          <!-- Seção 1: Header -->
          <section>...</section>

          <!-- Seção 2: Demonstração -->
          <section id="demonstracao">...</section>

          <!-- ... demais seções na ordem do template ... -->
        </main>
      </div>
    </div>
  </div>
</template>
```

## Regras de implementação

### SEO
- `onMounted` com `document.title` e meta description em cada página
- `onUnmounted` restaura o título padrão

### ComponentDocsNav
- Primeiro elemento dentro do `<div class="flex gap-8">`
- Props: `:sections="sections"`
- Sticky via CSS no componente, IntersectionObserver interno

### Exemplos de código
- Exemplos funcionais que rodam — não pseudocódigo
- Estado local via `ref()` quando necessário para interatividade

### Notas e Dicas (seção 14)
```html
<!-- Dica — CheckCircle2 text-primary -->
<div class="flex gap-2 items-start">
  <CheckCircle2 class="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
  <p class="text-sm">Texto da dica.</p>
</div>

<!-- Aviso — XCircle text-destructive -->
<div class="flex gap-2 items-start">
  <XCircle class="h-4 w-4 text-destructive mt-0.5 shrink-0" aria-hidden="true" />
  <p class="text-sm">Texto do aviso.</p>
</div>
```

## Output

Arquivo `/components/docs/[Componente]Docs.vue` completo e funcional, pronto para ser registrado em `lazyDocs` no `App.vue`.

Após criar o arquivo, adicionar em `App.vue`:
```ts
'nome-componente': defineAsyncComponent(() => import('./components/docs/[Componente]Docs.vue')),
```
