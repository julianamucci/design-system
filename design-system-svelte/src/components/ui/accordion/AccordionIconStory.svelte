<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from './index';
  import { Info, AlertTriangle, CheckCircle } from 'lucide-svelte';
</script>

<Accordion type="single" class="w-full max-w-lg">
  <AccordionItem value="info">
    <AccordionTrigger>
      <span class="flex items-center gap-2">
        <Info class="h-4 w-4 text-blue-500 shrink-0" aria-hidden="true" />
        Informações gerais
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Ícone à esquerda do label. Use aria-hidden no ícone para não poluir leitores de tela.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="aviso">
    <AccordionTrigger>
      <span class="flex items-center gap-2">
        <AlertTriangle class="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
        Atenção — leia antes de continuar
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Ícones contextuais reforçam a semântica do item sem depender apenas de cor.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="sucesso">
    <AccordionTrigger>
      <span class="flex items-center gap-2">
        <CheckCircle class="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
        Configuração concluída
      </span>
    </AccordionTrigger>
    <AccordionContent>
      Use ícones semânticos (info, warning, success) para reforçar o estado.
    </AccordionContent>
  </AccordionItem>
</Accordion>
