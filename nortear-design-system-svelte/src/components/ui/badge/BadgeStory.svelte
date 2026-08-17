<script lang="ts">
  import { Badge } from './index';
  import type { BadgeVariant } from './index';
  import Check from '@lucide/svelte/icons/check';
  import Bell from '@lucide/svelte/icons/bell';

  type Caso = 'simples' | 'comIcone' | 'contador' | 'link' | 'botao';

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
{:else if caso === 'contador'}
  <!-- Contador AO LADO do sino, como a documentação descreve. Quem nomeia é o
       container: "12" sozinho não diz de que é a contagem. -->
  <span class="nds-cluster" data-spacing="sm" role="status" aria-label={ariaLabel}>
    <Bell aria-hidden="true" class="nds-text-foreground nds-icon-lg" />
    <Badge {variant} class={className}>{label}</Badge>
  </span>
{:else if caso === 'link'}
  <!-- Badge ENVOLVIDO em <a>: quem é focável é o link, e o badge fica
       decorativo dentro dele. A prop href do próprio badge saiu — transformava
       o badge no elemento interativo, o contrário do que a docs page orienta. -->
  <a href="#design" aria-label={ariaLabel} class="nds-cluster nds-rounded-md nds-focus-ring-inset">
    <Badge {variant} class={className}>{label}</Badge>
  </a>
{:else if caso === 'botao'}
  <button type="button" aria-label={ariaLabel} class="nds-cluster nds-rounded-md nds-focus-ring-inset">
    <Badge {variant} class={className}>{label}</Badge>
  </button>
{:else}
  <Badge {variant} class={className}>{label}</Badge>
{/if}
