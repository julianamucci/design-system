/**
 * Transform do painel Code do Textarea.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: o campo é um `<textarea>` nativo com a diretiva, e o
 * rótulo é um `<label ndsLabel for="…">` — o par `id`/`for` é o nome acessível.
 * A altura nasce de `rows` e da classe de mínimo, nunca de medida cravada
 * (guideline 12): assim o campo cresce junto com a fonte do navegador.
 */
export type TextareaArgs = {
  label: string;
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  invalid: boolean;
  rows: number;
  maxlength: number;
};

/** Ver a nota em separator.source.ts: o painel Code mostra o andaime da story. */
export function textareaPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<TextareaArgs> } = {},
): string {
  const {
    label = 'Descrição',
    placeholder = 'ex: Descreva o produto em até 500 caracteres...',
    disabled = false,
    readonly = false,
    invalid = false,
    rows = 3,
    maxlength = 500,
  } = ctx.args ?? {};

  const attrs = [
    'id="description"',
    `rows="${rows}"`,
    `maxlength="${maxlength}"`,
    `placeholder="${placeholder}"`,
    'class="nds-resize-y nds-min-h-30"',
    disabled ? 'disabled' : '',
    readonly ? 'readonly' : '',
    invalid ? 'aria-invalid="true"' : '',
  ].filter(Boolean).join('\n    ');

  return `import { NdsTextarea } from '@/components/ui/textarea';
import { NdsLabel } from '@/components/ui/label';

@Component({
  imports: [NdsTextarea, NdsLabel],
  template: \`
    <label ndsLabel for="description">${label}</label>
    <textarea
      ndsTextarea
      ${attrs}
    ></textarea>
  \`,
})
export class Exemplo {}`;
}
