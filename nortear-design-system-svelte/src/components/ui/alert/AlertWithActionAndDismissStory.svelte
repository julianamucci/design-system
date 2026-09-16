<script lang="ts">
  import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
  import { Button } from '@/components/ui/button';
  import Info from '@lucide/svelte/icons/info';
</script>

<!-- Ação e botão de fechar no mesmo alerta: a ação ocupa a terceira coluna do
     grid e o X segue na própria calha, à direita dela. -->
<Alert dismissible>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>
  <AlertDescription>Salve seu trabalho para não perder as alterações.</AlertDescription>
  <AlertAction>
    <Button size="sm" variant="default">Salvar agora</Button>
  </AlertAction>
</Alert>
