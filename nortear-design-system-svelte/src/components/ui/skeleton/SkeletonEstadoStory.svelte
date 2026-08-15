<script lang="ts">
  import { Skeleton } from './index';
</script>

<div
  role="status"
  aria-busy="true"
  aria-label="Carregando conteúdo"
  class="nds-stack nds-w-sm"
  data-spacing="sm"
>
  <Skeleton data-shape="text" data-width="full" />
  <Skeleton data-shape="text" data-width="3-4" />
</div>
