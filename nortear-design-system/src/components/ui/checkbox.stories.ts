import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCheckbox, type CheckboxOptions } from './checkbox';
import { createCheckboxDocs } from '@/components/docs/CheckboxDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CheckboxArgs = {
  checked: boolean;
  disabled: boolean;
  label: string;
  ariaLabel: string;
};

const meta: Meta<CheckboxArgs> = {
  title: 'UI/Checkbox',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createCheckboxDocs) },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Estado marcado inicial do checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o checkbox',
    },
    label: {
      control: 'text',
      description: 'Texto do label associado',
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label quando não há label visível',
    },
  },
  args: {
    checked: false,
    disabled: false,
    label: 'Aceito os termos e condições',
    ariaLabel: '',
  },
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildCheckboxWithLabel(args: CheckboxArgs): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster';
  wrapper.dataset.spacing = 'sm';

  const id = `checkbox-playground-${Math.random().toString(36).slice(2, 8)}`;
  const cb = createCheckbox({
    checked: args.checked,
    disabled: args.disabled,
    id,
    ...(args.ariaLabel ? { 'aria-label': args.ariaLabel } : {}),
  });

  if (args.label) {
    const labelId = `${id}-label`;
    cb.setAttribute('aria-labelledby', labelId);
    const label = document.createElement('label');
    label.id = labelId;
    label.htmlFor = id;
    label.textContent = args.label;
    label.className = 'nds-text-body nds-font-medium nds-leading-none ' + (args.disabled ? 'nds-cursor-default' : 'nds-cursor-pointer');
    label.addEventListener('click', (e) => {
      e.preventDefault();
      cb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    if (args.disabled) { label.style.opacity = '0.7'; label.style.cursor = 'not-allowed'; }
    wrapper.append(cb, label);
  } else {
    wrapper.append(cb);
  }

  return wrapper;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => buildCheckboxWithLabel(args),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Checkbox presente no DOM com role correto', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox está visível', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toBeVisible();
    });

    await step('aria-checked reflete o estado inicial', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    await step('Clique alterna para marcado', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await userEvent.click(checkbox);
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clique novamente desmarca', async () => {
      const checkbox = canvas.getByRole('checkbox');
      await userEvent.click(checkbox);
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};
