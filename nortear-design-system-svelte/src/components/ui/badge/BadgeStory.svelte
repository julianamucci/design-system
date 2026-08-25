<script lang="ts">
  import { Badge } from './index';
  import type { BadgeVariant } from './index';
  import Check from '@lucide/svelte/icons/check';

  type Caso = 'simples' | 'comIcone' | 'botao';

  interface Props {
    caso?: Caso;
    variant?: BadgeVariant;
    label?: string;
    class?: string;
    ariaLabel?: string;
  }

  let {
    caso = 'simples',
    variant = 'default',
    label = 'Badge',
    class: className = '',
    ariaLabel = '',
  }: Props = $props();
</script>

{#if caso === 'comIcone'}
  <Badge {variant} class={className}>
    <Check aria-hidden="true" data-icon="inline-start" />
    {label}
  </Badge>
{:else if caso === 'botao'}
  <!-- Badge ENVOLVIDO em <button>: quem é focável é o botão, e o badge fica
       decorativo dentro dele. A prop href do próprio badge saiu — transformava
       o badge no elemento interativo, o contrário do que a docs page orienta. -->
  <button type="button" aria-label={ariaLabel} class="nds-cluster nds-rounded-md nds-focus-ring-inset">
    <Badge {variant} class={className}>{label}</Badge>
  </button>
{:else}
  <Badge {variant} class={className}>{label}</Badge>
{/if}
