# System Design — Arquitetura de Software (Vue)

Este documento descreve o System Design do projeto para Vue 3.

**Para estrutura de pastas e componentes principais, consulte**: `12-arquitetura-projeto.md`
**Para tokens CSS e padrões visuais, consulte**: `../../docs/shared/guidelines/04-padroes-design-sistema.md`

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
│  CSS standalone .nds-* (Styling)        │
│  ├── Design Tokens (CSS Variables)      │
│  └── Classes .nds-*                     │
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

Não há o que rotear: a navegação é a sidebar do Storybook, ordenada pelo
`storySort` de `.storybook/preview.ts`, e desde 2026-09-02 não existe sandbox de
aplicação nesta stack. Router aqui seria uma segunda árvore de navegação
competindo com a única que o leitor vê.

---

## Padrão de Composição Vue

```vue
<!-- ✅ CORRETO: Composition com componentes do design system -->
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

Quem divide o código por página é o próprio Storybook: cada story é um módulo, e
o builder carrega sob demanda a que está aberta. A stack não mantém registro de
páginas para carregar sozinha — o registro que existia vivia no sandbox, que
saiu em 2026-09-02.

`defineAsyncComponent` continua válido dentro de um componente que só precisa de
uma parte pesada quando o usuário chega nela (com `Suspense` e um fallback que
anuncie a espera). O que deixou de existir é o uso dele como roteador de docs
pages.

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
