/**
 * Transform do painel Code do Form.
 *
 * Módulo próprio porque é o que põe o construtor sob o
 * `source-snippets.test.ts`: a guarda varre `*.source.ts` por glob e CHAMA cada
 * export. Função local dentro da story não é alcançável por ela, e o texto que
 * o leitor copia ficava sem portão nenhum.
 *
 * O snippet ensina o campo inteiro — rótulo, controle, descrição e mensagem de
 * erro dentro do mesmo `ndsFormField` — junto do `FormGroup` reativo que o
 * alimenta. É a parte que a story não mostra: o `@if` do andaime esconde de
 * onde vem o `formControlName`.
 */
export type FormArgs = {
  label: string;
  placeholder: string;
  description: string;
  error: string;
  invalid: boolean;
  disabled: boolean;
};

/**
 * O painel Code do renderer Angular imprime o andaime da story — com o `@if`
 * que decide se a descrição aparece e com `[placeholder]` ligado a um arg. Ver
 * a armadilha 3 do CLAUDE.md desta stack; o que a pessoa copia sai daqui.
 */
export function formPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<FormArgs> } = {},
): string {
  const {
    label = 'Email',
    placeholder = 'ex: joao@empresa.com',
    description = '',
    error = '',
    invalid = false,
    disabled = false,
  } = ctx.args ?? {};

  const fieldAttrs = invalid || error ? ' [invalid]="true"' : '';
  const inputAttrs = [
    'ndsInput',
    'type="email"',
    'formControlName="email"',
    `placeholder="${placeholder}"`,
    disabled ? 'disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const field = [
    `<div ndsFormField${fieldAttrs}>`,
    `  <label ndsFormLabel>${label}</label>`,
    `  <input ${inputAttrs} />`,
    description ? `  <p ndsFormDescription>${description}</p>` : '',
    error ? `  <p ndsFormMessage>${error}</p>` : '',
    '</div>',
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join('\n');

  return `import { NDS_FORM } from '@/components/ui/form';
import { NdsInput } from '@/components/ui/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [...NDS_FORM, NdsInput, ReactiveFormsModule],
  template: \`
    <form ndsForm [formGroup]="form">
${field}
    </form>
  \`,
})
export class Exemplo {
  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
}`;
}
