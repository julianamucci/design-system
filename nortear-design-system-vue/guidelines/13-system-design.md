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
│  FormField e Fieldset (a11y do campo)   │
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

## Formulários

O design system não traz biblioteca de formulário nem de validação por schema.
O `FormField` e o `Fieldset` fazem a costura de acessibilidade em volta do campo,
e o estado — valor, erros de validação, submit — é da biblioteca que a
aplicação escolher. Ver `06-form-components.md` §Form.

Até 2026-09-10 esta seção ensinava `useForm` do Vee-Validate com um schema do
Zod. Nenhum dos dois era importado em lugar nenhum de `src/`, e os dois saíram do
`package.json` naquele dia.

---

## Escalabilidade

Para indexação completa por mecanismos de busca, considerar migração para **Nuxt 3** com `nuxt generate` (SSG por rota). A estrutura de componentes e CSS é compatível sem alterações.
