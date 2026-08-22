import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NDS_FORM } from './form';
import { NdsInput } from './input';
import { NdsFormDocs } from '@/components/docs/FormDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type FormArgs = {
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
function playgroundSource(_gerado: string, ctx: { args?: Partial<FormArgs> }): string {
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

  const campo = [
    `<div ndsFormField${fieldAttrs}>`,
    `  <label ndsFormLabel>${label}</label>`,
    `  <input ${inputAttrs} />`,
    description ? `  <p ndsFormDescription>${description}</p>` : '',
    error ? `  <p ndsFormMessage>${error}</p>` : '',
    '</div>',
  ]
    .filter(Boolean)
    .map((linha) => `      ${linha}`)
    .join('\n');

  return `import { NDS_FORM } from '@/components/ui/form';
import { NdsInput } from '@/components/ui/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [...NDS_FORM, NdsInput, ReactiveFormsModule],
  template: \`
    <form ndsForm [formGroup]="form">
${campo}
    </form>
  \`,
})
export class Exemplo {
  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
}`;
}

const meta: Meta<FormArgs> = {
  title: 'UI/Form',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [...NDS_FORM, NdsInput] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsFormDocs) },
  },
  argTypes: {
    label: { control: 'text', description: 'Texto do rótulo. O campo o associa ao controle.' },
    placeholder: { control: 'text', description: 'Exemplo do formato esperado. Nunca substitui o rótulo.' },
    description: { control: 'text', description: 'Texto de apoio abaixo do controle. Vazio = ausente.' },
    error: { control: 'text', description: 'Mensagem de erro anunciada por aria-live. Vazio = sem erro.' },
    invalid: { control: 'boolean', description: 'Força o estado inválido sem depender de um FormControl.' },
    disabled: { control: 'boolean', description: 'Desabilita o controle interno.' },
  },
  args: {
    label: 'Email',
    placeholder: 'ex: joao@empresa.com',
    description: 'Usaremos apenas para contato.',
    error: '',
    invalid: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<FormArgs>;

/**
 * Nem o rótulo tem `for` nem o controle tem `id` — é o campo que fecha a
 * associação. É o comportamento que o resto do componente depende, e por isso
 * ele é o que a story padrão verifica.
 */
export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    // Saíram daqui duas declarações que esta story não cumpria:
    //
    //  · `accessibility.item5` dizia "contraste 4.5:1 em label, descrição E erro
    //    em TODOS os temas", apoiado no axe. O axe mede o que está na tela, e a
    //    tela está sempre no tema claro; além disso o Playground nasce SEM
    //    mensagem de erro, então o terceiro alvo do item nem existe aqui. O item
    //    passou para `States > Invalid`, onde as três peças existem e a razão é
    //    calculada nos dois modos;
    //  · `visual.item1` é "Padrão — label + input", e o Playground nasce com
    //    descrição nos args: a foto do Chromatic tem três peças, não duas. O
    //    item passou para `Variants > LabelAndControl`, que é a foto certa.
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsFormField class="nds-max-w-sm" [invalid]="invalid || !!error">
        <label ndsFormLabel>{{ label }}</label>
        <input ndsInput type="email" [placeholder]="placeholder" [disabled]="disabled" />
        @if (description) {
          <p ndsFormDescription>{{ description }}</p>
        }
        @if (error) {
          <p ndsFormMessage>{{ error }}</p>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const campo = canvasElement.querySelector<HTMLElement>('.nds-form-field')!;
    const controle = campo.querySelector<HTMLInputElement>('input')!;
    const rotulo = campo.querySelector<HTMLLabelElement>('label')!;

    await step('O id do controle é gerado e o rótulo aponta para ele', async () => {
      // O template não escreve `id` nem `for`. Se a fiação falhar, o campo
      // continua bonito na tela e some do leitor de tela.
      await expect(controle.id).not.toBe('');
      await expect(rotulo.htmlFor).toBe(controle.id);
    });

    await step('O controle é alcançável pelo texto do rótulo', async () => {
      // Buscar por rótulo é o que prova a associação de verdade: um `for`
      // apontando para id inexistente passaria numa checagem de atributo.
      await expect(canvas.getByLabelText(args.label)).toBe(controle);
    });

    await step('A descrição é LIDA junto com o campo, não só exibida', async () => {
      const descricao = campo.querySelector<HTMLElement>('[data-slot="field-description"]')!;
      // O alvo tem que EXISTIR, não só estar citado: um `aria-describedby`
      // apontando para id inexistente passa em asserção de atributo e o leitor
      // de tela não anuncia nada. Foi assim que a rodada do textarea ficou verde
      // com o campo mudo.
      await expect(descricao.id).not.toBe('');
      await expect(controle.getAttribute('aria-describedby')).toContain(descricao.id);
      await expect(document.getElementById(descricao.id)).toBe(descricao);
    });

    await step('Clicar no rótulo leva o foco ao controle', async () => {
      await userEvent.click(rotulo);
      await expect(controle).toHaveFocus();
    });
  },
};
