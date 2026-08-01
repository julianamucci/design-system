<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from './index';
  import Info from '@lucide/svelte/icons/info';

  interface Props {
    /** Spy/callback repassado ao Alert — dispara uma vez por fechamento. */
    onDismiss?: () => void;
  }

  let { onDismiss }: Props = $props();

  // Fechar remove o alert da tela. Se a story parasse aí, o canvas ficaria
  // vazio depois da play function — e o Chromatic fotografaria o vazio.
  // O contador remonta um alert novo a cada fechamento: o nó ORIGINAL sai do
  // documento (a prova da remoção continua válida) e a story nunca fica vazia.
  let instancia = $state(0);

  function handleDismiss() {
    onDismiss?.();
    instancia += 1;
  }
</script>

{#key instancia}
  <Alert dismissible onDismiss={handleDismiss}>
    <Info class="nds-icon" aria-hidden="true" />
    <AlertTitle>Atenção</AlertTitle>
    <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
  </Alert>
{/key}
