/**
 * Transform do painel Code do Input.
 *
 * Vive fora do arquivo de story porque é assim que ele passa a ser CHAMADO pelo
 * `source-snippets.test.ts`: a guarda varre `*.source.ts` por glob, executa cada
 * export e cobra o texto que sai. Construtor inline não é alcançável por ela.
 *
 * O snippet ensina o campo com o rótulo ao lado, e nunca sozinho: o `for` do
 * `ndsLabel` casa com o `id` do input, que é o que dá nome acessível ao
 * controle. O estado inválido sai por `aria-invalid`, não por cor.
 */
export type InputArgs = {
  type: string;
  placeholder: string;
  label: string;
  disabled: boolean;
  invalid: boolean;
};

/** Ver a nota em separator.stories.ts. */
export function inputPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<InputArgs> } = {},
): string {
  const {
    type = 'email',
    placeholder = 'ex: joao@empresa.com',
    label = 'Email profissional',
    disabled = false,
    invalid = false,
  } = ctx.args ?? {};

  const attrs = [
    'id="email"',
    `type="${type}"`,
    `placeholder="${placeholder}"`,
    disabled ? 'disabled' : '',
    invalid ? 'aria-invalid="true"' : '',
  ].filter(Boolean).join(' ');

  return `import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsInput, NdsLabel],
  template: \`
    <label ndsLabel for="email">${label}</label>
    <input ndsInput ${attrs} />
  \`,
})
export class Exemplo {}`;
}
