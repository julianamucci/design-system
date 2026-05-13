<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';

  let activeItem = $state<string>('item-1');

  const items = [
    { value: 'item-1', trigger: 'Item 1', content: 'Conteúdo do primeiro item.' },
    { value: 'item-2', trigger: 'Item 2', content: 'Conteúdo do segundo item.' },
    { value: 'item-3', trigger: 'Item 3', content: 'Conteúdo do terceiro item.' },
  ];
</script>

<div class="w-full max-w-lg space-y-3">
  <p class="text-xs text-muted-foreground">
    Item ativo: <code class="font-mono">{activeItem || '(nenhum)'}</code>
  </p>
  <Accordion type="single" value={activeItem} onValueChange={(v) => (activeItem = v as string)}>
    {#each items as item (item.value)}
      <AccordionItem value={item.value}>
        <AccordionTrigger>{item.trigger}</AccordionTrigger>
        <AccordionContent>{item.content}</AccordionContent>
      </AccordionItem>
    {/each}
  </Accordion>
</div>
