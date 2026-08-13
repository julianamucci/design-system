import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { createCheckbox } from './checkbox';
import { createCheckboxDocs } from '@/components/docs/CheckboxDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CheckboxArgs = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  label: string;
  ariaLabel: string;
  onCheckedChange: (checked: boolean) => void;
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
    indeterminate: {
      control: 'boolean',
      description: 'Estado misto — seleção parcial de um grupo. Vale sobre `checked` enquanto durar.',
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
    onCheckedChange: {
      control: false,
      description: 'Callback disparado ao alternar o estado marcado/desmarcado.',
    },
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    label: 'Aceito os termos e condições',
    ariaLabel: '',
    onCheckedChange: fn(),
  },
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildCheckboxWithLabel(args: CheckboxArgs): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster';
  wrapper.dataset.spacing = 'sm';
  if (args.disabled) wrapper.dataset.disabled = 'true';

  const id = `checkbox-playground-${Math.random().toString(36).slice(2, 8)}`;
  const cb = createCheckbox({
    checked: args.checked,
    indeterminate: args.indeterminate,
    disabled: args.disabled,
    id,
    onCheckedChange: args.onCheckedChange,
    ...(args.ariaLabel ? { 'aria-label': args.ariaLabel } : {}),
  });

  if (args.label) {
    const labelId = `${id}-label`;
    cb.setAttribute('aria-labelledby', labelId);
    const label = document.createElement('label');
    label.id = labelId;
    label.htmlFor = id;
    label.textContent = args.label;
    label.className = 'nds-label nds-text-body nds-font-medium nds-leading-none ' + (args.disabled ? 'nds-cursor-default' : 'nds-cursor-pointer');
    label.addEventListener('click', (e) => {
      e.preventDefault();
      cb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    wrapper.append(cb, label);
  } else {
    wrapper.append(cb);
  }

  return wrapper;
}

// Pares idempotentes: só clicam se o estado atual ainda não é o desejado, e
// aguardam a transição. Um clique cego seguido de asserção inverte o
// resultado no replay do painel Interactions, que reaproveita o DOM da
// rodada anterior em vez de remontar a story.
const marcar = async (cb: HTMLElement) => {
  if (cb.getAttribute('aria-checked') !== 'true') await userEvent.click(cb);
  await waitFor(() => expect(cb).toHaveAttribute('aria-checked', 'true'));
};
const desmarcar = async (cb: HTMLElement) => {
  if (cb.getAttribute('aria-checked') !== 'false') await userEvent.click(cb);
  await waitFor(() => expect(cb).toHaveAttribute('aria-checked', 'false'));
};

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  render: (args) => buildCheckboxWithLabel(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox presente no DOM com role correto', async () => {
      await expect(checkbox).toBeInTheDocument();
    });

    await step('Checkbox é localizável pelo nome acessível', async () => {
      await expect(canvas.getByRole('checkbox', { name: args.label })).toBeInTheDocument();
    });

    // Baseline conhecida: garante desmarcado antes de provar a transição.
    await step('Estado parte desmarcado', async () => {
      await desmarcar(checkbox);
    });

    await step('Clique em desmarcado marca e dispara o callback com true', async () => {
      await marcar(checkbox);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });

    await step('Clique em marcado desmarca e dispara o callback com false', async () => {
      await desmarcar(checkbox);
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
    });

    await step('Space alterna o estado e dispara o callback', async () => {
      (checkbox as HTMLElement).focus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });
  },
};
