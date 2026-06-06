<script lang="ts">
  import { Skeleton } from './index';

  interface Props {
    class?: string;
  }

  let { class: classProp = 'h-4 w-[250px]' }: Props = $props();
</script>

<div role="status" aria-busy="true" aria-label="Carregando conteúdo">
  <Skeleton class={`${classProp} motion-reduce:animate-none`} aria-hidden="true" />
</div>
