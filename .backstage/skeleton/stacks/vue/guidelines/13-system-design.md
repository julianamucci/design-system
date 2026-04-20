# System Design — Arquitetura de Software (Vue)

Este documento descreve o System Design do projeto para Vue 3.

**Para estrutura de pastas e componentes principais, consulte**: `15-arquitetura-projeto.md`
**Para tokens CSS e padrões visuais, consulte**: `16-padroes-design-sistema.md`

---

## Stack Tecnológica

```
┌─────────────────────────────────────────┐
│         Browser (Cliente)                │
├─────────────────────────────────────────┤
│  Vue 3 (UI Framework)                   │
│  ├── Composition API (ref, computed)    │
│  ├── defineAsyncComponent (lazy load)   │
│  └── Suspense (async fallbacks)         │
├─────────────────────────────────────────┤
│  Tailwind CSS 4.0 (Styling)             │
│  ├── Design Tokens (CSS Variables)      │
│  └── Utility Classes                    │
├─────────────────────────────────────────┤
│  Reka UI (Primitivos Acessíveis)        │
│  ├── Dialog, Dropdown, Accordion, etc.  │
│  └── WAI-ARIA Compliance                │
├─────────────────────────────────────────┤
│  lucide-vue-next (Ícones)               │
│  Vee-Validate + Zod (Formulários)       │
│  vue-sonner (Toast notifications)       │
└─────────────────────────────────────────┘
```

---

## Por que não Vue Router?

O projeto é documentação estática com navegação simples por sidebar. Vue Router adicionaria complexidade desnecessária:
- URLs seriam fragmentos sem valor de SEO real (SPA sem SSR)
- O estado de navegação é simples: uma string `currentPage`
- Lazy loading via `defineAsyncComponent` cobre a necessidade de code splitting

Para indexação real no futuro, considerar Nuxt com SSG — ver seção de escalabilidade.

---

## Padrão de Composição Vue

```vue
<!-- ✅ CORRETO: Composition com componentes Shadcn Vue -->
<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Título</CardTitle>
    </CardHeader>
    <CardContent>
      <Button>Ação</Button>
    </CardContent>
  </Card>
</template>
```

---

## Lazy Loading

```ts
// defineAsyncComponent para code splitting por página
const AlertDocs = defineAsyncComponent(() => import('./components/docs/AlertDocs.vue'))

// Uso com Suspense obrigatório
```

```html
<Suspense>
  <component :is="currentComponent" />
  <template #fallback>
    <div aria-live="polite">Carregando...</div>
  </template>
</Suspense>
```

---

## Formulários (Vee-Validate + Zod)

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const schema = toTypedSchema(z.object({
  email: z.string().email('Email inválido.'),
}))

const { handleSubmit, errors } = useForm({ validationSchema: schema })
const onSubmit = handleSubmit((values) => console.log(values))
</script>
```

---

## Escalabilidade

Para indexação completa por mecanismos de busca, considerar migração para **Nuxt 3** com `nuxt generate` (SSG por rota). A estrutura de componentes e CSS é compatível sem alterações.
