<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';
  import { Info, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide-svelte';

  type IconType = 'info' | 'error' | 'success' | 'warning';

  interface Props {
    variant?: AlertVariant;
    title?: string;
    description?: string;
    showIcon?: boolean;
    icon?: IconType;
    class?: string;
    descriptionClass?: string;
  }

  let {
    variant = 'default',
    title = 'Atenção',
    description = 'Suas alterações serão aplicadas na próxima sessão.',
    showIcon = true,
    icon = 'info',
    class: className = '',
    descriptionClass = '',
  }: Props = $props();

  const ICONS = { info: Info, error: AlertCircle, success: CheckCircle2, warning: TriangleAlert };
  let IconComponent = $derived(ICONS[icon]);
</script>

<Alert {variant} class={className}>
  {#if showIcon}
    <IconComponent class="h-4 w-4" aria-hidden="true" />
  {/if}
  {#if title}
    <AlertTitle>{title}</AlertTitle>
  {/if}
  <AlertDescription class={descriptionClass}>{description}</AlertDescription>
</Alert>
