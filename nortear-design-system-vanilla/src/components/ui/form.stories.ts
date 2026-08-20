import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createFormField } from './form';
import { formSource } from './form.source';
import { createInput } from './input';
import { createFormDocs } from '@/components/docs/FormDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type FormArgs = {
  label: string;
  placeholder: string;
  description: string;
  error: string;
  ariaInvalid: boolean;
  disabled: boolean;
};

const meta: Meta<FormArgs> = {
  title: 'UI/Form',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createFormDocs), source: { transform: formSource } },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Texto do rótulo associado ao controle.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Email' } },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder do input — exemplo do formato esperado.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'ex: joao@empresa.com' } },
    },
    description: {
      control: 'text',
      description: 'Texto de apoio exibido abaixo do controle. Vazio = ausente.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    error: {
      control: 'text',
      description: 'Mensagem de erro (aria-live="polite"). Vazio = sem erro.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    ariaInvalid: {
      control: 'boolean',
      description: 'Aplica aria-invalid="true" no controle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o controle.',
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

// ─── Playground ───────────────────────────────────────────────────────────────

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
  render: (args) => {
    const input = createInput({
      type: 'email',
      placeholder: args.placeholder,
      disabled: args.disabled,
    });
    if (args.ariaInvalid || args.error) {
      input.setAttribute('aria-invalid', 'true');
    }
    return createFormField({
      label: args.label,
      input,
      description: args.description || undefined,
      error: args.error || undefined,
      class: 'nds-max-w-sm',
    });
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const campo = canvasElement.querySelector<HTMLElement>('[data-slot="field"]')!;
    const controle = campo.querySelector<HTMLInputElement>('input')!;
    const rotulo = campo.querySelector<HTMLLabelElement>('label')!;

    await step('O id do controle é gerado e o rótulo aponta para ele', async () => {
      // O render não escreve `id` nem `for`. Se a fiação falhar, o campo
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
      // O id tem que existir E o alvo tem que ser este elemento: um
      // `aria-describedby` apontando para o nada passa em asserção de atributo
      // e não anuncia nada.
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
