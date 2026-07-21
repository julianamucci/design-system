<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';
  import { Info, AlertTriangle, CheckCircle } from 'lucide-svelte';
</script>

<Accordion type="single" class="nds-w-full nds-max-w-lg">
  <AccordionItem value="info">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <Info class="text-blue-500 nds-shrink-0" style="height: 1rem; width: 1rem" aria-hidden="true" />
        Informações gerais
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Ícone à esquerda do label. Use aria-hidden no ícone para não poluir leitores de tela.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="aviso">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <AlertTriangle class="text-amber-500 nds-shrink-0" style="height: 1rem; width: 1rem" aria-hidden="true" />
        Atenção — leia antes de continuar
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Ícones contextuais reforçam a semântica do item sem depender apenas de cor.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="sucesso">
    <AccordionTrigger>
      <span class="nds-cluster" data-spacing="sm">
        <CheckCircle class="text-green-500 nds-shrink-0" style="height: 1rem; width: 1rem" aria-hidden="true" />
        Configuração concluída
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Use ícones semânticos (info, warning, success) para reforçar o estado.
    </AccordionContent>
  </AccordionItem>
</Accordion>
