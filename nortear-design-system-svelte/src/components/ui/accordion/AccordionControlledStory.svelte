<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';

  let activeItem = $state<string>('item-1');

  const items = [
    { value: 'item-1', trigger: 'Item 1 — controlado', content: 'Estado gerenciado externamente via valor inicial e callback de mudança.' },
    { value: 'item-2', trigger: 'Item 2 — controlado', content: 'Útil para sincronizar com URL ou outro estado da aplicação.' },
  ];
</script>

<div class="nds-stack nds-w-lg" data-spacing="sm">
  <p class="nds-text-caption nds-text-muted-foreground">
    Item aberto: <code class="nds-font-mono">{activeItem || 'nenhum'}</code>
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
