import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createSelect } from './select';
import { createSelectDocs } from '@/components/docs/SelectDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SelectArgs = {
  name: string;
  placeholder: string;
  disabled: boolean;
  labelText: string;
};

const meta: Meta<SelectArgs> = {
  title: 'UI/Select',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createSelectDocs) },
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML (atributo `name` do `<select>`).',
    },
    placeholder: {
      control: 'text',
      description: 'Texto exibido quando nenhuma opção está selecionada.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o `<select>` inteiro.',
    },
    labelText: {
      control: 'text',
      description: 'Texto do `<label>` associado via `for/id` — obrigatório para acessibilidade.',
    },
  },
  args: {
    name: 'state',
    placeholder: 'Selecione...',
    disabled: false,
    labelText: 'Estado',
  },
};

export default meta;
type Story = StoryObj<SelectArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';

    const label = document.createElement('label');
    label.htmlFor = 'sel-pg';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = args.labelText;

    const select = createSelect({
      placeholder: args.placeholder,
      disabled: args.disabled,
      items: [
        { value: 'sp', label: 'São Paulo' },
        { value: 'rj', label: 'Rio de Janeiro' },
        { value: 'mg', label: 'Minas Gerais' },
        { value: 'rs', label: 'Rio Grande do Sul' },
      ],
    });
    select.id = 'sel-pg';
    select.name = args.name;

    wrap.append(label, select);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select é renderizado como combobox', async () => {
      const select = canvas.getByRole('combobox');
      await expect(select).toBeTruthy();
    });

    await step('Placeholder visível e nenhum valor selecionado', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await expect(select.value).toBe('');
    });

    await step('Trocar a opção atualiza o valor', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await userEvent.selectOptions(select, 'rj');
      await expect(select.value).toBe('rj');
    });
  },
};
