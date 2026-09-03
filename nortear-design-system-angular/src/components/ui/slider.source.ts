/**
 * Transform do painel Code do Slider.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o valor é sempre um ARRAY — um item para valor único,
 * dois para intervalo —, e ele mora num signal ligado por `[(value)]`. O
 * `aria-label` entra sempre: sem ele o controle não tem nome acessível, e
 * `min`/`max` sem nome não dizem de que grandeza se está falando.
 */
export type SliderArgs = {
  value: number[];
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  ariaLabel: string;
};

/** Ver a nota em separator.source.ts. */
export function sliderPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SliderArgs> } = {},
): string {
  const {
    value = [50],
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    ariaLabel = 'Volume',
  } = ctx.args ?? {};

  const attrs = [
    `[(value)]="valor"`,
    `[min]="${min}"`,
    `[max]="${max}"`,
    step !== 1 ? `[step]="${step}"` : '',
    disabled ? '[disabled]="true"' : '',
    `aria-label="${ariaLabel}"`,
  ].filter(Boolean).join('\n    ');

  return `import { signal } from '@angular/core';
import { NdsSlider } from '@/components/ui/slider';

@Component({
  imports: [NdsSlider],
  template: \`
    <div ndsSlider
      ${attrs}
    ></div>
  \`,
})
export class Exemplo {
  // Um array: um item para valor único, dois para intervalo.
  readonly valor = signal(${JSON.stringify(value)});
}`;
}
