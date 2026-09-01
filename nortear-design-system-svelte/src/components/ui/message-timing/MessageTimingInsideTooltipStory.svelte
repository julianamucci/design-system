<script lang="ts">
  /**
   * Andaime da forma compacta: um controle guarda a linha inteira.
   *
   * É como a fonte resolve o espaço de uma linha, e aqui ela é COMPOSIÇÃO em
   * vez de variante — o gatilho é um controle de verdade, com nome próprio, e a
   * peça continua sendo a mesma linha por dentro (decisão 8 da folha). Ela não
   * abre camada flutuante nem herda a política de foco que vem com ela.
   *
   * DIVERGÊNCIA DE API a registrar, e ela é da dica de ferramenta, não do tempo
   * da resposta: nesta stack a dica é uma composição de quatro componentes —
   * provedor, raiz, gatilho e conteúdo —, e a abertura inicial se declara por
   * estado ligado à raiz, e não por um argumento de configuração. Divergência
   * de API de framework não se "alinha": registra-se. O que não muda é o que
   * importa — o gatilho continua sendo um botão de verdade com nome próprio, e
   * a linha continua sem saber que está dentro de uma dica.
   *
   * O respiro de fora é do ANDAIME: sem ele a dica nasce colada na borda do
   * quadro e a foto de regressão corta o balão. Mesma escolha do andaime da
   * própria dica de ferramenta.
   *
   * As props são as MESMAS da peça — o arquivo de stories é tipado pelo
   * componente, e um invólucro com vocabulário próprio deixaria de caber ali.
   * Por isso o rótulo do gatilho nasce AQUI, do idioma da página, em vez de
   * chegar como uma prop que a peça não tem.
   */
  import { locale } from '@/lib/i18n';
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from '@/components/ui/tooltip';
  import { Button } from '@/components/ui/button';
  import { MessageTiming, type MessageTimingLabels, type MessageTimingStat } from './index';
  import { messageTimingTriggerLabelFor } from './message-timing.fixtures';

  const {
    stats,
    labels,
  }: {
    /** As medições que a dica guarda. */
    stats: readonly MessageTimingStat[];
    labels: MessageTimingLabels;
  } = $props();

  /** O número que resume a medição, escrito no idioma da página. */
  const triggerLabel = $derived(messageTimingTriggerLabelFor($locale));

  // Aberta de saída: o assunto é onde a linha mora, e não a animação de abrir.
  // Fechada, a foto não mostraria nada do que se quer provar.
  let open = $state(true);
</script>

<div class="nds-p-8">
  <TooltipProvider delayDuration={0}>
    <Tooltip bind:open>
      <TooltipTrigger>
        {#snippet child({ props })}
          <!-- O nome do controle é PRÓPRIO, e não emprestado da dica: em toque
               não há ponteiro, e o botão precisa dizer o que mostra mesmo com a
               dica fechada. -->
          <Button variant="ghost" size="sm" aria-label={labels.title} {...props}>
            {triggerLabel}
          </Button>
        {/snippet}
      </TooltipTrigger>
      <TooltipContent side="top">
        <MessageTiming {stats} {labels} />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>
