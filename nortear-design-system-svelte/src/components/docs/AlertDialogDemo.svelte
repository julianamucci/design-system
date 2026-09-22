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
    createAlertDialogCloseWatch,
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
     * Id estável do gatilho, que vai no `trigger_id` dos eventos.
     *
     * OBRIGATÓRIO, e sempre escrito no ponto de uso. Até 2026-09-22 ele era
     * opcional e caía num valor DERIVADO do `tone` — com isso o id do evento
     * mudava junto com a cor do botão, e o payload deixava de identificar o
     * gatilho: era o tom que chegava ao GA4, não o preview. O Do & Don't já
     * passava o id do par (`pair1-do`, `pair2-dont`…), porque ali o tom não
     * distingue o exemplo certo do errado; agora todos passam.
     *
     * Nunca texto traduzido: partiria o mesmo evento em três valores no GA4.
     */
    triggerId: string;
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
    triggerId,
  }: Props = $props();

  // O `onOpenChange` da lib não diz por que o diálogo fechou, e o
  // `dialog_close` exige `reason` (`18-overlay.md` §Analytics). Quem traduz
  // gesto em palavra é o `close-reason.ts` do primitivo, ao lado das peças:
  // este preview é só mais um consumidor dele, como qualquer app seria.
  //
  // Até 2026-09-12 a tradução morava AQUI, num tipo local chamado
  // `CloseReason` — o nome genérico o deixava fora até dos portões que
  // comparam o vocabulário entre stacks.
  //
  // Uma instância por preview: a docs page monta este componente uma vez por
  // exemplo, e um gesto pendente compartilhado misturaria os previews.
  const closeWatch = createAlertDialogCloseWatch();

  function handleOpenChange(open: boolean): void {
    if (open) {
      closeWatch.reset();
      track('dialog_open', { component: 'alert-dialog', trigger_id: triggerId, location });
      return;
    }
    track('dialog_close', {
      component: 'alert-dialog',
      trigger_id: triggerId,
      reason: closeWatch.takeReason(),
      location,
    });
  }

  /**
   * A confirmação e o evento de confirmação, numa chamada só.
   *
   * A marca vai ANTES do `dialog_confirm` de propósito: o painel fecha na
   * sequência, e o `dialog_close` precisa encontrar a decisão anotada. Sem ela
   * "confirmou a exclusão" chegaria ao relatório como "apertou o Cancelar" — a
   * ação e o Cancelar são partes de fechar da lib, indistinguíveis de fora.
   */
  function handleConfirm(): void {
    closeWatch.markConfirmation();
    track('dialog_confirm', { component: 'alert-dialog', trigger_id: triggerId, location });
  }
</script>

<AlertDialog onOpenChange={handleOpenChange}>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant={triggerVariant}>{triggerLabel}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent {...closeWatch.listeners}>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <!--
        O clique no Cancelar é o `close-press` que a lib não publica: ela avisa
        que o diálogo fechou, e o Cancelar e a ação saem pelo mesmo caminho.
        Sem esta marca o fechamento cairia no padrão `api` — "decisão de
        dentro" para quem só desistiu.
      -->
      <AlertDialogCancel {...closeWatch.cancelTrigger}>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction variant={tone === 'destructive' ? 'destructive' : 'default'} onclick={handleConfirm}>
        {actionLabel}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
