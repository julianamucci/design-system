/**
 * Transform do painel Code do Separator.
 *
 * ESTE MÓDULO GUARDA A NOTA que os outros construtores desta stack citam. Ela
 * nasceu em `separator.stories.ts`, e um ponteiro curto continua lá para quem
 * chegar pelo caminho antigo — a explicação, porém, é esta, e vale para todos:
 *
 *   O renderer do Storybook imprime o `template` da story como está escrito —
 *   inclusive o `@if` que alterna exemplos e os bindings ligados aos args
 *   (`[orientation]="orientation"`). Isso é o ANDAIME da story, não o que
 *   alguém escreve para usar o componente. O `transform` devolve o uso real,
 *   com os valores atuais dos controls já resolvidos.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 */
import type { SeparatorEmphasis, SeparatorOrientation } from './separator';

export type SeparatorArgs = {
  orientation: SeparatorOrientation;
  decorative: boolean;
  emphasis: SeparatorEmphasis;
};

/**
 * O painel Code mostra o `template` da story como está escrito — inclusive o
 * `@if` que alterna exemplos e os bindings ligados aos args
 * (`[orientation]="orientation"`). Isso é o andaime da story, não o que alguém
 * escreve para usar um Separator. O `transform` devolve o uso real, com os
 * valores atuais dos controls resolvidos — mesma decisão do Vanilla, onde um
 * dump de DOM também não era o que o consumidor escreve.
 */
export function separatorPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<SeparatorArgs> } = {},
): string {
  const { orientation = 'horizontal', decorative = true, emphasis = 'default' } = ctx.args ?? {};
  // Só o que difere do default aparece — snippet de documentação não deve
  // ensinar a repetir o valor que já vem por padrão.
  const attrs = [
    `orientation="${orientation}"`,
    decorative ? '' : '[decorative]="false"',
    emphasis === 'strong' ? 'emphasis="strong"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsSeparator } from '@/components/ui/separator';

@Component({
  imports: [NdsSeparator],
  template: \`
    <p>Seção superior</p>
    <div ndsSeparator ${attrs}></div>
    <p>Seção inferior</p>
  \`,
})
export class Exemplo {}`;
}
