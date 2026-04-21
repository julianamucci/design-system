---
name: implement-component
description: Implementa um componente ou feature usando Shadcn Vue (Reka UI), Tailwind CSS e Vue 3 Composition API, seguindo as guidelines do projeto. Usar sempre que o usuário pedir para criar, construir, implementar, adicionar ou codar um componente — seja uma tela nova, um formulário, um card, um dialog, ou qualquer elemento de UI. Também usar para refatorar implementações existentes que não seguem o padrão do projeto.
---

# Skill: Implement Component (Vue)

Implementa componentes e features seguindo as guidelines do projeto de design system para Vue 3.

## Antes de codar

1. Identificar a **categoria** do componente solicitado (layout / navigation / form / feedback / display / disclosure / overlay)
2. Ler o arquivo de guideline correspondente (04–10) para a API exata, estrutura de subcomponentes e regras
3. Se o componente envolve formulário: ler `06-form-components.md` → seção Form
4. Se envolve acessibilidade complexa: ler `11-acessibilidade.md`
5. Se envolve analytics: ler `21-analytics.md`

## Checklist de implementação

### Estrutura Vue 3
- [ ] `<script setup lang="ts">` — sempre Composition API
- [ ] `defineProps<{...}>()` com TypeScript
- [ ] `defineEmits<{...}>()` com TypeScript
- [ ] Composables com prefixo `use` importados de `@/composables/`
- [ ] Sem `this` — Composition API não usa `this`

### API e estrutura de componentes
- [ ] Usar apenas props que existem na API do Reka UI / Shadcn Vue
- [ ] Estrutura de subcomponentes correta
- [ ] `as-child` nos triggers de: Dialog, Sheet, Drawer, AlertDialog, Collapsible, DropdownMenu, Popover, Tooltip, ContextMenu
- [ ] `type="button"` em botões dentro de forms que não são submit

### Tokens e estilo
- [ ] Cores em HSL — nunca rgba/hex/oklch
- [ ] Superfícies: `bg-card` para painéis, `bg-popover` para overlays flutuantes
- [ ] Variantes customizadas via `class` com tokens — não props inexistentes
- [ ] Tamanho de fonte via CSS base — não classes Tailwind de tamanho
- [ ] Espaçamento em múltiplos de 8px

### Formulários (Vee-Validate + Zod)
- [ ] Schema com `toTypedSchema` de `@vee-validate/zod`
- [ ] `useForm` com `validationSchema`
- [ ] `useField` ou `Field` para cada campo
- [ ] Mensagens de erro via `errors.fieldName`
- [ ] `type="submit"` apenas no botão final

### Acessibilidade
- [ ] `aria-label` contextual em elementos interativos ambíguos
- [ ] `aria-hidden="true"` em ícones decorativos
- [ ] `DialogTitle` + `DialogDescription` em todo Dialog/Sheet/Drawer
- [ ] `scope="col"` em cabeçalhos de tabela
- [ ] `aria-live="polite"` em contadores e mensagens dinâmicas

### Alinhamento
- [ ] Botão primário à direita — `flex justify-end` ou `ml-auto`
- [ ] DOM na ordem visual — `flex-row-reverse` proibido

### Analytics
- [ ] Tracking na camada de produto — nunca dentro de `./components/ui/`
- [ ] Formato de evento: `objeto_ação` snake_case
- [ ] Payload: `{ component, variant?, location, label? }`

## Padrões por tipo de componente

### Overlays (Dialog, Sheet, Drawer, AlertDialog)
```vue
<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button>Abrir</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Título</DialogTitle>
        <DialogDescription>Descrição.</DialogDescription>
      </DialogHeader>
      <!-- conteúdo -->
      <DialogFooter>
        <Button variant="outline" @click="open = false">Cancelar</Button>
        <Button @click="confirm">Confirmar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### Formulários
```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const schema = toTypedSchema(z.object({
  campo: z.string().min(1, 'Obrigatório.'),
}))
const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [campo, campoAttrs] = defineField('campo')
const onSubmit = handleSubmit((values) => console.log(values))
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div>
      <label for="campo">Label</label>
      <input id="campo" v-bind="campoAttrs" v-model="campo" />
      <span v-if="errors.campo">{{ errors.campo }}</span>
    </div>
    <button type="submit">Salvar</button>
  </form>
</template>
```

### Navegação interna (SPA)
```vue
<!-- Nunca <a href> para navegação interna -->
<button @click="emit('navigate', 'button')">Ir para Button</button>
```

## Output

Arquivo `.vue` completo com:
- `<script setup lang="ts">` com imports corretos
- Tipagem TypeScript via defineProps/defineEmits
- Template semântico e acessível
- Comentários apenas onde a lógica não é óbvia
