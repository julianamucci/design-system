import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NDS_FORM } from './form';
import { NdsInput } from './input';
import { formPlaygroundSource, type FormArgs } from './form.source';
import { NdsFormDocs } from '@/components/docs/FormDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<FormArgs> = {
  title: 'Components/Form/Form',
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
    docs: { source: { transform: formPlaygroundSource } },
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
    const field = canvasElement.querySelector<HTMLElement>('.nds-form-field')!;
    const control = field.querySelector<HTMLInputElement>('input')!;
    const label = field.querySelector<HTMLLabelElement>('label')!;

    await step('O id do controle é gerado e o rótulo aponta para ele', async () => {
      // O template não escreve `id` nem `for`. Se a fiação falhar, o campo
      // continua bonito na tela e some do leitor de tela.
      await expect(control.id).not.toBe('');
      await expect(label.htmlFor).toBe(control.id);
    });

    await step('O controle é alcançável pelo texto do rótulo', async () => {
      // Buscar por rótulo é o que prova a associação de verdade: um `for`
      // apontando para id inexistente passaria numa checagem de atributo.
      await expect(canvas.getByLabelText(args.label)).toBe(control);
    });

    await step('A descrição é LIDA junto com o campo, não só exibida', async () => {
      const descricao = field.querySelector<HTMLElement>('[data-slot="field-description"]')!;
      // O alvo tem que EXISTIR, não só estar citado: um `aria-describedby`
      // apontando para id inexistente passa em asserção de atributo e o leitor
      // de tela não anuncia nada. Foi assim que a rodada do textarea ficou verde
      // com o campo mudo.
      await expect(descricao.id).not.toBe('');
      await expect(control.getAttribute('aria-describedby')).toContain(descricao.id);
      await expect(document.getElementById(descricao.id)).toBe(descricao);
    });

    await step('Clicar no rótulo leva o foco ao controle', async () => {
      await userEvent.click(label);
      await expect(control).toHaveFocus();
    });
  },
};
