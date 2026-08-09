<script lang="ts">
  // As cinco variantes na mesma tela: a story mede contraste, e medir uma por
  // vez esconderia justamente a variante que reprova.
  import { Alert, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';

  const variantes: AlertVariant[] = ['default', 'destructive', 'success', 'warning', 'info'];
</script>

<div class="nds-stack" data-spacing="sm">
  {#each variantes as variante (variante)}
    <Alert variant={variante}>
      <AlertTitle>Título {variante}</AlertTitle>
      <AlertDescription>Texto corrido da variante {variante}.</AlertDescription>
    </Alert>
  {/each}
</div>
