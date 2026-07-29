<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';
  import Info from '@lucide/svelte/icons/info';
  import AlertCircle from '@lucide/svelte/icons/circle-alert';
  import CheckCircle2 from '@lucide/svelte/icons/circle-check-big';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

  type IconType = 'info' | 'error' | 'success' | 'warning';

  interface Props {
    variant?: AlertVariant;
    title?: string;
    description?: string;
    showIcon?: boolean;
    icon?: IconType;
    class?: string;
    descriptionClass?: string;
    /** Slot de ação no canto superior direito (.nds-alert-action). */
    action?: Snippet;
  }

  let {
    variant = 'default',
    title = 'Atenção',
    description = 'Suas alterações serão aplicadas na próxima sessão.',
    showIcon = true,
    icon = 'info',
    class: className = '',
    descriptionClass = '',
    action,
  }: Props = $props();

  const ICONS = { info: Info, error: AlertCircle, success: CheckCircle2, warning: TriangleAlert };
  let IconComponent = $derived(ICONS[icon]);
</script>

<Alert {variant} class={className}>
  {#if showIcon}
    <IconComponent class="nds-icon" aria-hidden="true" />
  {/if}
  {#if title}
    <AlertTitle>{title}</AlertTitle>
  {/if}
  <AlertDescription class={descriptionClass}>{description}</AlertDescription>
  {#if action}
    <AlertAction>{@render action()}</AlertAction>
  {/if}
</Alert>
