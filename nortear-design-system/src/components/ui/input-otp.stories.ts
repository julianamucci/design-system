import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createInputOTP } from './input-otp';
import { createInputOTPDocs } from '@/components/docs/InputOTPDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type InputOTPArgs = {
  length: number;
  disabled: boolean;
  withSeparator: boolean;
};

const meta: Meta<InputOTPArgs> = {
  title: 'UI/InputOTP',
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createInputOTPDocs) },
  },
  argTypes: {
    length: {
      control: { type: 'number', min: 4, max: 8, step: 1 },
      description: 'Número total de slots/caracteres do código.',
    },
    disabled: {
      control: 'boolean',
      description: 'Bloqueia interação e aplica opacity-50.',
    },
    withSeparator: {
      control: 'boolean',
      description:
        'Exibe um separator visual no meio do código. Divergência idiomática do factory Basecoat: separator é controlado via opção `separator` (índices) e não via subcomponente.',
    },
  },
  args: {
    length: 6,
    disabled: false,
    withSeparator: false,
  },
};

export default meta;
type Story = StoryObj<InputOTPArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '120px';
  wrapper.appendChild(child);
  return wrapper;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const sepIndices = args.withSeparator ? [Math.floor(args.length / 2)] : undefined;
    const el = createInputOTP({
      length: args.length,
      disabled: args.disabled,
      separator: sepIndices,
    });
    return wrap(el);
  },
  play: async ({ canvasElement, step, args }) => {
    if (args.disabled) return;
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole('textbox') as HTMLInputElement[];

    await step('Digitar caracteres preenche slots e move foco', async () => {
      const code = '123456'.slice(0, args.length);
      for (let i = 0; i < code.length; i++) {
        await userEvent.type(inputs[i], code[i]);
      }
      const concat = inputs.map((i) => i.value).join('');
      await expect(concat).toBe(code);
    });
  },
};
