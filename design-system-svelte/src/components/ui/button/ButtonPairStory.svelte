<script lang="ts">
  import { Button } from './index';

  interface Props {
    primaryLabel?: string;
    secondaryLabel?: string;
  }

  let {
    primaryLabel = 'Confirmar',
    secondaryLabel = 'Cancelar',
  }: Props = $props();
</script>

<div class="flex gap-2">
  <Button variant="outline">{secondaryLabel}</Button>
  <Button>{primaryLabel}</Button>
</div>
