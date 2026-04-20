# Disclosure Components

---

## Accordion

**Propósito**: mostrar e ocultar seções de conteúdo relacionado para reduzir densidade visual.

**Quando usar**: FAQs, configurações avançadas, conteúdo agrupável. Não usar para conteúdo que o usuário precisará sempre — prefira seções visíveis.

**Tipos**:
- `single` — apenas um item expandido por vez
- `multiple` — vários itens expandidos simultaneamente

**Implementação**:
```svelte
<script lang="ts">
  import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger
  } from '$lib/components/ui/accordion';
</script>

<Accordion type="single" collapsible class="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>O que é um Design System?</AccordionTrigger>
    <AccordionContent>
      Um Design System é um conjunto de padrões, componentes e guias que padronizam o desenvolvimento de interfaces.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Como instalar o componente?</AccordionTrigger>
    <AccordionContent>
      Use o comando: <code>npx shadcn-svelte@latest add accordion</code>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Acessibilidade**:
- Bits UI aplica automaticamente `role="region"`, `aria-expanded`, `aria-controls`, `aria-labelledby`
- `collapsible` permite fechar o item aberto — obrigatório em `type="single"` para UX acessível
- Animações de expand/collapse: `motion-reduce:animate-none` em animações customizadas

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
```svelte
<script lang="ts">
  import { track } from '$lib/analytics';

  let currentValue = $state<string | undefined>(undefined);

  function handleValueChange(value: string | undefined) {
    if (value) {
      track('accordion_expand', { label: value });
    } else {
      track('accordion_collapse', { label: currentValue ?? '' });
    }
    currentValue = value;
  }
</script>

<Accordion type="single" collapsible bind:value={currentValue} onValueChange={handleValueChange}>
  <!-- itens -->
</Accordion>
```

---

## Collapsible

**Propósito**: mostrar e ocultar um único bloco de conteúdo. Mais simples que o Accordion — sem grupos.

**Quando usar**: "Ver mais" de texto longo, seção colapsável de filtros, detalhe expandível de um item. Accordion para múltiplas seções agrupadas; Collapsible para um item isolado.

**Implementação**:
```svelte
<script lang="ts">
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui/collapsible';
  import { Button } from '$lib/components/ui/button';
  import { ChevronsUpDown } from 'lucide-svelte';

  let aberto = $state(false);
</script>

<Collapsible bind:open={aberto} class="w-[350px] space-y-2">
  <div class="flex items-center justify-between space-x-4 px-4">
    <h4 class="font-semibold">Dependências do projeto</h4>
    <CollapsibleTrigger asChild let:builder>
      <Button
        builders={[builder]}
        variant="ghost"
        size="icon"
        aria-label={aberto ? 'Ocultar dependências' : 'Exibir dependências'}
      >
        <ChevronsUpDown class="h-4 w-4" aria-hidden="true" />
      </Button>
    </CollapsibleTrigger>
  </div>

  <div class="rounded-md border border-input px-4 py-3 font-mono text-sm">
    @radix-ui/react-collapsible
  </div>

  <CollapsibleContent class="space-y-2">
    <div class="rounded-md border border-input px-4 py-3 font-mono text-sm">
      @stitches/react
    </div>
    <div class="rounded-md border border-input px-4 py-3 font-mono text-sm">
      lucide-svelte
    </div>
  </CollapsibleContent>
</Collapsible>
```

**Acessibilidade**:
- `CollapsibleTrigger` com `asChild` para usar o `Button` semanticamente correto
- `aria-label` descritivo no trigger — indica o estado atual: "Exibir X" / "Ocultar X"
- Bits UI aplica `aria-expanded` e `aria-controls` automaticamente
