<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from './index';
  import Info from '@lucide/svelte/icons/info';
  import AlertCircle from '@lucide/svelte/icons/circle-alert';
  import CheckCircle2 from '@lucide/svelte/icons/circle-check-big';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
</script>

<div class="nds-stack" data-spacing="sm">
  <Alert>
    <Info class="nds-icon" aria-hidden="true" />
    <AlertTitle>Informação</AlertTitle>
    <AlertDescription>Mensagem informativa e neutra.</AlertDescription>
  </Alert>
  <Alert variant="destructive">
    <AlertCircle class="nds-icon" aria-hidden="true" />
    <AlertTitle>Erro</AlertTitle>
    <AlertDescription>Erro crítico que bloqueia o fluxo.</AlertDescription>
  </Alert>
  <Alert variant="success">
    <CheckCircle2 class="nds-icon" aria-hidden="true" />
    <AlertTitle>Sucesso</AlertTitle>
    <AlertDescription>Ação concluída com sucesso.</AlertDescription>
  </Alert>
  <Alert variant="warning">
    <TriangleAlert class="nds-icon" aria-hidden="true" />
    <AlertTitle>Aviso</AlertTitle>
    <AlertDescription>Aviso que requer atenção.</AlertDescription>
  </Alert>
</div>
