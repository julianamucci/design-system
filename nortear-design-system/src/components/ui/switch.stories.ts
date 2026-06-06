import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createSwitch } from './switch';
import { createSwitchDocs } from '@/components/docs/SwitchDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SwitchArgs = {
  checked: boolean;
  disabled: boolean;
  label: string;
  ariaLabel: string;
};

const meta: Meta<SwitchArgs> = {
  title: 'UI/Switch',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createSwitchDocs) },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado inicial marcado (não-controlado no Basecoat).',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o Switch.',
    },
    label: {
      control: 'text',
      description:
        'Texto do Label associado via `htmlFor` ao `id` do Switch. Descreve o estado ATIVO da função.',
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label quando não há Label visível associado.',
    },
  },
  args: {
    checked: false,
    disabled: false,
    label: 'Receber notificações por email',
    ariaLabel: '',
  },
};

export default meta;
type Story = StoryObj<SwitchArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildSwitchWithLabel(args: SwitchArgs): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';

  const id = `switch-playground-${Math.random().toString(36).slice(2, 8)}`;
  const sw = createSwitch({
    id,
    checked: args.checked,
    disabled: args.disabled,
    ...(args.ariaLabel ? { 'aria-label': args.ariaLabel } : {}),
  });

  if (args.label) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = args.label;
    label.className =
      'text-sm font-medium leading-none ' +
      (args.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer');
    if (!args.disabled) {
      label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });
    }
    row.append(sw, label);
  } else {
    row.append(sw);
  }

  return row;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => buildSwitchWithLabel(args),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Switch presente no DOM com role correto', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toBeInTheDocument();
    });

    await step('Switch está visível', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toBeVisible();
    });

    await step('aria-checked reflete o estado inicial', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clique alterna para ativado', async () => {
      const sw = canvas.getByRole('switch');
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clique novamente desativa', async () => {
      const sw = canvas.getByRole('switch');
      await userEvent.click(sw);
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  },
};
