<!--
  Andaime da story do dado que ENCOLHE: um botão que troca o conjunto e o
  gráfico que o desenha.

  Existe pelo mesmo motivo do ChartDualStory — nesta stack não dá para compor
  dois componentes dentro do `.ts` da story, então o andaime é um `.svelte`.
-->
<script lang="ts">
  import { ChartContainer, buildBarOption } from './index';
  import { Button } from '../button';

  interface Serie {
    name: string;
    data: number[];
  }
  // Props todas opcionais: o render das stories tipa o componente contra `Args`,
  // e prop obrigatória faz o `Component<Props>` sair incompatível.
  interface Props {
    months?: string[];
    series?: Serie[];
    reduced?: Serie[];
    label?: string;
    buttonLabel?: string;
    height?: number;
  }

  let {
    months = [],
    series = [],
    reduced = [],
    label = 'Acessos mensais por dispositivo',
    buttonLabel = 'Reler do servidor',
    height = 280,
  }: Props = $props();

  // DEFINE o conjunto reduzido — não alterna entre dois.
  //
  // O painel Interactions reexecuta a play no MESMO DOM, sem remontar: um botão
  // que alternasse levaria a segunda rodada de volta ao conjunto cheio e a
  // asserção inverteria. Definindo, clicar duas vezes vale o mesmo que uma.
  let atual = $state(series);
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <Button variant="outline" size="sm" onclick={() => (atual = reduced)}>
    {buttonLabel}
  </Button>
  <ChartContainer
    option={buildBarOption({ xAxis: months, series: atual })}
    {height}
    showData
    class="nds-w-full"
    aria-label={label}
  />
</div>
