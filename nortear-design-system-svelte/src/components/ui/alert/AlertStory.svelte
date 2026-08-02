<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';
  import Info from '@lucide/svelte/icons/info';
  import AlertCircle from '@lucide/svelte/icons/circle-alert';
  import CheckCircle2 from '@lucide/svelte/icons/circle-check-big';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

  type IconType = 'info' | 'error' | 'success' | 'warning';

  interface Props {
    variant?: AlertVariant;
    /** Semântica de anúncio repassada ao Alert. */
    role?: 'alert' | 'status' | 'note';
    // `string | null` e `ClassValue` alinham com HTMLAttributes do Alert —
    // sem isso o render das stories acusa Component<Props> incompatível.
    title?: string | null;
    description?: string;
    showIcon?: boolean;
    icon?: IconType;
    class?: ClassValue | null;
    descriptionClass?: string;
    /** Slot de ação no canto superior direito (.nds-alert-action). */
    action?: Snippet;
    /** Exibe o botão de fechar do Alert. */
    dismissible?: boolean;
    /** Callback de fechamento repassado ao Alert. */
    onDismiss?: () => void;
    /** Rótulo acessível do botão de fechar. */
    dismissLabel?: string;
  }

  let {
    variant = 'default',
    role = 'alert',
    title = 'Atenção',
    description = 'Suas alterações serão aplicadas na próxima sessão.',
    showIcon = true,
    icon = 'info',
    class: className = '',
    descriptionClass = '',
    action,
    dismissible = false,
    onDismiss,
    dismissLabel,
  }: Props = $props();

  const ICONS = { info: Info, error: AlertCircle, success: CheckCircle2, warning: TriangleAlert };
  let IconComponent = $derived(ICONS[icon]);
</script>

<Alert {variant} {role} class={className} {dismissible} {onDismiss} {dismissLabel}>
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
