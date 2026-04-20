<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';
</script>

<Accordion type="multiple" class="w-full max-w-lg">
  <AccordionItem value="especificacoes">
    <AccordionTrigger>Especificações técnicas</AccordionTrigger>
    <AccordionContent>
      <div class="space-y-2 text-sm">
        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
          <span class="text-muted-foreground">Processador</span>
          <span>Intel Core i7-12700</span>
          <span class="text-muted-foreground">Memória RAM</span>
          <span>16 GB DDR5</span>
          <span class="text-muted-foreground">Armazenamento</span>
          <span>512 GB NVMe SSD</span>
          <span class="text-muted-foreground">Sistema</span>
          <span>Windows 11 Pro</span>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="descricao">
    <AccordionTrigger>Descrição detalhada</AccordionTrigger>
    <AccordionContent>
      <div class="space-y-3 text-sm text-muted-foreground">
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
