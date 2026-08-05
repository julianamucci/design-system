<script lang="ts">
  import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
  import { Button } from '@/components/ui/button';
  import Info from '@lucide/svelte/icons/info';
</script>

<!-- `nds-w-full` (block, já ocupa a largura) e `nds-w-auto` no slot de ação
     (absoluto, shrink-to-fit por default) são inertes de propósito: a story
     prova a composição de classes sem mexer no snapshot visual. -->
<Alert class="nds-w-full">
  <Info class="nds-icon" aria-hidden="true" />
  <AlertTitle class="nds-w-full">Classe adicional</AlertTitle>
  <AlertDescription class="nds-w-full">
    A classe do consumidor convive com as do design system.
  </AlertDescription>
  <AlertAction class="nds-w-auto">
    <Button size="sm" variant="outline">Ação</Button>
  </AlertAction>
</Alert>
