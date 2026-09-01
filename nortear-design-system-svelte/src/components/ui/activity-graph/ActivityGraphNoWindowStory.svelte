<script lang="ts">
  /**
   * Andaime dos dois casos em que a peça prefere não existir.
   *
   * São DOIS, e pela mesma razão: fim antes do começo não é janela, e sem
   * degrau todo dia pintaria igual — nenhum dos dois tem onde desenhar uma
   * grade. Devolver uma moldura vazia seria pior que não desenhar nada: a
   * camada que rola é parada de teclado, e uma parada que leva a uma caixa
   * vazia é ruído com nome.
   *
   * Os dois hosts moram no MESMO invólucro, e não em duas stories, porque o
   * assunto da story é justamente que nenhum dos dois desenha nada — duas
   * fotos de nada não ensinam mais que uma.
   */
  import { locale } from '@/lib/i18n';
  import { ActivityGraph } from './index';
  import { activityGraphLabelsFor } from './activity-graph.fixtures';
  import {
    ACTIVITY_DAYS,
    ACTIVITY_END,
    ACTIVITY_START,
    ACTIVITY_THRESHOLDS,
  } from '@shared/primitives/activity-graph-examples';

  const labels = $derived(activityGraphLabelsFor($locale));
</script>

<div class="nds-stack nds-w-full" data-spacing="lg">
  <div data-testid="activity-graph-no-window-host">
    <!-- O fim antes do começo. -->
    <ActivityGraph
      days={ACTIVITY_DAYS}
      start={ACTIVITY_END}
      end={ACTIVITY_START}
      thresholds={ACTIVITY_THRESHOLDS}
      status="complete"
      {labels}
    />
  </div>
  <div data-testid="activity-graph-no-scale-host">
    <!-- Sem degrau, todo dia pintaria igual e a peça deixaria de dizer algo. -->
    <ActivityGraph
      days={ACTIVITY_DAYS}
      start={ACTIVITY_START}
      end={ACTIVITY_END}
      thresholds={[]}
      status="complete"
      {labels}
    />
  </div>
</div>
