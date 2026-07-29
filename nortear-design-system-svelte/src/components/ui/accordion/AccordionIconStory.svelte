<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';
  import Info from '@lucide/svelte/icons/info';
  import AlertTriangle from '@lucide/svelte/icons/triangle-alert';
  import CheckCircle from '@lucide/svelte/icons/circle-check';
</script>

<Accordion type="single" class="nds-max-w-lg">
  <AccordionItem value="info">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <Info class="nds-icon nds-text-info nds-shrink-0" aria-hidden="true" />
        Informação
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Ícones facilitam a identificação rápida do tipo de conteúdo. Adicione aria-hidden="true" no ícone.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="warning">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <AlertTriangle class="nds-icon nds-text-warning nds-shrink-0" aria-hidden="true" />
        Aviso
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Sinalize categorias distintas com ícones semânticos. O texto do trigger já descreve para leitores de tela.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="success">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <CheckCircle class="nds-icon nds-text-success nds-shrink-0" aria-hidden="true" />
        Confirmação
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Use ícones consistentes entre itens do mesmo accordion para criar padrão visual.
    </AccordionContent>
  </AccordionItem>
</Accordion>
