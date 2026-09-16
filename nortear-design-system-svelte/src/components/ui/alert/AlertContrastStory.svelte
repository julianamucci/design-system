<script lang="ts">
  // As cinco variantes na mesma tela: a story mede contraste, e medir uma por
  // vez esconderia justamente a variante que reprova.
  import { Alert, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';

  const variants: AlertVariant[] = ['default', 'destructive', 'success', 'warning', 'info'];
</script>

<div class="nds-stack" data-spacing="sm">
  {#each variants as variant (variant)}
    <Alert {variant}>
      <AlertTitle as="h4">Título {variant}</AlertTitle>
      <AlertDescription>Texto corrido da variante {variant}.</AlertDescription>
    </Alert>
  {/each}
</div>
