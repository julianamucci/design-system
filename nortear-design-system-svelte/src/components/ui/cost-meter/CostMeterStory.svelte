<script lang="ts">
  /**
   * Andaime do Playground do custo de uma execução.
   *
   * Os rótulos e a QUANTIA são derivados do idioma, e não montados uma vez: a
   * barra de idioma do Storybook troca o idioma com a story montada, a palavra
   * de cada nível é texto de interface e o dinheiro é escrito no idioma de quem
   * lê. Sem o invólucro, o `render` escreveria a quantia no idioma em que a
   * story abriu e ela ficaria para trás na troca.
   *
   * É AQUI que o dinheiro é escrito, e nunca dentro da peça: este invólucro está
   * no papel de quem consome, que é quem conhece a moeda e o idioma. Os controls
   * mexem em NÚMEROS de propósito — um control de texto ensinaria o contrário do
   * contrato.
   *
   * O invólucro também é onde o teto zero vira AUSÊNCIA de teto: é o que o
   * primitivo compartilhado já decide, e é o único caminho para esse caso por
   * control numérico.
   */
  import { locale } from '@/lib/i18n';
  import { spentFraction } from '@shared/primitives/token-budget';
  import { CostMeter, type CostBudget } from './index';
  import { costAmountFor, costMeterLabelsFor } from './cost-meter.fixtures';

  const {
    spent,
    budget,
  }: {
    /** Quanto a execução custou. O andaime escreve a quantia antes de passá-la. */
    spent: number;
    /** O teto declarado. Zero é a ausência de teto, e não um teto de zero. */
    budget: number;
  } = $props();

  const labels = $derived(costMeterLabelsFor($locale));

  /**
   * O teto daqueles controls, já escrito — ou nada, quando o teto é zero.
   *
   * A FRAÇÃO SAI DO PRIMITIVO, e é o `null` dele que decide: teto ausente, zero
   * ou não-finito são a mesma resposta, e nenhum sinalizador à parte precisa
   * existir para dizê-lo.
   */
  const pair: CostBudget | undefined = $derived.by(() => {
    const fraction = spentFraction(spent, budget);
    if (fraction === null) return undefined;
    return { amount: costAmountFor($locale, budget), fraction };
  });
</script>

<CostMeter amount={costAmountFor($locale, spent)} budget={pair} {labels} />
