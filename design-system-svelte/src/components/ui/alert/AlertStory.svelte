<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';

  interface Props {
    variant?: AlertVariant;
    title?: string;
    description?: string;
    showIcon?: boolean;
    class?: string;
  }

  let { variant = 'default', title = 'Atenção', description = 'Suas alterações serão aplicadas na próxima sessão.', showIcon = true, class: className = '' }: Props = $props();
</script>

<Alert {variant} class={className}>
  {#if showIcon}
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  {/if}
  {#if title}
    <AlertTitle>{title}</AlertTitle>
  {/if}
  <AlertDescription>{description}</AlertDescription>
</Alert>
