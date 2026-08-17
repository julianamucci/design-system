<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';
</script>

<Accordion type="multiple" class="nds-max-w-lg nds-text-body">
  <AccordionItem value="specs">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>
      <!-- Tabela de verdade, não grid: `.nds-grid[data-cols="2"]` exige 18rem
           por coluna e colapsa dentro do accordion. Mesmo exemplo da docs page. -->
      <table class="nds-w-full nds-text-body nds-border-collapse">
        <tbody>
          <tr class="nds-border-b">
            <td class="nds-py-1 nds-pr-4">CPU</td>
            <td class="nds-py-1">Intel Core i7-12700</td>
          </tr>
          <tr class="nds-border-b">
            <td class="nds-py-1 nds-pr-4">RAM</td>
            <td class="nds-py-1">16GB DDR5</td>
          </tr>
          <tr>
            <td class="nds-py-1 nds-pr-4">SSD</td>
            <td class="nds-py-1">512GB NVMe</td>
          </tr>
        </tbody>
      </table>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="inclui">
    <AccordionTrigger>O que está incluso</AccordionTrigger>
    <AccordionContent>
      <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
        <li>Cabo de alimentação</li>
        <li>Manual do usuário</li>
        <li>Garantia de 24 meses</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
</Accordion>
