<script lang="ts">
  import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
  import { Button } from '@/components/ui/button';
  import Info from '@lucide/svelte/icons/info';
</script>

<!-- `nds-w-full` (block, já ocupa a largura) e `nds-w-auto` no slot de ação
     (coluna `auto` do grid, já com a largura do botão) são inertes de propósito: a story
     prova a composição de classes sem mexer no snapshot visual. -->
<Alert class="nds-w-full">
  <Info aria-hidden="true" />
  <AlertTitle as="h4" class="nds-w-full">Classe adicional</AlertTitle>
  <AlertDescription class="nds-w-full">
    A classe do consumidor convive com as do design system.
  </AlertDescription>
  <AlertAction class="nds-w-auto">
    <Button size="sm" variant="default">Ação</Button>
  </AlertAction>
</Alert>
