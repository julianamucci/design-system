import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, within } from 'storybook/test';
import FormFieldStory from './FormFieldStory.svelte';
import { formSource } from './form.source';

type FormArgs = {
  label: string;
  placeholder: string;
  description: string;
  error: string;
  ariaInvalid: boolean;
  disabled: boolean;
};

const meta: Meta<FormArgs> = {
  title: 'Primitives/Form/Form',
  component: FormFieldStory,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'padded',
    docs: { source: { transform: formSource } },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Texto do rótulo. O campo o associa ao controle.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Email' } },
    },
    placeholder: {
      control: 'text',
      description: 'Exemplo do formato esperado. Nunca substitui o rótulo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'ex: joao@empresa.com' } },
    },
    description: {
      control: 'text',
      description: 'Texto de apoio abaixo do controle. Vazio = ausente.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    error: {
      control: 'text',
      description: 'Mensagem de erro anunciada por aria-live. Vazio = sem erro.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid no controle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o controle interno.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    label: 'Email',
    placeholder: 'ex: joao@empresa.com',
    description: 'Usaremos apenas para contato.',
    error: '',
    ariaInvalid: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<FormArgs>;

/**
 * Nem o rótulo tem `for` nem o controle tem `id` — é o campo que fecha a
 * associação. É disso que o resto do componente depende, e por isso é o que a
 * story padrão verifica.
 */
export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
    ],
  },
  render: (args) => ({ Component: FormFieldStory, props: { ...args } }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvasElement.querySelector<HTMLElement>('[data-slot="field"]')!;
    const control = field.querySelector<HTMLInputElement>('input')!;
    const label = field.querySelector<HTMLLabelElement>('label')!;

    await step('O id do controle é gerado e o rótulo aponta para ele', async () => {
      // O render não escreve `id` nem `for`. Se a fiação falhar, o campo
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
      // de tela não anuncia nada.
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
