/**
 * Transform do painel Code do Checkbox.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é o par controle + rótulo: o `id` do checkbox e o
 * `for` do label são o que dá nome acessível ao controle e o que faz o clique
 * no texto marcar a caixa. Por isso o `id` entra SEMPRE no snippet, mesmo sendo
 * o único atributo que não veio de um control — sem ele o exemplo estaria
 * ensinando um checkbox anônimo.
 */

export type CheckboxArgs = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

/** Ver a nota em separator.stories.ts. */
export function checkboxPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CheckboxArgs> } = {},
): string {
  const {
    checked = false,
    indeterminate = false,
    disabled = false,
    label = 'Aceito os termos',
  } = ctx.args ?? {};

  const attrs = [
    'id="termos"',
    checked ? '[checked]="true"' : '',
    indeterminate ? '[indeterminate]="true"' : '',
    disabled ? '[disabled]="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsCheckbox } from '@/components/ui/checkbox';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsCheckbox, NdsLabel],
  template: \`
    <button ndsCheckbox ${attrs}></button>
    <label ndsLabel for="termos">${label}</label>
  \`,
})
export class Exemplo {}`;
}
