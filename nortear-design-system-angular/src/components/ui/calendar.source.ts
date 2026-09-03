/**
 * Transform do painel Code do Calendar.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é o TIPO da data: um calendário fala `CalendarDate`
 * do `@internationalized/date`, sem hora e sem fuso, e não `Date` do
 * JavaScript. O modo também muda a forma do estado — um valor em modo único,
 * um array em modo múltiplo —, e o snippet mostra os dois já resolvidos, com o
 * `signal` que o binding de duas vias exige.
 */
import type { CalendarCaptionLayout, CalendarMode } from './calendar';

export type CalendarArgs = {
  mode: CalendarMode;
  locale: string;
  captionLayout: CalendarCaptionLayout;
  numberOfMonths: number;
  showOutsideDays: boolean;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o binding no
 * arg, que não é o que a pessoa deve escrever. Ver a nota em
 * `separator.stories.ts`.
 */
export function calendarPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CalendarArgs> } = {},
): string {
  const {
    mode = 'single',
    locale = 'pt-BR',
    captionLayout = 'label',
    numberOfMonths = 1,
    showOutsideDays = true,
  } = ctx.args ?? {};

  const multiplo = mode === 'multiple';
  const attrs = [
    multiplo ? 'mode="multiple"' : '',
    '[(value)]="data"',
    `locale="${locale}"`,
    captionLayout === 'dropdown' ? 'captionLayout="dropdown"' : '',
    numberOfMonths !== 1 ? `[numberOfMonths]="${numberOfMonths}"` : '',
    showOutsideDays ? '' : '[showOutsideDays]="false"',
  ]
    .filter(Boolean)
    .join('\n      ');

  const inicial = multiplo
    ? `signal([parseDate('2026-04-08'), parseDate('2026-04-12')])`
    : `signal(parseDate('2026-04-12'))`;

  return `import { signal } from '@angular/core';
import { parseDate } from '@internationalized/date';
import { NdsCalendar } from '@/components/ui/calendar';

@Component({
  imports: [NdsCalendar],
  template: \`
    <div
      ndsCalendar
      ${attrs}
    ></div>
  \`,
})
export class Exemplo {
  // CalendarDate do @internationalized/date — sem hora e sem fuso, que é o que
  // um calendário precisa.
  readonly data = ${inicial};
}`;
}
