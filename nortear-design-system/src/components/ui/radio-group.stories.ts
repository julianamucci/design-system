import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';
import { createRadioGroupDocs } from '@/components/docs/RadioGroupDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type RadioGroupArgs = {
  name: string;
  disabled: boolean;
  groupLabel: string;
};

const meta: Meta<RadioGroupArgs> = {
  title: 'UI/RadioGroup',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createRadioGroupDocs) },
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML (atributo `name` dos radios).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
    },
    groupLabel: {
      control: 'text',
      description: 'aria-label do `<fieldset>`/grupo — descreve a escolha.',
    },
  },
  args: {
    name: 'payment',
    disabled: false,
    groupLabel: 'Forma de pagamento',
  },
};

export default meta;
type Story = StoryObj<RadioGroupArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'xs';

    const legend = document.createElement('p');
    legend.id = 'rg-pg-legend';
    legend.className = 'nds-text-body nds-font-semibold';
    legend.textContent = args.groupLabel;

    const group = createRadioGroup({
      name: args.name,
      items: [
        { value: 'card', label: 'Cartão de crédito', disabled: args.disabled },
        { value: 'pix', label: 'Pix', disabled: args.disabled },
        { value: 'boleto', label: 'Boleto bancário', disabled: args.disabled },
      ],
    });
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', 'rg-pg-legend');

    wrap.append(legend, group);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grupo possui role="radiogroup"', async () => {
      const group = canvasElement.querySelector('[role="radiogroup"]');
      await expect(group).toBeTruthy();
    });

    await step('Três itens com role="radio"', async () => {
      const radios = canvas.getAllByRole('radio');
      await expect(radios).toHaveLength(3);
    });

    await step('Nenhum item está pré-selecionado', async () => {
      const radios = canvas.getAllByRole('radio');
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clicar no segundo item marca aria-checked="true"', async () => {
      const radios = canvas.getAllByRole('radio');
      await userEvent.click(radios[1]);
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      await expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });
  },
};
