/**
 * Transform do painel Code do AspectRatio.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é que a proporção se escreve como DIVISÃO, e não
 * como o decimal que o control carrega: `[ratio]="16 / 9"` é o que a pessoa
 * digita, e `1.7777777777777777` é o que ela receberia se o painel imprimisse o
 * arg cru. A tabela que faz essa tradução mora em `aspect-ratio.fixtures.ts`,
 * porque a story também precisa dela para montar as opções do control.
 */
import { RATIOS } from './aspect-ratio.fixtures';

export type AspectRatioArgs = {
  ratio: number;
  alt: string;
};

/** Ver a nota em separator.stories.ts. */
export function aspectRatioPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<AspectRatioArgs> } = {},
): string {
  const { ratio = 16 / 9, alt = 'Vista aérea da orla' } = ctx.args ?? {};
  const legivel = RATIOS.find((r) => Math.abs(r.value - ratio) < 0.001)?.expr ?? String(ratio);
  return `import { NdsAspectRatio } from '@/components/ui/aspect-ratio';

@Component({
  imports: [NdsAspectRatio],
  template: \`
    <div ndsAspectRatio [ratio]="${legivel}">
      <img src="/orla.jpg" alt="${alt}" />
    </div>
  \`,
})
export class Exemplo {}`;
}
