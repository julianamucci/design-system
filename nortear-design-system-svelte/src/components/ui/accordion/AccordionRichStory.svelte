<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';
</script>

<Accordion type="multiple" class="nds-w-full nds-max-w-lg">
  <AccordionItem value="especificacoes">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>
      <div class="nds-text-body" data-spacing="sm">
        <div class="nds-grid" data-cols="2">
          <span class="nds-text-muted-foreground">Processador</span>
          <span>Intel Core i7-12700</span>
          <span class="nds-text-muted-foreground">Memória RAM</span>
          <span>16 GB DDR5</span>
          <span class="nds-text-muted-foreground">Armazenamento</span>
          <span>512 GB NVMe SSD</span>
          <span class="nds-text-muted-foreground">Sistema</span>
          <span>Windows 11 Pro</span>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="descricao">
    <AccordionTrigger>Descrição detalhada</AccordionTrigger>
    <AccordionContent>
      <div class="nds-text-body nds-text-muted-foreground" data-spacing="sm">
        <p>
          Computador de alto desempenho voltado para profissionais criativos e
          desenvolvedores que necessitam de processamento intensivo.
        </p>
        <p>
          O design compacto permite uso em qualquer ambiente sem comprometer
          a capacidade de processamento.
        </p>
      </div>
    </AccordionContent>
  </AccordionItem>
</Accordion>
