/**
 * Transform do painel Code do Chart.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é que o `label` NÃO é opcional: ele vira o nome
 * acessível do desenho e a legenda da tabela de dados que existe por baixo de
 * todo gráfico. E ensina que eixo e séries chegam como membros da classe — o
 * template do Angular só enxerga o que a classe declara, e um array importado
 * no topo do arquivo seria invisível ali.
 */
import type { ChartType } from './chart';

export type ChartArgs = {
  type: ChartType;
  label: string;
  chartTitle: string;
  showLegend: boolean | undefined;
  showData: boolean;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o `[type]`
 * ligado ao arg, que não é o que a pessoa escreve. Devolve o uso real.
 * Ver a nota em separator.stories.ts.
 */
export function chartPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ChartArgs> } = {},
): string {
  const { type = 'bar', label = '', chartTitle = '', showData = false } = ctx.args ?? {};
  const lines = [
    `<div ndsChart`,
    `  type="${type}"`,
    `  [xAxis]="meses"`,
    `  [series]="series"`,
    // O rótulo é o contrato de acessibilidade do componente: sem ele o
    // compilador reclama, e é isso que o snippet precisa mostrar.
    `  label="${label}"`,
  ];
  if (chartTitle) lines.push(`  chartTitle="${chartTitle}"`);
  if (showData) lines.push(`  [showData]="true"`);
  lines.push(`></div>`);

  return `import { NdsChart } from '@/components/ui/chart';

@Component({
  imports: [NdsChart],
  template: \`
${lines.map((l) => `    ${l}`).join('\n')}
  \`,
})
export class Exemplo {
  readonly meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  readonly series = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
}`;
}
