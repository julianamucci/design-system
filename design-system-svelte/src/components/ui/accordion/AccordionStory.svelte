<script lang="ts">
  import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

  let {
    type = 'single',
    collapsible = true,
    defaultValue = undefined,
    items = [
      { value: 'item-1', trigger: 'O que é um design system?', content: 'Um conjunto de padrões, componentes e diretrizes que garantem consistência visual e de interação em produtos digitais.' },
      { value: 'item-2', trigger: 'Quais tecnologias são usadas?', content: 'React, Vue 3, Svelte e Vanilla TypeScript, todos compartilhando os mesmos tokens de design e guidelines.' },
      { value: 'item-3', trigger: 'Como contribuir com novos componentes?', content: 'Siga as guidelines em guidelines/, crie a docs page, as stories e adicione testes de acessibilidade.' },
    ],
  }: {
    type?: 'single' | 'multiple';
    collapsible?: boolean;
    defaultValue?: string;
    items?: Array<{ value: string; trigger: string; content: string; disabled?: boolean }>;
  } = $props();
</script>

<Accordion {type} {collapsible} {defaultValue} class="w-full max-w-md">
  {#each items as item}
    <AccordionItem value={item.value} disabled={item.disabled ?? false}>
      <AccordionTrigger>{item.trigger}</AccordionTrigger>
      <AccordionContent>{item.content}</AccordionContent>
    </AccordionItem>
  {/each}
</Accordion>
