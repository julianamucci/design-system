<script lang="ts">
  import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
  import { Button } from '@/components/ui/button';
  import Info from '@lucide/svelte/icons/info';
</script>

<Alert>
  <Info class="nds-icon" aria-hidden="true" />
  <AlertTitle>Atualização disponível</AlertTitle>
  <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
  <AlertAction>
    <Button size="sm" variant="default">Atualizar</Button>
  </AlertAction>
</Alert>
