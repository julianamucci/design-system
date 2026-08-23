<script lang="ts">
  // As cinco variantes na mesma tela: a story mede contraste, e medir uma por
  // vez esconderia justamente a variante que reprova.
  import { Alert, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';

  const variantes: AlertVariant[] = ['default', 'destructive', 'success', 'warning', 'info'];
</script>

<div class="nds-stack" data-spacing="sm">
  {#each variantes as variant (variant)}
    <Alert variant={variant}>
      <AlertTitle>Título {variant}</AlertTitle>
      <AlertDescription>Texto corrido da variant {variant}.</AlertDescription>
    </Alert>
  {/each}
</div>
