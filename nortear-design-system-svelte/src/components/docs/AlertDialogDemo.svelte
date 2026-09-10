<script lang="ts">
  /**
   * Preview vivo da docs page do AlertDialog — o MESMO para Demonstração,
   * Variantes e Do & Don't: o componente de verdade, rastreado.
   *
   * Renderiza sempre o gatilho fechado: o painel vive num portal com véu modal,
   * e um preview aberto por padrão cobriria a página inteira ao carregar.
   */
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
  import { Button } from '@/components/ui/button';
  import { track } from '@/lib/analytics';

  interface Props {
    triggerLabel: string;
    title: string;
    description: string;
    cancelLabel: string;
    actionLabel: string;
    /** Variante do Button usado como gatilho. */
    triggerVariant?: 'default' | 'destructive' | 'outline';
    /** `destructive` pinta a ação com o tom de risco; `default` é a neutra. */
    tone?: 'default' | 'destructive';
    /**
     * Seção da docs page onde o preview está (`docs_demo`, `docs_variantes`,
     * `docs_do_dont`). Obrigatória: o mesmo preview serve três seções, e um
     * valor fixo aqui dentro mandaria todo clique como se viesse da
     * demonstração.
     */
    location: 'docs_demo' | 'docs_variantes' | 'docs_do_dont';
    /**
     * Rótulo estável do evento. Sem ele, sai do tom (`destructive` /
     * `neutral`); o Do & Don't passa o do par (`pair1-do`, `pair2-dont`…),
     * porque ali o tom não distingue o exemplo certo do errado. Nunca texto
     * traduzido: partiria o mesmo evento em três valores no GA4.
     */
    trackLabel?: string;
  }

  const {
    triggerLabel,
    title,
    description,
    cancelLabel,
    actionLabel,
    triggerVariant = 'destructive',
    tone = 'default',
    location,
    trackLabel,
  }: Props = $props();

  const label = $derived(trackLabel ?? (tone === 'destructive' ? 'destructive' : 'neutral'));

  // O `onOpenChange` da lib não diz por que o diálogo fechou, e o
  // `dialog_close` exige `reason` (`18-overlay.md` §Analytics). Três caminhos
  // fecham este componente, e nenhum é o clique fora: `Escape` (anunciado pela
  // lib), o Cancelar (`close-button`, que é o que sobra) e a ação que CONFIRMA
  // — `api`, "fechou por decisão de dentro". A ação e o Cancelar são partes de
  // fechar da lib; sem marcar a confirmação antes, "confirmou" chegaria ao
  // relatório como "apertou o botão de fechar".
  type CloseReason = 'escape' | 'close-button' | 'api';
  let pendingCloseReason: CloseReason | null = null;

  function handleOpenChange(open: boolean): void {
    if (open) {
      pendingCloseReason = null;
      track('dialog_open', { component: 'alert-dialog', label, location });
      return;
    }
    track('dialog_close', {
      component: 'alert-dialog',
      label,
      reason: pendingCloseReason ?? 'close-button',
      location,
    });
    pendingCloseReason = null;
  }

  function handleConfirm(): void {
    pendingCloseReason = 'api';
    track('dialog_confirm', { component: 'alert-dialog', label, location });
  }
</script>

<AlertDialog onOpenChange={handleOpenChange}>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant={triggerVariant}>{triggerLabel}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent onEscapeKeydown={() => { pendingCloseReason = 'escape'; }}>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction variant={tone === 'destructive' ? 'destructive' : 'default'} onclick={handleConfirm}>
        {actionLabel}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
