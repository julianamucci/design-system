<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from './index';
  import type { AlertVariant } from './index';
  import Info from '@lucide/svelte/icons/info';
  import CheckCircle2 from '@lucide/svelte/icons/circle-check-big';

  interface Props {
    variant?: AlertVariant;
    icon?: 'info' | 'success';
    title?: string;
    description?: string;
    /** Rótulo acessível do botão de fechar; ausente, vale o padrão do Alert. */
    dismissLabel?: string;
    /** Spy/callback repassado ao Alert — dispara uma vez por fechamento. */
    onDismiss?: () => void;
  }

  let {
    variant = 'default',
    icon = 'info',
    title = 'Preferências salvas',
    description = 'Você pode fechar este aviso quando quiser.',
    dismissLabel,
    onDismiss,
  }: Props = $props();

  const ICONS = { info: Info, success: CheckCircle2 };
  let IconComponent = $derived(ICONS[icon]);

  // Fechar remove o alert da tela. Se a story parasse aí, o canvas ficaria
  // vazio depois da play function — e o Chromatic fotografaria o vazio.
  // O contador remonta um alert novo a cada fechamento: o nó ORIGINAL sai do
  // documento (a prova da remoção continua válida) e a story nunca fica vazia.
  let instance = $state(0);

  function handleDismiss() {
    onDismiss?.();
    // Remonta só no microtask seguinte. Remontando no mesmo tick, o `{#key}`
    // destrói a instância antes de o Alert chegar a re-renderizar sem o nó — a
    // remoção que a story prova seria a do wrapper, não a do componente.
    queueMicrotask(() => {
      instance += 1;
    });
  }
</script>

{#key instance}
  <Alert {variant} dismissible {dismissLabel} onDismiss={handleDismiss}>
    <IconComponent aria-hidden="true" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{description}</AlertDescription>
  </Alert>
{/key}
