<script lang="ts">
  import { Badge } from './index';
  import type { BadgeVariant } from './index';
  import { Check, Star, AlertTriangle, Tag as TagIcon } from 'lucide-svelte';

  type IconType = 'check' | 'star' | 'warning' | 'tag' | 'none';

  interface Props {
    variant?: BadgeVariant;
    label?: string;
    icon?: IconType;
    class?: string;
    href?: string;
    asButton?: boolean;
    ariaLabel?: string;
  }

  let {
    variant = 'default',
    label = 'Badge',
    icon = 'none',
    class: className = '',
    href,
    asButton = false,
    ariaLabel,
  }: Props = $props();

  const ICONS = { check: Check, star: Star, warning: AlertTriangle, tag: TagIcon };
  let IconComponent = $derived(icon !== 'none' ? ICONS[icon] : null);
</script>

{#if asButton}
  <button
    type="button"
    class="inline-flex rounded-4xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    aria-label={ariaLabel ?? label}
  >
    <Badge {variant} class={className}>
      {#if IconComponent}
        <IconComponent aria-hidden="true" />
      {/if}
      {label}
    </Badge>
  </button>
{:else}
  <Badge {variant} {href} class={className} aria-label={ariaLabel}>
    {#if IconComponent}
      <IconComponent aria-hidden="true" />
    {/if}
    {label}
  </Badge>
{/if}
