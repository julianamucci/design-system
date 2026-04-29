<script lang="ts">
  import { Separator } from './index';

  interface Props {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
  }

  let {
    orientation = 'horizontal',
    decorative = true,
  }: Props = $props();
</script>

{#if orientation === 'vertical'}
  <div class="flex items-center h-16 gap-4 text-sm">
    <span class="text-muted-foreground">Item A</span>
    <Separator {orientation} {decorative} />
    <span class="text-muted-foreground">Item B</span>
    <Separator {orientation} {decorative} />
    <span class="text-muted-foreground">Item C</span>
  </div>
{:else}
  <div class="w-72 space-y-3 text-sm">
    <p class="text-muted-foreground">Seção superior</p>
    <Separator {orientation} {decorative} />
    <p class="text-muted-foreground">Seção inferior</p>
  </div>
{/if}
