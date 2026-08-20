<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';
  import { Badge } from '@/components/ui/badge';

  const items = [
    { value: 'novo',  label: 'Novidades da versão 3.0',    badge: 'Novo',  badgeVariant: 'default' as const,    content: 'Conteúdo das novidades. Use badges para sinalizar status sem alterar o trigger textual.' },
    { value: 'beta',  label: 'Funcionalidades em beta',     badge: 'Beta',  badgeVariant: 'secondary' as const,  content: 'Funcionalidades beta podem mudar. Feedback é bem-vindo.' },
  ];
</script>

<div class="nds-w-cap-lg">
  <Accordion type="single">
    {#each items as item (item.value)}
      <AccordionItem value={item.value}>
        <AccordionTrigger>
          <span class="nds-cluster" data-spacing="sm">
            {item.label}
            <Badge variant={item.badgeVariant}>{item.badge}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>{item.content}</AccordionContent>
      </AccordionItem>
    {/each}
  </Accordion>
</div>
