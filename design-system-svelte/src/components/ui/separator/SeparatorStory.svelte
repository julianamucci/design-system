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
  <div class="nds-cluster nds-text-body" data-align="center" data-spacing="md" style="height: 4rem">
    <span class="nds-text-muted-foreground">Item A</span>
    <Separator {orientation} {decorative} />
    <span class="nds-text-muted-foreground">Item B</span>
    <Separator {orientation} {decorative} />
    <span class="nds-text-muted-foreground">Item C</span>
  </div>
{:else}
  <div class="nds-text-body" data-spacing="sm" style="width: 18rem">
    <p class="nds-text-muted-foreground">Seção superior</p>
    <Separator {orientation} {decorative} />
    <p class="nds-text-muted-foreground">Seção inferior</p>
  </div>
{/if}
