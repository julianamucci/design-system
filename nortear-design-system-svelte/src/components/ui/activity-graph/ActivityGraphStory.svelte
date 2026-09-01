<script lang="ts">
  /**
   * Andaime de uma grade só — o Playground e a maior parte das stories.
   *
   * É componente, e não trecho no arquivo de story, porque num
   * `*.stories.ts` todo export nomeado vira story: não há onde escrever
   * marcação sem publicar uma story a mais na barra lateral.
   *
   * Os rótulos são DERIVADOS do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o nome da
   * camada que rola é texto de interface. Sem o invólucro, o `render`
   * montaria os rótulos no idioma em que a story abriu e eles ficariam para
   * trás na troca.
   *
   * O INVÓLUCRO É TAMBÉM ONDE O EIXO DO PLAYGROUND VIRA DADO: "houve
   * atividade na janela?" vira `days: []` ou a atividade de referência. É
   * recorte de quem consome, e não da peça — a peça não sabe o que é um
   * booleano de atividade, só sabe uma lista de dias.
   *
   * E É ELE QUE PERMITE AFIRMAR QUE NADA FOI DESENHADO. Sem janela — ou sem
   * escala — a peça não desenha marcação nenhuma, e sem um elemento de fora
   * a asserção não teria a que apontar.
   */
  import type { ActivityDay, RunStatus } from '@shared/primitives/chat-protocol';
  import {
    ACTIVITY_DAYS,
    ACTIVITY_END,
    ACTIVITY_START,
    ACTIVITY_THRESHOLDS,
  } from '@shared/primitives/activity-graph-examples';
  import { locale } from '@/lib/i18n';
  import { ActivityGraph } from './index';
  import { activityGraphLabelsFor } from './activity-graph.fixtures';

  const {
    days,
    start = ACTIVITY_START,
    end = ACTIVITY_END,
    thresholds = ACTIVITY_THRESHOLDS,
    weekStart,
    withActivity,
    status = 'complete',
    hostClass,
    testid,
  }: {
    /** O que aconteceu, dia a dia. Ausente é a atividade de referência. */
    days?: readonly ActivityDay[];
    /** O primeiro dia da janela, em ano-mês-dia. */
    start?: string;
    /** O último dia da janela, em ano-mês-dia. */
    end?: string;
    /** Os degraus da escala, em contagem. */
    thresholds?: readonly number[];
    /** Em que dia a semana começa, com zero no domingo. */
    weekStart?: number;
    /**
     * Do Playground: houve atividade na janela? Ignorado quando `days` é
     * passado — é o controle que decide a lista, e não o contrário.
     */
    withActivity?: boolean;
    /** Em que pé está a execução que escreve a grade. */
    status?: RunStatus;
    /** Teto de largura, quando o assunto da story é a rolagem. */
    hostClass?: string;
    /** O endereço que a `play` usa para apontar para o invólucro. */
    testid?: string;
  } = $props();

  const labels = $derived(activityGraphLabelsFor($locale));
  const shownDays = $derived(days ?? (withActivity === false ? [] : ACTIVITY_DAYS));
</script>

<div class={hostClass} data-testid={testid}>
  <ActivityGraph days={shownDays} {start} {end} {thresholds} {weekStart} {status} {labels} />
</div>
